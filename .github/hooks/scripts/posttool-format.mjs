import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const toolName = String(input.tool_name ?? input.toolName ?? '');

// Only run format after edit operations
const isEditTool =
  /^(apply_patch|create_file|edit_notebook_file|create_directory|edit_file|write_file|replace_string_in_file|insert_text_in_file)$/i.test(
    toolName
  ) || /edit|create|write|replace/i.test(toolName);

if (!isEditTool) {
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}

try {
  // Get list of changed files (staged + unstaged)
  const changedFiles = execFileSync(
    'git',
    ['diff', '--name-only', '--diff-filter=ACMR', 'HEAD'],
    {
      encoding: 'utf8',
      shell: false,
      cwd: process.cwd()
    }
  )
    .trim()
    .split('\n')
    .filter(Boolean);

  // If no changed files, skip formatting
  if (changedFiles.length === 0) {
    console.log(JSON.stringify({ continue: true }));
    process.exit(0);
  }

  // Format only changed files
  execFileSync('npx', ['prettier', '--write', '--log-level', 'warn', ...changedFiles], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  console.log(JSON.stringify({ continue: true }));
} catch {
  // Fail gracefully - allow continuation but warn
  console.log(
    JSON.stringify({
      continue: true,
      systemMessage:
        'Formatting failed on changed files. Consider running prettier manually.',
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: 'Formatting failed on changed files but allowing continuation.'
      }
    })
  );
  process.exit(0);
}