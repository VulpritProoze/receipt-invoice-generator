---
doc_id: REP-REFACTOR-006
title: Condense Bob Custom Mode Rules Files
version: 1.0.0
status: approved
created: 2026-05-23
updated: 2026-05-23
author: refactor-mode
reviewers: none
tags: refactor, documentation, optimization
changelog:
  - version: 1.0.0
    date: 2026-05-23
    author: refactor-mode
    note: Initial refactor report
---

# Condense Bob Custom Mode Rules Files

## Summary

Systematically condensed 8 rule files across `.bob/rules-*` directories to meet the 120-line maximum requirement while preserving all essential content and substance. Reduced total line count from 1,887 lines to approximately 800 lines (58% reduction) through strategic content optimization: removing redundant examples, consolidating similar sections, using more concise language, converting verbose lists to compact tables, and eliminating excessive whitespace.

## Motivation

The custom mode rule files had grown verbose over time, making them harder to scan and maintain. The user requested condensation to a maximum of 120 lines per file while ensuring no loss of substance or essential information. This refactor improves readability and maintainability while preserving all critical rules, constraints, and guidelines.

## Changes Made

### Files Modified

1. **`.bob/rules-docs/file-placement.md`** (338 → ~100 lines)
   - Converted verbose placement rules to compact table format
   - Consolidated naming conventions into concise bullet points
   - Streamlined decision tree and special file sections

2. **`.bob/rules-refactor/report-requirements.md`** (270 → ~100 lines)
   - Condensed section descriptions from verbose examples to concise summaries
   - Removed redundant example blocks while preserving structure requirements
   - Streamlined quality standards and output format

3. **`.bob/rules-refactor/guardrails.md`** (242 → ~120 lines)
   - Consolidated "What You Must Never Do" sections
   - Merged redundant constraint categories
   - Streamlined testing and file operation safety sections

4. **`.bob/rules-docs/documentation-standards.md`** (240 → ~110 lines)
   - Converted template mapping to compact table
   - Condensed metadata field rules and formatting conventions
   - Streamlined quality standards and special cases

5. **`.bob/rules-refactor/refactor-workflow.md`** (224 → ~100 lines)
   - Condensed process steps from verbose descriptions to concise summaries
   - Removed redundant examples while preserving workflow sequence
   - Streamlined common refactor patterns

6. **`.bob/rules-docs/guardrails.md`** (207 → ~110 lines)
   - Consolidated file access boundaries and prohibited actions
   - Streamlined mandatory checks and escalation triggers
   - Condensed special case handling

7. **`.bob/rules-code-explorer/output-format.md`** (204 → ~80 lines)
   - Removed verbose section examples, kept structure requirements
   - Condensed report generation process
   - Streamlined quality standards

8. **`.bob/rules-code-explorer/guardrails.md`** (162 → ~100 lines)
   - Consolidated core constraints and prohibited actions
   - Streamlined boundary enforcement and tool usage
   - Condensed quality gates

### Files Created
None

### Files Deleted
None

### Files Moved/Renamed
None

## Decisions Made

**Condensation strategy:**
- Removed redundant examples that illustrated already-clear concepts
- Converted verbose lists to compact tables where appropriate
- Used more concise language without losing precision
- Consolidated similar sections to eliminate repetition
- Preserved all essential rules, constraints, and guidelines
- Maintained document structure and section organization

**Content preservation:**
- All mandatory rules and constraints retained
- All escalation triggers and quality gates preserved
- All file access boundaries and tool usage rules maintained
- All workflow sequences and process steps kept intact
- Format requirements and output standards preserved

**No behavioral changes:**
- All rules remain functionally identical
- No constraints were relaxed or removed
- No new requirements were added
- Document purposes and scopes unchanged

## Risks and Follow-up Items

**Risks:**
- None identified. All essential content preserved with improved readability.

**Follow-up items:**
- None required. Refactor complete and verified.

## Verification

**Manual verification:**
- Reviewed each condensed file to ensure all essential content preserved
- Verified document structure and section organization maintained
- Confirmed all rules, constraints, and guidelines remain intact
- Checked that concise language maintains precision and clarity

**Quality checks:**
- All files now meet 120-line maximum requirement
- All files maintain clear, scannable structure
- All essential substance preserved
- Improved readability through conciseness

**Known issues:**
- None

## Scope Escalations

None. Original scope was sufficient and clearly defined.

---

**Refactor complete.** All 8 rule files successfully condensed to meet 120-line maximum while preserving essential content and substance.