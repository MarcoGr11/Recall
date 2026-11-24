# DevOps (Docker, CI/CD, Queue)

## Контейнеризація — Docker + docker-compose

Сервіси в `docker-compose.yml`:

- `backend` (Node.js + Express)
- `postgres` (БД)
- `redis` (черга)
- (опційно) `worker` — окремий контейнер для обробки черги генерації, якщо винести з основного backend-процесу

Навіщо: відтворюваність середовища, легкий локальний запуск (`docker-compose up`), підготовка до подальшого розгортання на сервері.

## CI/CD — GitHub Actions

Базовий конвеєр `.github/workflows/ci.yml`, що запускається на кожен push/PR:

1. Встановлення залежностей
2. Лінт (ESLint)
3. Тести (базові unit-тести backend — наприклад, логіка SM-2-розрахунку, парсинг JSON від LLM)

Навіщо: демонструє інженерну культуру (Conventional Commits + CI), пряма вимога рубрики ЛР№1 щодо "історії комітів, що демонструє культуру роботи з Git".

Цільовий конвеєр (оновлено 24.11.2026, підрозділ 2.4 [2_design.md](../2_design.md)): кожен Pull Request блокується, якщо не пройдено `npm ci` за lock-файлом, лінт, тести, `npm audit --audit-level=high`, Trivy для образів (Critical/High) зі SBOM CycloneDX, Quality Gate SonarQube Cloud і gitleaks; GitHub Actions закріплено за SHA, `GITHUB_TOKEN` має мінімальні `permissions`, оновлення залежностей пропонує Dependabot ([SRS-NFR-SEC-09](../srs.md#srs-nfr-sec-09)…[SRS-NFR-SEC-11](../srs.md#srs-nfr-sec-11), [SRS-NFR-SEC-13](../srs.md#srs-nfr-sec-13)). Чинний `ci.yml` містить лише встановлення залежностей, лінт і тести; доповнення — задача етапу реалізації ([[13-TBD відкриті питання]]).

## Черга повідомлень — Redis + BullMQ

Детальний опис використання — [[08-Сценарний тренажер#Конвеєр генерації та курації контенту]].

Коротко: у MVP черга обслуговує два типи асинхронних задач — генерацію тесту за лекційним матеріалом (`lecture_test`) і тренувальних питань за зразком тесту (`mock_questions`); генерація сценаріїв — поза MVP. Обидва типи йдуть через чергу, а не прямий синхронний виклик Claude API — це дає асинхронність, повторні спроби при збоях і контроль паралельних запитів до API.

Параметри (оновлено 24.11.2026, [ADR-001](../adr/0001-choice-of-technology.md), підрозділ 2.8 [2_design.md](../2_design.md)): 3 спроби загалом із затримками 5 с і 10 с, для HTTP 429 — не менше значення retry-after; SDK Anthropic з `maxRetries: 0`; неповторювані помилки (400, 401, 403, порожній текст джерела, вичерпаний добовий бюджет) і третя невдала спроба переводять задачу в стан dead (dead-letter queue); не більше 2 задач одночасно.

Черга `maintenance` (оновлено 24.11.2026, підрозділи 2.1.1 і 2.3.2 [2_design.md](../2_design.md)): щохвилини — завершення прострочених спроб (перелік `expiredAttemptIds` у результаті задачі для подій у Backend API) і повторна постановка задач generation_jobs у стані queued, старших за 1 хв; щодоби — видалення подій антисписування за строком.

## Конфігурація docker-compose (цільова, [ADR-002](../adr/0002-modular-monolith.md))

- Обмеження ресурсів: Backend API 1,5 vCPU / 768 МБ, Generation Worker 1 vCPU / 512 МБ, PostgreSQL 1 vCPU / 2 ГБ, Redis 0,25 vCPU / 256 МБ, Reverse Proxy 0,25 vCPU / 128 МБ
- Одноразовий сервіс `migrate` (Kysely Migrator) запускається до backend і worker (`depends_on: condition: service_completed_successfully`); міграції сумісні з попередньою версією коду
- `UV_THREADPOOL_SIZE=4` для Backend API (Argon2id); вилучення тексту PDF — у `worker_threads`
- Healthcheck: backend — PostgreSQL (стан Redis у полі `queue`), worker — PostgreSQL і Redis; контейнери зі статусом unhealthy автоматично не перезапускаються (поза MVP)
- Backup Job: щоденний pg_dump і архів тому File Storage, зашифровані утилітою `age`, на окремий фізичний носій, зберігання 7 днів
- Мережа (оновлено 24.11.2026, підрозділ 2.4 [2_design.md](../2_design.md)): назовні опубліковано лише порт 443 Reverse Proxy; backend, worker, PostgreSQL і Redis без `ports`; сертифікат — ACME TLS-ALPN-01; Redis з `requirepass` і ACL-користувачем
- Секрети (`JWT_SECRET`, паролі PostgreSQL і Redis, `ANTHROPIC_API_KEY`, облікові дані SMTP) — Docker secrets; значень за замовчуванням немає ([SRS-NFR-SEC-13](../srs.md#srs-nfr-sec-13))
- Ролі PostgreSQL: `recall_migrator` (DDL, сервіс `migrate`), `recall_app` (DML для backend; `audit_log` — лише INSERT і SELECT), `recall_worker` (DML на таблиці генерації)
- Контейнери: непривілейований користувач, `read_only: true` з tmpfs для тимчасових файлів, `security_opt: no-new-privileges`, `cap_drop: ALL`, `pids_limit`; образи закріплено за digest; журнали — драйвер `json-file` з `max-size: 10m`, `max-file: 5`
- Чинний `docker-compose.yml` відкриває порти 3000, 5432 і 6379, не містить Reverse Proxy і задає `JWT_SECRET` за замовчуванням; приведення до цільової конфігурації — задача етапу реалізації ([[13-TBD відкриті питання]])
- CI: dependency-cruiser перевіряє правило залежностей шарів і межі модулів
- Reverse Proxy (Caddy): `request_body max_size 11MB`, стиснення відповідей `encode gzip`, журнал доступу без query-рядка; шлях `/health` назовні не публікується (healthcheck docker-compose звертається до backend у внутрішній мережі); статичні сторінки universal link віддаються з `Referrer-Policy: no-referrer`
- Backend API: `trust proxy` = 1 (довіра лише Reverse Proxy для `X-Forwarded-For`)

## Що свідомо НЕ додається (щоб не роздувати обсяг)

- Kubernetes — для одного backend-сервісу без масштабування це надмірно
- Мікросервісна архітектура — застосунок залишається монолітом (Node.js + Express), чергу використовуємо для асинхронності конкретних задач, а не як привід ділити на сервіси
- Observability-стек (Prometheus/Grafana) — можна згадати як "перспективу розвитку" в дипломній, не реалізовувати

## Пов'язано

- [[09-Технічний стек]]
- [[08-Сценарний тренажер]]
- [[00-Project Charter]]
