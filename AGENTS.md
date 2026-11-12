# AGENTS.md

This repo demonstrates **Spec-Driven Development**: the specs are the primary
artifact, the code is their output. Specs are committed on purpose.

## Workflow

```
grill → constitution → specification → plan → tasks → implementation → sync
```

| # | Artifact | Gate |
| --- | --- | --- |
| 1 | `GLOSSARY.md`, `docs/adr/` (via grilling) | Human answers each round |
| 2 | `specs/01-constitution.md` | Human approves |
| 3 | `specs/02-specification.md` | Human approves |
| 4 | `specs/03-plan.md` | Human approves |
| 5 | `specs/04-tasks.md` | Human approves |
| 6 | Implementation, one phase at a time | Exit check passes, human reviews diff |
| 7 | Spec sync | Code and specs agree |

No application code before gates 2–5 are approved. Stop at every gate and wait for
explicit approval in the conversation.

- **Grilling:** use the `grill-with-docs` skill. One round = numbered questions with a
  recommended answer each, then wait. Look up facts yourself; ask only about decisions.
  Resolved terms go into `GLOSSARY.md`; ADRs only for hard-to-reverse, surprising
  decisions with a real trade-off.
- **Requirements** carry stable IDs (`AC-F5`) that plan and tests cite. Tag each as
  `[PDF]` (stated in the brief, `docs/task/`) or `[assumption]` (ours).
- **Implementation:** run the phase's exit check yourself and paste the real output.
  Tick checkboxes only after it passes, commit, stop. If a test and a spec disagree,
  stop and ask.
- **Sync:** at the end, update the specs so they describe the code that exists.

## Commits

- Prefix every agent commit with `[agent]`; imperative one-line subject.
- Commit per approved artifact and per finished phase slice; fixes get their own commit.
- Cite the requirement IDs in the body.
- Never `--no-verify` (the fallow audit gate). Fix the finding or surface it.
- Don't push unless asked.

## Hygiene

- Use the project scripts (`npm test`, `npm run build`, `npm run audit`,
  `npx playwright test`) and say which produced which output.
- No new dependency without asking.
- Strict TypeScript, no `any`, small single-purpose files.
- Remove scratch files before handing back.
