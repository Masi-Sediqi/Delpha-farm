APG first security patch (2026-10-31)
Apply only after backing up the current project.
Copies src/App.jsx and src/pages/Settings.jsx from public(1).zip plus previously available patch baseline.
This is NOT a complete resolution of all 14 findings.
Fix 1: Non-admin server users no longer receive full frontend permissions by default.
Fix 2: New/changed passwords in Settings must be at least 12 characters.
LIMITATION: Backend still only authorizes Admin for collections; User management is not yet integrated with delpha_users. Non-admin users will be denied until next migration phase.
This patch does not migrate accounts or touch PostgreSQL. Do not overwrite local changes newer than the supplied archive. Run npm run build and test UI.
