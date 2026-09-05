export function createArtifactDownloadUrl({ sourceUrl, fileName }) {
  const search = new URLSearchParams({ source: sourceUrl, filename: fileName });
  return `/api/artifacts/download?${search}`;
}

function textError(message, status) {
  return new Response(message, {
    status,
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
  });
}

export function createArtifactDownloadHandler({ fetchSource = fetch } = {}) {
  return {
    async fetch(request) {
      if (request.method !== 'GET') return textError('仅支持 GET 请求', 405);
      const search = new URL(request.url).searchParams;
      const source = search.get('source');
      const fileName = search.get('filename');
      let sourceUrl;
      try { sourceUrl = new URL(source); } catch { return textError('下载链接无效或已过期', 403); }
      const pathnameMatch = sourceUrl.pathname.match(/^\/generated\/(?:presentation|bid)\/[0-9a-f-]+\/artifact\.(pptx|docx)$/i);
      const fileExtension = fileName?.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
      if (sourceUrl.protocol !== 'https:' || !sourceUrl.hostname.endsWith('.private.blob.vercel-storage.com') || !pathnameMatch || pathnameMatch[1].toLowerCase() !== fileExtension || /[\r\n]/.test(fileName)) {
        return textError('下载链接无效或已过期', 403);
      }
      const result = await fetchSource(source, { redirect: 'error' });
      if (!result.ok || !result.body) return textError('文件不存在或下载链接已过期', result.status === 404 ? 404 : 403);
      const fallbackName = fileExtension === 'pptx' ? 'presentation.pptx' : 'bid-document.docx';
      return new Response(result.body, {
        headers: {
          'Cache-Control': 'private, no-store',
          'Content-Disposition': `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
          'Content-Type': result.headers.get('content-type') || 'application/octet-stream',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    },
  };
}
