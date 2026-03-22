# Section: Backup & Restore

**Nav Label:** Backup & Restore  
**Nav Icon:** Database  
**Route ID:** `backup`  
**Current Status:** 🟢 Implemented — functional export and import

---

## Purpose

The Backup & Restore section provides **data portability and recovery** for the application. Its role is to answer:

> _"Can I safely back up everything and restore it if something goes wrong?"_

Given that this is a self-hosted personal finance tool with no cloud sync, local backups are the primary (and only) safety net for data preservation.

---

## Functionality

### Export

- Calls `GET /api/backup/export`
- Returns a single versioned JSON object containing all application data
- The file is downloaded directly to the user's browser as:  
  `wealth-tracker-backup-YYYY-MM-DD.json`

**Backup envelope format:**
```json
{
  "version": 1,
  "timestamp": "2026-03-22T21:00:00.000Z",
  "data": {
    "wealth": {
      "sources": [...],
      "snapshots": [...]
    },
    "budget": {
      "incomes": [...],
      "outgoings": [...],
      "accounts": [...],
      "allocations": [...]
    }
  }
}
```

### Import / Restore

1. User selects a `.json` backup file via file picker
2. Basic validation checks for `version` and `data` fields
3. A confirmation panel is shown listing the record counts in the backup file
4. On confirmation, `POST /api/backup/import` is called
5. Success or failure is shown via a status banner

**Import strategy (current):** The backend clears all existing application data and performs a clean insert of the backup data. Before wiping the data, it saves a single snapshot of the pre-import state, allowing the user to "Undo Last Restore" if needed.

---

## System Information Panel

Displays the current application version number (`0.2`). This is currently hardcoded in `BackupPage.tsx` and should be read from a shared version source.

---

## Suggestions

1. ✅ **[Resolved] The merge-not-replace import strategy is a silent risk** — The application now clears data before insertion and offers a single-version revert feature.

2. **No validation of backup version compatibility** — the import endpoint accepts any version number. Once the application's data model evolves (e.g., a new entity or field added), an old backup restored into a new schema could be silently incomplete. A version check with a clear warning ("This backup was created with v0.1 and may be missing fields added in v0.2") would improve resilience.

3. **Version number is hardcoded** — `BackupPage.tsx` line 149 has `"0.2"` as a string literal. The backup export `version: 1` is hardcoded in `backup.service.ts`. These should both reference a shared constant (e.g., a `version.ts` file in the root or an env variable) to ensure they stay in sync.

4. **`alert()` is used for error messages** — `BackupPage.tsx` uses `alert()` for export failure and invalid file format errors. This is inconsistent with the rest of the UI which uses styled inline banners. The error handling pattern should be unified.

5. **No scheduled/automated backup** — the backup is entirely manual. For a self-hosted app targeting NAS devices (Unraid), an automated nightly export to a configurable path would be a high-value addition and is feasible without introducing significant complexity.

6. **Import of accounts and allocations** — the backup correctly covers the full data set including the newer `accounts` and `allocations` budget entities. Any future new entity added to the data model must also be added to the backup export/import to keep the system complete.

7. **There is also a legacy CSV import/export** (via `GET /api/wealth/export` and `POST /api/wealth/import`) that predates the JSON backup system. This covers wealth snapshots only. The relationship between the two backup mechanisms should be clarified — the CSV system may now be redundant and could be removed or promoted as a "spreadsheet-friendly export" option.

8. **Revert state persistence** — The `.backup-revert.json` file used for the "Undo Last Restore" feature is currently saved to the local working directory. It should be stored in a persistent volume so that the revert capability survives a container restart.
