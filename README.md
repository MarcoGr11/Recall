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
  <b>Платформа адаптивної підготовки студентів ІТ-спеціальностей до екзаменаційної сесії</b><br/>
  з пріоритизацією повторення за датами контрольних заходів
</p>

---

Кваліфікаційний проєкт, спеціальність F2 — Інженерія програмного забезпечення.

## Документація

- [docs/README.md](docs/README.md) — навігація пояснювальною запискою і відповідність лабораторних робіт підрозділам
- [docs/srs.md](docs/srs.md) — специфікація вимог за ISO/IEC/IEEE 29148 (Додаток А)
- [docs/2_design.md](docs/2_design.md) — Розділ 2. Обґрунтування архітектурних рішень та проєктування системи
- [docs/api/openapi.yaml](docs/api/openapi.yaml) — контракт REST API (OpenAPI 3.0.3, підрозділ 2.5)
- Зведений документ Розділів 1–2 (Google Docs): GOOGLE_DOCS_CH1_2

## Призначення

Recall — кросплатформна клієнт-серверна система адаптивної підготовки студентів ІТ-спеціальностей до екзаменаційної сесії з кількох дисциплін. Система поєднує тестування, серверне планування інтервального повторення за алгоритмом SM-2, асинхронну генерацію тестових завдань великою мовною моделлю з модерацією викладачем, пробні тести до контрольних заходів і моніторинг засвоєння групою в реальному часі.

## Функції MVP

| Функція | Опис |
|---|---|
| Рольова модель | Ролі owner, co-instructor і student окремо в кожному курсі; приєднання за кодом запрошення |
| Курси і контрольні заходи | Теми курсу; контрольні заходи типів current, module, credit, exam з датою і переліком тем |
| Тестування | Рандомізований порядок питань і варіантів, серверний таймер, оцінка лише на сервері |
| Планування повторень | SM-2 на сервері; персональний план на день до 30 питань з пріоритизацією за найближчим контрольним заходом |
| Генерація контенту | Генерація тестів за лекційним PDF через Claude API у черзі BullMQ; обов'язкова модерація викладачем |
| Пробний тест | Тренувальні питання за закритим зразком тесту контрольного заходу без копіювання оригіналів |
| Антисписування | Фіксація виходів із застосунку і знімків екрана, блокування копіювання тексту під час тесту |
| Моніторинг | Панель моніторингу групи в реальному часі (Socket.io) і теплова карта засвоєння «студент × тема» |

Поза межами MVP: сценарний тренажер прийняття рішень, флагманський модуль із серією днів практики (streak), push-нагадування, офлайн-режим, інтеграція LTI 1.3, ручна верифікація на iOS (повний перелік — [srs.md](docs/srs.md), розділ 1.2).

## Стек

| Категорія | Технології |
|---|---|
| **Backend** | Node.js · Express · Socket.IO · JWT |
| **БД / черги** | PostgreSQL 16 (Kysely) · Redis 7 · BullMQ |
| **Frontend** | React Native (Expo) |
| **Інтеграції** | Claude API (Claude Haiku 5.5) — генерація тестів за лекціями і тренувальних питань за зразками |
| **Інфраструктура** | Docker · docker-compose · GitHub Actions (CI) |

## Структура репозиторію

```text
Recall/
├── src/
│   ├── backend/    # API-сервер
│   └── frontend/   # мобільний застосунок (React Native, Expo)
└── docs/           # пояснювальна записка, srs.md, adr/, api/
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
cp src/backend/.env.example src/backend/.env
```

## Статус проєкту

Етап проєктування архітектури, моделі даних, контракту API і алгоритмів завершено (Розділ 2, підрозділи 2.2–2.3, 2.5, 2.7–2.9); розробка MVP — грудень 2026 – лютий 2027. Пропозиція теми — [docs/proposal.md](docs/proposal.md).
