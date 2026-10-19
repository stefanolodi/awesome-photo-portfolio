# AFK pipeline

The AFK pipeline builds `ready-for-agent` issues with nobody watching. `afk-run` picks one issue at a time and takes it through three stages. Each stage runs as its own subagent in a fresh context, so a long build does not leave the review short of room.

| Stage | Skill | Agent | Writes |
| --- | --- | --- | --- |
| 0 | `afk-pick` | none, `afk-run` calls it | a claim on the issue |
| 1 | `afk-implement` | `afk-implementer` | a branch, commits, `notes.md` |
| 2 | `afk-code-review` | `afk-reviewer` | `review.md`, each finding tagged fix or decline |
| 3 | `afk-pr` | `afk-pusher` | the review's fixes, a PR, and a merge when given `merge` |

The skills live in `.claude/skills/afk-*` and the agents in `.claude/agents/afk-*`. Three are adapted from Matt Pocock's `implement`, `code-review` and `pr`. Each records the upstream commit it was copied from and what it changes on purpose.

## Handoff files

Stages pass work through files, not through conversation. Issue `<n>` has a directory at `$(git rev-parse --path-format=absolute --git-common-dir)/afk/<n>/`, inside `.git`, so it is never committed. It holds `branch`, `notes.md`, `review.md`, `pr-body.md`, and `blocked.md` when a stage stops. Beside the issue directories sit `runs.log`, one line per event, and `run.lock`, the live run's heartbeat.

A stage that writes `blocked.md` hands the issue to a human. The issue loses `ready-for-agent` and gets `ready-for-human`, with a comment saying why.

## Labels

Two labels sit on top of Matt's five triage labels:

- `spec` marks a spec umbrella issue. It is never `ready-for-agent`. Its tickets are, and each names its blockers. If `/to-spec` puts `ready-for-agent` on the umbrella, swap it for `spec`.
- `afk-in-progress` marks an issue a run has claimed. A claim older than 4 hours belongs to a run that died.

## The night clone

Nights run in a separate clone, `<repo>-afk`, beside your checkout. A session loads its skills and agents from the folder it starts in, and a scheduled task started in a worktree loaded them from the main checkout, which was behind. The clone keeps itself on the latest `main`: `afk-run` syncs it after each issue and before it reports. A change merged during the day reaches the night after next, because a run loads its skills before it syncs. Sync by hand if you need it sooner.

A gitignored folder that tickets read, such as a local prototype, never reaches the clone. Link it into the clone by hand and add the link to the clone's `.git/info/exclude`.

## Setting up the routine

Nights wait until the repo has a verify command. Then, in the Claude desktop app, open Code, then Routines, then New routine, then Local:

- Instructions: `/afk-run merge cap=6 run-cap=2 max-blocked=2 window=23:00-05:00`
- Permission mode: Auto. Manual stops at the first prompt and waits until morning.
- Model: the strongest available. The stage agents inherit it.
- Folder: the `<repo>-afk` clone, with worktree off.
- Schedule: cron `0 23,0-4 * * *`. The picker has no such preset, so ask Claude in a desktop session to set it.
- Machine: the app open, "Keep computer awake" on, the lid open, and anything verify needs running, such as Docker.

Before the first night, set the instructions to `/afk-run merge cap=1`, click Run now, and watch. Answer each permission prompt with "always allow", then restore the instructions. Run `/context` once in that run to check that your user-level CLAUDE.md loaded.

In the morning, each run's session under Scheduled ends with a table of the issues it claimed. `runs.log` in the clone lists the whole night. Then check `ready-for-human` for anything that blocked.

## Fork mode is off

`.claude/settings.json` sets `CLAUDE_CODE_FORK_SUBAGENT=0`. Fork mode runs every subagent in the background, and a background subagent has no `Agent` tool, so `afk-reviewer` could not start its two review sub-agents. With fork mode off, `afk-code-review` starts them with `run_in_background: false` and waits for both.
