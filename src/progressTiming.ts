export const CALCULATION_MINIMUM_MS = 8_000;
export const ARTIFACT_MINIMUM_MS = 15_000;

export function progressSnapshot(elapsedMs: number, durationMs: number, stageCount: number) {
  const ratio = Math.max(0, Math.min(1, elapsedMs / durationMs));
  return {
    percent: Math.min(96, Math.max(4, Math.floor(ratio * 100))),
    stage: Math.min(stageCount - 1, Math.floor(ratio * stageCount)),
  };
}

export function waitForMinimumDuration(startedAt: number, durationMs: number, now = Date.now) {
  const remaining = Math.max(0, startedAt + durationMs - now());
  return new Promise<void>((resolve) => globalThis.setTimeout(resolve, remaining));
}
