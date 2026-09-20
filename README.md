# Retain

Дипломний проєкт (спеціальність F2, Інженерія ПЗ). Опис і обґрунтування — у [docs/proposal.md](docs/proposal.md).

## Стек

- **Backend:** Node.js, Express, Socket.IO, JWT
- **БД / черги:** PostgreSQL, Redis + BullMQ
- **Frontend:** React Native (Expo) — буде ініціалізовано окремим кроком
- **Інфраструктура:** Docker, docker-compose, GitHub Actions

## Структура

| Шлях | Призначення |
|------|-------------|
| `backend/` | API-сервер |
| `frontend/` | мобільний застосунок (поки порожньо) |
| `docs/` | документація |

## Запуск локально

```bash
docker-compose up --build
```

- Backend: http://localhost:3000 (`GET /health`)
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

Змінні середовища для розробки без Docker: `cp backend/.env.example backend/.env`.
Для compose можна перевизначити `JWT_SECRET`, `ANTHROPIC_API_KEY`, `POSTGRES_*` через shell або кореневий `.env`.
