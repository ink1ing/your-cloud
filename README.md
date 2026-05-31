# InksPortal

基于 Cloudflare Worker + R2 的轻量网盘。后端源码已从线上打包产物还原为可维护结构。

## 结构

```
src/
  index.js        # Worker 入口与所有 API 路由 + R2 S3 预签名(SigV4)
  encryption.js   # 文件密码哈希/校验(SHA-256 + 固定盐)
public/
  index.html      # 前端页面(已从线上恢复,CSS 内联)
  app.js          # 前端逻辑(已从线上恢复)
wrangler.toml     # 绑定与变量配置
.dev.vars.example # 本地开发变量模板(复制为 .dev.vars)
```

## API 路由(前缀 `/portal`)

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/signPut` | 生成上传用预签名 URL |
| POST | `/signGet` | 生成下载用预签名 URL |
| GET | `/list` | 列出对象(支持 prefix/limit/cursor) |
| DELETE | `/delete` | 删除对象(需密码或确认) |
| POST | `/text` | 保存文本到 `texts/`(可设 1-6 位数字密码) |
| POST | `/proxy/upload` | 经 Worker 代理上传 |
| GET | `/proxy/download` | 经 Worker 代理下载 |
| GET | `/status` | 运行状态自检 |
| POST | `/verify-password` | 校验文件密码 |
| POST | `/preview-text` | 预览文本文件 |
| POST | `/file-status` | 批量查询文件是否带密码 |

## 配置:变量与密钥

线上 Worker 把 4 个值全部存为 **secret**:`R2_ACCOUNT_ID`、`R2_BUCKET`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`。
因此 `wrangler.toml` **不要**用 `[vars]` 定义同名项,否则 deploy 会用明文覆盖线上 secret。

- 本地开发:复制 `.dev.vars.example` 为 `.dev.vars` 并填入这 4 个值(已被 git 忽略)。
- 线上修改某个值:`npx wrangler secret put <NAME>`。
- 顶层 `account_id` 与 `[[r2_buckets]].bucket_name`(均为 `inksportal` 账号下)已在 `wrangler.toml` 配好。

## 本地开发与部署

```bash
npm install
npm run dev      # 本地 http://localhost:8787
npm run deploy   # 部署到 Cloudflare
```

## 前端来源

前端 `public/index.html` 与 `public/app.js` 已从线上 `https://portal.ink1ing.tech/` 取回。
页面仅依赖外部 Google Fonts(Oxanium),API 调用使用根相对路径,本地 `wrangler dev` 与线上根域名均可直接联通。

### 下载/上传体验
- 顶部固定进度条(`#topbar`)在上传/下载时显示百分比与实时速度。
- 下载统一走 `/proxy/download` 流式抓取 + Blob 保存,确保各种格式都"一步下载"而非新标签预览(代价:下载流量经过 Worker)。
- 上传改用 XHR 以获取上传进度;直传签名 PUT 与代理上传两条路径都有进度。

## 注意事项 / 已知点

已修复:
- **安全**:`/signGet` 现在校验文件密码,堵住"绕过密码直接获取下载链接"的漏洞。
- `/delete` 对无密码文件的确认逻辑改为严格要求 `confirmed`(原逻辑任意非空值即可删除)。
- `START_TIME` 在 Worker 顶层恒为 0,改为首次请求初始化,`/status` 的 uptime 现在正确。
- `/list` 的 `limit` 增加 NaN/负数兜底;还原时修正了 ETag 末尾多余的 `}`。
- **防覆盖**:`/signPut`、`/proxy/upload`、`/text` 上传到已存在的 key 时返回 409,不再静默覆盖、也不会清除原文件密码。
- **密码锁标识**:`/list` 改为 `include: ["customMetadata"]` 直接返回 `hasPassword` 布尔,列表"Status"列直接渲染 🔒(消除了原本每次刷新 N 次 HEAD 的隐患)。
- **上传性能**:代理上传改为直接 `put(key, file)`(Blob 流式),不再 `arrayBuffer()` 全量进内存;上传默认走直传签名 PUT(失败自动回退代理),解除"中文=强制代理"耦合。R2 桶 CORS 已允许浏览器 `PUT`。
- **死代码清理**:移除 `openDownloadLink`、`downloadViaProxy`、`toggleBusy`、`updateFileStatus` 及失效的 `#status` 引用。

下载仍走 `/proxy/download` 流式抓取 + Blob 保存(为保留进度条/速度显示),代价是经 Worker 流量、无 Range、客户端整块入内存。

仍待决策(会改变行为,未擅自改动):
- 整套 API **无鉴权**,任何人知道域名即可 list/上传/下载/删除。如需私有,可加访问口令或 Cloudflare Access。
- 文件密码为 1-6 位数字 + 固定盐(`InksPortalEncryption2024`),可被暴力枚举(约 110 万组合)且无限流,属轻量访问控制。
