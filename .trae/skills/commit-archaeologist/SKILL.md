---
name: commit-archaeologist
description: "Reconstructs why code exists from local git history. Use when the user asks 'why does this code exist', 'who wrote this function and why', or to 'explain the history of this function' before a rewrite, refactor, or risky edit. Runs entirely locally."
---

# Commit Archaeologist

`git blame` names the last person to touch a line. This skill reconstructs the
reason the line exists. It traces a file or current line range through local git
history, identifies its origin and later edits, finds files that repeatedly
changed beside it, and extracts intent clues from commit messages.

Everything runs locally. No network calls, API keys, or repository writes.

## When to use

- The user asks why a block, function, or file exists
- The user wants to know who introduced code and what changed afterward
- A rewrite or refactor needs historical constraints and change risks
- A workaround, temporary branch, or surprising design choice needs context

## When not to use

- The user only wants raw blame output or a commit list
- The task is to squash, delete, or rewrite git history
- The repository is remote and has not been cloned locally
- The question is about project-wide architecture rather than one file or region

## Gather the target

Get the repository path and tracked file path. Use a line range when the user
names a current block or function. If either path is missing, ask only for the
missing value.

## Run the dig

From the skill directory:

```bash
python3 scripts/archaeologist.py /path/to/repo src/cache.py --lines 40-72 --json
```

For the complete history of a file, omit `--lines`.

## Write the report

Turn the JSON into a short "why this code exists" report:

1. **Bottom line.** One or two sentences with the most likely explanation and
   a confidence label: high, medium, or low.
2. **Origin.** Introducing hash, date, author, subject, and the neighboring
   files that make the initial purpose clearer.
3. **Timeline.** Oldest to newest. Group mechanical edits when they do not
   change the story, but preserve reverts, fixes, and workarounds.
4. **Companion files.** Explain repeated co-changes as a coupling clue.
5. **Intent evidence.** Quote short commit subjects or signal words.
6. **Change risk.** Name the constraints, companion files, and unresolved
   temporary choices worth checking before an edit.

## Evidence rules

- Current blame ownership is not proof of original authorship.
- Repeated co-change suggests coupling; it does not prove a dependency.
- If the history is thin or messages are vague, say "the history shows" and
  "likely" instead of inventing a design rationale.