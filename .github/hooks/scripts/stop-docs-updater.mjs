import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const stopHookActive = Boolean(input.stop_hook_active);

// Always allow continuation - this is advisory only
console.log(
  JSON.stringify({
    continue: true,
    systemMessage: stopHookActive
      ? undefined
      : 'Session ending. Consider running the docs-updater skill to keep AGENTS.md current with your changes.',
    hookSpecificOutput: {
      hookEventName: 'Stop',
      decision: 'allow-with-advisory',
      reason: stopHookActive
        ? 'Stop hook already processed'
        : 'Reminder: Run /docs-updater to document session changes',
      additionalContext: stopHookActive
        ? undefined
        : 'The docs-updater skill helps maintain AGENTS.md and generates session reports. Consider running it before ending.'
    }
  })
);