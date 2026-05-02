/**
 * All app dates are local-civil-date strings (YYYY-MM-DD). Weeks are Monday-anchored
 * because Friday-as-end-of-week needs a stable Monday for the URL key.
 */

export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  return todayIso(date) === value;
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return todayIso(date);
}

export function mondayOf(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  const dayOfWeek = date.getDay();
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  date.setDate(date.getDate() + offsetToMonday);
  return todayIso(date);
}

export function weekDates(weekStartIso: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStartIso, i));
}

export function isFridayOrLater(iso: string): boolean {
  const day = new Date(`${iso}T00:00:00`).getDay();
  return day === 5 || day === 6 || day === 0;
}

export function formatLongDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
