import { resolve } from 'node:path';

import { generatePresentationBytes } from '../../scripts/ppt-binding/generate-ppt.mjs';
import { storePrivateArtifact } from '../_lib/blob-store.mjs';
import { createGenerationHandler } from '../_lib/generation-handler.mjs';

const templatePath = resolve(process.cwd(), 'templates', '物业路演PPT_完整24页_v1.pptx');

export default createGenerationHandler({
  kind: 'presentation',
  extension: 'pptx',
  fileLabel: '路演方案',
  contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  generate: (result) => generatePresentationBytes({ templatePath, result }),
  store: storePrivateArtifact,
});
