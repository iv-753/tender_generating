export const ARTIFACT_RETENTION_MS = 24 * 60 * 60 * 1000;

// Legacy links were signed after upload. Generation functions allow at most
// five minutes, so keep this margin before removing their backing files.
export const ARTIFACT_CLEANUP_GRACE_MS = 5 * 60 * 1000;
