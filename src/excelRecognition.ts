import type { ExcelRecognitionResult } from './types';

const MAX_EXCEL_BYTES = 4_000_000;

export async function recognizeExcelFile(file: File): Promise<ExcelRecognitionResult> {
  if (!file.name.toLowerCase().endsWith('.xlsx')) throw new Error('仅支持 .xlsx 文件');
  if (file.size > MAX_EXCEL_BYTES) throw new Error('文件不能超过 4MB');

  const response = await fetch('/api/excel/recognize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'X-File-Name': encodeURIComponent(file.name),
    },
    body: file,
  });
  const payload = await response.json().catch(() => null) as ExcelRecognitionResult | { error?: string } | null;
  if (!response.ok) {
    throw new Error(payload && 'error' in payload && payload.error ? payload.error : 'Excel识别失败，请重新上传');
  }
  if (!payload || !('project' in payload) || !Array.isArray(payload.missingFields)) throw new Error('识别服务返回了无效结果');
  return payload;
}
