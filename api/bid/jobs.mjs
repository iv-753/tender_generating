import { resolve } from 'node:path';

import { generateBidDocumentBytes } from '../../scripts/bid-binding/generate-bid.mjs';
import { storePrivateArtifact } from '../_lib/blob-store.mjs';
import { createGenerationHandler } from '../_lib/generation-handler.mjs';

const templatePath = resolve(process.cwd(), 'templates', '安序物业_住宅物业服务投标文件_双括号动态母版_清理版.docx');

export default createGenerationHandler({
  kind: 'bid',
  extension: 'docx',
  fileLabel: '投标标书',
  contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  generate: (result) => generateBidDocumentBytes({ templatePath, result }),
  store: storePrivateArtifact,
});
