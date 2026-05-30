// 文件密码加密/校验工具
// 注意:使用固定盐 + SHA-256,仅用于轻量级访问控制,不可视为强加密。
const SALT_SEED = "InksPortalEncryption2024";

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text + SALT_SEED);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function generatePasswordHash(password) {
  if (!password) {
    return null;
  }
  return sha256Hex(password);
}

export async function verifyPasswordHash(password, storedHash) {
  // 无存储哈希视为无密码,直接放行
  if (!storedHash) {
    return true;
  }
  if (!password) {
    return false;
  }
  try {
    return (await sha256Hex(password)) === storedHash;
  } catch (error) {
    console.error("密码验证错误:", error);
    return false;
  }
}
