export function json(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

export async function readJson(request, maxBytes = 1_000_000) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > maxBytes) throw new Error('请求数据过大');
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > maxBytes) throw new Error('请求数据过大');
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function errorMessage(error, fallback = '服务内部错误') {
  return error instanceof Error && error.message ? error.message : fallback;
}
