---
name: project-graveyard
description: "Scans the developer's machine for dead side projects, autopsies each one from its git history, surfaces personal death patterns, and picks the corpse most worth resurrecting. Use when the user mentions abandoned, unfinished, or old side projects, asks 'what should I finish', wants to revive a project, or wonders why they never finish anything. Runs entirely locally."
---

# Project Graveyard

Every developer has a folder full of dead projects. Nobody has ever gotten an
autopsy report. This skill scans the machine for abandoned repos, works out why
each one died from its git history, finds the user's personal death patterns,
and picks the one corpse worth digging up — then helps ship it.

Everything runs locally. No API, no network, nothing leaves the machine.

## When to use

- The user asks about abandoned/unfinished/old side projects, or what to finish
- The user wants to revive, resurrect, or "finally ship" something
- The user asks why they never finish projects
- The user proposes a new project — check the graveyard first

## When not to use

- Cleaning up disk space or node_modules — that's `kondo`/`npkill`, not this
- Archiving repos on GitHub — this works on local clones and never-pushed work
- Analyzing one specific repo's history in depth — just read the git log

## Run it

```bash
python3 scripts/graveyard.py ~/dev ~/projects
```

Point it at wherever projects actually live. If you don't know where that
is, ask — one question beats sweeping someone's home directory uninvited.
No args scans the usual suspects (~/dev, ~/projects, ~/code, ~/Desktop, ...).

## Writing the tombstone report

Turn the script output into a report the user will actually feel. Format:

1. **The census.** Deaths, combined lifespan, oldest corpse. Plain numbers.
2. **Tombstones.** One per dead project, worst-to-best pulse. Name, lifespan,
   commit count, cause of death with its evidence, and a one-line epitaph.
3. **The patterns.** This is the part they'll remember. "Your projects die at
   day 19." "Four of six were killed by a newer project."
4. **The resurrection.** One project. Not three.

## The resurrection

Pick ONE corpse. Highest pulse wins unless its idea is dead in the world too.
Before deciding, read the top candidate's README and skim the code — then do
the **world-check**:

- Search whether what blocked it got easier since it died
- Search whether the world shipped the idea

Then write the resurrection plan with at most 7 concrete steps, ending at *shipped*.
Step 0 is always: confirm it still runs. Step 1 must be completable today.

## Necromancer mode

When the user proposes building something new, check the graveyard for prior
attempts before scaffolding anything — grep the state file for name and README overlap.