---
name: generate-doc
user-invocable: true
description: 'Use when creating or updating any file in docs/ except AGENTS.md. Choose the right template, assign a unique doc_id, fill the metadata header, write real content, set the correct status, and add cross-links and session log references.'
---

# Generate Doc

Use this skill to create or update documentation in BillGen with the correct structure, metadata, and cross-references.

## When to Use

Use this skill when:

- Creating a new file in `docs/architecture/`, `docs/reports/`, `docs/reports/test-reports/`, `docs/plans/`, `docs/decisions/`, or `docs/getting-started/`.
- Updating an existing doc in a way that changes its meaning, structure, status, or versioned content.

Do not use this skill for root `AGENTS.md`, files outside `docs/`, or the template files in `docs/templates/`.

## Workflow

1. Identify the document type and subfolder.
   - Match the file to the correct docs subfolder.
   - Use the subfolder to select the right template and `doc_id` prefix.
   - If the document does not fit cleanly, surface the ambiguity in the current session log file instead of guessing.

2. Assign a unique `doc_id`.
   - Scan the target area and the rest of `docs/` for existing IDs.
   - Use the next sequential number, zero-padded to three digits.
   - Keep the ID globally unique across the docs tree.

3. Choose a descriptive filename.
   - Use lowercase kebab-case.
   - Make the filename descriptive enough that the topic is obvious before opening the file.

4. Create the file from the correct template.
   - Start from the matching template in `docs/templates/`.
   - Write an H1 title followed immediately by the metadata block.
   - Populate every metadata field with real values.

5. Fill the body with real content.
   - Write for a reader with no context.
   - Do not leave placeholder text in a finished document.
   - If a section cannot be completed yet, write `[Pending: reason]` and record the gap in the current session log file.

6. Apply the content rules for the document type.
   - Architecture docs: explain purpose, responsibilities, interfaces, data flow, key decisions, and known limitations.
   - Plan docs: define objective, scope, milestones, dependencies, risks, and open questions.
   - Getting-started docs: cover prerequisites, step-by-step instructions, verification, and troubleshooting.
   - Report docs: include a summary, structured findings or metrics, and recommendations.
   - Test reports: only update metadata if one was generated incomplete; do not create them directly with this skill.

7. Set the correct status.
   - Use `draft` for new or incomplete docs.
   - Use `review` for complete docs that still need human validation.
   - Use `approved` for complete agent-generated docs that do not need sign-off.
   - Use `deprecated` for docs that are still present but no longer authoritative.

8. Update existing docs carefully.
   - Bump the version according to the scope of the change.
   - Update `updated` to today.
   - Append a new changelog entry rather than rewriting the old history.
   - Adjust the status if the document's role has changed.

9. Add cross-references.
   - New architecture docs should be linked from `docs/architecture/system-overview.md`.
   - New ADRs should be linked from the related architecture doc.
   - New getting-started docs should be linked from `docs/getting-started/local-setup.md`.
   - All newly created docs should be mentioned in the current session log file.

## Document Quality Rules

- Every doc must have a valid metadata header.
- Every link must resolve, or be marked `[forthcoming: DOC-ID]` if the target does not yet exist.
- No verbatim TypeScript interface dumps as a substitute for prose.
- No duplicate docs for the same topic or component.
- Do not document intent instead of current behavior for architecture docs.

## Update Rules

- Patch version: typo fixes and minor corrections.
- Minor version: added sections or meaningful structural changes.
- Major version: rewrites that change the document's core purpose or structure.

## Completion Criteria

This skill is complete only when all of the following are true:

- The document exists at the correct path.
- The metadata header is complete and the `doc_id` is unique.
- The body contains real content with no placeholder text.
- The status matches the document's actual state.
- Cross-links are accurate and any missing targets are marked `[forthcoming: DOC-ID]`.
- The doc is linked from an appropriate place or from the session log file.
- The session log file mentions the new or updated doc.

## Do Nots

- Do not create docs without the metadata header.
- Do not place a doc in the wrong subfolder.
- Do not use placeholder text in a finished doc.
- Do not create duplicate docs for the same topic.
- Do not link to non-existent files as if they already exist.
- Do not delete deprecated docs; mark them deprecated instead.
- Do not skip version bumps and changelog entries when updating a doc.
- Do not write architecture docs that describe the intended design instead of the current implementation.

## Output

The expected result of using this skill is a documentation file that is correctly structured, accurately linked, and ready for the next agent to trust.
