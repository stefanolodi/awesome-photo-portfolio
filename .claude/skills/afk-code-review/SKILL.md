---
name: afk-code-review
description: "AFK pipeline, stage 2 of 3: review one issue's branch against the coding standards and the issue, and tag every finding fix or decline for the next stage. Takes the issue number."
metadata:
  upstream: "mattpocock/skills skills/engineering/code-review@49dd158"
---

Two-axis review of issue `#<n>`'s branch, then a verdict on every finding:

- **Standards**: does the code conform to this repo's documented coding standards?
- **Spec**: does the code faithfully implement the issue?

Both axes run as **parallel sub-agents** so they don't pollute each other's context. You are **AFK**: the fixed point and the spec are given below, and the verdict is yours to make. You change no code; `afk-pr` applies the fixes.

Your handoff directory is `"$(git rev-parse --path-format=absolute --git-common-dir)/afk/<n>"` ([docs/agents/afk.md](../../../docs/agents/afk.md)). Switch to the branch named in its `branch` file.

## Process

### 1. Pin the fixed point

`git fetch origin`. The fixed point is `origin/main`. Capture the diff command once: `git diff origin/main...HEAD` (three-dot, so the comparison is against the merge-base), and the commits: `git log origin/main..HEAD --oneline`.

An empty diff fails here: write it to `blocked.md` and stop.

### 2. The spec

Issue `#<n>`: `gh issue view <n> --json title,body,labels,state,comments`, plus the spec its `## Parent` names, if any.

### 3. The standards

- `docs/agents/coding-standards.md`, the authority. Its "Rules that must not regress" and "Definition of done" sections hold what CI cannot catch.
- `GLOSSARY.md`, the domain language names must use.
- `docs/adr/README.md`, the ADR index. Open a single ADR only when the diff changes what it governs.
- The writing rules in your user-level CLAUDE.md, for every line of prose the diff adds: comments, docs, Markdown and commit messages.

On top of these, the Standards axis always carries the **smell baseline** below: a fixed set of Fowler code smells (_Refactoring_, ch.3). Two rules bind it:

- **The repo overrides.** A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation. Like any standard here, skip anything tooling already enforces.

Each smell reads *what it is* → *how to fix*; match it against the diff:

- **Mysterious Name**: a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- **Duplicated Code**: the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Feature Envy**: a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps**: the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession**: a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches**: the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Shotgun Surgery**: one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change**: one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality**: abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
- **Message Chains**: long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man**: a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest**: a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.

### 4. Spawn both sub-agents in parallel

Send a single message with two `Agent` tool calls, both `general-purpose`. Neither gets `notes.md`: each judges the diff against its sources, unswayed by the implementer's reasons.

Pass `run_in_background: false` on both calls, so they run in parallel and you wait for both reports. Run in the background, they outlive your turn: you hand back before either reports, with nothing to write in `review.md` (#766).

**Standards sub-agent prompt** should include:

- The diff command and commit list.
- The standards files from step 3, **plus the smell baseline** pasted in full (the sub-agent has no other access to it). The sub-agent loads the writing rules from its own user-level CLAUDE.md.
- The brief: "Report, per file/hunk where relevant, (a) every place the diff violates a documented standard: cite the standard (file + the rule); (b) any baseline smell you spot: name it and quote the hunk; and (c) every added line of prose (comments, docs, Markdown, commit messages) that breaks a writing rule from your user-level CLAUDE.md: cite the rule number and quote the line. Writing-rule breaches are hard violations. Distinguish hard violations from judgement calls: documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip anything tooling enforces. Under 400 words."

**Spec sub-agent prompt** should include:

- The diff command and commit list.
- The fetched issue and parent spec.
- The brief: "Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Quote the spec line for each finding. Under 400 words."

### 5. Verdict

Now read `notes.md`, then tag every finding from both reports:

- **fix**: every hard documented-standard violation, every writing-rule breach, every Spec (a) and (c) unless `notes.md` **Left out** gives a reason the issue itself supports; every Spec (b), fixed by removing it, unless an acceptance criterion needs it; a baseline smell whose fix stays inside the diff.
- **decline**: everything else, with a one-line reason citing `notes.md`, the standard, or the issue line.

### 6. Write `review.md`

Keep the axes apart, as upstream does: a finding is never merged or reranked across them.

```markdown
## Standards
- [fix] src/x.ts:42. <finding>. Fix: <what the fix is>
- [decline] src/y.ts:7. <finding>. Reason: <reason>

## Spec
- [fix] … 

<n> fix, <m> decline. Worst per axis: <one line each>.
```

Done when every finding from both sub-agents appears in `review.md` with a tag.

## Differs from upstream on purpose

- The fixed point is always `origin/main` and the spec is always the issue, so it never asks.
- It names its standards files instead of searching for them, and adds the writing rules to the Standards axis.
- In place of upstream's aggregate step it tags every finding fix or decline in `review.md`. It changes no code; `afk-pr` applies the fixes.
