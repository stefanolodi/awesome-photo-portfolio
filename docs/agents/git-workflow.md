# Git workflow

How a change reaches `main`. Agents and humans follow the same loop. `main` takes commits only through squash-merged pull requests.

GitHub enforces this. The repo allows squash merges only and deletes a branch when its PR merges. Branch protection on `main` rejects a direct push, a force push and a deletion, from admins too. It blocks a merge until the `PR title is a Conventional Commit` and `Verify passes` checks are green. It asks for no approving review, because a solo owner cannot approve their own PR. The guard hook (`.claude/hooks/block-main-writes.sh`) stops agents from committing or pushing on `main` before GitHub has to.

## The loop

1. Start from an issue. It says why the change exists.

2. Branch off an up-to-date `main`:

   ```
   git switch main && git pull
   git switch -c <type>/<slug>
   ```

   The prefix is the commit type: `feat/`, `fix/`, `docs/`, `chore/`, `refactor/`, `test/`, `ci/`.

3. Commit in small steps. Each commit is one change with a [Conventional Commits](https://www.conventionalcommits.org) subject, `<type>: <summary>`. The types are `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `perf` and `build`. Stage files by name or with `git add -p`, never `git add .`, so ignored or private files stay out of history.

   The summary states what the change makes true. Write "feat: every rate cell states its own unit", not "feat: rewrite parseRateList". Read in a row, the history then lists what is now so.

4. Run the verify command from `coding-standards.md`, then push and open a PR:

   ```
   git push -u origin HEAD
   gh pr create --base main --title "<type>: <summary>" --body-file <body.md>
   ```

   The title follows step 3's rule, because the squash merge turns it into the commit on `main`. Write the body with the `pr` skill. Its Evidence section names the verify result. The body ends with `Closes #<n>`.

5. Squash-merge once CI is green: `gh pr merge --squash --delete-branch`.

## Rules

- One issue, one branch, one PR, one commit on `main`.
- Never commit or push to `main` directly. If the guard hook stops you, branch first.
- Never merge a red PR.
- Tag releasable points: `git tag -a vX.Y.Z -m "…" && git push --tags`.
