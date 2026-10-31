# FreeLLMAPI

[FreeLLMAPI](https://github.com/tashfeenahmed/freellmapi) (MIT) — self-hosted сервер, который
объединяет бесплатные тарифы ~34 провайдеров LLM (Google Gemini, Groq, Cerebras, Mistral,
OpenRouter, Cloudflare, NVIDIA, HuggingFace и др.) за одним эндпоинтом `/v1`, совместимым с
OpenAI и Anthropic. Роутер сам выбирает модель, переключается на следующего провайдера при
лимитах и следит, чтобы не выйти за бесплатные квоты.

Здесь — готовая конфигурация для запуска из официального Docker-образа
`ghcr.io/tashfeenahmed/freellmapi`. Исходники проекта не копируются в этот репозиторий.

## Запуск

Нужны Docker и Docker Compose (Mac/Windows — Docker Desktop).

```bash
cd tools/freellmapi
./start.sh
```

Скрипт при первом запуске создаст `.env` со случайным `ENCRYPTION_KEY` (сохраните его
копию — им зашифрованы ключи провайдеров), скачает образ и запустит контейнер.

1. Откройте http://localhost:3001.
2. На странице **Keys** добавьте API-ключи провайдеров (бесплатные регистрации у Google AI
   Studio, Groq, Cerebras, Mistral, OpenRouter и т. д.).
3. В шапке страницы **Keys** скопируйте единый ключ (unified key).

Без Docker: десктоп-приложение для macOS/Windows —
[Releases](https://github.com/tashfeenahmed/freellmapi/releases/latest).

## Подключение клиентов

OpenAI SDK и любые совместимые клиенты:

```bash
export OPENAI_BASE_URL=http://localhost:3001/v1
export OPENAI_API_KEY=<unified-key>
```

```python
from openai import OpenAI
client = OpenAI(base_url="http://localhost:3001/v1", api_key="<unified-key>")
client.chat.completions.create(model="auto", messages=[{"role": "user", "content": "Привет"}])
```

Автонастройка агентов (Claude Code, Codex, Gemini CLI, Cursor, Aider и др.) — см.
[supported agents](https://github.com/tashfeenahmed/freellmapi/blob/main/docs/en/clients/02-supported-agents.md):

```bash
npx freellmapi setup-claude --url http://localhost:3001 --api-key <unified-key>
```

## Управление

```bash
docker compose logs -f      # логи
docker compose pull && docker compose up -d   # обновление
docker compose down         # остановка (данные остаются в volume freellmapi-data)
```

## Важно знать

- **Только для себя.** Сервер однопользовательский и по умолчанию слушает только
  `127.0.0.1`. Не открывайте его в интернет.
- **Качество.** Фронтирных моделей в бесплатных тарифах нет; к вечеру (UTC) лучшие модели
  выбирают дневные лимиты, и ответы становятся слабее. SLA нет.
- **Приватность.** Запросы уходят сторонним провайдерам, многие из них на бесплатных тарифах
  используют данные для обучения. Не отправляйте конфиденциальное.
- **Условия провайдеров.** Используйте по одному своему ключу на провайдера. Регистрация
  нескольких аккаунтов, чтобы обойти лимиты, обычно нарушает правила провайдеров.
- **Claude Code через FreeLLMAPI** будет работать на бесплатных моделях, а не на Claude:
  навыки и агенты из `.claude/` загрузятся, но качество работы будет заметно ниже.
