import { del, list } from '@vercel/blob';
import { ARTIFACT_CLEANUP_GRACE_MS, ARTIFACT_RETENTION_MS } from './artifact-retention.mjs';

const JOB_ID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const GENERATED_ARTIFACT = new RegExp(`^generated/(?:presentation/${JOB_ID}/artifact\\.pptx|bid/${JOB_ID}/artifact\\.docx)$`);

export function createArtifactCleanup({ listBlobs = list, deleteBlobs = del } = {}) {
  return async function cleanup({ now = Date.now(), abortSignal, dryRun = false } = {}) {
    if (!Number.isFinite(now)) throw new Error('Invalid cleanup time');
    const cutoff = now - ARTIFACT_RETENTION_MS - ARTIFACT_CLEANUP_GRACE_MS;
    const expired = new Map();
    const cursors = new Set();
    let cursor;
    let scanned = 0;

    // Finish pagination before deletion so removals cannot shift later pages.
    do {
      const page = await listBlobs({ prefix: 'generated/', limit: 1000, cursor, abortSignal });
      scanned += page.blobs.length;
      for (const blob of page.blobs) {
        if (!GENERATED_ARTIFACT.test(blob.pathname) || !blob.uploadedAt) continue;
        const uploadedAt = new Date(blob.uploadedAt).getTime();
        if (!Number.isFinite(uploadedAt) || uploadedAt > cutoff) continue;
        expired.set(blob.pathname, Number.isFinite(blob.size) && blob.size >= 0 ? blob.size : 0);
      }
      if (!page.hasMore) break;
      if (!page.cursor || cursors.has(page.cursor) || cursors.size >= 100) {
        throw new Error('Invalid or excessive Blob listing cursor');
      }
      cursors.add(page.cursor);
      cursor = page.cursor;
    } while (true);

    const paths = [...expired.keys()];
    if (dryRun) {
      return {
        scanned, deleted: 0, deletedBytes: 0, eligible: paths.length,
        eligibleBytes: [...expired.values()].reduce((sum, size) => sum + size, 0), dryRun: true,
      };
    }
    let deletedBytes = 0;
    for (let index = 0; index < paths.length; index += 100) {
      const batch = paths.slice(index, index + 100);
      await deleteBlobs(batch, { abortSignal });
      deletedBytes += batch.reduce((sum, pathname) => sum + expired.get(pathname), 0);
    }
    return { scanned, deleted: paths.length, deletedBytes };
  };
}

export const cleanupExpiredArtifacts = createArtifactCleanup();
