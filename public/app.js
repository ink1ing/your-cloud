const fileInput = document.querySelector('#file-input');
const keyInput = document.querySelector('#key-input');
const passwordInput = document.querySelector('#password-input'); // 新增密码输入框
const uploadBtn = document.querySelector('#upload-btn');
const refreshBtn = document.querySelector('#refresh-btn');
const statusEl = document.querySelector('#status');
const tableBody = document.querySelector('#file-table-body');
const fileCountEl = document.querySelector('#file-count');
const dropZone = document.querySelector('#drop-zone');
const langButtons = document.querySelectorAll('.language-toggle button[data-lang]');
const textInput = document.querySelector('#text-input');
const textKeyInput = document.querySelector('#text-key-input');
const textPasswordInput = document.querySelector('#text-password-input'); // 新增文本密码输入框
const pasteBtn = document.querySelector('#paste-btn');
const saveTextBtn = document.querySelector('#save-text-btn');
const textStatusEl = document.querySelector('#text-status');
const uptimeEl = document.querySelector('#uptime');

fileCountEl.dataset.count = fileCountEl.dataset.count || '0';

const translations = {
  en: {
    title: 'Silas Portal',
    subtitle: 'Upload today, share instantly.',
    fileTitle: 'Upload File',
    fileSubtitle: 'Drag or select files.',
    dropHeadline: '',
    dropSubtext: 'Drag or select files here',
    dropReady: 'Release to start upload',
    dropReceive: 'File staged. Click upload to send.',
    keyLabel: 'Filename',
    keyPlaceholder: 'uploads/photo.png',
    passwordLabel: 'Key (optional)',
    passwordPlaceholder: '123456',
    uploadBtn: 'Upload',
    refreshBtn: 'Refresh',
    textTitle: 'Upload Text',
    textSubtitle: 'Paste or type text.',
    textContentLabel: 'Message content',
    textContentPlaceholder: 'Type or paste text here',
    textKeyLabel: 'Filename',
    textKeyPlaceholder: 'texts/note.txt',
    textPasteBtn: 'Paste clipboard',
    textSaveBtn: 'Save text',
    listTitle: 'Current files',
    colName: 'Name',
    colSize: 'Size',
    colStatus: 'Status',
    colUpdated: 'Uploaded at',
    colActions: 'Actions',
    empty: 'No files uploaded yet.',
    fileCount: (count) => (count === 0 ? 'No files yet' : `${count} file${count > 1 ? 's' : ''}`),
    download: 'Download',
    view: 'View',
    remove: 'Remove',
    statusIdle: '',
    statusNoFile: 'Select a file first.',
    statusNoKey: 'Provide a storage key.',
    statusUploading: 'Signing upload...',
    statusPutting: 'Uploading to R2…',
    statusUploadSuccess: 'Upload complete ✅',
    statusListLoading: 'Loading list…',
    statusListDone: 'List refreshed.',
    statusDelete: (key) => `Deleting ${key}`,
    statusDeleteDone: 'Deleted.',
    statusDownload: (key) => `Preparing download: ${key}`,
    statusDownloadDone: 'Download link opened.',
    statusProxyFallback: 'Direct upload failed. Retrying via proxy…',
    statusProxyUpload: 'Uploading via proxy…',
    statusProxyDownload: (key) => `Preparing proxy download: ${key}`,
    textStatusIdle: '',
    textStatusPasted: 'Clipboard pasted.',
    textStatusNoContent: 'Enter some text first.',
    textStatusSaving: 'Saving text…',
    textStatusSaved: (key) => `Text saved to ${key}`,
    textStatusError: (msg) => `Text save failed: ${msg}`,
    textClipboardEmpty: 'Clipboard is empty.',
    textClipboardUnsupported: 'Clipboard read is not supported in this browser.',
    genericRequestError: 'Request failed',
    proxyUploadError: 'Proxy upload failed',
    listError: 'Unable to load list',
    missingUploadUrl: 'Missing upload URL',
    missingDownloadUrl: 'Missing download URL',
    deleteErrorFallback: 'Unable to delete object',
    statusInvalidKey: 'Key cannot contain ".." or backslashes.',
    statusInvalidFileKey: 'Key must include a file extension.',
    statusError: (msg) => `Error: ${msg}`,
    uptimePrefix: 'Uptime: ',
    uptimeDays: 'd ',
    uptimeHours: 'h ',
    uptimeMinutes: 'm',
    emojiPasswordTitle: 'Upload successful!',
    emojiPasswordSubtitle: 'Please save this password for downloading:',
    copyPassword: 'Copy Password',
    understood: 'Saved',
    passwordWarning: 'Please save this password, you cannot download without it',
  },
  zh: {
    title: 'Silas Portal',
    subtitle: '随手上传，马上分享。',
    fileTitle: '传文件',
    fileSubtitle: '拖拽或选择文件。',
    dropHeadline: '',
    dropSubtext: '拖拽或选择文件到此处',
    dropReady: '松手即可上传',
    dropReceive: '文件已就绪，点击上传即可传输。',
    keyLabel: '文件名',
    keyPlaceholder: 'uploads/photo.png',
    passwordLabel: '密码（可选）',
    passwordPlaceholder: '123456',
    uploadBtn: '上传',
    refreshBtn: '刷新',
    textTitle: '传文本',
    textSubtitle: '粘贴或输入文本。',
    textContentLabel: '文本内容',
    textContentPlaceholder: '输入或粘贴文本到此处',
    textKeyLabel: '文件名',
    textKeyPlaceholder: 'texts/note.txt',
    textPasteBtn: '粘贴剪贴板',
    textSaveBtn: '保存文字',
    listTitle: '当前文件',
    colName: '文件名',
    colSize: '大小',
    colStatus: '状态',
    colUpdated: '上传时间',
    colActions: '操作',
    empty: '暂未上传文件。',
    fileCount: (count) => (count === 0 ? '暂无文件' : `共 ${count} 个文件`),
    download: '下载',
    view: '预览',
    remove: '删除',
    statusIdle: '',
    statusNoFile: '请先选择要上传的文件。',
    statusNoKey: '请填写存储文件名 (Key)。',
    statusUploading: '正在申请上传凭证…',
    statusPutting: '正在上传至 R2…',
    statusUploadSuccess: '上传成功 ✅',
    statusListLoading: '正在加载列表…',
    statusListDone: '列表已更新。',
    statusDelete: (key) => `正在删除：${key}`,
    statusDeleteDone: '删除成功。',
    statusDownload: (key) => `正在生成下载链接：${key}`,
    statusDownloadDone: '下载链接已打开。',
    statusProxyFallback: '直连失败，正在改用代理上传…',
    statusProxyUpload: '正在通过代理上传…',
    statusProxyDownload: (key) => `正在通过代理准备下载：${key}`,
    textStatusIdle: '',
    textStatusPasted: '已粘贴剪贴板内容。',
    textStatusNoContent: '请先输入要保存的文字。',
    textStatusSaving: '正在保存文字…',
    textStatusSaved: (key) => `文字已保存到 ${key}`,
    textStatusError: (msg) => `保存失败：${msg}`,
    textClipboardEmpty: '剪贴板没有文本。',
    textClipboardUnsupported: '浏览器不支持读取剪贴板。',
    genericRequestError: '请求失败',
    proxyUploadError: '代理上传失败',
    listError: '列表请求失败',
    missingUploadUrl: '未获取到上传地址',
    missingDownloadUrl: '未获取到下载链接',
    deleteErrorFallback: '删除失败',
    statusInvalidKey: 'Key 不能包含 ".." 或反斜杠。',
    statusInvalidFileKey: '文件名需要包含扩展名。',
    statusError: (msg) => `出错了：${msg}`,
    uptimePrefix: '已运行: ',
    uptimeDays: '天',
    uptimeHours: '小时',
    uptimeMinutes: '分',
    emojiPasswordTitle: '文件上传成功！',
    emojiPasswordSubtitle: '请保存下面的密码，用于下载文件：',
    copyPassword: '复制密码',
    understood: '我已保存',
    passwordWarning: '请务必保存此密码，丢失后将无法下载文件',
  },
};

