import { createHmac, timingSafeEqual } from 'node:crypto';
import { get } from '@vercel/blob';

function tokenSecret(secret) {
  const value = secret || process.env.BLOB_READ_WRITE_TOKEN;
  if (!value) throw new Error('缺少私有文件下载签名配置');
  return value;
}

function signature(payload, secret) {
  return createHmac('sha256', tokenSecret(secret)).update(payload).digest('base64url');
}

export function createArtifactDownloadUrl({ pathname, fileName, validUntil }, secret) {
  const payload = Buffer.from(JSON.stringify({ pathname, fileName, validUntil })).toString('base64url');
  return `/api/artifacts/download?token=${encodeURIComponent(`${payload}.${signature(payload, secret)}`)}`;
}

export function readArtifactDownloadToken(token, secret, now = Date.now()) {
  const [payload, providedSignature, extra] = String(token || '').split('.');
  if (!payload || !providedSignature || extra) return null;
  const expected = Buffer.from(signature(payload, secret));
  const provided = Buffer.from(providedSignature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!value.pathname || !value.fileName || !Number.isFinite(value.validUntil) || value.validUntil <= now) return null;
    return value;
  } catch {
    return null;
  }
}

function textError(message, status) {
  return new Response(message, {
    status,
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
  });
}

export function createArtifactDownloadHandler({ getBlob = get, secret, now = Date.now } = {}) {
  return {
    async fetch(request) {
      if (request.method !== 'GET') return textError('仅支持 GET 请求', 405);
      const token = new URL(request.url).searchParams.get('token');
      const artifact = readArtifactDownloadToken(token, secret, now());
      const pathnameMatch = artifact?.pathname?.match(/^generated\/(?:presentation|bid)\/[0-9a-f-]+\/artifact\.(pptx|docx)$/i);
      const fileExtension = artifact?.fileName?.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
      if (!artifact || !pathnameMatch || pathnameMatch[1].toLowerCase() !== fileExtension || /[\r\n]/.test(artifact.fileName)) {
        return textError('下载链接无效或已过期', 403);
      }
      const result = await getBlob(artifact.pathname, { access: 'private' });
      if (!result || result.statusCode !== 200 || !result.stream) return textError('文件不存在', 404);
      const fallbackName = fileExtension === 'pptx' ? 'presentation.pptx' : 'bid-document.docx';
      return new Response(result.stream, {
        headers: {
          'Cache-Control': 'private, no-store',
          'Content-Disposition': `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(artifact.fileName)}`,
          'Content-Type': result.blob?.contentType || 'application/octet-stream',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    },
  };
}
