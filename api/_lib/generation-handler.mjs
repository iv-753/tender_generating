import { randomUUID } from 'node:crypto';

import { errorMessage, json, readJson } from './http.mjs';
import { resultValidationError, safeFileName } from './result-validation.mjs';

export function createGenerationHandler({ kind, extension, fileLabel, contentType, generate, store }) {
  return {
    async fetch(request) {
      if (request.method !== 'POST') return json({ error: '仅支持 POST 请求' }, 405);
      try {
        const result = await readJson(request);
        const validationError = resultValidationError(result);
        if (validationError) return json({ error: validationError }, 400);
        const jobId = randomUUID();
        const fileName = `${safeFileName(result.project.projectName)}-${fileLabel}.${extension}`;
        const output = await generate(result);
        const stored = await store({
          access: 'private',
          pathname: `generated/${kind}/${jobId}/artifact.${extension}`,
          downloadFileName: fileName,
          bytes: output.bytes,
          contentType,
        });
        return json({
          jobId,
          status: 'complete',
          stage: 'complete',
          fileName,
          downloadUrl: stored.downloadUrl,
          ...(output.slides ? { slides: output.slides } : {}),
          ...(output.actionCount !== undefined ? { actionCount: output.actionCount } : {}),
        });
      } catch (error) {
        console.error(error);
        return json({ error: errorMessage(error, `${fileLabel}生成失败`) }, 500);
      }
    },
  };
}
