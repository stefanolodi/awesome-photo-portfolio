# Coding standards: awesome-photo-portfolio

A rule here is one sentence and a pointer. If it needs an argument, the argument is an ADR. An amendment goes in the ADR, never here. `/code-review` and `afk-code-review` judge every change against this file.

## Stack

- Install dependencies: `npm ci`
- Verify: `<verify command>`
- `package.json` is the fact. When this section disagrees with it, this section is wrong.
- No new dependency without an ADR naming the need, the pick and the alternative rejected.
- A dependency considered and rejected is listed here with its ADR.

## Modules

- Design modules with the vocabulary of Matt's `codebase-design` skill.
- One job per module, split by domain concern. No catch-all `utils` module.
- Logic modules hold no I/O and no UI. Code is pure by default, with side effects at the edges.
- One primary export per file, and the file is named for it.

## Rules that must not regress

<!-- Domain rules whose breakage gives wrong results, each with the ADR that explains it. -->

## Testing

<!-- The runner, where tests live, and which suite needs what. -->

## Comments and docs

<!-- What this project comments, and where docs live. -->

## Definition of done

Before a PR opens:

1. The verify command is green. CI runs the same steps in the same order.
2. New logic and every bug fix come with a test.
3. No client data or secrets are committed.
4. The glossary, ADR and handoff updates the change implies are in the same PR.
