---
name: afk-pick
description: "AFK pipeline, stage 0: resume the issue a dead run left half-done, or pick the next ready-for-agent issue on the frontier and claim it, or say why there is none. Takes optional `cap=<N>`, `max-blocked=<N>` and `window=<HH:MM-HH:MM>`."
---

Pick one issue for the AFK pipeline and claim it, so `afk-run` can take it through the three stages. You are **AFK**: every call below is yours.

The handoff root is `"$(git rev-parse --path-format=absolute --git-common-dir)/afk"` ([docs/agents/afk.md](../../../docs/agents/afk.md)). It holds `runs.log`, one line per event, oldest first:

```
<epoch seconds> <ISO time, UTC> #<n> <event> [detail]
```

Events are `claim`, `merged`, `pr`, `blocked` and `stale`. A resumed claim is `claim resume-stage-<s>`. Append with `>>`; never rewrite the file.

Arguments: `cap=<N>` (default `3`), `max-blocked=<N>` (default `2`), `window=<HH:MM-HH:MM>` (default none: any hour). A window may cross midnight (`22:00-07:00`).

The **night** began at the window's most recent opening: today's start time if it has passed, else yesterday's (`date -j -f '%Y-%m-%d %H:%M' "<day> <HH:MM>" +%s`). Without a window, it began 12 hours ago.

## Steps

1. **Window.** With a `window`, compare the local time (`date +%H:%M`) to it. Outside it: `pick: none, outside <window>`, and stop.

2. **Claims.** `gh issue list --state open --label afk-in-progress --json number`. A claimed issue either has a handoff directory in this checkout or it does not.
   - **It has one: the run that claimed it died.** `afk-run` holds `run.lock` while it works, so no other run is live in this checkout. Resume the issue, before any new claim and whatever the cap says, since it was claimed under the cap:
     - If the directory holds `blocked.md`, the run died handing it over: hand it to a human as below, and go on to the next claim.
     - Count its `claim resume-stage-*` lines since its last plain `claim`. At `2` already, it fails each time it is picked up: hand it to a human, and go on to the next claim.
     - Otherwise find the first stage whose output is missing: no `notes.md` → `1`; no `review.md` → `2`; else `3`. A stage-3 resume whose PR has already merged is `afk-run`'s to notice; you need not check.
     - Log `claim resume-stage-<s>`, and end with `pick: #<n> resume <s>`.
   - **It has none: another checkout claimed it.** Read when the label went on from GitHub: `gh api "repos/{owner}/{repo}/issues/<n>/events" --paginate --jq '[.[] | select(.event=="labeled" and .label.name=="afk-in-progress")] | last | .created_at // empty' | tail -1`. Under 4 hours old, that run may be live: `pick: none, #<n> is claimed by a live run`, and stop. 4 hours or older, it died somewhere this checkout cannot resume it: hand it to a human.

   **To hand an issue to a human:** list what its handoff directory holds, if any (`ls`), then `gh issue comment <n>` saying the AFK run stopped without finishing, how many times it was resumed, the last file it wrote (or `blocked.md` in full, if there is one), and the branch from `branch` if any. Then `gh issue edit <n> --remove-label afk-in-progress --remove-label ready-for-agent --add-label ready-for-human`, and log `stale`.

3. **Cap.** In this checkout's `runs.log`, since the night began:
   - `merged` and `pr` lines are issues shipped. At `cap` or over: `pick: none, cap of <cap> shipped reached`, and stop.
   - `blocked` and `stale` lines are issues handed to a human. At `max-blocked` or over: `pick: none, <max-blocked> blocked tonight`, and stop.

   `claim` lines do not count, so neither a block nor a resume costs a shipped slot.

4. **Frontier.** Candidates, oldest first (tickets are published blockers-first, so issue order is the DAG's order):

   ```sh
   gh issue list --state open --limit 100 --json number \
     --search 'label:ready-for-agent -label:spec -label:afk-in-progress -linked:pr sort:created-asc'
   ```

   `-linked:pr` skips an issue a PR already closes, so an unmerged PR from an earlier run is never built twice. Take the first candidate whose blockers are all closed, by both sources:
   - `gh api repos/{owner}/{repo}/issues/<n>/dependencies/blocked_by`: every entry is `closed`.
   - every `#<m>` under the body's `## Blocked by` heading: `gh issue view <m> --json state` is `CLOSED`.

   No candidate passes: `pick: none, frontier empty`, and stop.

5. **Claim.** If the issue already has a handoff directory from an earlier run, rename it to `<n>.<epoch>` so the stages start clean; the old branch stays for the morning reader. Then `gh issue edit <n> --add-label afk-in-progress`, create its handoff directory, and log `claim`. The directory is what tells the next pick, should this run die, that the claim is this checkout's to resume.

Done when your last line is exactly one `pick: #<n>`, `pick: #<n> resume <s>` or `pick: none, <reason>`; a fresh pick has the label, its handoff directory and its `claim` line; and a resume has its `claim resume-stage-<s>` line.
