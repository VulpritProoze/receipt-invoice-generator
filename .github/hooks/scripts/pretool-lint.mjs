import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const toolName = String(input.tool_name ?? input.toolName ?? '');

// Only run lint before read operations to catch issues early
const isReadTool =
  /^(read_file|file_search|grep_search|semantic_search|get_errors|read_page|copilot_getNotebookSummary)$/i.test(
    toolName
  );

if (!isReadTool) {
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}

try {
  // Get list of changed files (staged + unstaged) in src/
  const changedFiles = execFileSync(
    'git',
    ['diff', '--name-only', '--diff-filter=ACMR', 'HEAD', '--', 'src/**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    {
      encoding: 'utf8',
      shell: false,
      cwd: process.cwd()
    }
  )
    .trim()
    .split('\n')
    .filter(Boolean);

  // If no changed files, skip linting
  if (changedFiles.length === 0) {
    console.log(JSON.stringify({ continue: true }));
    process.exit(0);
  }

  // Lint only changed files
  execFileSync(
    'npx',
    ['eslint', ...changedFiles, '--max-warnings', '0', '--format', 'stylish'],
    {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    }
  );

  console.log(JSON.stringify({ continue: true }));
} catch (error) {
  // Fail gracefully - allow continuation but warn
  console.log(
    JSON.stringify({
      continue: true,
      systemMessage:
        'Linting failed on changed files. Consider fixing ESLint issues before continuing.',
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow-with-warning',
        permissionDecisionReason:
          'Linting failed on changed files but allowing continuation.'
      }
    })
  );
  process.exit(0);
}