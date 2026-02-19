export const formatSyncDuration = (durationMs: number | null): string => {
  if (durationMs === null || Number.isNaN(durationMs) || durationMs < 0) {
    return '';
  }

  if (durationMs < 1000) {
    return `${Math.round(durationMs)} ms`;
  }

  return `${(durationMs / 1000).toFixed(2)} s`;
};
