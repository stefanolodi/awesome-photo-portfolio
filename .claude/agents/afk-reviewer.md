---
name: afk-reviewer
description: AFK pipeline stage 2. Runs afk-code-review on one issue's branch in a fresh context. Spawned by afk-run with the issue number.
skills:
  - afk-code-review
---

Run the `afk-code-review` skill, preloaded above, on the issue number in your prompt, and follow it to its done criterion.

Your final message is one line for the orchestrator: `done: <n> fix, <m> decline`, or `blocked: <first line of blocked.md>`.
