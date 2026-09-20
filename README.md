
## Стек

- **Backend:** Node.js, Express, Socket.IO, JWT
- **БД / черги:** PostgreSQL, Redis + BullMQ
- **Frontend:** React Native (Expo) — буде ініціалізовано окремим кроком
- **Інтеграції:** Claude API (Haiku) — асинхронна генерація навчальних сценаріїв
- **Інфраструктура:** Docker, docker-compose, GitHub Actions (CI)

## Структура репозиторію

| Шлях | Призначення |
|---|---|
| `backend/` | API-сервер |
| `frontend/` | мобільний застосунок (поки порожньо) |
| `docs/` | документація, `proposal.md` |

## Запуск локально

```bash
docker-compose up --build
```

- Backend: `http://localhost:3000` (`GET /health`)
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

Змінні середовища для розробки без Docker:
```bash
cp backend/.env.example backend/.env
```
Для compose можна перевизначити `JWT_SECRET`, `ANTHROPIC_API_KEY`, `POSTGRES_*` через shell або кореневий `.env`.

## Статус проєкту

🚧 Активна розробка — MVP. Деталі етапів — [`docs/proposal.md`](docs/proposal.md).

## Документація

- [Thesis Proposal](docs/proposal.md) — тема, проблематика, стек