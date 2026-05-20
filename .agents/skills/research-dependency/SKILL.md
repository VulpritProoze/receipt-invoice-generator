---
name: research-dependency
user-invocable: true
description: 'Use when adding, updating, or removing any npm package. Research the package on npm and GitHub, evaluate alternatives, write an accepted ADR before installation, install and verify the package, and update code/docs references as needed.'
---

# Research Dependency

Use this skill as a hard gate before any npm package change in BillGen. The package must be researched, justified, documented, installed, and verified before the work is considered complete.

## When to Use

Use this skill before:
- Adding a new npm dependency, production or dev.
- Upgrading a package to a new major version.
- Using a package from `package.json` that has not been researched in the current session.
- Installing an `@types/*` package, after researching the runtime package it supports.

Do not use this skill for Node.js built-ins, or for sub-path imports from a package that has already been researched in the current session.

## Working Rule

Do not run `npm install` until the ADR exists and is in accepted status. A deprecated package is a hard stop; choose a replacement instead of installing the deprecated package.

## Workflow

1. Justify the package first.
   - State the exact problem it solves.
   - Explain why Next.js built-ins, Web APIs, or a small tested utility cannot solve it.
   - If the problem is small enough to solve locally, write the utility code instead and add a short inline comment explaining why no package was used.

2. Research the npm package.
   - Search for `[package name] npm`.
   - Review the npm page for deprecation notices, latest version, last publish date, weekly downloads, TypeScript support, dependency count, and description.

3. Research the GitHub repository.
   - Search for `[package name] github` or use the repo linked from npm.
   - Record the last commit date, open issues, recent activity, README deprecation notices, migration guidance, and stars/forks for context.

4. Evaluate the package.
   - Treat deprecation or a publish date older than 18 months as a hard stop.
   - If the package fails any other criterion, document the concern and compare at least one alternative before deciding.

5. If the package is deprecated, find and research a replacement.
   - Search for `[deprecated package name] alternative [current year]`.
   - Check the deprecated package README, npm deprecation notice, and recent GitHub discussion for migration guidance.
   - Evaluate the replacement with the same research criteria before adopting it.

6. Evaluate at least one alternative.
   - Record why the alternative was not chosen.
   - This is mandatory for significant dependencies such as parsing libraries, PDF generation, Redis clients, styling systems, and date utilities.

7. Write the ADR before installation.
   - Use `docs/templates/adr-template.md`.
   - Create `docs/decisions/DEC-NNN-dependency-[slug].md` with the next available `DEC-NNN`.
   - Mark the ADR as accepted.
   - Include the research findings, alternatives considered, and consequences.

8. Install and verify the package.
   - Use `npm install [package]` for production dependencies.
   - Use `npm install --save-dev [package]` for dev dependencies.
   - If `@types/*` is required, install it alongside the runtime package.
   - Verify with `npm ls [package]`.

9. Reference the ADR in production code.
   - Add a brief inline comment at the first import of the package that points to the ADR.

10. Update documentation if needed.
    - Add environment variables to `docs/getting-started/env-setup.md` if the package requires them.
    - Update `docs/architecture/testing-strategy.md` if the package affects the test setup.

11. Validate TypeScript.
    - Confirm `tsc --noEmit` passes after the dependency is added.

## Completion Criteria

This skill is complete only when all of the following are true:
- The package has been researched in the current session.
- If deprecated, a replacement has been researched and chosen instead.
- The ADR exists in `docs/decisions/` with `accepted` status and full content.
- The package is installed and appears in `package.json`.
- TypeScript resolves the package cleanly under `tsc --noEmit`.
- The first production import includes an inline comment referencing the ADR.
- Any required environment documentation has been updated.

## Do Nots

- Do not install before the ADR exists.
- Do not install a deprecated package.
- Do not skip alternative evaluation for a significant dependency.
- Do not rely on memory or prior experience instead of current research.
- Do not install packages globally.
- Do not install `@types/*` without the runtime package already being part of the plan.
- Do not choose a package because it feels standard if current research does not support it.

## Output

The expected result of using this skill is a confirmed package decision, a populated accepted ADR, a local install, and a verified codebase that documents the dependency choice.