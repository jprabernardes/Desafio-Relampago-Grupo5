export type PaymentSituation = 'adimplente' | 'inadimplente';

export function daysInMonth(year: number, monthIndex0: number): number {
  // monthIndex0: 0-11
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

export function parseDateOnly(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  // expected YYYY-MM-DD
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function clampDueDayToMonth(year: number, monthIndex0: number, dueDay: number): number {
  const dim = daysInMonth(year, monthIndex0);
  const day = Math.max(1, Math.min(31, Math.floor(dueDay)));
  return Math.min(day, dim);
}

export function dueDateForMonth(year: number, monthIndex0: number, dueDay: number): Date {
  const day = clampDueDayToMonth(year, monthIndex0, dueDay);
  return new Date(year, monthIndex0, day);
}

export function mostRecentDueDate(today: Date, dueDay: number): Date {
  const y = today.getFullYear();
  const m = today.getMonth();
  const currentMonthDue = dueDateForMonth(y, m, dueDay);

  // compare by date-only (time at midnight)
  const t = new Date(y, m, today.getDate());
  if (t.getTime() >= currentMonthDue.getTime()) return currentMonthDue;

  // previous month
  const prev = new Date(y, m - 1, 1);
  return dueDateForMonth(prev.getFullYear(), prev.getMonth(), dueDay);
}

export function addMonthsKeepingDueDay(baseDueDate: Date, dueDay: number, monthsToAdd: number): Date {
  const y = baseDueDate.getFullYear();
  const m = baseDueDate.getMonth();
  const target = new Date(y, m + monthsToAdd, 1);
  return dueDateForMonth(target.getFullYear(), target.getMonth(), dueDay);
}

export function computePaymentSituation(
  today: Date,
  dueDay: number,
  paidUntilStr?: string | null,
): {
  dueDate: Date;
  nextDueDate: Date;
  situation: PaymentSituation;
} {
  const lastDue = mostRecentDueDate(today, dueDay);
  const nextDue = addMonthsKeepingDueDay(lastDue, dueDay, 1);

  const paidUntil = parseDateOnly(paidUntilStr);
  const situation: PaymentSituation = paidUntil && paidUntil.getTime() >= lastDue.getTime()
    ? 'adimplente'
    : 'inadimplente';

  return { dueDate: lastDue, nextDueDate: nextDue, situation };
}
