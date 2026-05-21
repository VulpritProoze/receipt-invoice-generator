# Agent Rule Prompt: Agent Communication

**File**: `.agents/rules/agent-communication.md`
**Scope**: All agents. Governs how agents communicate state, progress, blockers, and decisions — to each other and to the human.
**Priority**: High. A multi-agent system without clear communication is a system where agents silently contradict each other, duplicate work, and leave invisible gaps. Every agent is responsible for leaving the system in a state the next agent can understand and build on.

---

## Role

You are an agent operating in the BillGen repository alongside other agents and alongside a human. You are not the only one who will touch this codebase. Another agent — or a future session of yourself — will read what you leave behind and either benefit from its clarity or be harmed by its absence. This rule governs how you communicate, what you record, and how you hand off.

---

## Rule 1: AGENTS.md Is the Single Source of Truth for Project State

`AGENTS.md` at the repository root is the canonical record of this project's runtime state. It tracks:

- Which phase the project is in and the status of every phase.
- What has been completed, what is in progress, what is blocked.
- What decisions were made, by which agent, and when.
- What open questions remain and who is expected to answer them.
- References to individual session logs.

**Your behavior around AGENTS.md:**

- Read it at the start of every session before doing anything else. It tells you what the current state is.
- Ensure session logs are created and resolved cleanly via hooks and skills.
- Never rewrite it from scratch. It is a living document — append and update, never overwrite. Prior entries are historical record.
- Keep the phase log table honest. Do not mark a phase complete until every condition for completion is met.

---

## Rule 2: Phase Completion Has Explicit Conditions

A phase in the phase log may only be moved to `✅ Complete` when **all** of the following are verified — not assumed — as true:

1. All code changes for the phase compile under `tsc --strict` with zero errors.
2. All tests relevant to the phase pass — verified by running the full suite via `/run-tests`, not by running individual files.
3. A test report exists in `docs/reports/test-reports/` from this session's run.
4. All architecture docs for modules introduced or changed in this phase are up to date.
5. All ADRs for decisions made in this phase are written and in `accepted` status (or `proposed` if awaiting human review — with the question listed in `AGENTS.md`).
6. The session log file for the session that completed this phase has been saved and is ready for resolution.
7. No open blockers are listed against this phase.

**If any condition is unmet:** mark the phase `🟡 In Progress`. Add a note listing exactly what remains. Do not mark it complete optimistically to keep the log looking tidy. An optimistic phase log is a lie that misleads the next agent.

---

## Rule 3: Blockers Are Documented Explicitly and Immediately

When you cannot proceed on a task — because of a missing input, an unresolved question, a failing test you cannot fix, or a decision you are not authorized to make — you do not skip it silently. You do not make a guess and proceed. You do not leave a comment in code saying "fix this later" without a corresponding record in `AGENTS.md`.

**The blocker protocol:**

1. Stop the blocked work.
2. Add the blocker to `## Open Questions / Blockers` in `AGENTS.md`:
   - What is blocked (specific task or phase).
   - What is needed to unblock it (specific input, a human decision, a clarification, a resource).
   - What downstream work is affected.
3. Continue with any unblocked work that remains.
4. If nothing is unblocked, end the session and surface the blockers clearly in your output to the human.

**Why skipping silently is the worst thing you can do:** An undocumented skip creates an invisible gap. The next agent or developer arrives, assumes the state described in `AGENTS.md` is accurate, builds on top of the gap, and discovers the problem three phases later — when it is far more expensive to fix.

---

## Rule 4: Open Questions Are Specific and Actionable

Every item in `## Open Questions / Blockers` is written so that a human or another agent can read it and give a concrete yes/no or choose-one answer.

**Good form:**

> "Should the invoice PDF be generated server-side via a Route Handler, or client-side via a browser print API? Server-side is the current plan (see DEC-004) but the PDF library [library name] requires Node.js APIs not available in the Edge Runtime. Decision needed before implementing the PDF route handler."

**Bad form:**

> "PDF generation needs to be figured out."

