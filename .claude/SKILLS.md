# Claude Code skills in this repo

- `.claude/skills/` — 311 skills from [everything-claude-code](https://github.com/affaan-m/everything-claude-code) (full profile, hooks disabled) + 15 skills from [anthropics/skills](https://github.com/anthropics/skills)
- `.claude/agents/`, `.claude/commands/`, `.claude/rules/ecc/` — ECC agents, slash commands and rules

Sessions opened on this repo load them automatically.

To make them available in **every** session (any repo), add this to the cloud
environment's setup script:

```bash
git clone --depth 1 https://github.com/ser937897-hash/ppp /tmp/ppp && bash /tmp/ppp/scripts/install-claude-skills.sh
```

The script also fetches Anthropic's `docx`, `pdf`, `pptx`, `xlsx` skills from
upstream (their license does not allow redistributing them here).