let serviceStartTime = null;

let currentLang = 'en';
const initialLanguage = (navigator.language || '').toLowerCase();
let preferProxy = initialLanguage.startsWith('zh');
let proxyFallbackActivated = false;

updateProxyIndicator();

if (textKeyInput) {
  textKeyInput.value = '';
}

setTextStatus(t('textStatusIdle'));

fileInput.addEventListener('change', () => {
  updateKeyFromSelection();
});

dropZone.addEventListener('click', () => {
  fileInput.click();
});

// "选择文件"按钮点击事件
const browseBtn = document.querySelector('#browse-btn');
if (browseBtn) {
  browseBtn.addEventListener('click', () => {
    fileInput.click();
  });
}

dropZone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    fileInput.click();
  }
});

['dragenter', 'dragover'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    dropZone.classList.add('hover');
    setStatus(t('dropReady'));
  });
});

['dragleave'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove('hover');
    setStatus(t('statusIdle'));
  });
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) return;
  dropZone.classList.remove('hover');
  fileInput.files = files;
  updateKeyFromSelection();
  setStatus(t('dropReceive'));
});

langButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const lang = button.dataset.lang;
    if (lang && lang !== currentLang) {
      switchLanguage(lang);
    }
  });
});

if (pasteBtn) {
  pasteBtn.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
        throw new Error(t('textClipboardUnsupported'));
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setTextStatus(t('textClipboardEmpty'), true);
        return;
      }
      if (textInput) {
        textInput.value = text;
        // 自动聚焦到文本框
        textInput.focus();
      }
      setTextStatus(t('textStatusPasted'));
    } catch (error) {
      console.error('Clipboard paste failed', error);
      const errorMsg = error.name === 'NotAllowedError'
        ? t('textClipboardUnsupported')
        : (error.message || t('textStatusError', t('textClipboardUnsupported')));
      setTextStatus(errorMsg, true);
    }
  });
}

