# Bob Tools Reference
Updated: 05-23-2026-17:32:00+08:00

Bob has access to the following tools for code operations:

- **read_file** — Read file contents (up to 5 files per request, supports line ranges)
- **write_to_file** — Write complete file content (overwrites existing, creates new)
- **apply_diff** — Replace code using search/replace blocks (preferred for targeted edits)
- **insert_content** — Add new lines at specific line numbers
- **execute_command** — Run CLI commands in the workspace directory
- **search_files** — Search files using regex patterns
- **list_files** — List directory contents (supports recursive listing)
- **list_code_definition_names** — List top-level code definitions (classes, functions, etc.)
- **ask_followup_question** — Request clarification from the user
- **attempt_completion** — Present task results when complete
- **switch_mode** — Request mode switch (e.g., to Advance mode for MCP tools)
- **update_todo_list** — Create/update markdown checklists for multi-step tasks

**Note**: Bob does not support web search. External research must be done manually or via Advance mode with MCP.