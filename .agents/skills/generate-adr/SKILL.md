---
name: generate-adr
user-invocable: true
description: 'Use when making a significant architectural, dependency, or design decision. Check for an existing ADR, assign the next DEC-NNN, write the ADR before the code, handle superseding decisions, add code references, and log the decision in the current session log file.'
---

# Generate ADR

Use this skill to turn a significant decision into a reusable Architecture Decision Record before any implementation lands.

## When to Use

Use this skill for:

- Any npm package choice that affects the project meaningfully.
- Any non-obvious data model, Redis key structure, or storage pattern.
- Any convention break, limitation, or trade-off that will matter later.
- Any decision that replaces or reverses an earlier ADR.

Do not use this skill for trivial implementation details or choices that any competent developer would make the same way.

## Workflow

1. Check for an existing ADR.
   - Scan `docs/decisions/` before creating anything.
   - If an accepted ADR already covers the decision and is still accurate, reference it instead of creating a duplicate.
   - If an ADR exists but is outdated or being reversed, plan a superseding ADR.

2. Determine the next ADR number.
   - Find the highest `DEC-NNN` currently in `docs/decisions/`.
   - Use the next sequential number, zero-padded to three digits.

3. Choose a descriptive slug.
   - Use a kebab-case slug that names the decision clearly.
   - Prefer a slug that makes the ADR easy to find later without opening every file.

4. Draft the ADR from `docs/templates/adr-template.md`.
   - Create `docs/decisions/[DEC-NNN]-[slug].md`.
   - Fill every section with real content.
   - Keep the wording specific enough that a future reader can understand the decision without reconstructing the session.

5. Write the metadata header.
   - Use a unique `doc_id` matching the ADR number.
   - Set the status to `accepted` when the decision is within autonomous authority.
   - Set the status to `proposed` when the decision needs human sign-off or is not yet safe to implement.

6. Write the body.
   - In Context, explain the problem, constraints, and options that forced the decision.
   - In Decision, state the chosen option directly.
   - In Alternatives Considered, include every meaningful option and the reason it was not chosen.
   - In Consequences, be explicit about positive effects, trade-offs, risks, and when the decision should be revisited.

7. Handle superseding decisions.
   - In the new ADR, add `supersedes: DEC-MMM` when it replaces an older ADR.
   - In the old ADR, change the status to `superseded`, add `superseded_by: DEC-NNN`, update the date, and add a changelog entry explaining the replacement.

8. Reference the ADR in code.
   - At the first code point where the decision becomes real, add a short inline comment that points to the ADR.
   - Keep the comment brief; the ADR carries the reasoning.

9. Log the decision in the current session log file.
   - Record that the ADR was created or superseded in the session log.
   - If the ADR is only proposed, add the open question or blocker that needs resolution.

## Decision Rules

- Use `accepted` when the agent has authority to make the call and implementation can proceed immediately.
- Use `proposed` when the decision needs human confirmation or carries business impact the agent cannot determine alone.
- If uncertain, default to `proposed`.
- Never create two ADRs for the same decision.
- Never delete a superseded ADR.

## Completion Criteria

This skill is complete only when all of the following are true:

- The ADR exists at `docs/decisions/[DEC-NNN]-[slug].md`.
- The metadata header is complete and the status is correct.
- Every section contains real content with no template placeholders left behind.
- Any superseded ADR has been updated correctly.
- The decision is referenced in code with a brief inline comment, if code exists yet.
- The session log file mentions the ADR.

## Do Nots

- Do not write the ADR after the code is implemented.
- Do not leave placeholder text in a finished ADR.
- Do not create a duplicate ADR for an existing decision.
- Do not mark a decision accepted if it needs human approval.
- Do not delete historical ADRs when replacing them.

## Output

The expected result of using this skill is a new or updated ADR that documents the decision, points to the code that implements it, and leaves the project history clear for the next agent.
