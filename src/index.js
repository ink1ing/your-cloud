import { generatePasswordHash, verifyPasswordHash } from "./encryption.js";

// ===== 常量配置 =====
const REGION = "auto";
const SERVICE = "s3";
const DEFAULT_EXPIRY_SECONDS = 3600;
const MAX_EXPIRY_SECONDS = 7 * 24 * 60 * 60;
const UNSIGNED_PAYLOAD = "UNSIGNED-PAYLOAD";
const TEXT_PREFIX = "texts";
// Workers 顶层 Date.now() 恒为 0,改为首次请求时初始化
let START_TIME = 0;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ===== Worker 入口 =====
export default {
  async fetch(request, env, ctx) {
    if (!START_TIME) START_TIME = Date.now();
    const url = new URL(request.url);
    let pathname = url.pathname;
    if (pathname.startsWith("/portal")) {
      pathname = pathname.slice(7) || "/";
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      if (pathname === "/signPut" && request.method === "POST") {
        return handleSignPut(request, env);
      }
      if (pathname === "/signGet" && request.method === "POST") {
        return handleSignGet(request, env);
      }
      if (pathname === "/list" && request.method === "GET") {
        return handleList(env, url.searchParams);
      }
      if (pathname === "/delete" && request.method === "DELETE") {
        return handleDelete(request, env);
      }
      if (pathname === "/text" && request.method === "POST") {
        return handleTextPost(request, env);
      }
      if (pathname === "/proxy/upload" && request.method === "POST") {
        return handleProxyUpload(request, env);
      }
      if (pathname === "/proxy/download" && request.method === "GET") {
        return handleProxyDownload(env, url.searchParams);
      }
      if (pathname === "/status" && request.method === "GET") {
        return handleStatus();
      }
      if (pathname === "/verify-password" && request.method === "POST") {
        return handlePasswordVerification(request, env);
      }
      if (pathname === "/preview-text" && request.method === "POST") {
        return handleTextPreview(request, env);
      }
      if (pathname === "/file-status" && request.method === "POST") {
        return handleFileStatus(request, env);
      }

      // 静态资源(前端页面)
      if (env.ASSETS && request.method === "GET") {
        const assetUrl = new URL(request.url);
        if (assetUrl.pathname.startsWith("/portal")) {
          assetUrl.pathname = assetUrl.pathname.slice(7) || "/";
        }
        if (assetUrl.pathname === "/" || assetUrl.pathname === "") {
          assetUrl.pathname = "/index.html";
        }
        const assetRequest = new Request(assetUrl.toString(), request);
        return env.ASSETS.fetch(assetRequest);
      }

      return jsonError("Not Found", 404);
    } catch (error) {
      console.error("Request failed:", error);
      return jsonError("Internal Server Error", 500);
    }
  },
};

// ===== 路由处理器 =====
async function handleSignPut(request, env) {
  const body = await readJsonBody(request);
  let key = sanitizeKey(body?.key);
  if (!key) {
    return jsonError("`key` is required", 400);
  }
  key = ensureFileExtension(key, "bin");
  if (await env.R2_STORAGE.head(key)) {
    return jsonError("文件已存在,请改名或先删除", 409);
  }
  const expires = normalizeExpiry(body?.expires);
  const contentType = typeof body?.contentType === "string" ? body.contentType : undefined;
  const url = await createPresignedUrl({ env, key, method: "PUT", expires, contentType });
  return jsonResponse({ url, key, expires });
}

async function handleSignGet(request, env) {
  const body = await readJsonBody(request);
  const key = sanitizeKey(body?.key);
  if (!key) {
    return jsonError("`key` is required", 400);
  }
  // 防绕过:受密码保护的文件必须提供正确密码,才能拿到预签名下载链接
  const object = await env.R2_STORAGE.head(key);
  const storedHash = object?.customMetadata?.passwordHash;
  if (storedHash && !(await verifyPasswordHash(body?.password || "", storedHash))) {
    return jsonError("密码错误或文件需要密码", 403);
  }
  const expires = normalizeExpiry(body?.expires);
  const url = await createPresignedUrl({ env, key, method: "GET", expires });
  return jsonResponse({ url, expires });
}

