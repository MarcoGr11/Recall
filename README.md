# Retain

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/React_Native-Expo-61DAFB?logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=githubactions&logoColor=white" alt="GitHub Actions" />
</p>

<p align="center">
  <b>Мультидисциплінарна платформа теоретичної підготовки БЗВП</b><br/>
  з адаптивним повторенням та сценарним тренажером прийняття рішень
</p>

---

Дипломний проєкт, спеціальність F2 — Інженерія програмного забезпечення.
Повне обґрунтування теми, проблематика та детальний опис функціоналу — у [`docs/proposal.md`](docs/proposal.md).

## Навіщо

Наявні рішення для теоретичної підготовки за програмою БЗВП (Moodle та подібні LMS) забезпечують лише одноразовий контроль знань — матеріал не переглядається повторно, знання швидко забуваються. Retain вирішує це через:

- 🔁 **адаптивне повторення** (алгоритм SM-2) — система сама нагадує повернутись до слабких тем
- 👁 **живий моніторинг групи** інструктором у реальному часі, а не разовий звіт після тесту
- 🎯 **сценарний тренажер рішень** — реалістичні кейси з розгалуженнями замість механічних тестів, чернетки яких генерує ШІ та перевіряє інструктор перед публікацією

## Ключові функції

| Функція | Опис |
|---|---|
| 🔐 Рольова модель | Засновник курсу / співінструктор / курсант — права визначаються окремо для кожного курсу |
| 📝 Тестування | Проходження тем з рандомізацією питань і відповідей |
| 🧠 SM-2 повторення | Розрахунок оптимального інтервалу до наступного повторення теми |
| 📊 Live-дашборд інструктора | Прогрес групи в реальному часі через WebSocket |
| 🌳 Сценарний тренажер | AI-генерація чернеток розгалужених кейсів + модерація інструктором |

## Архітектура

```
┌──────────────┐      REST API       ┌──────────────┐
│   Frontend   │ ──────────────────▶ │   Backend    │
│ React Native │                     │ Node/Express │
│   (Expo)     │ ◀─── WebSocket ──── │  Socket.IO   │
└──────────────┘                     └──────┬───────┘
                                             │
                        ┌────────────────────┼────────────────────┐
                        ▼                    ▼                    ▼
                 ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
                 │ PostgreSQL  │     │ Redis+BullMQ │     │ Claude API  │
                 │ (основні    │     │ (черга AI-   │     │ (генерація  │
                 │  дані)      │     │  генерації)  │     │  сценаріїв) │
                 └─────────────┘     └──────────────┘     └─────────────┘
```

## Стек

| Категорія | Технології |
|---|---|
| **Backend** | Node.js · Express · Socket.IO · JWT |
| **БД / черги** | PostgreSQL · Redis · BullMQ |
| **Frontend** | React Native (Expo) — *буде ініціалізовано окремим кроком* |
| **Інтеграції** | Claude API (Haiku) — асинхронна генерація навчальних сценаріїв |
| **Інфраструктура** | Docker · docker-compose · GitHub Actions (CI) |

## Структура репозиторію

```
Retain/
├── backend/     # API-сервер
├── frontend/    # мобільний застосунок (поки порожньо)
└── docs/        # документація, proposal.md
```

## Запуск локально

```bash
docker-compose up --build
```

| Сервіс | Адреса |
|---|---|
| Backend | `http://localhost:3000` (`GET /health`) |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

Змінні середовища для розробки без Docker:
```bash
cp backend/.env.example backend/.env
```
Для compose можна перевизначити `JWT_SECRET`, `ANTHROPIC_API_KEY`, `POSTGRES_*` через shell або кореневий `.env`.

## Статус проєкту

🚧 **Активна розробка — MVP.** Деталі етапів — [`docs/proposal.md`](docs/proposal.md).

## Документація

- 📄 [Thesis Proposal](docs/proposal.md) — тема, проблематика, стек