async function saveTextMessage() {
  try {
    const content = (textInput?.value ?? '').trim();
    if (!content) {
      setTextStatus(t('textStatusNoContent'), true);
      return;
    }

    let keyInputValue = textKeyInput?.value ?? '';
    if (!keyInputValue.trim()) {
      keyInputValue = generateTextKey();
    }

    const key = normalizeTextKey(keyInputValue);
    if (textKeyInput) {
      textKeyInput.value = key;
    }

    const password = textPasswordInput?.value?.trim(); // 获取文本密码

    setTextStatus(t('textStatusSaving'));

    // 构建请求数据
    const requestData = { key, content };
    if (password) {
      requestData.password = password;
    }

    const response = await apiPost('/text', requestData);
    const savedKey = response?.key || key;
    const emojiPassword = response?.emojiPassword;

    // 显示emoji密码（如果有）
    if (emojiPassword) {
      showEmojiPassword(emojiPassword);
    }

    if (textInput) {
      textInput.value = '';
    }
    if (textKeyInput) {
      textKeyInput.value = '';
    }
    if (textPasswordInput) {
      textPasswordInput.value = ''; // 清空密码输入框
    }
    setTextStatus(t('textStatusSaved', savedKey));
    await loadList();
  } catch (error) {
    console.error('Save text failed', error);
    setTextStatus(error.message || t('textStatusError', t('genericRequestError')), true);
  }
}

if (saveTextBtn) {
  saveTextBtn.addEventListener('click', saveTextMessage);
}

// 添加 Ctrl+Enter 或 Cmd+Enter 保存快捷键
if (textInput) {
  textInput.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      saveTextMessage();
    }
  });
}

uploadBtn.addEventListener('click', async () => {
  const file = fileInput.files[0];
  if (!file) {
    setStatus(t('statusNoFile'), true);
    return;
  }

  const rawKey = (keyInput.value || file.name || '').trim();
  if (!rawKey) {
    setStatus(t('statusNoKey'), true);
    return;
  }

  let key;
  try {
    // 传递文件对象以便提取扩展名
    key = normalizeFileKey(rawKey, file);
  } catch (error) {
    setStatus(error.message, true);
    return;
  }

  toggleBusy(true);
  try {
    await uploadFile(file, key);
  } catch (error) {
    console.error(error);
    setStatus(t('statusError', error.message), true);
  } finally {
    toggleBusy(false);
  }
});

// refreshBtn 可能已被移除，添加检查
if (refreshBtn) {
  refreshBtn.addEventListener('click', () => {
    loadList(true); // 强制刷新缓存
  });
}

// 为文件列表添加独立的刷新按钮
const listRefreshBtn = document.querySelector('#list-refresh-btn');
if (listRefreshBtn) {
  listRefreshBtn.addEventListener('click', () => {
    loadList(true); // 强制刷新缓存
  });
}

tableBody.addEventListener('click', async (event) => {
  console.log('Table click detected:', event.target);
  const button = event.target.closest('button[data-action]');
  console.log('Found button:', button);
  if (!button) return;

  const { action, key } = button.dataset;
  console.log('Action:', action, 'Key:', key);
  if (!key) return;

  if (action === 'download') {
    await handleDownload(key);
  } else if (action === 'delete') {
    console.log('Calling handleDelete with key:', key);
    await handleDelete(key);
  } else if (action === 'view') {
    await handleTextPreview(key);
  }
});

async function handleDownload(key) {
  const filename = (key || '').split('/').pop() || 'download';
  try {
    const needsPassword = await checkIfPasswordRequired(key);
    let password = null;
    if (needsPassword) {
      password = await promptForPassword(key);
      if (!password) return; // 用户取消
    }
    let url = `/proxy/download?key=${encodeURIComponent(key)}`;
    if (password) url += `&password=${encodeURIComponent(password)}`;
    await downloadWithProgress(url, filename);
  } catch (error) {
    console.error(error);
    transferEnd(t('statusError', error.message), true);
  }
}

async function handleDelete(key) {
  console.log('handleDelete called with key:', key);
  try {
    // 首先检查文件是否有密码
    const needsPassword = await checkIfPasswordRequired(key);

    // 根据文件是否有密码显示不同的确认界面
    let emojiPassword = await promptForPassword(key, '删除', needsPassword);
    if (!emojiPassword) {
      return; // 用户取消
    }

    setStatus(t('statusDelete', key));
    console.log('Making delete request...');

    const requestBody = { key, password: emojiPassword };

    const response = await apiFetch('/delete', {
      method: 'DELETE',
      body: JSON.stringify(requestBody),
    });

    console.log('Delete response:', response);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.error || t('deleteErrorFallback'));
    }

    setStatus(t('statusDeleteDone'));
    console.log('Reloading file list...');

    // 强制清除所有缓存
    fileListCache = null;
    cacheTimestamp = 0;

    // 添加小延迟确保删除操作完全完成
    setTimeout(async () => {
      try {
        await loadList(true);
        console.log('File list reloaded successfully');
      } catch (error) {
        console.error('Failed to reload file list after delete:', error);
        // 如果重新加载失败，尝试再次刷新
        setTimeout(() => loadList(true), 1000);
      }
    }, 500);
  } catch (error) {
    console.error('Delete error:', error);
    setStatus(t('statusError', error.message), true);
  }
}

