---
description: Update architecture review docs after application changes
---

# /update-docs — Keep Documentation In Sync

Run this workflow after any meaningful code change (new feature, new page, new backend endpoint, data model change, bug fix that changes behaviour) to keep the review documents accurate.

## Trigger

Use the slash command `/update-docs` or ask: "Please update the docs to reflect the changes I just made."

Always run this **after** the code change is complete and verified, not before.

---

## Step 1 — Identify what changed

Review the changes that were just made. Focus on:

- Which page/section (nav item) was affected?
- Was a new backend entity, endpoint, or module added?
- Was a stub page promoted to a real implementation?
- Was an existing feature significantly changed or removed?
- Was a new npm dependency introduced?
- Was the data model (entity, DTO) changed?

Summarise the scope before touching any docs.

---

## Step 2 — Update the relevant section document

The section documents live at:

```
<appDataDir>/brain/<conversation-id>/
  01_section_summary.md
  02_section_monthly_budget.md
  03_section_asset_tracker.md
  04_section_investments.md
  05_section_liabilities.md
  06_section_backup_restore.md
```

For the affected section(s):

- Update the **Current Status** badge:
  - `🔴 Placeholder — not yet implemented`
  - `🟡 Partially implemented — [what works / what doesn't]`
  - `🟢 Substantially implemented — [brief summary]`
- Update the **Functionality** table and descriptions to reflect what's now built
- Update any **data model** snippets if entities changed
- Remove or mark as resolved any **suggestions** that were actioned
- Add **new suggestions** if the review of the new code reveals new observations

Do NOT rewrite the whole document — make targeted, minimal edits to keep it accurate.

---

## Step 3 — Update the application overview document

The overview lives at:

```
<appDataDir>/brain/<conversation-id>/00_application_overview.md
```

Update it only if any of the following changed:

| Changed thing | What to update in the overview |
|--------------|-------------------------------|
| New npm dependency added | Tech Stack table |
| New backend module or entity | Project Structure tree + Data Model Summary |
| New page / nav section added | Core Objectives table; Project Structure |
| A suggestion was actioned | Mark as resolved in Architectural Suggestions (add ✅ prefix and note the version) |
| Application version bumped | Note in the header |
| Deployment configuration changed | Deployment table |

---

## Step 4 — Verify consistency

Cross-check these three things are consistent after edits:

1. The **Core Objectives** in `00_application_overview.md` match the actual state of all six section docs
2. The **Data Model Summary** in `00_application_overview.md` reflects the current entities
3. No **suggestion** is listed in both the overview and a section doc without being consistent between them (an actioned suggestion in one should be actioned in both)

---

## Step 5 — Commit the docs alongside the code

The docs in `<appDataDir>/brain/<conversation-id>/` are AI artifacts and don't need to be committed to Git. However, if you want the docs to be version-controlled alongside the code, copy them into the project:

```
wealth-tracker/docs/
  00_application_overview.md
  01_section_summary.md
  02_section_monthly_budget.md
  ...
```

// turbo
```bash
mkdir -p /Users/martin/Development/WealthTracker/wealth-tracker/docs
```

Then commit the `docs/` folder with the same commit as the code change so the history stays aligned.
