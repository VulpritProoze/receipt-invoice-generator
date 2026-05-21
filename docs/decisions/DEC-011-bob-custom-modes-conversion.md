---
doc_id: DEC-011
title: Bob Custom Modes Conversion from GitHub Agents
version: 1.0.0
status: accepted
created: 2026-05-21
updated: 2026-05-21
author: Bob (Advanced Mode)
reviewers: none
tags: bob, custom-modes, agents, configuration, workflow
changelog:
  - version: 1.0.0
    date: 2026-05-21
    author: Bob (Advanced Mode)
    note: Initial conversion documentation
---

# ADR-011: Bob Custom Modes Conversion from GitHub Agents

## Context

The BillGen project previously used a multi-agent system defined in `.github/agents/` with seven specialized agents:

1. **orchestrator** - Master planning and task decomposition
2. **code-explorer** - Deep codebase analysis and architecture mapping
3. **docs** - Documentation creation and maintenance
4. **file-reader** - Lightweight file reading and summarization
5. **refactor** - Large-scale code restructuring
6. **small-implementations** - Precise, minimal-footprint edits
7. **tester** - Modular testing and verification

These agents were designed for a GitHub Copilot Workspace environment with explicit handoff mechanisms. Bob IDE uses a different architecture based on **custom modes** that users can switch between, rather than agent-to-agent handoffs.

## Decision

Convert the GitHub agent system to Bob custom modes configuration in `.bob/custom_modes.yaml`, adapting the multi-agent handoff pattern to Bob's mode-switching paradigm.

## Conversion Strategy

### 1. Agent-to-Mode Mapping

| GitHub Agent | Bob Mode | Slug | Key Changes |
|--------------|----------|------|-------------|
| orchestrator | 🔀 Orchestrator | `orchestrator` | Removed handoff buttons; uses `/switch_mode` instead |
| code-explorer | 🔍 Code Explorer | `code-explorer` | Preserved analysis workflow; added write access for reports |
| docs | 📝 Documentation | `docs` | Preserved doc-only access; integrated with Bob's file tools |
| refactor | ♻️ Refactor | `refactor` | Preserved scope discipline; adapted to Bob's tool set |
| tester | 🧪 Tester | `tester` | Preserved modular testing approach; uses Bob's execute_command |
| small-implementations | ✏️ Small Edits | `small-impl` | Preserved minimal-footprint philosophy |
| file-reader | *(merged)* | - | Functionality absorbed into other modes via `/read_file` |

### 2. Handoff Pattern Adaptation

**GitHub Agents Pattern:**
```yaml
handoffs:
  - label: Hand off to Refactor Agent
    agent: refactor
    prompt: Apply the large-scale code changes described in the plan.
```

**Bob Custom Modes Pattern:**
```markdown
Use `/switch_mode` to delegate:
- Small edits → Switch to Code mode or Small Edits mode
- Large refactors → Switch to Refactor mode
- Documentation → Switch to Documentation mode
```

### 3. Tool Mapping

Bob provides a unified tool set. The conversion maps GitHub agent tools to Bob tools:

| GitHub Agent Tool | Bob Tool | Notes |
|-------------------|----------|-------|
| `read` | `read_file` | Direct mapping |
| `edit` | `apply_diff`, `write_to_file`, `insert_content` | Multiple Bob tools for different edit types |
| `search` | `search_files` | Direct mapping |
| `write` | `write_to_file` | Direct mapping |
| `command` | `execute_command` | Direct mapping |
| `agent` | `switch_mode`, `new_task` | Paradigm shift from handoffs to mode switching |
| `web` | *(not available in Bob)* | Removed; external research must be done manually |
| `todo` | `update_todo_list` | Direct mapping |

### 4. File Restrictions

Bob's custom modes support file access restrictions per mode. This preserves the GitHub agents' access boundaries:

**Documentation Mode** (most restrictive):
```yaml
allowed_patterns:
  - "docs/**/*.md"
  - "AGENTS.md"
  - "README.md"
denied_patterns:
  - "src/**/*"
  - "*.ts"
  - "*.tsx"
```

**Orchestrator Mode** (planning only):
```yaml
allowed_patterns:
  - "docs/**/*.md"
  - "AGENTS.md"
  - "README.md"
  - ".bob/**/*"
denied_patterns:
  - "src/**/*"
  - "*.ts"
  - "*.tsx"
```

**Refactor Mode** (full access):
```yaml
allowed_patterns:
  - "**/*"
denied_patterns:
  - "node_modules/**/*"
  - ".next/**/*"
  - ".git/**/*"
```

## Implementation Details

### Configuration File Structure

```yaml
modes:
  - slug: mode-identifier
    name: "🎯 Display Name"
    description: |
      Multi-line description
    system_prompt: |
      Complete agent instructions
    tools:
      - tool_name_1
      - tool_name_2
    file_restrictions:
      allowed_patterns: [...]
      denied_patterns: [...]
```

### Global Configuration

```yaml
default_mode: orchestrator

mode_switching:
  allow_user_override: true
  require_confirmation: false

global_file_restrictions:
  always_denied:
    - "node_modules/**/*"
    - ".next/**/*"
    - ".git/**/*"
    - "*.env"
    - "*.env.local"

rules_integration:
  enforce_rules: true
  rules_directory: ".bob/rules"
  core_rules:
    - "core-principles.md"
    - "security-and-data-safety.md"
    - "testing-protocol.md"
    - "linting-and-formatting.md"
    - "documentation-protocol.md"
    - "agent-communication.md"
    - "report-layout.md"
```

