#!/usr/bin/env bash
# Starts FreeLLMAPI in Docker; generates .env with an encryption key on first run.
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  key="$(openssl rand -hex 32 2>/dev/null || node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')"
  sed "s/^ENCRYPTION_KEY=.*/ENCRYPTION_KEY=${key}/" .env.example > .env
  chmod 600 .env
  echo "Created .env with a new ENCRYPTION_KEY — back it up, it encrypts your provider keys."
fi

docker compose pull
docker compose up -d
echo "FreeLLMAPI: http://localhost:$(grep -E '^PORT=' .env | cut -d= -f2 || echo 3001)"
