/** Temporary mock data until the API is ready. Shape mirrors topics + sm2_progress. */
export interface Topic { id: string; name: string; ease: number; groupEase: number; studentsInGap: number }
export interface Course { id: string; name: string; isOwn?: boolean; topics: Topic[] }

const t = (id: string, name: string, ease: number, groupEase: number, studentsInGap: number): Topic => ({ id, name, ease, groupEase, studentsInGap });

export const flagshipTopics: Topic[] = [
  t("f1", "Git-воркфлоу", 2.6, 2.3, 1), t("f2", "Алгоритми та структури даних", 1.9, 1.8, 6),
  t("f3", "Мережі й протоколи", 2.2, 2.0, 4), t("f4", "Бази даних", 1.5, 1.9, 5), t("f5", "Основи безпеки (OWASP)", 1.35, 1.6, 11),
];

export const courses: Course[] = [
  { id: "c1", name: "Архітектура ПЗ", isOwn: true, topics: [t("a1", "Принципи SOLID", 2.5, 2.2, 2), t("a2", "Патерни GoF", 1.8, 1.7, 8), t("a3", "Мікросервіси", 1.4, 1.5, 13), t("a4", "Модель C4", 2.1, 2.35, 1), t("a5", "Architecture Decision Records", 1.6, 1.45, 15)] },
  { id: "c2", name: "Тестування ПЗ", topics: [t("b1", "Модульні тести", 2.7, 2.4, 0), t("b2", "Інтеграційні тести", 2.0, 2.0, 3), t("b3", "TDD", 1.7, 1.8, 7), t("b4", "Моки та стаби", 2.3, 2.1, 2), t("b5", "Навантажувальне тестування", 1.3, 1.5, 12)] },
  { id: "c3", name: "Веб-технології", topics: [t("w1", "HTTP і REST", 2.8, 2.5, 0), t("w2", "Автентифікація JWT", 1.9, 1.7, 9), t("w3", "WebSocket", 1.55, 1.6, 10), t("w4", "CORS", 2.2, 1.9, 5), t("w5", "Кешування", 1.45, 1.55, 12)] },
];
