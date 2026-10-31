# APG Phase 5: Atomic Returns and Trash Restore

Install only after Phase 4. Back up PostgreSQL and modified files before replacement.

Files: backend atomic-batch route + PostgreSQL revision helper from phase 4, PurchaseReturns.jsx, SaleReturns.jsx, Trash.jsx.

Changes: three-collection batch for sales/purchase returns; four-collection batch for restoring purchases from trash; no partial client-side writes. For conflicts the transaction rolls back; the form remains open. A duplicate purchase cannot be restored over existing data. Permanent deletion stays a single collection update.

IMPORTANT LIMITATIONS: The route is Admin-only. Full server-side business validation (stock availability, returned quantities, record relationships, permissions, deletion provenance) is still pending. Do not treat this as a production authorization or stock-integrity audit. Existing purchase deletion path may still use separate writes; verify separately. Do not deploy to production until integration tests validate real PostgreSQL and concurrent browser operation.

Checks: node --check transport-backend/server.js; npm run build; test purchase return, sale return, restored purchase, conflict and rollback in staging.
