# Third-party notices

## Mocha V3 / Kimi Code CLI

`components/hero/AgentTaskList.tsx` is modified from TodoContent in
`web/src/features/tool/components/display-content.tsx`, Mocha V3 commit
`1814a755abacc13f35a78d785defcf7d09a0c473`.

Upstream Kimi Code CLI: https://github.com/MoonshotAI/kimi-cli

License: Apache License, Version 2.0. A copy is included at
`content/licenses/Apache-2.0.txt`.

Changes: narrowed statuses, semantic list markup, removed unrelated renderers,
adapted icons/styles to MoleculeOS; all data is passed locally via props.

Applicable original attribution retained from upstream NOTICE:

Kimi Code CLI
Copyright 2025 Moonshot AI

This product includes software developed at
Moonshot AI (https://www.moonshot.ai/).

The upstream NOTICE also describes OpenAI Codex code in
`src/kimi_cli/skills/skill-creator/SKILL.md`; that file is not included or reused
by this project.

Mol* remains the existing npm dependency; its package license and notices remain
in its distribution. No structure-prediction application source was copied.
