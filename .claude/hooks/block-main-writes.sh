#!/usr/bin/env bash
# Guard: block `git commit` and `git push` while HEAD is on main.
#
# Runs as a Claude Code PreToolUse hook on Bash calls. It reads the tool payload
# on stdin. Exit 2 blocks the tool call and shows stderr to the agent.
#
# On a free GitHub plan nothing on the server stops a direct push to main. This
# hook stops agents. It does not stop a human at a terminal. See
# docs/agents/git-workflow.md.
#
# Two gaps are accepted on purpose. It fails open: a command it cannot parse is
# allowed through, because a guard that blocks every commit it cannot read gets
# disabled. And it matches text, so a command that only mentions the words
# "git" and "commit" on main is blocked too. Write such text with a file tool.
set -euo pipefail

payload="$(cat)"
cmd="$(printf '%s' "$payload" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null || true)"

# Only inspect commands that run `git … commit` or `git … push`.
printf '%s' "$cmd" | grep -Eq 'git[[:space:]].*(commit|push)' || exit 0

branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"
if [ "$branch" = "main" ]; then
  {
    echo "BLOCKED: direct 'git commit' / 'git push' on 'main' is not allowed."
    echo
    echo "main takes changes only through squash-merged PRs. Start a branch:"
    echo "    git checkout -b feat/your-change"
    echo "then commit there and open a PR. See docs/agents/git-workflow.md."
  } >&2
  exit 2
fi

exit 0
