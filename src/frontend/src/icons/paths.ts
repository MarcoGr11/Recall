/**
 * Recall icon set: 24×24, stroke 2 with round caps and joins, duotone.
 * `s` is the outline, `a` the accent shape filled with the primary colour at 30 %.
 * Plain data on purpose: the same paths are exported to the Figma library (Icon/<name>).
 */
export interface IconDef {
  s: string;
  a?: string;
  /** Default accessibilityLabel. */
  label: string;
}

const LEAF = 'M5 19C5 10 11 4 20 4c0 9-6 15-15 15z';
const RING = 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18z';

export const ICONS = {
  // navigation, nature themed
  home: { label: 'Сьогодні', a: 'M12 3a3 3 0 1 0 0 6a3 3 0 0 0 0-6z', s: 'M12 3a3 3 0 1 0 0 6a3 3 0 0 0 0-6zM12 21v-7M12 17c-3 0-5-1.5-5-4c3 0 5 1.5 5 4zM12 17c3 0 5-1.5 5-4c-3 0-5 1.5-5 4zM5 21h14' },
  tree: { label: 'Дерево знань', a: 'M12 3a6 6 0 0 0-5.3 8.8A3.6 3.6 0 0 0 9 16h6a3.6 3.6 0 0 0 2.3-4.2A6 6 0 0 0 12 3z', s: 'M12 3a6 6 0 0 0-5.3 8.8A3.6 3.6 0 0 0 9 16h6a3.6 3.6 0 0 0 2.3-4.2A6 6 0 0 0 12 3zM12 21v-9M12 15l-2.5-2.5M12 13l2-2M9 21h6' },
  book: { label: 'Курси', a: 'M12 11c0-3.5 2-6 6-6c0 3.5-2 6-6 6z', s: 'M4 15h15v5H4zM6 11h14v4H6zM12 11c0-3.5 2-6 6-6c0 3.5-2 6-6 6zM12 11l3-3' },
  bell: { label: 'Сповіщення', a: 'M6 17v-5a6 6 0 0 1 12 0v5z', s: 'M6 17v-5a6 6 0 0 1 9-5.2M18 12v5l1.5 2h-15L6 17M10 21h4M15 7c0-2.5 1.5-4 4.5-4c0 3-1.5 4.5-4.5 4z' },
  user: { label: 'Профіль', a: 'M8 16c0-4.5 3.5-8 8-8c0 4.5-3.5 8-8 8z', s: `${RING}M8 16c0-4.5 3.5-8 8-8c0 4.5-3.5 8-8 8zM8 16l4.5-4.5` },
  inbox: { label: 'Модерація', a: LEAF, s: `${LEAF}M9.5 12.5l2.5 2.5l4.5-5` },
  monitor: { label: 'Моніторинг', a: 'M17 8c0-2.5 1.5-4 4.5-4c0 3-1.5 4.5-4.5 4z', s: 'M2 14h4l2-5l3 9l3-11l2 7h5M17 8c0-2.5 1.5-4 4.5-4c0 3-1.5 4.5-4.5 4z' },
  grid: { label: 'Теплова карта', a: 'M4 10c0-3.5 2.5-6 6-6c0 3.5-2.5 6-6 6zM14 20c0-3.5 2.5-6 6-6c0 3.5-2.5 6-6 6z', s: 'M4 10c0-3.5 2.5-6 6-6c0 3.5-2.5 6-6 6zM14 10c0-3.5 2.5-6 6-6c0 3.5-2.5 6-6 6zM4 20c0-3.5 2.5-6 6-6c0 3.5-2.5 6-6 6zM14 20c0-3.5 2.5-6 6-6c0 3.5-2.5 6-6 6z' },
  leaf: { label: 'Листок', a: LEAF, s: `${LEAF}M5 19l9-9` },
  // general
  users: { label: 'Учасники', a: 'M9 5a3 3 0 1 0 0 6a3 3 0 0 0 0-6z', s: 'M9 5a3 3 0 1 0 0 6a3 3 0 0 0 0-6zM3 20a6 6 0 0 1 12 0M16 5.2a3 3 0 0 1 0 5.6M17.5 14.3A6 6 0 0 1 21 20' },
  clock: { label: 'Час', a: RING, s: `${RING}M12 7v5l3 2` },
  calendar: { label: 'Календар', a: 'M4 6h16v4H4z', s: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4' },
  file: { label: 'Файл', a: 'M6 3h8l4 4v14H6z', s: 'M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h4' },
  key: { label: 'Код запрошення', a: 'M8 11a4 4 0 1 0 0 8a4 4 0 0 0 0-8z', s: 'M8 11a4 4 0 1 0 0 8a4 4 0 0 0 0-8zM11 12.5L20 4M17 7l2.5 2.5M14.5 9.5l2 2' },
  alert: { label: 'Увага', a: 'M12 4l9 16H3z', s: 'M12 4l9 16H3zM12 10v4M12 17v.01' },
  check: { label: 'Готово', s: 'M5 12.5l4.5 4.5L19 7.5' },
  settings: { label: 'Налаштування', a: 'M16 5a2 2 0 1 0 0 4a2 2 0 0 0 0-4zM8 15a2 2 0 1 0 0 4a2 2 0 0 0 0-4z', s: 'M4 7h10M18 7h2M4 17h2M10 17h10M16 5a2 2 0 1 0 0 4a2 2 0 0 0 0-4zM8 15a2 2 0 1 0 0 4a2 2 0 0 0 0-4z' },
  upload: { label: 'Завантажити', a: 'M4 17h16v3H4z', s: 'M12 16V4M7 9l5-5l5 5M4 17v3h16v-3' },
  play: { label: 'Почати', a: 'M8 5l11 7l-11 7z', s: 'M8 5l11 7l-11 7z' },
  lock: { label: 'Закрито', a: 'M6 11h12v9H6z', s: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 15v2' },
  'wifi-off': { label: 'Немає з’єднання', s: 'M3 3l18 18M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 3.5-2.3M12 9.5a10 10 0 0 1 7 3.4M2 9a15 15 0 0 1 4.2-2.8M10.5 5.1A15 15 0 0 1 22 9M12 20v.01' },
  'camera-off': { label: 'Знімки екрана заборонено', s: 'M3 3l18 18M9.5 5h5l1.5 2H20v10.5M17 19H4V7h2M9.6 10.6a3.2 3.2 0 0 0 4.4 4.4' },
  'eye-off': { label: 'Приховано', s: 'M3 3l18 18M10.6 6.2A9.5 9.5 0 0 1 12 6c5 0 8.5 4 9.5 6a13 13 0 0 1-2.6 3.4M6.5 7.6A13 13 0 0 0 2.5 12c1 2 4.5 6 9.5 6a9 9 0 0 0 4-1M9.9 9.9a3 3 0 0 0 4.2 4.2' },
  refresh: { label: 'Оновити', s: 'M20 5v5h-5M4 19v-5h5M19.5 10A8 8 0 0 0 5.6 7.5M4.5 14a8 8 0 0 0 13.9 2.5' },
  logout: { label: 'Вийти', s: 'M10 4H5v16h5M14 8l4 4l-4 4M18 12H9' },
  info: { label: 'Інформація', a: RING, s: `${RING}M12 11v6M12 7.5v.01` },
  edit: { label: 'Редагувати', a: 'M4 20h4L19 9l-4-4L4 16z', s: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4' },
  trash: { label: 'Видалити', a: 'M6 7l1 13h10l1-13z', s: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5' },
  copy: { label: 'Скопіювати', a: 'M9 9h11v11H9z', s: 'M9 9h11v11H9zM5 15H4V4h11v1' },
  search: { label: 'Пошук', a: 'M11 4a7 7 0 1 0 0 14a7 7 0 0 0 0-14z', s: 'M11 4a7 7 0 1 0 0 14a7 7 0 0 0 0-14zM16 16l4.5 4.5' },
  shield: { label: 'Захист', a: 'M12 3l8 3v6c0 4.5-3.5 8-8 9c-4.5-1-8-4.5-8-9V6z', s: 'M12 3l8 3v6c0 4.5-3.5 8-8 9c-4.5-1-8-4.5-8-9V6zM9 12l2 2l4-4' },
  sparkles: { label: 'Генерація', a: 'M10 4l1.6 4.4L16 10l-4.4 1.6L10 16l-1.6-4.4L4 10l4.4-1.6z', s: 'M10 4l1.6 4.4L16 10l-4.4 1.6L10 16l-1.6-4.4L4 10l4.4-1.6zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z' },
  sun: { label: 'Світла тема', a: 'M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8z', s: 'M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5' },
  moon: { label: 'Темна тема', a: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z', s: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z' },
  phone: { label: 'Телефон', a: 'M8 3h8v18H8z', s: 'M8 3h8v18H8zM11 18h2' },
  signal: { label: 'Сигнал', s: 'M5 19v-3M10 19v-7M15 19V8M20 19V4' },
  list: { label: 'Список', s: 'M9 6h11M9 12h11M9 18h11M4.5 6v.01M4.5 12v.01M4.5 18v.01' },
  more: { label: 'Ще', s: 'M12 5v.01M12 12v.01M12 19v.01' },
  drag: { label: 'Перетягнути', s: 'M9 6v.01M15 6v.01M9 12v.01M15 12v.01M9 18v.01M15 18v.01' },
  plus: { label: 'Додати', s: 'M12 5v14M5 12h14' },
  x: { label: 'Закрити', s: 'M6 6l12 12M18 6L6 18' },
  'chevron-left': { label: 'Назад', s: 'M15 6l-6 6l6 6' },
  'chevron-right': { label: 'Далі', s: 'M9 6l6 6l-6 6' },
  'arrow-left': { label: 'Назад', s: 'M19 12H5M11 6l-6 6l6 6' },
} satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;
