import { loadRecognitionConfig } from '../../scripts/excel-recognition/config.mjs';
import { recognizeExcel } from '../../scripts/excel-recognition/recognize-excel.mjs';
import { errorMessage, json } from '../_lib/http.mjs';

const MAX_EXCEL_BYTES = 4_000_000;

function isXlsx(bytes) {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

export function createExcelRecognitionHandler({ recognize = recognizeExcel, loadConfig = loadRecognitionConfig } = {}) {
  return {
    async fetch(request) {
      if (request.method !== 'POST') return json({ error: '仅支持 POST 请求' }, 405);
      try {
        const encodedName = request.headers.get('x-file-name') || '';
        let fileName;
        try { fileName = decodeURIComponent(encodedName); } catch { return json({ error: '文件名无效' }, 400); }
        if (!fileName.toLowerCase().endsWith('.xlsx')) return json({ error: '目前仅支持 .xlsx 文件' }, 400);
        const declared = Number(request.headers.get('content-length') || 0);
        if (declared > MAX_EXCEL_BYTES) return json({ error: '文件不能超过 4MB' }, 413);
        const bytes = Buffer.from(await request.arrayBuffer());
        if (bytes.length > MAX_EXCEL_BYTES) return json({ error: '文件不能超过 4MB' }, 413);
        if (!isXlsx(bytes)) return json({ error: '文件不是有效的 .xlsx 工作簿' }, 400);
        const config = await loadConfig();
        return json(await recognize(bytes, { config }));
      } catch (error) {
        console.error(error);
        return json({ error: errorMessage(error, 'Excel识别失败') }, 500);
      }
    },
  };
}

export default createExcelRecognitionHandler();