// 缓存机制
let fileListCache = null;
let cacheTimestamp = 0;
let uptimeCache = null;
let uptimeCacheTime = 0;
const CACHE_DURATION = 30000; // 30秒缓存
const UPTIME_CACHE_DURATION = 10000; // 10秒运行时间缓存

async function loadList(forceRefresh = false) {
  try {
    // 检查缓存
    const now = Date.now();
    if (!forceRefresh && fileListCache && (now - cacheTimestamp) < CACHE_DURATION) {
      renderTable(fileListCache);
      return;
    }

    // 如果是强制刷新，完全清除缓存
    if (forceRefresh) {
      fileListCache = null;
      cacheTimestamp = 0;
    }

    // 禁用刷新按钮并显示加载状态
    const listRefreshBtn = document.querySelector('#list-refresh-btn');
    if (listRefreshBtn) {
      listRefreshBtn.disabled = true;
      listRefreshBtn.textContent = t('statusListLoading');
    }

    // 添加随机参数防止浏览器缓存
    const cacheBuster = forceRefresh ? `?_t=${Date.now()}` : '';
    const response = await apiFetch(`/list${cacheBuster}`);
    if (!response.ok) {
      throw new Error(t('listError'));
    }
    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];

    // 更新缓存
    fileListCache = items;
    cacheTimestamp = now;

    renderTable(items);

    // 恢复按钮状态
    if (listRefreshBtn) {
      listRefreshBtn.disabled = false;
      listRefreshBtn.textContent = t('refreshBtn');
    }
  } catch (error) {
    console.error(error);
    renderTable([]);

    // 恢复按钮状态
    const listRefreshBtn = document.querySelector('#list-refresh-btn');
    if (listRefreshBtn) {
      listRefreshBtn.disabled = false;
      listRefreshBtn.textContent = t('refreshBtn');
    }
  }
}

function toggleBusy(isBusy) {
  uploadBtn.disabled = isBusy;
  if (refreshBtn) {
    refreshBtn.disabled = isBusy;
  }
  const listRefreshBtn = document.querySelector('#list-refresh-btn');
  if (listRefreshBtn) {
    listRefreshBtn.disabled = isBusy;
  }
}

// ---- 顶部进度/状态条 ----
const topbar = document.querySelector('#topbar');
const topbarFill = document.querySelector('#topbar-fill');
const topbarLabel = document.querySelector('#topbar-label');
let barTimer = null;
let barTransfer = false; // 传输进行中:不被普通消息打断/自动隐藏
let barStartTs = 0;

function actLabel(kind) {
  const zh = currentLang === 'zh';
  return kind === 'ul' ? (zh ? '上传中' : 'Uploading') : (zh ? '下载中' : 'Downloading');
}

function setStatus(message, isError = false) {
  if (!topbar) return;
  if (barTransfer && !isError) return;
  clearTimeout(barTimer);
  if (!message) { topbar.hidden = true; return; }
  topbar.hidden = false;
  topbar.classList.remove('indeterminate');
  topbar.classList.toggle('error', Boolean(isError));
  topbarFill.style.width = '0%';
  topbarLabel.textContent = message;
  barTimer = setTimeout(() => { topbar.hidden = true; }, isError ? 4000 : 2500);
}

function transferStart(label) {
  if (!topbar) return;
  barTransfer = true;
  barStartTs = performance.now();
  clearTimeout(barTimer);
  topbar.hidden = false;
  topbar.classList.remove('error');
  topbar.classList.add('indeterminate');
  topbarFill.style.width = '0%';
  topbarLabel.textContent = label || '';
}

function transferProgress(loaded, total, action, filename) {
  if (!topbar) return;
  const secs = (performance.now() - barStartTs) / 1000;
  const speed = secs > 0 ? loaded / secs : 0;
  let text = filename ? `${action} ${filename}` : action;
  if (total > 0) {
    const pct = Math.min(100, Math.round((loaded / total) * 100));
    topbar.classList.remove('indeterminate');
    topbarFill.style.width = `${pct}%`;
    text += ` — ${pct}%`;
  }
  if (speed > 0) text += ` · ${formatBytes(speed)}/s`;
  topbarLabel.textContent = text;
}

function transferEnd(message, isError = false) {
  barTransfer = false;
  if (!topbar) return;
  clearTimeout(barTimer);
  topbar.classList.remove('indeterminate');
  topbar.classList.toggle('error', Boolean(isError));
  topbarFill.style.width = '100%';
  if (message) topbarLabel.textContent = message;
  barTimer = setTimeout(() => { topbar.hidden = true; }, isError ? 4000 : 1400);
}

// XHR 上传以获得上传进度
function xhrUpload(method, url, body, headers, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    for (const k in (headers || {})) xhr.setRequestHeader(k, headers[k]);
    if (xhr.upload) {
      xhr.upload.onprogress = (e) => onProgress && onProgress(e.loaded, e.lengthComputable ? e.total : 0);
    }
    xhr.onload = () => resolve({ status: xhr.status, ok: xhr.status >= 200 && xhr.status < 300, text: xhr.responseText });
    xhr.onerror = () => reject(new TypeError('Network request failed'));
    xhr.send(body);
  });
}

