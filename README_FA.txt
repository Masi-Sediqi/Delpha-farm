Delpha targeted patch (2026-10-29)
Files are relative to the repository root.
- ProductMasterDataBootstrap: waits for initial collections to load; migrates once per mount rather than repeatedly writing productGroups/countries after every refresh.
- useJsonCollection: reduces background polling from 15s to 60s. This does not solve whole-collection PUT cost.
- Settings: explains why ACCDE fails on Ubuntu and why import is currently 403-disabled.

This is a mitigation, NOT confirmation that all data is on VPS. Some UI preferences, report settings and AI agent conversations still use localStorage. The normal business collection path is server mode when VITE_USE_BROWSER_STORAGE=false, but verify the deployed build and actual PostgreSQL data.

SECURITY: Before production use, rotate the previously exposed admin password. Do not enable Access import without secure authenticated conversion and validation. Do not expose PostgreSQL directly to the internet.

Deploy: commit these three files to your repo; git pull --ff-only; npm run build:production; verify /api/health, /api/collections unauthorized 401, and test create/reload from two browsers. No PM2 restart needed for these frontend changes.