async function handleList(env, searchParams) {
  try {
    const prefix = searchParams.get("prefix");
    const limit = Math.max(1, Math.min(parseInt(searchParams.get("limit"), 10) || 1000, 1000));
    const cursor = searchParams.get("cursor");
    const result = await env.R2_STORAGE.list({
      prefix: prefix ? sanitizeKey(prefix) : undefined,
      limit,
      cursor: cursor || undefined,
    });
    const items = (result.objects ?? []).map((object) => ({
      key: object.key,
      size: object.size,
      lastModified: object.uploaded ? object.uploaded.toISOString() : null,
      // 暂时设置为 unknown,前端会异步获取真实状态
      hasPassword: "unknown",
    }));
    const responseData = {
      items,
      truncated: result.truncated || false,
      cursor: result.cursor || null,
    };
    const response = jsonResponse(responseData);
    response.headers.set("Cache-Control", "public, max-age=30");
    response.headers.set("ETag", `"${items.length}-${Date.now()}"`);
    return response;
  } catch (error) {
    console.error("Failed to list bucket objects", error);
    return jsonError("Unable to list bucket objects", 502);
  }
}

async function handleDelete(request, env) {
  const body = await readJsonBody(request);
  const key = sanitizeKey(body?.key);
  const emojiPassword = body?.password;
  if (!key) {
    return jsonError("`key` is required", 400);
  }
  try {
    const object = await env.R2_STORAGE.head(key);
    if (!object) {
      return jsonError("File not found", 404);
    }
    const storedHash = object.customMetadata?.passwordHash;
    if (storedHash) {
      const isPasswordValid = await verifyPasswordHash(emojiPassword || "", storedHash);
      if (!isPasswordValid) {
        return jsonError("密码错误或文件需要密码", 403);
      }
    } else if (emojiPassword?.trim() !== "confirmed") {
      return jsonError("删除文件需要密码确认", 403);
    }
    await env.R2_STORAGE.delete(key);
    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Failed to delete object", error);
    return jsonError("Unable to delete object", 502);
  }
}

async function handleTextPost(request, env) {
  const body = await readJsonBody(request);
  if (!body || typeof body.content !== "string" || !body.content.trim()) {
    return jsonError("`content` is required", 400);
  }
  let key = sanitizeKey(body.key);
  const password = body.password;
  if (!key) {
    key = generateTextKey();
  }
  if (!key.toLowerCase().endsWith(".txt")) {
    key = `${key}.txt`;
  }
  if (!key.startsWith(`${TEXT_PREFIX}/`)) {
    key = `${TEXT_PREFIX}/${key}`;
  }
  if (await env.R2_STORAGE.head(key)) {
    return jsonError("文件已存在,请改名或先删除", 409);
  }
  try {
    const customMetadata = {};
    if (password && password.trim()) {
      if (!/^\d{1,6}$/.test(password.trim())) {
        return jsonError("密码必须是1-6位数字", 400);
      }
      customMetadata.passwordHash = await generatePasswordHash(password.trim());
    }
    await env.R2_STORAGE.put(key, body.content, {
      httpMetadata: { contentType: "text/plain; charset=utf-8" },
      customMetadata,
    });
    return jsonResponse({ key });
  } catch (error) {
    console.error("Failed to store text content", error);
    return jsonError("Unable to store text content", 502);
  }
}

async function handleProxyUpload(request, env) {
  let formData;
  try {
    formData = await request.formData();
  } catch (error) {
    console.error("Failed to parse form data for proxy upload", error);
    return jsonError("Invalid form data", 400);
  }
  let key = sanitizeKey(formData.get("key"));
  const file = formData.get("file");
  const password = formData.get("password");
  if (!key) {
    return jsonError("`key` is required", 400);
  }
  key = ensureFileExtension(key, "bin");
  if (await env.R2_STORAGE.head(key)) {
    return jsonError("文件已存在,请改名或先删除", 409);
  }
  if (!file || typeof file.arrayBuffer !== "function") {
    return jsonError("`file` is required", 400);
  }
  const arrayBuffer = await file.arrayBuffer();
  const contentType = typeof file.type === "string" && file.type ? file.type : "application/octet-stream";
  try {
    const customMetadata = {};
    if (password && password.trim()) {
      if (!/^\d{1,6}$/.test(password.trim())) {
        return jsonError("密码必须是1-6位数字", 400);
      }
      customMetadata.passwordHash = await generatePasswordHash(password.trim());
    }
    await env.R2_STORAGE.put(key, arrayBuffer, {
      httpMetadata: { contentType },
      customMetadata,
    });
    return jsonResponse({ success: true, key });
  } catch (error) {
    console.error("Proxy upload failed", error);
    return jsonError("Unable to upload object through proxy", 502);
  }
}