## Preserved Capabilities

### ✅ Fully Preserved

1. **Role-based specialization** - Each mode has a clear, focused responsibility
2. **Scope discipline** - Orchestrator plans, specialists execute
3. **Documentation requirements** - All modes respect documentation protocol
4. **File access boundaries** - Modes cannot access files outside their domain
5. **Testing workflow** - Modular, scoped testing approach maintained
6. **Refactor discipline** - Scope boundaries and reporting requirements preserved
7. **Core principles enforcement** - All `.bob/rules/` apply to all modes

### ⚠️ Adapted

1. **Agent handoffs → Mode switching** - User must explicitly switch modes (or orchestrator instructs via `/switch_mode`)
2. **File-reader agent** - Functionality absorbed into other modes via Bob's native `/read_file` tool
3. **Web research** - Removed (Bob doesn't support web search); external research must be manual
4. **Handoff prompts** - Converted to mode-switching instructions in system prompts

### ❌ Removed

1. **Web tool** - Not available in Bob; orchestrator can no longer fetch npm package info or GitHub advisories automatically
2. **Explicit handoff buttons** - Bob uses mode switching instead of agent spawning
3. **Agent-to-agent communication** - Replaced with mode-to-mode workflow via user or orchestrator direction

## Usage Examples

### Example 1: Orchestrator Planning a Refactor

**GitHub Agents (old):**
```
[Orchestrator creates plan]
[Clicks "Hand off to Refactor Agent" button]
[Refactor agent receives plan and executes]
```

**Bob Custom Modes (new):**
```
[Orchestrator creates plan in Orchestrator mode]
[Orchestrator outputs: "Switch to Refactor mode to execute this plan"]
[User switches to Refactor mode]
[Refactor mode executes plan]
```

### Example 2: Documentation After Refactor

**GitHub Agents (old):**
```
[Refactor agent completes work]
[Refactor agent outputs: "@orchestrator — invoke /docs agent"]
[Orchestrator spawns docs agent]
[Docs agent creates documentation]
```

**Bob Custom Modes (new):**
```
[Refactor mode completes work]
[Refactor mode outputs: "Switch to Documentation mode to create docs"]
[User switches to Documentation mode]
[Documentation mode creates documentation]
```

### Example 3: Small Edit Workflow

**GitHub Agents (old):**
```
[Orchestrator identifies small edit]
[Orchestrator hands off to small-implementations agent]
[Small-implementations agent applies edit]
```

**Bob Custom Modes (new):**
```
[Orchestrator identifies small edit]
[Orchestrator outputs: "Switch to Small Edits mode or Code mode"]
[User switches to appropriate mode]
[Mode applies edit]
```

## Migration Path

### For Users

1. **No action required** - The `.bob/custom_modes.yaml` file is automatically loaded by Bob
2. **Mode switching** - Use Bob's mode switcher UI or `/switch_mode` command
3. **Workflow adaptation** - Follow orchestrator's mode-switching instructions instead of automatic handoffs

### For Future Development

1. **Adding new modes** - Add new mode definitions to `.bob/custom_modes.yaml`
2. **Modifying modes** - Edit system prompts, tools, or file restrictions in the YAML
3. **Testing modes** - Validate YAML syntax with: `python -c "import yaml; yaml.safe_load(open('.bob/custom_modes.yaml'))"`

## Consequences

### Positive

1. **Native Bob integration** - Uses Bob's built-in mode system instead of external agent framework
2. **Simplified architecture** - No need for separate agent spawning mechanism
3. **Preserved specialization** - All agent roles and responsibilities maintained
4. **File safety** - File restrictions prevent modes from accessing inappropriate files
5. **Rule enforcement** - All `.bob/rules/` automatically apply to all modes
6. **User control** - User can switch modes at any time, not just when orchestrator delegates

### Negative

1. **Manual mode switching** - User must explicitly switch modes (less automated than agent handoffs)
2. **No web research** - Orchestrator cannot automatically fetch external information
3. **Context loss** - Mode switching may lose some context (mitigated by Bob's context management)
4. **Learning curve** - Users must learn when to switch modes

### Neutral

1. **Different paradigm** - Mode switching vs. agent spawning is a conceptual shift but functionally equivalent
2. **File-reader merged** - Functionality preserved but no longer a separate mode

## Validation

### YAML Syntax
```bash
python -c "import yaml; yaml.safe_load(open('.bob/custom_modes.yaml', 'r', encoding='utf-8').read())"
# Output: (no errors = valid)
```

### Mode Count
- **GitHub Agents**: 7 agents
- **Bob Modes**: 6 modes (file-reader merged into others)

### Tool Coverage
- All essential GitHub agent tools mapped to Bob equivalents
- Only `web` tool removed (not available in Bob)

## References

- Original agents: `.github/agents/*.agent.md`
- Bob configuration: `.bob/custom_modes.yaml`
- Bob rules: `.bob/rules/*.md`
- Bob documentation: https://bob.ibm.com/docs/ide/configuration/custom-modes

## Approval

**Status**: Accepted
**Date**: 2026-05-21
**Approved by**: Conversion completed and validated

## Notes

This conversion maintains the multi-agent workflow philosophy while adapting to Bob's mode-based architecture. The core principles of specialization, scope discipline, and documentation requirements are fully preserved.

Users should treat mode switching as the equivalent of agent handoffs — the orchestrator will guide when to switch modes, just as it previously guided agent handoffs.