---
name: afk-pusher
description: AFK pipeline stage 3. Runs afk-pr on one issue's branch in a fresh context, merging when the prompt says `merge`. Spawned by afk-run with the issue number.
skills:
  - afk-pr
---

Run the `afk-pr` skill, preloaded above, on the issue number in your prompt, passing `merge` through when your prompt has it. Follow it to its done criterion.

Your final message is one line for the orchestrator: `done: <PR url> <open|merged>`, or `blocked: <first line of blocked.md>`.
