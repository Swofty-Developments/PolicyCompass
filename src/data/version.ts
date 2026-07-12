// Bump BILLS_VERSION whenever the bill deck is regenerated. Compass runs record
// it for display/telemetry only (resume replays by bill id, so deck changes never
// break them). Terms careers pin their curated docket to this version and drop a
// saved run on mismatch — see src/terms/lib/storage.ts.
export const BILLS_VERSION = '2026.06.28'

// Bump only when the SavedRun shape changes. Runs with a different schema are
// dropped on load rather than mis-read.
export const RUN_SCHEMA_VERSION = 2
