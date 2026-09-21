# Recall

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
  <b>Платформа адаптивної підготовки до сесії для студентів ІТ-спеціальностей</b><br/>
  з пріоритизацією за розкладом іспитів та сценарним тренажером прийняття рішень
</p>

---

Дипломний проєкт, спеціальність F2 — Інженерія програмного забезпечення.
Повне обґрунтування теми — у [`docs/proposal.md`](docs/proposal.md).

## Навіщо

Наявні рішення (Moodle, Anki, Quizlet) забезпечують або одноразовий контроль знань, або індивідуальне повторення без ролі викладача і без пріоритизації між кількома предметами одночасно. Recall вирішує це через:

- 🔁 **SM-2 повторення з пріоритизацією за сесією** — система сама розставляє пріоритети між предметами залежно від близькості іспиту
- 👁 **живий моніторинг групи** викладачем у реальному часі
- 🎯 **сценарний тренажер рішень** — реалістичні інженерні кейси замість механічних тестів
- 🔥 **флагманський модуль вічних навичок** (Git, алгоритми, мережі, БД, безпека) зі стріком, як у Duolingo

## Ключові функції

| Функція | Опис |
|---|---|
| 🔐 Рольова модель | Засновник курсу / співвикладач / студент — права на рівні кожного курсу |
| 📝 Тестування | Рандомізовані тести, генеруються також автоматично з лекцій викладача через AI |
| 🧠 SM-2 + розклад сесії | Персональний план підготовки на день з урахуванням дат іспитів усіх предметів |
| 📊 Live-дашборд викладача | Прогрес групи в реальному часі через WebSocket |
| 🌳 Сценарний тренажер | AI-генерація кейсів (Git-конфлікти, збої в проді, архітектурні рішення) + модерація |
| 🔥 Evergreen-модуль | Git, алгоритми, мережі, БД, безпека — стрік-механіка повторення без дедлайну |
| 🗺 Дерево знань | Візуалізація засвоєння: стовбур — флагманський модуль, гілки — курси, листки — теми |

## Стек

| Категорія | Технології |
|---|---|
| **Backend** | Node.js · Express · Socket.IO · JWT |
| **БД / черги** | PostgreSQL · Redis · BullMQ |
| **Frontend** | React Native (Expo) |
| **Інтеграції** | Claude API (Haiku) — генерація сценаріїв і тестів з лекцій |
| **Інфраструктура** | Docker · docker-compose · GitHub Actions (CI) |

## Структура репозиторію

```
Recall/
├── backend/    # API-сервер
├── frontend/   # мобільний застосунок (поки порожньо)
└── docs/       # документація, proposal.md
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

```bash
cp backend/.env.example backend/.env
```

## Статус проєкту

🚧 **Активна розробка — MVP.** Деталі — [`docs/proposal.md`](docs/proposal.md).
