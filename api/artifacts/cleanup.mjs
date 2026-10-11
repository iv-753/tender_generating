import { timingSafeEqual } from 'node:crypto';
import { cleanupExpiredArtifacts } from '../_lib/artifact-cleanup.mjs';
import { json } from '../_lib/http.mjs';

export function createArtifactCleanupHandler({
  cleanup = cleanupExpiredArtifacts,
  getSecret = () => process.env.CRON_SECRET,
} = {}) {
  return {
    async fetch(request) {
      if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
      const secret = getSecret();
      if (!secret) return json({ error: 'Cleanup is not configured' }, 503);
      const actual = Buffer.from(request.headers.get('authorization') ?? '');
      const expected = Buffer.from(`Bearer ${secret}`);
      if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
        return json({ error: 'Unauthorized' }, 401);
      }
      try {
        const stats = await cleanup({
          abortSignal: AbortSignal.timeout(50_000),
          dryRun: new URL(request.url).searchParams.get('dryRun') === '1',
        });
        console.info('Artifact cleanup completed', stats);
        return json(stats);
      } catch {
        console.error('Artifact cleanup failed; expired files will be retried on the next run');
        return json({ error: 'Artifact cleanup failed' }, 500);
      }
    },
  };
}

export default createArtifactCleanupHandler();
