// Bump BILLS_VERSION whenever the bill deck is regenerated. Saved runs record
// the version they were played under; resume logic replays by bill id, so adding
// or removing bills never breaks an old run — this is just for display/telemetry.
export const BILLS_VERSION = '2026.06.28'

// Bump only when the SavedRun shape changes. Runs with a different schema are
// dropped on load rather than mis-read.
export const RUN_SCHEMA_VERSION = 2
