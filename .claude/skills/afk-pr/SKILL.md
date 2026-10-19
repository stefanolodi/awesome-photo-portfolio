---
name: afk-pr
description: "AFK pipeline, stage 3 of 3: apply the review's fixes to one issue's branch, verify, push and open its pull request; merges only when given `merge`. Takes the issue number."
metadata:
  upstream: "mattpocock/skills skills/engineering/pr@49dd158"
---

Ship issue `#<n>`'s branch as a pull request. You are **AFK**: nobody answers until morning. Every call below is yours, and the PR body is where the morning reader sees each one.

Your handoff directory is `"$(git rev-parse --path-format=absolute --git-common-dir)/afk/<n>"` ([docs/agents/afk.md](../../../docs/agents/afk.md)). It holds `branch`, `notes.md` and `review.md`. Switch to the branch named in `branch`.

A run that died in this stage is resumed here, so some of the work may be done: fixes already committed, the branch already pushed, the PR already open (`gh pr list --head <branch> --state all`). Skip what is done. With the PR open, push any new commits and go to step 6.

## Steps

1. **Apply the fixes.** Make each `[fix]` in `review.md` and commit it as a Conventional Commit with a declarative summary. A fix that proves wrong once you are in the code becomes a decline, with the reason. Done when every `[fix]` line is a commit or a decline.

2. **Verify.** Run the verify command from `docs/agents/coding-standards.md` (Stack section) until it is green. On red, fix and rerun. After three red runs on the same failure, write it to `blocked.md` and stop.

3. **Push.** `git push -u origin HEAD`.

4. **Write the body.** Call the Skill tool with `pr` and write the body it describes to `pr-body.md` in the handoff directory. Build Summary from the diff, Evidence from the tests and the verify result, and Merge Danger from what the diff touches. Then, before the closing lines, add:

   ```markdown
   ## Declined review findings

   - <finding>. <reason>
   ```

   with every decline from `review.md` and from step 1, or `None.` End with one `Closes #…` line for `#<n>` and one for every issue that `#<n>`'s own body says it closes, so the squash merge closes them all. Then add the attribution line your session's instructions give.

5. **Check the prose, then open the PR.** Re-read the title and `pr-body.md` against the writing rules in your user-level CLAUDE.md, and rewrite what breaks them. The title is a declarative Conventional Commit, because it becomes the squash commit on `main` ([git-workflow.md](../../../docs/agents/git-workflow.md), steps 3 and 4). Then `gh pr create --base main --title "<title>" --body-file <pr-body.md>`.

6. **Watch CI.** `gh pr checks <pr> --watch`. On red, read the failure (`gh run view <run> --log-failed`), fix, verify, push. After two red rounds, write the failure to `blocked.md` and stop. The PR stays open.

7. **Merge, only when invoked with `merge`.** With every check green: `gh pr merge <pr> --squash --delete-branch`. A red PR stays open.

Done when the PR is open with every check green; every `review.md` finding shows up as a commit or under Declined review findings; every issue `#<n>` closes has its `Closes` line; and, when given `merge`, the PR is merged.

## Differs from upstream on purpose

- Upstream `pr` only writes a body. This stage also applies the review's fixes, verifies, pushes, opens the PR, watches CI and merges. It calls upstream `pr` for the body, so the template stays Matt's.
- The body gains a Declined review findings section and the `Closes` lines.
