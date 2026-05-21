# Agent Rule Prompt: Core Principles

**File**: `.agents/rules/core-principles.md`
**Scope**: All agents. All times. No exceptions.
**Priority**: Highest — overrides convenience, speed, and user impatience.

---

## Role

You are an agent operating inside the BillGen repository. Before you write a single line of code, install a package, or make a decision, you internalize and operate under the following principles. These are not suggestions. They are the load-bearing walls of this project. Violating them silently is the most dangerous thing you can do — the next agent will build on top of your broken foundation without knowing it.

---

## Principle 1: Research Before You Act

You do not know the current state of any external dependency, API, or library. Your training data has a cutoff. Packages get deprecated. APIs change. What was the right choice last year may be the wrong choice today.

**Before adding, updating, or removing any npm package:**

- Web-search `[package name] npm` in the current session. Read the page. Check: deprecation notice, latest version, publish date, weekly download count.
- Web-search `[package name] github`. Read the repo. Check: last commit date, open issues, README deprecation notices, CHANGELOG, whether the README points you somewhere else.
- If the last publish was more than 18 months ago, or the npm page shows a deprecation warning — the package is deprecated. Do not use it.

**There are no exceptions to this principle.** "I've used this package before" is not research. Your prior experience may be based on stale information. Research it now.

---

## Principle 2: Deprecation Is a Hard Stop

If research reveals a planned dependency is deprecated:

1. Stop. Do not proceed with the deprecated package "just to get moving."
2. Web-search `[package name] alternative [current year]` to find the community-recommended replacement.
3. Evaluate the replacement under the same research criteria.
4. Write an ADR in `docs/decisions/` documenting the deprecated package, why it was rejected, and what was chosen instead. The ADR must exist **before** you install the replacement.
5. Only then: install the replacement and continue.

"I'll swap it later" is not a plan. Deprecated dependencies compound into security vulnerabilities, broken builds, and migration nightmares. Fix it now, at the source, the first time.

---

## Principle 3: Every Dependency Must Earn Its Place

You do not add a package because it is convenient, familiar, or "standard." You add it because no reasonable alternative exists.

**A dependency is justified when:**

- It solves a problem that cannot reasonably be solved with Next.js built-ins, Web APIs, or fewer than ~30 lines of well-tested utility code.
- It is actively maintained.
- Its bundle size impact has been evaluated for client-side packages.

**A dependency is not justified when:**

- It duplicates functionality already present in the project.
- It is being added for a one-time task (write the 10-line helper instead).
- You "remember using it" but have not confirmed its current status this session.
- It is a transitive dependency being lifted to direct without reason.

When in doubt: write the code. Add a brief inline comment explaining why you chose not to add a package: `// Not using [package] — solved in ~15 lines to avoid a dependency.`

---

## Principle 4: TypeScript Strict Mode — Always, Everywhere

All TypeScript in this project compiles under `--strict` with zero errors and zero `any` escapes. This is not a goal. It is a constraint.

**What this means in practice:**

- `strict: true` is set in `tsconfig.json`. You will never remove it, comment it out, or add flags that weaken it.
- `@ts-ignore` is forbidden in all files. If you think you need it, you have a type design problem. Fix the type design.
- `@ts-expect-error` is allowed only in test files, only when you are testing that invalid input is correctly rejected at runtime, and must be accompanied by a comment explaining the expected error and why it is acceptable here.
- Explicit `any` is forbidden in production code. Use `unknown` and narrow it with type guards. If a third-party library returns `any` at a boundary, wrap it immediately in a typed function — document the wrapper and why it is necessary.
- Type assertions (`as SomeType`) must include an inline comment justifying why the assertion is safe. If you need the assertion because the type is wrong, fix the type.

**Why this matters:** TypeScript strict mode catches entire categories of runtime bugs before they reach users. Every `@ts-ignore` you add is a bet that the runtime behavior will be fine despite the type system flagging it. That bet loses eventually. Do not make it.

---

## Principle 5: No Magic — Everything Must Be Traceable

Every non-obvious decision in this codebase is traceable to either an inline comment (explaining the _why_, not the _what_) or an ADR in `docs/decisions/` linked from the relevant code.

**A decision is "non-obvious" when any of these are true:**

- A dependency was chosen over a simpler or more common alternative.
- A data structure was chosen over a more conventional one.
- A calculation uses a non-standard formula or ordering.
- An API route deviates from standard REST conventions.
- A component is structured in a way that might surprise a thoughtful reader.
- A workaround exists for a library bug or platform limitation.
- Something was deliberately _not_ implemented that might be expected.

**Why this principle exists:** Agents have no memory between sessions. Developers join projects without context. Every undocumented decision will be re-litigated by the next person who touches the code — wasting their time and risking accidental reversal of a decision that was made carefully. Document it once. Save hours later.

The inline comment format: `// [Why this was done, not what it does]. See DEC-NNN if more context needed.`

---

## Principle 6: Secrets Are Never Hardcoded

No credential, token, URL with embedded auth, connection string, or environment-specific value appears in any committed file — source code, config, docs, examples, or agent files.

**The correct pattern:**

- All secrets go in `.env.local`, which is never committed.
- `.env.example` contains key names with placeholder values only: `UPSTASH_REDIS_REST_TOKEN=your_token_here`.
- Every environment variable used anywhere in the codebase is documented in `docs/getting-started/env-setup.md` with: name, purpose, where to obtain it, required vs. optional.
- Server-side secrets (Redis tokens, API keys) are accessed only from Route Handlers or Server Components. They are never imported into Client Components and never exposed in client-side bundles.

**If you discover a hardcoded secret:**

1. Remove it immediately.
2. Treat the exposed credential as compromised — surface this to the human for rotation.
3. Add the correct env var pattern.
4. Document the incident in the current session log file.

The sequence matters. Remove first. Then do everything else.

---

## Principle 7: Component Size Discipline

React components in `src/components/` and `src/modules/` do not exceed approximately **150 lines** of TypeScript/JSX.

**When a component approaches 150 lines:**

1. Find the natural seam — a UI sub-section, a repeated pattern, a self-contained concern.
2. Extract it into a named sub-component in the same directory.
3. If the sub-component is reusable across modules, move it to `src/components/shared/`.
4. Mark the extraction with an inline comment: `// Extracted to [ComponentName] — [reason for split].`

**Why 150 lines?** A component beyond this length is doing more than one thing. It resists testing, resists snapshotting, and resists understanding. Components that compose cleanly from smaller pieces are easier to maintain, easier to test, and easier for the next agent to work with without unintended side effects.

---

## How These Principles Are Enforced

These principles are not enforced by trust. They are enforced mechanically:

- **Pre-read hook** → runs `lint` skill before any source file opens. Catches type escapes, unsafe patterns, and missing dependencies in hooks before the agent reads and reinforces broken code.
- **Post-edit hook** → runs `format` skill after every file write. Prettier and ESLint --fix ensure style and auto-fixable quality issues are resolved instantly.
- **`/run-tests` skill** → schema tests, security tests, and linting bookends catch runtime violations of these principles.
- **Session-end hook** → runs `docs-updater`, which checks for undocumented decisions, missing ADRs, and hardcoded env vars in new code.

**If you knowingly violate a principle:** document the violation, the reason, and the remediation plan in the current session log file. A silent violation is not an acceptable path forward under any circumstance.
