import { hash, mulberry32 } from './generate';
import type { Course, TreeInput } from './types';

export const DAY = 86_400_000;

const SYLLABUS: [string, string[]][] = [
  ['Архітектура ПЗ', ['Принципи SOLID', 'Патерни GoF', 'Мікросервіси', 'Модель C4', 'Architecture Decision Records', 'Чиста архітектура', 'CQRS', 'Event Sourcing']],
  ['Бази даних', ['Реляційна модель', 'Нормалізація', 'Індекси', 'Транзакції та ACID', 'Рівні ізоляції', 'JOIN-и', 'Віконні функції', 'Реплікація', 'Шардинг', 'NoSQL-моделі', 'Плани запитів', 'Міграції схем']],
  ['Алгоритми', ['Складність O(n)', 'Масиви', 'Зв’язні списки', 'Стек і черга', 'Хеш-таблиці', 'Бінарний пошук', 'Сортування злиттям', 'Швидке сортування', 'Купа', 'Дерева пошуку', 'Обхід графів', 'Алгоритм Дейкстри', 'Динамічне програмування', 'Жадібні алгоритми', 'Бектрекінг', 'Префіксні дерева']],
  ['Комп’ютерні мережі', ['Модель OSI', 'TCP і UDP', 'IP-адресація', 'DNS', 'HTTP і REST', 'TLS']],
  ['Тестування ПЗ', ['Модульні тести', 'Інтеграційні тести', 'TDD', 'Моки та стаби', 'E2E-тести', 'Навантажувальне тестування', 'Покриття коду', 'Тест-дизайн', 'CI-пайплайни', 'Регресійне тестування']],
];

/** Extra course names for the dev panel's "add course". */
export const EXTRA_COURSES = ['Операційні системи', 'Веб-технології', 'Безпека застосунків', 'Машинне навчання', 'DevOps'];

export function mockTopic(id: string, title: string, nowMs: number) {
  const r = mulberry32(hash(id));
  return {
    id,
    title,
    mastery: Math.round(Math.pow(r(), 0.6) * 100) / 100,
    lastReviewedAt: new Date(nowMs - r() * 20 * DAY).toISOString(),
    dueAt: new Date(nowMs + (r() * 12 - 3) * DAY).toISOString(),
  };
}

export function mockCourse(id: string, title: string, topicTitles: string[], nowMs: number): Course {
  return { id, title, topics: topicTitles.map((t, i) => mockTopic(`${id}-t${i + 1}`, t, nowMs)) };
}

/** Temporary mock until the API is ready: 5 courses with 6–16 topics. */
export function mockTree(nowMs: number, courses = SYLLABUS.length): TreeInput {
  return { studentId: 'student-demo', courses: SYLLABUS.slice(0, courses).map(([title, topics], i) => mockCourse(`course-${i + 1}`, title, topics, nowMs)) };
}

/** Stress preset for profiling: 8 courses × 30 topics. */
export function stressTree(nowMs: number): TreeInput {
  return {
    studentId: 'student-demo',
    courses: Array.from({ length: 8 }, (_, c) =>
      mockCourse(`stress-${c + 1}`, `Курс ${c + 1}`, Array.from({ length: 30 }, (_, t) => `Тема ${t + 1}`), nowMs),
    ),
  };
}
