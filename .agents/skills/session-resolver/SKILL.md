---
name: session-resolver
user-invocable: true
description: 'Use this skill to process unresolved session logs, propagating metadata, phase updates, decisions, and hand-off notes to AGENTS.md, docs (including those in docs/architecture/ and docs/getting-started/), and rules, then archiving the processed log files.'
---

# Session Resolver

Use this skill to process pending session logs that have been recorded but not yet integrated into the project's central status files and documentation.

## Purpose

As developers and agents work on the project, they create temporary session logs in `docs/reports/session-logs/unresolved/` to avoid bloating the main `AGENTS.md` file. The `session-resolver` skill processes these files, updates the aggregate project state (such as the Phase Log, Blockers, and Hand-off Notes in `AGENTS.md`), updates any necessary repository rules or configuration documents, and archives the logs into `docs/reports/session-logs/resolved/` to maintain a clean workspace.

## When to Invoke

- **Start of Session**: Recommended at the beginning of a session if there are unresolved logs, ensuring the workspace is fully synchronized.
- **On Demand**: When unresolved session logs have accumulated and need to be processed to update the project status.

## Workflow

Follow these steps to resolve pending session logs:

### 1. Scan for Unresolved Logs
- Scan the directory `docs/reports/session-logs/unresolved/` for any markdown files (ignoring `.gitkeep`).
- If no files are found, stop and output: `No unresolved session logs found.`

### 2. Parse Pending Logs
For each unresolved session log file, parse and extract the following:
- **Timestamp & Agent**: The session start timestamp and the agent name (e.g. `Copilot`, `Antigravity`).
- **Session Focus & Notes**: Core objectives and any hand-off/next-step details.
- **Phase Log Changes**: Any adjustments to project phases (e.g. moving a phase from `Not Started` to `In Progress` or `Complete`).
- **Open Questions / Blockers**: Any new blockers added, or existing ones resolved/checked off.
- **ADRs & Decisions**: Any newly created or modified Architecture Decision Records.
- **Rules Violations / Policy Changes**: Any updates to guidelines or lint policies.

### 3. Update AGENTS.md
Modify the root [AGENTS.md](file:///D:/Ram%20Alin/src/Misc/receipt-invoice-generator/AGENTS.md) as follows:
- **Active Agent**: Set the `Active Agent` field under project metadata to the name of the last active agent.
- **Last Updated**: Update the `Last Updated` date to the timestamp of the latest resolved session.
- **Phase Log Table**: Synchronize the statuses and notes of all phases. Ensure that if a phase is completed, its status is updated to `✅ Complete` and any corresponding notes are filled out.
- **Open Questions / Blockers**: Check off resolved questions/blockers or add new ones as listed in the session log.
- **Hand-off Notes**: Update the Hand-off Notes section to contain the notes from the latest session log(s).
- *Note: Do NOT append the full session log text to `AGENTS.md`. The detailed session history remains stored in the individual log files.*

### 4. Propagate Infrastructure, Rules, and Docs
- **Decisions/ADRs**: Verify that all new ADRs are cataloged.
- **Syncing Rules**: If any rule modifications occurred, ensure `.agents/rules/` and `.bob/rules/` are completely in sync. Both directories must contain identical rules.
- **Documentation**: Update getting-started guides or system overview files if the session logs indicate documentation changes that need aggregate indexes updated.
- **Architecture & Getting Started Docs**:
  - Propagate changes to architecture documentation in `docs/architecture/` (such as `data-models.md`, `system-overview.md`, or specific module docs like `import-module.md` or `invoice-module.md`) to reflect any new modules, interfaces, schema changes, or flow changes mentioned in the session logs.
  - Propagate changes to setup or onboarding documentation in `docs/getting-started/` (such as `env-setup.md`, `local-setup.md`, `testing-guide.md`, or `deployment-guide.md`) to reflect new dependencies, environment variables, test structures, or deploy steps mentioned in the session logs.

### 5. Archive the Session Log
- Move each processed session log from `docs/reports/session-logs/unresolved/SES-[timestamp].md` to `docs/reports/session-logs/resolved/SES-[timestamp].md`.
- Keep the filename exactly the same (replacing any colons with hyphens to remain Windows-compatible, e.g. `SES-2026-05-20T09-57-56.md`).
- Ensure no data is lost during the move.

## Completion Criteria

This skill is successfully executed when:
- All unresolved files in `docs/reports/session-logs/unresolved/` have been processed and moved to `docs/reports/session-logs/resolved/`.
- [AGENTS.md](file:///D:/Ram%20Alin/src/Misc/receipt-invoice-generator/AGENTS.md) has its `Last Updated`, `Active Agent`, `Phase Log`, `Open Questions / Blockers`, and `Hand-off Notes` fully updated.
- Relevant documentation in `docs/architecture/` and `docs/getting-started/` is updated and synced based on session log findings.
- Rules in `.agents/rules/` and `.bob/rules/` are in sync if any policy changes occurred.
- The Git status of the repo shows unresolved logs moved to the resolved folder, and corresponding updates to `AGENTS.md` and related docs/rules.

## Do Nots

- **Do not** append the raw session log text into `AGENTS.md`. Keep it lightweight.
- **Do not** delete unresolved session logs without parsing and propagating their details.
- **Do not** modify or delete historical logs in the `docs/reports/session-logs/resolved/` directory.
- **Do not** allow `.agents/rules/` and `.bob/rules/` to diverge. They must always be identical.

## Output

The expected outcome is a clean `unresolved` folder, a populated `resolved` history log, and a fully updated [AGENTS.md](file:///D:/Ram%20Alin/src/Misc/receipt-invoice-generator/AGENTS.md) showing the current state of the project.
