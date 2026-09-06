export const OFFICIAL_EXCEL_RECOGNITION_URL = 'https://www.zhiyingtupu.website/api/excel/recognize';

export async function recognizeExcelRemotely(bytes, {
  fileName,
  fetchImpl = fetch,
  timeoutMs = 60_000,
} = {}) {
  let response;
  try {
    response = await fetchImpl(OFFICIAL_EXCEL_RECOGNITION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'X-File-Name': encodeURIComponent(fileName || '项目资料.xlsx'),
      },
      body: bytes,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new Error('线上智能识别暂时不可用');
  }

  if (!response.ok) throw new Error('线上智能识别暂时不可用');
  const payload = await response.json().catch(() => null);
  if (!payload || typeof payload !== 'object' || !payload.project || !Array.isArray(payload.missingFields)) {
    throw new Error('线上智能识别返回了无效结果');
  }
  return payload;
}
