# Code Exploration Summary Template

---

doc_id: CODE-EXPLORATION-TPL
title: Code Exploration Summary
version: 1.0.0
status: draft
created: 2026-05-21
updated: 2026-05-21
author: Antigravity
reviewers: none
tags: code-exploration, summary, documentation

---

## Summary

*A brief, high‑level overview of the explored codebase (one‑sentence description).*

## Codebase Overview

- **Repository:** `{{repo_name}}`
- **Root Path:** `{{root_path}}`
- **Primary Language(s):** `{{languages}}`
- **Total Files:** `{{file_count}}`
- **Total Lines of Code:** `{{loc}}`

## Modules / Packages

| Module / Package | Description | Key Files |
| ---------------- | ----------- | --------- |
| `{{module_name}}` | `{{module_description}}` | `{{file_list}}` |
| … | … | … |

## Key Findings

- **Architecture:** `{{architecture_summary}}`
- **Main Entry Points:** `{{entry_points}}`
- **Common Patterns / Conventions:** `{{patterns}}`
- **Potential Pain Points / Technical Debt:** `{{pain_points}}`

## Files Added / Modified / Removed

| Change Type | File Path | Reason |
| ----------- | --------- | ------ |
| Added | `{{added_file}}` | `{{reason}}` |
| Modified | `{{modified_file}}` | `{{reason}}` |
| Removed | `{{removed_file}}` | `{{reason}}` |

## Recommendations for Future Work

- `{{recommendation_1}}`
- `{{recommendation_2}}`
- `{{recommendation_3}}`

## Next Steps

1. `{{next_step_1}}`
2. `{{next_step_2}}`
3. `{{next_step_3}}`

---

*This template is used by the `code-explorer` agent to generate concise exploration reports that can be referenced by orchestrator sessions, reducing token consumption.*
