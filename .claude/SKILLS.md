# Claude Code skills in this repo

- `.claude/skills/` — 311 skills from [everything-claude-code](https://github.com/affaan-m/everything-claude-code) (full profile, hooks disabled) + 15 skills from [anthropics/skills](https://github.com/anthropics/skills)
- `.claude/agents/`, `.claude/commands/`, `.claude/rules/ecc/` — ECC agents, slash commands and rules

## Writers agency (`/writers-agency`)

A team of professional writers and editors for any text: articles, longreads,
essays, books, short stories, scripts, posts. Run `/writers-agency` or just ask
to write or edit something. Agents: `brief-strategist`, `researcher-factchecker`,
`nonfiction-author`, `fiction-author`, `scriptwriter`, `developmental-editor`,
`line-editor`, `copy-editor`, `continuity-editor`, `beta-reader`. Projects are
kept in `writing/<slug>/`.

### Engagement lab (`/engagement-lab`) and book reviews (`/book-review`)

The writers agency's quality department, used as stage 6 of the pipeline or on
its own to make a manuscript more gripping: `quality-auditor` (scored rubric and
delivery thresholds), `tension-editor` (hooks, stakes, open loops, pacing),
`character-doctor`, `dialogue-doctor`, `prose-stylist` and
`opening-ending-specialist`. `/book-review` writes internal reader's reports,
public reviews, short reviews and blurbs with `literary-critic`,
`quality-auditor` and `beta-reader`.

Sessions opened on this repo load them automatically.

To make them available in **every** session (any repo), add this to the cloud
environment's setup script:

```bash
git clone --depth 1 https://github.com/ser937897-hash/ppp /tmp/ppp && bash /tmp/ppp/scripts/install-claude-skills.sh
```

The script also fetches Anthropic's `docx`, `pdf`, `pptx`, `xlsx` skills from
upstream (their license does not allow redistributing them here).