function handleStatus() {
  const now = Date.now();
  return jsonResponse({
    startTime: START_TIME,
    currentTime: now,
    uptime: now - START_TIME,
    status: "running",
  });
}

async function handleProxyDownload(env, searchParams) {
  const key = sanitizeKey(searchParams.get("key"));
  const emojiPassword = searchParams.get("password");
  if (!key) {
    return jsonError("`key` is required", 400);
  }
  try {
    const object = await env.R2_STORAGE.get(key);
    if (!object) {
      return jsonError("Object not found", 404);
    }
    const storedHash = object.customMetadata?.passwordHash;
    const isPasswordValid = await verifyPasswordHash(emojiPassword || "", storedHash);
    if (!isPasswordValid) {
      return jsonError("密码错误或文件需要密码", 403);
    }
    const passthroughHeaders = new Headers();
    const contentType = object.httpMetadata?.contentType;
    if (contentType) {
      passthroughHeaders.set("Content-Type", contentType);
    }
    if (typeof object.size === "number") {
      passthroughHeaders.set("Content-Length", String(object.size));
    }
    const contentDisposition = object.httpMetadata?.contentDisposition;
    if (contentDisposition) {
      passthroughHeaders.set("Content-Disposition", contentDisposition);
    }
    passthroughHeaders.set("Cache-Control", object.httpMetadata?.cacheControl || "private, max-age=0");
    passthroughHeaders.set("Access-Control-Allow-Origin", corsHeaders["Access-Control-Allow-Origin"]);
    passthroughHeaders.set("Access-Control-Expose-Headers", "Content-Length, Content-Type, Content-Disposition");
    return new Response(object.body, { status: 200, headers: passthroughHeaders });
  } catch (error) {
    console.error("Proxy download failed", error);
    return jsonError("Unable to fetch object through proxy", 502);
  }
}

async function handlePasswordVerification(request, env) {
  const body = await readJsonBody(request);
  const key = sanitizeKey(body?.key);
  const emojiPassword = body?.password;
  if (!key) {
    return jsonError("`key` is required", 400);
  }
  try {
    const object = await env.R2_STORAGE.head(key);
    if (!object) {
      return jsonError("Object not found", 404);
    }
    const storedHash = object.customMetadata?.passwordHash;
    const isPasswordValid = await verifyPasswordHash(emojiPassword || "", storedHash);
    return jsonResponse({ valid: isPasswordValid, hasPassword: !!storedHash });
  } catch (error) {
    console.error("Password verification failed", error);
    return jsonError("Unable to verify password", 502);
  }
}

async function handleTextPreview(request, env) {
  const body = await readJsonBody(request);
  const key = sanitizeKey(body?.key);
  const emojiPassword = body?.password;
  if (!key) {
    return jsonError("`key` is required", 400);
  }
  try {
    const object = await env.R2_STORAGE.get(key);
    if (!object) {
      return jsonError("File not found", 404);
    }
    const contentType = object.httpMetadata?.contentType;
    if (!contentType || !contentType.includes("text/")) {
      return jsonError("File is not a text file", 400);
    }
    const storedHash = object.customMetadata?.passwordHash;
    if (storedHash) {
      const isPasswordValid = await verifyPasswordHash(emojiPassword || "", storedHash);
      if (!isPasswordValid) {
        return jsonError("密码错误或文件需要密码", 403);
      }
    }
    const content = await object.text();
    return jsonResponse({
      key,
      content,
      hasPassword: !!storedHash,
      size: object.size,
      lastModified: object.uploaded ? object.uploaded.toISOString() : null,
      contentType,
    });
  } catch (error) {
    console.error("Text preview failed", error);
    return jsonError("Unable to preview text file", 502);
  }
}

async function handleFileStatus(request, env) {
  const body = await readJsonBody(request);
  const keys = body?.keys;
  if (!Array.isArray(keys) || keys.length === 0) {
    return jsonError("`keys` array is required", 400);
  }
  try {
    const results = await Promise.all(
      keys.map(async (key) => {
        try {
          const sanitizedKey = sanitizeKey(key);
          if (!sanitizedKey) {
            return { key, hasPassword: false, error: "Invalid key" };
          }
          const object = await env.R2_STORAGE.head(sanitizedKey);
          if (!object) {
            return { key, hasPassword: false, error: "File not found" };
          }
          return { key, hasPassword: !!object.customMetadata?.passwordHash };
        } catch (error) {
          return { key, hasPassword: false, error: error.message };
        }
      })
    );
    return jsonResponse({ results });
  } catch (error) {
    console.error("File status check failed", error);
    return jsonError("Unable to check file status", 502);
  }
}