// 流式下载 + Blob 保存:强制下载所有格式,并显示进度/速度
async function downloadWithProgress(url, filename) {
  transferStart(`${actLabel('dl')} ${filename}`);
  const response = await fetch(url);
  if (!response.ok) {
    let msg = String(response.status);
    try { const d = await response.json(); if (d?.error) msg = d.error; } catch (e) { /* ignore */ }
    throw new Error(msg);
  }
  const total = Number(response.headers.get('Content-Length')) || 0;
  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    transferProgress(loaded, total, actLabel('dl'), filename);
  }
  const objectUrl = URL.createObjectURL(new Blob(chunks));
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  requestAnimationFrame(() => anchor.remove());
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
  transferEnd(t('statusDownloadDone'));
}

function setTextStatus(message, isError = false) {
  if (!textStatusEl) return;
  textStatusEl.textContent = message ?? '';
  textStatusEl.classList.toggle('error', Boolean(isError));
}

async function uploadFile(file, key) {
  const password = passwordInput?.value?.trim();

  // 如果有密码，必须使用代理上传
  if (password || preferProxy) {
    await uploadViaProxy(file, key);
    return;
  }

  setStatus(t('statusUploading'));
  const signResponse = await apiPost('/signPut', {
    key,
    contentType: file.type || undefined,
  });

  if (!signResponse?.url) {
    throw new Error(t('missingUploadUrl'));
  }

  // 后端可能返回了规范化的 key(例如添加了扩展名)
  const actualKey = signResponse.key || key;
  const filename = (actualKey || '').split('/').pop() || 'file';

  transferStart(`${actLabel('ul')} ${filename}`);

  try {
    const putResult = await xhrUpload(
      'PUT',
      signResponse.url,
      file,
      { 'Content-Type': file.type || 'application/octet-stream' },
      (loaded, total) => transferProgress(loaded, total, actLabel('ul'), filename)
    );

    if (!putResult.ok) {
      throw new Error(`${putResult.status}`);
    }
  } catch (error) {
    if (shouldFallbackToProxy(error)) {
      enableProxyFallback();
      await uploadViaProxy(file, actualKey);
      return;
    }

    transferEnd(t('statusError', error.message), true);
    throw error;
  }

  transferEnd(t('statusUploadSuccess'));
  await finishSuccessfulUpload();
}

async function uploadViaProxy(file, key) {
  const password = passwordInput?.value?.trim();
  const filename = (key || '').split('/').pop() || 'file';

  const formData = new FormData();
  formData.set('key', key);
  formData.set('file', file);
  if (password) {
    formData.set('password', password);
  }

  transferStart(`${actLabel('ul')} ${filename}`);
  const response = await xhrUpload(
    'POST',
    '/proxy/upload',
    formData,
    {},
    (loaded, total) => transferProgress(loaded, total, actLabel('ul'), filename)
  );

  if (!response.ok) {
    let message = t('proxyUploadError');
    try {
      const data = JSON.parse(response.text);
      if (data?.error) message = data.error;
    } catch (error) { /* ignore */ }
    transferEnd(message, true);
    throw new Error(message);
  }

  // 后端可能返回规范化的 key / emoji 密码
  try {
    const result = JSON.parse(response.text);
    if (result?.emojiPassword) showEmojiPassword(result.emojiPassword);
  } catch (error) { /* ignore */ }

  transferEnd(t('statusUploadSuccess'));
  await finishSuccessfulUpload();
}

function shouldFallbackToProxy(error) {
  if (!error) return false;
  if (error instanceof TypeError) return true;

  const message = String(error.message || error).toLowerCase();
  return /network|fetch|timeout|connection|cors|dns|failed to fetch/.test(message);
}

function enableProxyFallback() {
  preferProxy = true;
  proxyFallbackActivated = true;
  updateProxyIndicator();
}

async function finishSuccessfulUpload() {
  setStatus(t('statusUploadSuccess'));
  fileInput.value = '';
  keyInput.value = '';
  // 清除缓存并强制刷新文件列表
  fileListCache = null;
  cacheTimestamp = 0;
  await loadList(true);
}

async function downloadViaProxy(key, password = null) {
  setStatus(t('statusProxyDownload', key));

  let url = `/proxy/download?key=${encodeURIComponent(key)}`;
  if (password) {
    url += `&password=${encodeURIComponent(password)}`;
  }

  openDownloadLink(url, key);
  setStatus(t('statusDownloadDone'));
}

function updateProxyIndicator() {
  document.documentElement.dataset.networkMode = preferProxy ? 'proxy' : 'direct';
}

async function apiPost(path, payload) {
  const response = await apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error || t('genericRequestError'));
  }
  return response.json();
}

function apiFetch(path, init = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(init.headers || {}),
  };
  return fetch(path, {
    ...init,
    headers,
  });
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value < 10 && index > 0 ? 1 : 0)} ${units[index]}`;
}

function formatUptime(milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return '—';

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}${translations[currentLang].uptimeDays}`);
  if (remainingHours > 0) parts.push(`${remainingHours}${translations[currentLang].uptimeHours}`);
  if (remainingMinutes > 0 || parts.length === 0) parts.push(`${remainingMinutes}${translations[currentLang].uptimeMinutes}`);

  return parts.join('');
}

function formatTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(currentLang === 'zh' ? 'zh-CN' : undefined, {
    hour12: false,
  });
}

function sanitizeKeyInput(input) {
  const value = String(input || '').trim().replace(/^\/+/, '');
  if (!value || value.includes('..') || value.includes('\\')) {
    throw new Error(t('statusInvalidKey'));
  }
  return value;
}

function hasFileExtension(key) {
  return /\.[a-zA-Z0-9]{1,10}$/.test(key);
}

function ensureFileExtension(key, fallbackExt = 'bin') {
  if (!hasFileExtension(key)) {
    return `${key}.${fallbackExt}`;
  }
  return key;
}

function getFileExtension(filename) {
  const match = filename.match(/\.([a-zA-Z0-9]{1,10})$/);
  return match ? match[1] : null;
}

function normalizeFileKey(input, file = null) {
  let key = sanitizeKeyInput(input);

  // 如果没有扩展名,尝试从文件对象获取
  if (!hasFileExtension(key) && file && file.name) {
    const ext = getFileExtension(file.name);
    if (ext) {
      key = `${key}.${ext}`;
    } else {
      key = ensureFileExtension(key, 'bin');
    }
  } else if (!hasFileExtension(key)) {
    // 如果完全没有扩展名,添加默认扩展名
    key = ensureFileExtension(key, 'bin');
  }

  return key;
}

function normalizeTextKey(input) {
  let key = sanitizeKeyInput(input);
  if (!key.toLowerCase().endsWith('.txt')) {
    key = `${key}.txt`;
  }
  if (!key.startsWith('texts/')) {
    key = `texts/${key}`;
  }
  return key;
}

function generateTextKey() {
  const iso = new Date().toISOString().replace(/[:.]/g, '-');
  return `texts/${iso}.txt`;
}

function openDownloadLink(url, key) {
  const isIos = /iP(?:ad|hone|od)/i.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const filename = (key || '').split('/').pop() || 'download';

  if (isIos && isSafari) {
    window.location.href = url;
    return;
  }

  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener';
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    requestAnimationFrame(() => anchor.remove());
  } catch (error) {
    console.warn('Falling back to window.open for download', error);
    window.open(url, '_blank');
  }
}

function updateKeyFromSelection() {
  if (fileInput.files.length === 0) return;
  const file = fileInput.files[0];
  if (!keyInput.value) {
    keyInput.value = file.name;
  }
}

function switchLanguage(lang) {
  currentLang = lang;

  if (!proxyFallbackActivated) {
    preferProxy = lang === 'zh';
  }
  updateProxyIndicator();

  langButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

  const dict = translations[lang];
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    const value = dict[key];
    if (typeof value === 'function') {
      if (el === fileCountEl) {
        el.textContent = value(parseInt(el.dataset.count ?? '0', 10));
      } else if (el.dataset.i18nArgs) {
        el.textContent = value(...JSON.parse(el.dataset.i18nArgs));
      }
    } else if (typeof value === 'string') {
      el.textContent = value;
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    const value = dict[key];
    if (typeof value === 'string') {
      el.placeholder = value;
    }
  });

  renderTable(currentItems);
  setStatus(t('statusIdle'));
  setTextStatus(t('textStatusIdle'));
}

function t(key, ...args) {
  const value = translations[currentLang][key];
  if (typeof value === 'function') {
    return value(...args);
  }
  return value;
}

let currentItems = [];

function renderTable(items) {
  currentItems = Array.isArray(items) ? items : [];
  tableBody.innerHTML = '';

  if (!currentItems.length) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 5; // 更新为5列
    emptyCell.className = 'table-empty';
    emptyCell.dataset.i18n = 'empty';
    emptyCell.textContent = t('empty');
    emptyRow.appendChild(emptyCell);
    tableBody.appendChild(emptyRow);
    fileCountEl.dataset.count = '0';
    fileCountEl.textContent = t('fileCount', 0);
    return;
  }

  const fragment = document.createDocumentFragment();
  currentItems
    .slice()
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
    .forEach((item) => {
      const tr = document.createElement('tr');

      const nameCell = document.createElement('td');
      nameCell.textContent = item.key;

      const sizeCell = document.createElement('td');
      sizeCell.textContent = formatBytes(item.size);

      const timeCell = document.createElement('td');
      timeCell.textContent = formatTime(item.lastModified);

      const actionCell = document.createElement('td');
      actionCell.style.textAlign = 'right';

      // 检查是否为txt文件，添加View按钮
      const isTxtFile = item.key.toLowerCase().endsWith('.txt');
      const buttons = [];

      if (isTxtFile) {
        const viewBtn = document.createElement('button');
        viewBtn.dataset.action = 'view';
        viewBtn.dataset.key = item.key;
        viewBtn.classList.add('primary');
        viewBtn.dataset.i18n = 'view';
        viewBtn.textContent = t('view');
        viewBtn.style.marginRight = '0.5rem';
        buttons.push(viewBtn);
      }

      const downloadBtn = document.createElement('button');
      downloadBtn.dataset.action = 'download';
      downloadBtn.dataset.key = item.key;
      downloadBtn.classList.add('secondary');
      downloadBtn.dataset.i18n = 'download';
      downloadBtn.textContent = t('download');
      buttons.push(downloadBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.dataset.action = 'delete';
      deleteBtn.dataset.key = item.key;
      deleteBtn.classList.add('danger');
      deleteBtn.style.marginLeft = '0.5rem';
      deleteBtn.dataset.i18n = 'remove';
      deleteBtn.textContent = t('remove');
      buttons.push(deleteBtn);

      // 添加所有按钮到actionCell
      actionCell.append(...buttons);
      tr.append(nameCell, sizeCell, timeCell, actionCell);
      fragment.appendChild(tr);
    });

  tableBody.appendChild(fragment);
  fileCountEl.dataset.count = String(currentItems.length);
  fileCountEl.textContent = t('fileCount', currentItems.length);
}

