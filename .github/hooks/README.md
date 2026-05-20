# BillGen Hook System

## Overview

This directory contains GitHub Copilot agent hooks that run automatically during tool execution to maintain code quality and documentation standards.

## Hook Configuration

The hooks are defined in `billgen-hooks.json` and execute at three lifecycle points:

1. **PreToolUse** - Before read operations
2. **PostToolUse** - After edit operations  
3. **Stop** - When the agent session ends

## Optimizations (2026-05-20)

The hook scripts have been optimized to address performance, stability, and usability concerns:

### Key Improvements

#### 1. Scoped Operations (Performance)
- **Before**: Ran lint/format on entire repository
- **After**: Only processes changed files via `git diff`
- **Impact**: 10-100x faster execution, reduced timeout frequency

#### 2. Fail-Open Behavior (Stability)
- **Before**: Blocked operations on lint/format failures
- **After**: Warns but allows continuation
- **Impact**: Prevents workflow interruptions, maintains agent responsiveness

#### 3. Advisory Stop Hook (Usability)
- **Before**: Blocked session end until docs-updater ran
- **After**: Provides friendly reminder but allows exit
- **Impact**: No forced workflows, better developer experience

#### 4. Reduced Timeouts (Efficiency)
- **PreToolUse**: 30s → 10s (scoped linting is fast)
- **PostToolUse**: 30s → 10s (scoped formatting is fast)
- **Stop**: 30s → 5s (advisory only, no heavy operations)

### Risk Mitigation

| Original Risk | Mitigation Strategy |
|---------------|---------------------|
| Tool execution latency | Scope to changed files only |
| Recursive modification loops | Format only after edits, not on every tool use |
| Non-idempotent formatting | Use `--log-level warn` to reduce noise |
| Environment dependency failures | Graceful fallback with warnings |
| Hidden failures blocking tooling | Fail-open with informative messages |
| Stop hook side effects | Made advisory-only, no file mutations |
| Concurrency/race conditions | Reduced by limiting scope to changed files |
| Security implications | Scripts remain read-only for Stop hook |

## Script Details

### pretool-lint.mjs

**Trigger**: Before read operations (read_file, file_search, etc.)

**Behavior**:
- Detects changed files in `src/` via `git diff`
- Runs ESLint only on those files
- Skips if no changes detected
- Warns but continues on failure

**Rationale**: Catch lint issues early before reading code, but don't block if issues exist.

### posttool-format.mjs

**Trigger**: After edit operations (write_file, apply_patch, etc.)

**Behavior**:
- Detects all changed files via `git diff`
- Runs Prettier only on those files
- Skips if no changes detected
- Warns but continues on failure

**Rationale**: Auto-format edited files to maintain consistency, but don't block on formatter issues.

### stop-docs-updater.mjs

**Trigger**: When agent session ends

**Behavior**:
- Provides friendly reminder to run docs-updater skill
- Always allows session to end
- No file mutations

**Rationale**: Encourage documentation updates without forcing them or blocking exit.

## Performance Characteristics

### Typical Execution Times

| Hook | Scenario | Time |
|------|----------|------|
| pretool-lint.mjs | No changes | <100ms |
| pretool-lint.mjs | 1-5 files | 1-3s |
| pretool-lint.mjs | 10+ files | 3-8s |
| posttool-format.mjs | No changes | <100ms |
| posttool-format.mjs | 1-5 files | 500ms-2s |
| posttool-format.mjs | 10+ files | 2-5s |
| stop-docs-updater.mjs | Always | <50ms |

### Worst-Case Scenarios

- **Timeout hit**: Hook terminates, agent continues with warning
- **Git unavailable**: Hook fails gracefully, agent continues
- **Dependencies missing**: Hook fails gracefully, agent continues

## Troubleshooting

### Hook not running
- Verify `billgen-hooks.json` is in `.github/hooks/`
- Check that Node.js is available in PATH
- Ensure scripts have correct file permissions

### Hook timing out
- Check if git repository is very large
- Consider increasing timeout in `billgen-hooks.json`
- Verify network/disk performance

### Hook failing silently
- Check agent logs for hook output
- Run scripts manually: `node .github/hooks/scripts/<script>.mjs < input.json`
- Verify dependencies are installed: `npm install`

### Formatting conflicts
- Ensure `.prettierrc` and `.prettierignore` are properly configured
- Check for conflicting formatter extensions in IDE
- Verify Prettier version matches project requirements

## Maintenance

### Adding New Hooks

1. Create script in `.github/hooks/scripts/`
2. Add entry to `billgen-hooks.json`
3. Test with sample input: `echo '{"tool_name":"test"}' | node script.mjs`
4. Document in this README

### Modifying Existing Hooks

1. Update script logic
2. Test with various tool names and scenarios
3. Verify timeout is appropriate
4. Update this README if behavior changes

### Disabling Hooks Temporarily

Remove or comment out entries in `billgen-hooks.json`:

```json
{
  "hooks": {
    "PreToolUse": [],
    "PostToolUse": [],
    "Stop": []
  }
}
```

## Best Practices

1. **Keep hooks fast** - Target <5s execution time
2. **Fail gracefully** - Always allow continuation with warnings
3. **Scope operations** - Only process changed files
4. **Log clearly** - Provide actionable error messages
5. **Test thoroughly** - Verify with various tool names and scenarios
6. **Document changes** - Update this README when modifying hooks

## Related Documentation

- [Agent Communication Rules](../.agents/rules/agent-communication.md)
- [Linting and Formatting](../.agents/rules/linting-and-formatting.md)
- [Documentation Protocol](../.agents/rules/documentation-protocol.md)