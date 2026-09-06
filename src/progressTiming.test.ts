import { describe, expect, test, vi } from 'vitest';

import { progressSnapshot, waitForMinimumDuration } from './progressTiming';

describe('progress timing', () => {
  test('maps elapsed time to a capped percent and active stage', () => {
    expect(progressSnapshot(0, 8_000, 4)).toEqual({ percent: 4, stage: 0 });
    expect(progressSnapshot(4_100, 8_000, 4)).toEqual({ percent: 51, stage: 2 });
    expect(progressSnapshot(20_000, 8_000, 4)).toEqual({ percent: 96, stage: 3 });
  });

  test('waits only for the remaining minimum duration', async () => {
    vi.useFakeTimers();
    const done = vi.fn();
    void waitForMinimumDuration(1_000, 8_000, () => 5_000).then(done);
    await vi.advanceTimersByTimeAsync(3_999);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
