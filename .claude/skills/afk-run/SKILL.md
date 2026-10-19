---
name: afk-run
description: "AFK pipeline orchestrator: resume what a dead run left half-done, then pick ready-for-agent issues one at a time and take each through afk-implement, afk-code-review and afk-pr, each stage a fresh subagent, until the frontier, the run's cap, the night's cap or the window runs out. Takes optional `merge`, `cap=<N>`, `run-cap=<N>`, `max-blocked=<N>`, `window=<HH:MM-HH:MM>`."
---

Run the AFK pipeline: issue after issue, three stages each, nobody watching. You are the **orchestrator**. You pick, dispatch, and read the handoff files; the stages do the work. Keep your own context lean: check that files exist and read their first lines. Leave diffs, reviews and logs to the stages, because you need the room for a whole night of issues.

Arguments: `merge` (squash-merge each PR once CI is green, so the next issue can build on it), `cap=<N>` (issues shipped per night), `run-cap=<N>` (issues shipped by this run; default none), `max-blocked=<N>` (issues handed to a human per night), `window=<HH:MM-HH:MM>`. Pass `cap`, `max-blocked` and `window` to `afk-pick` unchanged. Without `merge`, each PR stays open for morning review.

The handoff directory for issue `<n>` is `"$(git rev-parse --path-format=absolute --git-common-dir)/afk/<n>"`, and `runs.log` and `run.lock` sit beside it ([docs/agents/afk.md](../../../docs/agents/afk.md)).

To **sync** is to bring this checkout to the latest `main`, dependencies included: `git fetch origin && git switch --detach origin/main`, then run the install command from `docs/agents/coding-standards.md` (Stack section). If that section still shows `<install command>`, skip the install.

## Steps

1. **Lock.** `run.lock` is the live run's heartbeat. If it was touched under 2 hours ago (`find <run.lock> -mmin -120` prints it), another run is working this checkout: end with `afk-run stopped: another run is live`, and touch nothing, not even the lock. Otherwise `touch` it, and touch it again before every pick and every stage. The longest stage so far took 21 minutes, so a lock 2 hours stale belongs to a run that died, most likely at a usage limit. Every path that ends this run from here on removes the lock as its last act.

2. **Check the definitions.** The session loaded its skills and agents when it started, from this checkout as it stood then. Your skill list must hold `afk-pick`, and the `Agent` tool's types must hold `afk-implementer`, `afk-reviewer` and `afk-pusher`. If one is missing, the definitions are stale: claim nothing, sync so the next run loads current ones, and end with `afk-run stopped: <name> not loaded`. Each stage runs only as its own agent type; a missing type stops the run before it starts.

3. **Set up.** If `git status --porcelain --untracked-files=no` shows changes, find whose they are. If `HEAD` is the branch named in the `branch` file of an issue that still carries `afk-in-progress`, a stage died mid-edit: commit everything `git status --porcelain` lists (`git add -A`) to that branch as `wip: afk run died mid-stage`, unpushed, so the resumed stage starts from it. Otherwise stop: this checkout holds someone's work. Then sync.

4. **Pick.** With a `run-cap`, count the issues this run has taken to `merged` or `pr` in step 7, resumed ones included. At `run-cap` or over, go to step 8 with `pick: none, run cap of <run-cap> shipped reached`; the next firing starts a fresh run. Otherwise invoke the `afk-pick` skill with `cap`, `max-blocked` and `window`.
   - `pick: none`: go to step 8.
   - `pick: #<n>`: run step 5 from stage 1.
   - `pick: #<n> resume <s>`: a dead run left it at stage `<s>`. Run step 5 from stage `<s>`, except a stage 3 whose PR has already merged (`gh pr list --head <branch> --state all --json state`): go straight to step 7.

5. **Run the stages**, one at a time, each through the `Agent` tool, waiting for each to finish:

   | Stage | `subagent_type` | Prompt | Done when the handoff directory has |
   | --- | --- | --- | --- |
   | 1 | `afk-implementer` | `Issue #<n>.` | `branch` and `notes.md` |
   | 2 | `afk-reviewer` | `Issue #<n>.` | `review.md` |
   | 3 | `afk-pusher` | `Issue #<n>.`, plus ` merge` when you were given `merge` | a PR for `branch`: `gh pr list --head <branch> --state all` |

   After each stage, check the handoff directory before you go on. If `blocked.md` is there, go to step 6. If the stage's output is missing, write `blocked.md` yourself: the stage, what is missing, and the subagent's last message. Then go to step 6.

6. **Blocked.** Hand the issue to a human:
   - `gh issue comment <n> --body-file <file>`, where the file is `**AFK run stopped at stage <s>.**`, then `blocked.md`, then the branch and PR if any. The PR, if one is open, stays open.
   - `gh issue edit <n> --remove-label afk-in-progress --remove-label ready-for-agent --add-label ready-for-human`.
   - If the working tree is dirty, commit it to the branch as `wip: afk run stopped at stage <s>`, unpushed, so no work is lost.
   - Log `blocked <stage>`, then sync and go to step 4.

7. **Shipped.** Read `gh pr view <branch> --json number,state,url`. Trust the PR's state, not the merge command's exit code: `--delete-branch` can fail locally after the merge has already landed.
   - **`MERGED`**: check that `#<n>` is closed (`gh issue view <n> --json state`). If it is still open, comment that PR `#<pr>` merged without closing it and leave it open. Remove `afk-in-progress` and log `merged #<pr>`. Sync, then `git branch -D <branch> 2>/dev/null || true`: `afk-pr`'s `--delete-branch` has normally deleted it already, so this only catches the one it missed, and must not fail the step.
   - **`OPEN`**, run without `merge`: remove `afk-in-progress`, log `pr #<pr>`, then sync.

   Go to step 4.

8. **Report.** Sync once more, so the next run starts on the latest definitions. Then end with a table, one row per issue this run claimed or resumed: issue, outcome (`merged` / `pr` / `blocked at stage <s>`, plus `resumed at stage <s>` when it was), PR link, and one line from `blocked.md` or the PR title. Then add the reason the run stopped (the `pick: none` line). Remove `run.lock`.

Done when every issue this run claimed or resumed has a `merged`, `pr` or `blocked` line in `runs.log`, none of them still carries `afk-in-progress`, this checkout sits at the latest `origin/main`, the report is written, and `run.lock` is gone.
