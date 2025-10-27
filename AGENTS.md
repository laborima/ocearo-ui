# CLAUDE.md — Agent Playbook for ocearo-ui (Claude / Codex coding agents)

> Purpose: provide precise, project-aware instructions and prompt templates for using coding agents (Anthropic Claude Code, OpenAI Codex / Codex Cloud, or similar) safely and effectively on the **ocearo-ui** codebase. This playbook is a practical, no-new-deps guide: agents must not introduce external libraries beyond those already used by the project (React, Three.js, Tailwind, etc.).

---

## Quick summary (what this file contains)

* Short rules for safe use of remote coding agents.
* Recommended agent roles and workflows (writer, refactorer, tester, PR assistant).
* Concrete prompt templates (system + user message) tuned for component creation, refactors, tests, and docs — with explicit constraints to obey the project's rules.
* Sanitization and chunking steps for sending code to models.
* Human-in-the-loop verification checklist (build, lint, run scenes on a Pi if relevant).
* Commit message + PR templates for agent-generated changes.

---

## Rules of engagement (must-read)

1. **No new libraries**: Agents may change, refactor, or add code, but must not add new dependencies to `package.json` or require new native libraries. If a change truly requires a new dependency, a human must approve and document the rationale in the PR. (Strict enforcement: check `git diff package.json`.)

2. **English-only code & comments**: All source code comments, JSDoc, and README additions must be in English.

3. **Preserve Tesla black look & feel**: UI color tokens, Tailwind classes and component conventions that implement the dark, high-contrast HUD must be preserved. Agents must prefer existing token names in `tailwind.config.js` rather than inventing new ones.

4. **No secrets shared**: Never send `.env`, private keys, or any secret files to a remote LLM. Sanitize before sending (see "Sanitization").

5. **Human review required**: Every agent-generated change must be validated by a human engineer: run local build (`npm run build`), lint, and smoke test in dev (`npm run dev`) and confirm 3D canvas loads.

6. **Small, incremental PRs**: Keep agent-produced PRs focused (single responsibility). Large sweeping refactors must be split into smaller PRs.