async function fetchUptime() {
  try {
    // 检查运行时间缓存
    const now = Date.now();
    if (uptimeCache && (now - uptimeCacheTime) < UPTIME_CACHE_DURATION) {
      serviceStartTime = uptimeCache;
      updateUptime();
      return;
    }

    const response = await fetch('/status');
    if (!response.ok) return;
    const data = await response.json();

    // 更新缓存
    serviceStartTime = data.startTime;
    uptimeCache = data.startTime;
    uptimeCacheTime = now;

    updateUptime();
  } catch (error) {
    console.warn('Failed to fetch uptime', error);
  }
}

function updateUptime() {
  if (!uptimeEl || !serviceStartTime) return;
  const uptime = Date.now() - serviceStartTime;
  const formatted = formatUptime(uptime);
  uptimeEl.textContent = `${t('uptimePrefix')}${formatted}`;
}

setStatus(t('statusIdle'));

loadList();
fetchUptime();

// 每30秒更新一次运行时长
setInterval(updateUptime, 30000);

// Emoji密码相关函数
function showEmojiPassword(emojiPassword) {
  const modal = document.getElementById('emoji-password-modal');
  const display = document.getElementById('emoji-password-display');

  display.textContent = emojiPassword;
  modal.classList.add('show');
}

function closeEmojiModal() {
  const modal = document.getElementById('emoji-password-modal');
  modal.classList.remove('show');
}

