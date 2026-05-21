import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const stopHookActive = Boolean(input.stop_hook_active);

// Always allow continuation - this is advisory only
console.log(
  JSON.stringify({
    continue: true,
    systemMessage: stopHookActive
      ? undefined
      : 'Session ending. Consider running the docs-updater skill to save a session log to the unresolved session logs directory.',
    hookSpecificOutput: {
      hookEventName: 'Stop',
      decision: 'allow-with-advisory',
      reason: stopHookActive
        ? 'Stop hook already processed'
        : 'Reminder: Run /docs-updater to document session changes',
      additionalContext: stopHookActive
        ? undefined
        : 'The docs-updater skill helps generate session reports and saves them under docs/reports/session-logs/unresolved/. Consider running it before ending.'
    }
  })
);