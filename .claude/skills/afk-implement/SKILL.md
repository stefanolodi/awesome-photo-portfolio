---
name: afk-implement
description: "AFK pipeline, stage 1 of 3: build one ready-for-agent issue on a fresh branch with no human present, and leave notes for the reviewer. Takes the issue number."
metadata:
  upstream: "mattpocock/skills skills/engineering/implement@49dd158"
---

Implement issue `#<n>`, the number you were given, on its own branch. You are **AFK**: nobody answers until morning. Where you would ask, decide. Take the reading most consistent with `GLOSSARY.md` and the ADR index (`docs/adr/README.md`), and record the decision in `notes.md`.

Your handoff directory is `"$(git rev-parse --path-format=absolute --git-common-dir)/afk/<n>"` ([docs/agents/afk.md](../../../docs/agents/afk.md)). Create it.

## Steps

1. **Read the ticket.** `gh issue view <n> --json title,body,labels,state,comments`, and the spec its `## Parent` names, if any. Done when you can list every acceptance criterion. If a `Blocked by` issue is still open, or the ticket turns on a choice only a human can make, write the reason to `blocked.md` and stop.

2. **Branch.** If the handoff directory already holds `branch`, this is a resumed run: switch to that branch and carry on. Otherwise `git fetch origin`, then `git switch -c <type>/<slug> origin/main` with a prefix from [git-workflow.md](../../../docs/agents/git-workflow.md), and write the branch name to `branch`.

3. **Build.** Use the `tdd` skill at the seams the ticket names, or at the nearest existing test seam. Run type checks and single test files as you go. Commit in small Conventional Commits with declarative summaries, staging files by name (git-workflow.md, step 3). A gitignored folder the ticket names as reference is read-only: read it, build elsewhere, and leave it as you found it.

4. **Verify once.** Run the verify command from `docs/agents/coding-standards.md` (Stack section) until it is green. If that section still shows `<verify command>`, write that to `blocked.md` and stop.

5. **Check your prose.** Re-read every comment, doc line and commit message you wrote against the writing rules in your user-level CLAUDE.md. Rewrite what breaks them, and amend or add a commit for it.

6. **Write `notes.md`**, under 300 words, for a reviewer who never saw this session. It follows the same writing rules, with these sections:
   - Decisions: each ambiguity, the reading you took, and why.
   - Seams: where the tests sit.
   - Left out: anything in the ticket you did not build, and why.
   - Docs: the comments, ADR, glossary or handoff updates you made.

Your stage is done when every acceptance criterion maps to a commit and a test, or to a line under Left out; `git status` is clean; verify is green; and `notes.md` is written. Review happens next, in a fresh context, through `afk-code-review`.

## Differs from upstream on purpose

- It does not run code review. Review is the next stage, in a fresh context, so a long build does not leave the review short of room. Do not take upstream's call to `code-review`.
- It never asks. Where upstream asks, it decides and records the decision in `notes.md`.
- It runs verify once at the end instead of the full test suite, and it writes `notes.md` and `blocked.md` for the next stage.
