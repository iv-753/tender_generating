import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

import { privateBlobBytes } from './blob-store.mjs';

const DEFAULT_BLOB_PATH = 'models/property-cost-model.xlsx';

export async function loadCostModelBytes({ env = process.env, getBlob, localPath } = {}) {
  if (env.VERCEL || env.COST_MODEL_BLOB_PATH) {
    const pathname = env.COST_MODEL_BLOB_PATH || DEFAULT_BLOB_PATH;
    const bytes = await privateBlobBytes(pathname, { getBlob });
    if (!bytes) throw new Error('成本测算模型尚未配置，请联系管理员');
    return bytes;
  }
  return readFile(localPath || resolve(process.cwd(), '..', '动态成本分析模型.xlsx'));
}
