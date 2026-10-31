APG: ACCDE/ACCDB -> JSON -> PostgreSQL

1. On Windows install Microsoft Access Runtime of matching architecture, and Node.js 20+.
2. Extract this ZIP to a folder. Do not put your Access file on the Linux VPS.
3. Open PowerShell inside the extracted folder.
4. Convert:
   powershell -ExecutionPolicy Bypass -File .\Convert-APGAccess.ps1 -AccessFile "C:\path\file.accde"
5. Review generated APG-import-*.json, including counts and relationships.
6. Before uploading, take an independent PostgreSQL backup on the VPS.
7. Preview only:
   powershell -ExecutionPolicy Bypass -File .\Preview-Upload-APG.ps1 -JsonFile "C:\path\APG-import-....json"
8. If counts are correct, no conflicts, and PostgreSQL backup exists, repeat with -Commit.

Requires current APG backend with POST /api/import/json from Phase 6.
This API permits only Full Admin and merges by stable ID; conflict stops import.
Do not share JSON: it contains commercial/customer data. Never send credentials to chat.
If JSON exceeds server's 50MB request limit, do not manually split relationships: adjust limits after reviewing and backing up.
This converter uses the exact Access mapping extracted from APG Phase 6 server.js.
No files in your existing project are overwritten by this package.
Live Access extraction and VPS import have NOT been tested here.