// ===== AWS SigV4 预签名(R2 S3 兼容接口) =====
async function createPresignedUrl({ env, method, key, expires = DEFAULT_EXPIRY_SECONDS, contentType }) {
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const host = `${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const encodedKey = encodePath(key);
  const canonicalUri = `/${env.R2_BUCKET}/${encodedKey}`;
  const baseUrl = `https://${host}${canonicalUri}`;

  const canonicalHeadersList = [["host", host]];
  const trimmedContentType = typeof contentType === "string" ? contentType.trim() : "";
  if (trimmedContentType) {
    canonicalHeadersList.push(["content-type", trimmedContentType]);
  }
  canonicalHeadersList.sort(([a], [b]) => a.localeCompare(b));
  const signedHeaders = canonicalHeadersList.map(([name]) => name).join(";");
  const canonicalHeaders = canonicalHeadersList
    .map(([name, value]) => `${name}:${normalizeHeaderValue(value)}`)
    .join("\n");

  const params = new URLSearchParams();
  params.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
  params.set("X-Amz-Credential", `${env.R2_ACCESS_KEY_ID}/${credentialScope}`);
  params.set("X-Amz-Date", amzDate);
  params.set("X-Amz-Expires", `${expires}`);
  params.set("X-Amz-SignedHeaders", signedHeaders);
  const canonicalQueryString = buildCanonicalQueryString(params);

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    `${canonicalHeaders}\n`,
    signedHeaders,
    UNSIGNED_PAYLOAD,
  ].join("\n");

  const stringToSign = await buildStringToSign({ amzDate, credentialScope, canonicalRequest });
  const signature = await signString(env.R2_SECRET_ACCESS_KEY, dateStamp, stringToSign);
  return `${baseUrl}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

async function buildStringToSign({ amzDate, credentialScope, canonicalRequest }) {
  const hashedRequest = await sha256Hex(canonicalRequest);
  return ["AWS4-HMAC-SHA256", amzDate, credentialScope, hashedRequest].join("\n");
}

async function signString(secretAccessKey, dateStamp, stringToSign) {
  const kDate = await hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = await hmac(kDate, REGION);
  const kService = await hmac(kRegion, SERVICE);
  const kSigning = await hmac(kService, "aws4_request");
  return hmacHex(kSigning, stringToSign);
}

// ===== 加密/编码工具 =====
async function sha256Hex(value) {
  const data = typeof value === "string" ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

async function hmac(key, data) {
  const keyData = typeof key === "string" ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const dataBytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataBytes);
  return new Uint8Array(signature);
}

async function hmacHex(key, data) {
  return toHex(await hmac(key, data));
}

function toHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ===== 请求/响应辅助 =====
async function readJsonBody(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function sanitizeKey(value) {
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim().replace(/^\/+/, "");
  if (!trimmed || trimmed.includes("..") || trimmed.includes("\\")) {
    return "";
  }
  return trimmed;
}

function encodePath(key) {
  return key
    .split("/")
    .map((segment) =>
      encodeURIComponent(segment).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    )
    .join("/");
}

function buildCanonicalQueryString(params) {
  const entries = Array.from(params.entries()).filter(([, value]) => value !== undefined && value !== null);
  const encoded = entries.map(([key, value]) => [encodeRfc3986(key), encodeRfc3986(value)]);
  encoded.sort(([aKey], [bKey]) => aKey.localeCompare(bKey));
  return encoded.map(([key, value]) => `${key}=${value}`).join("&");
}

function encodeRfc3986(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function normalizeExpiry(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return DEFAULT_EXPIRY_SECONDS;
  }
  return Math.min(Math.max(1, Math.floor(numeric)), MAX_EXPIRY_SECONDS);
}

function normalizeHeaderValue(value) {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value).trim().replace(/\s+/g, " ");
}

function generateTextKey() {
  const iso = new Date().toISOString().replace(/[:.]/g, "-");
  return `${iso}.txt`;
}

function hasFileExtension(key) {
  return /\.[a-zA-Z0-9]{1,10}$/.test(key);
}

function ensureFileExtension(key, fallbackExt = "bin") {
  return hasFileExtension(key) ? key : `${key}.${fallbackExt}`;
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function jsonError(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

function toAmzDate(date) {
  const pad = (num) => num.toString().padStart(2, "0");
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}
