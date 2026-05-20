---
name: promptify
user-invocable: true
description: 'Use when a rough or half-written prompt needs to be transformed into a structured, agent-ready instruction. Interview for missing context, inputs, and outputs first, then generate the final prompt using a strict template.'
---

# Promptify

Promptify turns a rough or half-written prompt into a structured, comprehensive prompt for an AI agent. It first interviews the user for missing details, then emits a polished prompt in a strict format.

## When to Use

Use this skill when the user wants to:

- Improve a rough prompt.
- Turn notes into a proper agent prompt.
- Formalize instructions for a custom agent.
- Rewrite an unstructured request into a production-ready prompt.

Do not use this skill for general writing help, code review, or document editing unless the content is clearly meant to become an AI agent prompt.

## Workflow

1. Intake and interview.
   - Read the user's draft first.
   - Check for the three required fields: Context, Inputs, and Outputs.
   - If all three are missing, ask for them before doing anything else.
   - If some are present, ask only for what is missing.
   - Keep the interview conversational and focused.

2. Gather the helpful extras.
   - Ask about the target agent, available tools, constraints, success criteria, and tone/verbosity if those details are absent.
   - For the target agent, ask whether the prompt is for Claude, Claude Code, a custom agent, or another system.

3. Infer carefully, but do not guess silently.
   - If a field is ambiguous, make the most reasonable assumption you can and ask the user to confirm or correct it.
   - Avoid long questionnaires when a small number of targeted questions will do.

4. Generate the enhanced prompt.
   - Once you have enough information, produce the final prompt using the required section structure.
   - Preserve the user's voice and intent when it is already strong.

5. Iterate if the user asks for changes.
   - Revise the prompt and output only the updated prompt on the next pass.

## Required Prompt Structure

Every generated prompt must include these sections:

- Role & Persona
- Context
- Inputs
- Instructions
- Output Format
- Guardrails
- Tools Available

Sections may be omitted only if genuinely not applicable, but Role, Instructions, and Output Format are always required.

## Output Rules

When generating the final prompt:

- Output the prompt and nothing else.
- Start directly with the `# [Prompt Title]` heading.
- Do not add a preamble, postamble, or commentary.
- Do not wrap the prompt in a code block.
- Keep the prompt raw and undecorated.

After the prompt has been delivered, a brief check-in question is allowed:

- Ask whether it matches what the user had in mind.
- Ask whether anything should be adjusted.

## Guardrails

- Do not invent Context, Inputs, or Outputs when they are missing.
- Do not over-ask when one focused question can clarify the gap.
- Do not skip the required sections in the final prompt.
- Do not add explanation around the final prompt output.
- Do not use this skill for non-prompt writing tasks.

## Completion Criteria

This skill is complete only when:

- The user has been interviewed enough to fill the missing prompt fields.
- A polished prompt has been generated in the strict template.
- The prompt contains the required sections and no extra commentary.

## Notes for the Skill Agent

Keep the interview tight. Two or three focused questions usually beat a long form.
When in doubt, make the best reasonable assumption available and ask the user to confirm it.
The guardrails section should include real failure modes so the prompt stays useful under edge cases.
If the user's draft already has a strong voice, preserve it instead of flattening it into generic assistant language.

## Output Format

First, interview for any missing information. Then produce the final prompt in the strict template. The prompt itself must be the only output at generation time.