When a question is resolved: prepend `~~` to strike through the resolved question and add a resolution note directly below it:

```markdown
~~Should the invoice PDF be generated server-side or client-side?~~
**Resolved [date]**: Server-side via Route Handler using [library]. Edge Runtime limitation addressed by adding `export const runtime = 'nodejs'` to the route. See DEC-004 (updated).
```

---

## Rule 5: Hand-Off Notes Are Mandatory Between Phases

When you complete a phase and the next phase will be handled by another agent or another session, you write a hand-off note in `AGENTS.md` under `## Hand-off Notes`.

**A hand-off note includes:**

- Which phase was just completed and a summary of what was done.
- Which phase comes next and what the first concrete action should be.
- Context the next agent needs that is not obvious from the code or docs — especially conventions that were established mid-session that aren't yet reflected in a rule or ADR.
- Known rough edges, simplifications, or technical debt introduced and why.

**Example:**

> **Phase 3 → Phase 4 hand-off (2025-09-14)**
> Completed: All Zod schemas and TypeScript interfaces in `src/models/`. The `invoiceSchema` validation for `invoiceID` uses a regex — see `src/models/invoice.ts` line 8 and DEC-005. Redis key format for invoices is `invoice:[userID]:[invoiceID]` — this was chosen for SCAN pattern performance and is not yet in an ADR (flagged in open items). Phase 4 starts with the Redis client wrapper in `src/lib/redis.ts` — mock already scaffolded in `src/lib/__mocks__/redis.ts`.

Hand-off notes are never deleted. They accumulate as the project's running narrative.

---

## Rule 6: Never Assume What You Have Not Verified This Session

You do not assume:

- That a file exists unless you have read it in the current session.
- That a test passes unless you ran it in the current session.
- That a dependency is installed unless you checked `package.json` or ran `npm ls` this session.
- That a prior agent's claim in `AGENTS.md` is still accurate without verifying it against the actual files.

**Trust but verify.** If `AGENTS.md` says Phase 3 is complete, check that the files it implies exist actually exist before you build on top of them. If they don't, update the phase status, document the discrepancy, and surface it as a blocker. An inaccurate phase log corrected now is far better than discovered three phases later.

---

## Rule 7: Communicate Decisions at the Right Level of Formality

Not every decision needs an ADR. But every non-trivial decision needs _some_ communication. Match the formality to the significance:

| Decision size                                                         | Where to communicate it                                                                   |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Trivial — naming, minor style, obvious implementation choice          | Inline comment in the code                                                                |
| Small — one approach chosen over another within a module              | Inline comment + mention in session log file                                              |
| Medium — library chosen, data shape changed, convention deviated from | ADR in `docs/decisions/` + session log file note                                          |
| Large — scope change, architecture change, data model change          | ADR + update to architecture docs + surface to human for confirmation before implementing |

**When in doubt:** over-communicate. The cost of an unnecessary comment or session log file note is zero. The cost of an undocumented decision that gets reversed by the next agent is hours of debugging and rework.

---

## Rule 8: Escalate to the Human When Appropriate

Some decisions are not yours to make. You escalate when:

- A decision has significant business implications that go beyond technical trade-offs (e.g., changing the invoice ID format after invoices have been issued to customers).
- A decision requires knowledge you cannot research (e.g., whether a specific UI interaction matches the user's mental model).
- The `/test-fix-iterate` loop has run 5 cycles with no resolution.
- A dependency is deprecated and no clear, actively-maintained replacement exists.
- You are about to delete, migrate, or irreversibly transform data or files.
- A snapshot test changed and you need to know if the change was intentional.

**How to escalate:** Stop the relevant work. Add the escalation to `## Open Questions / Blockers` with: the situation, the options you can see, what you need from the human, and what downstream work is blocked pending their answer. Then continue with any unblocked work. If everything is blocked, end the session cleanly.

Do not guess at a human decision and proceed. Do not make a consequential decision silently just to keep moving. The human is a stakeholder, not an obstacle. Keep them informed.
