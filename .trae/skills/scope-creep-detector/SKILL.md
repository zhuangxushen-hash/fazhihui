---
name: scope-creep-detector
description: "Analyzes git diffs against a stated intent to detect scope creep, unrelated files, broad pull requests, changes that grew beyond a fix. Use when the user asks whether a change grew beyond the fix, a PR is too broad, or what unrelated stuff they touched, and wants keep, split, or justify guidance. Operates locally and offline."
---

# Scope Creep Detector

A one-line fix should not require a reviewer to reverse-engineer fourteen files
across three subsystems. This skill compares a git diff with its stated intent,
surfaces scope signals, and turns them into keep, split, or justify decisions.

Everything runs locally. The script makes no network calls and does not change
the working tree, index, commits, or branches.

## When to use

- Before opening a pull request whose diff may have grown beyond its intent
- When a bug fix touches unexpected files or subsystems
- When the user asks whether staged changes are too broad
- When a diff includes dependency, public API, config, CI, or build changes
- When the user wants a concrete split plan for a mixed change

## When not to use

- Formatting code, running a linter, or writing a commit message
- Reviewing correctness, security, or test quality inside an agreed scope
- Measuring historical project growth across many commits
- Editing or reverting files without the user's approval

## Establish the intent

Use the user's one-line intent when available. Keep it concrete, such as
`fix null dereference in parser` or `add retry limit to webhook delivery`.

If no intent was given, ask for one line of intent before treating relatedness as meaningful.

## Run the classifier

Run from this skill directory and point `--repo` at the target repository.

```bash
python3 scripts/scope_creep.py --repo /path/to/repo \
  --intent "fix null dereference in parser" --json
```

## Interpret the JSON

- `in_scope`: file paths with at least one intent/path keyword overlap
- `likely_creep`: paths without overlap, with the reason and detected signals
- `new_deps`: dependencies introduced in supported manifest formats
- `api_renames`: nearby removed and added public function or class declarations
- `config_edits`: CI, container, build, YAML, and TOML changes
- `stats`: churn, subsystem counts, oversized hunks, and formatting-only files

## Recommend keep, split, or justify

Give every item in `likely_creep` one disposition:

1. **Keep** when the path is necessary for the stated intent and the connection
   is direct. Explain the connection in one sentence.
2. **Split** when it can land independently, belongs to another subsystem, or
   introduces a dependency, API rename, config edit, or large hunk that is not
   required for the intent.
3. **Justify** when a cross-cutting edit cannot be separated safely.

## Write the scope report

Use this compact structure:

1. Intent and diff source
2. Files and subsystems touched, with total additions and deletions
3. In-scope changes
4. Likely creep with signal evidence
5. Keep, split, or justify table
6. Proposed follow-up grouping, if any