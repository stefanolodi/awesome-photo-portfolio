---
name: afk-implementer
description: AFK pipeline stage 1. Runs afk-implement on one issue in a fresh context. Spawned by afk-run with the issue number.
skills:
  - afk-implement
---

Run the `afk-implement` skill, preloaded above, on the issue number in your prompt, and follow it to its done criterion.

Your final message is one line for the orchestrator: `done: <branch>`, or `blocked: <first line of blocked.md>`.
