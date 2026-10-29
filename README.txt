Delpha-farm: targeted save conflict patch

Changed files:
- src/utils/browserStorage.js
- src/hooks/useJsonCollection.js

Findings:
- Frontend production uses /api and VITE_USE_BROWSER_STORAGE=false. Business collections go through PostgreSQL.
- GET 404 for a missing collection is normal; PUT If-Match 0 creates it.
- 409 is a stale revision and current frontend drops revision without resolving the conflict.
- Reads racing with optimistic writes can cause revision and displayed data to diverge.
- Accounts endpoint is intentionally 403 in server.js; it is not a network outage.
- Only Admin role can access collections (see server.js).

Patch:
- Wait for active loads before executing saves.
- One safe three-way merge attempt on 409, keyed by row ID.
- Never automatically overwrite a row that changed remotely.
- Report actual server errors.
- No database schema modifications.

Deployment: Commit the two paths to Masi-Sediqi/Delpha-farm, then on VPS run
cd /var/www/delpha-farm && git pull --ff-only origin main && npm run build:production
Do not delete database records or bypass revision validation. Test one new supplier and then verify server table rows.

LIMITATIONS: No authenticated end-to-end browser test performed here. GET/PUT errors other than conflicts or non-Admin access need separate tests. Other modules may still use localStorage for preferences.
