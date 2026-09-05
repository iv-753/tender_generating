import { get, put } from '@vercel/blob';
import { createArtifactDownloadUrl } from './artifact-download.mjs';

export async function privateBlobBytes(pathname, { getBlob = get } = {}) {
  const result = await getBlob(pathname, { access: 'private' });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return Buffer.from(await new Response(result.stream).arrayBuffer());
}

export function createPrivateArtifactStore({ putBlob = put, downloadTokenSecret } = {}) {
  return async function storePrivateArtifact({ pathname, downloadFileName, bytes, contentType }) {
    const blob = await putBlob(pathname, bytes, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType,
      multipart: bytes.byteLength > 5_000_000,
    });
    const validUntil = Date.now() + 24 * 60 * 60 * 1000;
    const downloadUrl = createArtifactDownloadUrl({
      pathname: blob.pathname,
      fileName: downloadFileName,
      validUntil,
    }, downloadTokenSecret);
    return { pathname: blob.pathname, downloadUrl, validUntil };
  };
}

export const storePrivateArtifact = createPrivateArtifactStore();
