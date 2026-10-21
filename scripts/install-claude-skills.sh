#!/usr/bin/env bash
# Installs this repo's Claude Code skills, agents, commands and rules into
# ~/.claude so they are available in every session, not just this project.
# Usage (e.g. in a cloud environment setup script):
#   git clone --depth 1 https://github.com/ser937897-hash/ppp /tmp/ppp && bash /tmp/ppp/scripts/install-claude-skills.sh
set -euo pipefail

SRC="$(cd "$(dirname "$0")/.." && pwd)/.claude"
DEST="${HOME}/.claude"
mkdir -p "$DEST"/{skills,agents,commands,rules}

cp -rn "$SRC"/skills/.   "$DEST"/skills/
cp -rn "$SRC"/agents/.   "$DEST"/agents/
cp -rn "$SRC"/commands/. "$DEST"/commands/
cp -rn "$SRC"/rules/.    "$DEST"/rules/

# docx/pdf/pptx/xlsx from anthropics/skills are source-available (not
# redistributable), so they are fetched from upstream instead of vendored here.
tmp="$(mktemp -d)"
if git clone --depth 1 -q https://github.com/anthropics/skills.git "$tmp/skills"; then
  for s in docx pdf pptx xlsx; do
    [ -e "$DEST/skills/$s" ] || cp -r "$tmp/skills/skills/$s" "$DEST/skills/$s"
  done
fi
rm -rf "$tmp"

echo "Installed $(ls "$DEST/skills" | wc -l) skills into $DEST"