async function copyEmojiPassword() {
  const display = document.getElementById('emoji-password-display');
  const password = display.textContent;

  try {
    await navigator.clipboard.writeText(password);
    // 临时改变按钮文本显示复制成功
    const copyBtn = document.querySelector('[onclick="copyEmojiPassword()"]');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '已复制!';
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 2000);
  } catch (error) {
    console.error('复制失败:', error);
    // 备用方案：选中文本
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(display);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

// 添加密码输入验证
if (passwordInput) {
  passwordInput.addEventListener('input', function (e) {
    const value = e.target.value;
    // 只允许数字输入
    const numericValue = value.replace(/\D/g, '');
    if (numericValue !== value) {
      e.target.value = numericValue;
    }
    // 限制最大长度
    if (numericValue.length > 6) {
      e.target.value = numericValue.slice(0, 6);
    }
  });
}

// 为文本密码输入框添加相同的验证
if (textPasswordInput) {
  textPasswordInput.addEventListener('input', function (e) {
    const value = e.target.value;
    // 只允许数字输入
    const numericValue = value.replace(/\D/g, '');
    if (numericValue !== value) {
      e.target.value = numericValue;
    }
    // 限制最大长度
    if (numericValue.length > 6) {
      e.target.value = numericValue.slice(0, 6);
    }
  });
}

// 全局函数，供HTML调用
window.closeEmojiModal = closeEmojiModal;
window.copyEmojiPassword = copyEmojiPassword;

// 文本预览相关功能
let currentPreviewKey = null;

async function handleTextPreview(key) {
  try {
    // 首先检查文件是否需要密码
    const needsPassword = await checkIfPasswordRequired(key);

    let emojiPassword = null;
    if (needsPassword) {
      emojiPassword = await promptForPassword(key);
      if (!emojiPassword) {
        return; // 用户取消
      }
    }

    // 请求文本预览
    const response = await apiPost('/preview-text', {
      key: key,
      password: emojiPassword
    });

    showTextPreview(response, key);

  } catch (error) {
    console.error('Text preview failed', error);
    alert('预览失败: ' + error.message);
  }
}

function showTextPreview(data, key) {
  currentPreviewKey = key;

  const modal = document.getElementById('text-preview-modal');
  const title = document.getElementById('text-preview-title');
  const content = document.getElementById('text-preview-content');
  const info = document.getElementById('text-preview-info');

  title.textContent = `📄 ${key}`;
  content.textContent = data.content;

  const sizeText = formatBytes(data.size);
  const timeText = data.lastModified ? formatTime(data.lastModified) : '未知';
  info.textContent = `大小: ${sizeText} | 修改时间: ${timeText}`;

  modal.classList.add('show');
}

function closeTextPreviewModal() {
  const modal = document.getElementById('text-preview-modal');
  modal.classList.remove('show');
  currentPreviewKey = null;
}

async function copyTextContent() {
  const content = document.getElementById('text-preview-content');
  const text = content.textContent;

  try {
    await navigator.clipboard.writeText(text);
    const status = document.getElementById('text-preview-status');
    status.textContent = '内容已复制！';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  } catch (error) {
    console.error('复制失败:', error);
    // 备用方案：选中文本
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(content);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

async function downloadFromPreview() {
  if (currentPreviewKey) {
    await handleDownload(currentPreviewKey);
  }
}

// 全局函数，供HTML调用
window.closeTextPreviewModal = closeTextPreviewModal;
window.copyTextContent = copyTextContent;
window.downloadFromPreview = downloadFromPreview;

// 异步更新文件状态
async function updateFileStatus(keys) {
  try {
    const response = await apiPost('/file-status', { keys });

    response.results.forEach(result => {
      const statusCell = document.querySelector(`td[data-key="${result.key}"]`);
      if (statusCell) {
        if (result.error) {
          statusCell.innerHTML = '<span style="color: #888888;">-</span>';
        } else if (result.hasPassword) {
          statusCell.innerHTML = '<span style="color: #ff9800;">🔒</span>';
          statusCell.title = 'Locked with password';
        } else {
          statusCell.innerHTML = '<span style="color: #888888;">-</span>';
          statusCell.title = 'No password';
        }
      }
    });
  } catch (error) {
    console.error('Failed to update file status:', error);
    // 如果获取状态失败，显示默认状态
    keys.forEach(key => {
      const statusCell = document.querySelector(`td[data-key="${key}"]`);
      if (statusCell) {
        statusCell.innerHTML = '<span style="color: #888888;">-</span>';
      }
    });
  }
}

// 检查文件是否需要密码
async function checkIfPasswordRequired(key) {
  try {
    const response = await apiPost('/verify-password', {
      key: key,
      password: ''
    });
    return response.hasPassword && !response.valid;
  } catch (error) {
    // 如果API调用失败，假设不需要密码
    console.warn('检查密码要求失败:', error);
    return false;
  }
}

// 提示用户输入密码
function promptForPassword(fileName, action = '下载', hasPassword = true) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'emoji-password-modal show';

    if (hasPassword) {
      // 有密码的文件，需要输入密码
      const isZh = currentLang === 'zh';
      modal.innerHTML = `
        <div class="emoji-password-content" style="max-width: 320px; padding: 1.5rem;">
          <button class="close-btn" onclick="this.closest('.emoji-password-modal').remove(); window.resolve(null);">&times;</button>
          <p style="margin: 0 0 1rem 0; color: #ffffff;">${isZh ? '输入密码：' : 'Enter password:'}</p>
          <input
            type="text"
            id="password-input-modal"
            style="width: 100%; padding: 0.7rem; border: 1px solid #333; border-radius: 10px; background: #000; color: #fff; margin-bottom: 1rem;"
            autocomplete="off"
          />
          <div style="display: flex; gap: 0.5rem;">
            <button class="secondary" onclick="this.closest('.emoji-password-modal').remove(); window.resolve(null);" style="flex: 1;">${isZh ? '取消' : 'Cancel'}</button>
            <button class="primary" onclick="window.submitPassword();" style="flex: 1;">${isZh ? '确认' : 'Confirm'}</button>
          </div>
        </div>
      `;

      // 添加函数到窗口对象
      window.resolve = resolve;
      window.submitPassword = function () {
        const passwordInput = document.getElementById('password-input-modal');
        const password = passwordInput.value.trim();

        if (!password) {
          passwordInput.style.borderColor = 'red';
          passwordInput.focus();
          return;
        }

        modal.remove();
        delete window.resolve;
        delete window.submitPassword;
        resolve(password);
      };

      document.body.appendChild(modal);
      const input = document.getElementById('password-input-modal');
      input.focus();
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          window.submitPassword();
        }
      });
    } else {
      // 没有密码的文件，只需要确认
      const isZh = currentLang === 'zh';
      modal.innerHTML = `
        <div class="emoji-password-content" style="max-width: 280px; padding: 1.5rem;">
          <button class="close-btn" onclick="this.closest('.emoji-password-modal').remove(); window.resolve(null);">&times;</button>
          <p style="margin: 0 0 1rem 0; color: #ffffff;">${isZh ? '确认删除？' : 'Confirm delete?'}</p>
          <div style="display: flex; gap: 0.5rem;">
            <button class="secondary" onclick="this.closest('.emoji-password-modal').remove(); window.resolve(null);" style="flex: 1;">${isZh ? '取消' : 'Cancel'}</button>
            <button class="danger" onclick="window.confirmDelete();" style="flex: 1;">${isZh ? '删除' : 'Delete'}</button>
          </div>
        </div>
      `;

      // 添加函数到窗口对象
      window.resolve = resolve;
      window.confirmDelete = function () {
        modal.remove();
        delete window.resolve;
        delete window.confirmDelete;
        resolve('confirmed'); // 返回确认标识符而不是实际密码
      };

      document.body.appendChild(modal);
    }
  });
}
