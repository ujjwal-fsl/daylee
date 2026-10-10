import { Task } from '../types';

/**
 * Format a Date object as YYYY-MM-DD (local time)
 */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string into a local Date
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get today's local date string YYYY-MM-DD
 */
export function getTodayDateString(): string {
  return toDateString(new Date());
}

/**
 * Check if a date string is today
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayDateString();
}

/**
 * Add or subtract days from a YYYY-MM-DD string
 */
export function addDays(dateStr: string, days: number): string {
  const d = parseDateString(dateStr);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

/**
 * Calculate difference in whole days between two date strings (target - start)
 */
export function daysBetween(startDateStr: string, targetDateStr: string): number {
  const start = parseDateString(startDateStr);
  const target = parseDateString(targetDateStr);
  const diffTime = target.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format date for the notebook header, e.g. "Monday, July 6"
 */
export function formatNotebookDate(dateStr: string): string {
  const d = parseDateString(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format year if viewing past/future year
 */
export function formatNotebookYear(dateStr: string): string {
  const d = parseDateString(dateStr);
  const currentYear = new Date().getFullYear();
  if (d.getFullYear() !== currentYear) {
    return String(d.getFullYear());
  }
  return '';
}

/**
 * Section 8.2: Contextual greeting based on user's local time:
 * Morning: Good Morning ☀️ (5:00 - 11:59)
 * Afternoon: Good Afternoon 🌤 (12:00 - 17:59)
 * Evening: Good Evening 🌙 (18:00 - 4:59)
 */
export function getTimeGreeting(): { greeting: string; icon: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { greeting: 'Good Morning', icon: '☀️' };
  } else if (hour >= 12 && hour < 18) {
    return { greeting: 'Good Afternoon', icon: '🌤' };
  } else {
    return { greeting: 'Good Evening', icon: '🌙' };
  }
}

/**
 * Section 8.10 Repeat Tasks:
 * Determine whether a task should appear on a given notebook page date
 */
export function isTaskScheduledForDate(task: Task, dateStr: string): boolean {
  if (!task.repeatRule || task.repeatRule.type === 'none') {
    return task.createdDate === dateStr;
  }

  const { type, startDate, interval = 1, weekdays = [] } = task.repeatRule;

  // Occurrences cannot precede task start date
  if (dateStr < startDate) {
    return false;
  }

  const targetDate = parseDateString(dateStr);
  const start = parseDateString(startDate);

  switch (type) {
    case 'daily':
      return true;

    case 'weekly':
      // Repeat on the same day of the week
      return targetDate.getDay() === start.getDay();

    case 'monthly':
      // Repeat on the same day of the month
      return targetDate.getDate() === start.getDate();

    case 'custom_weekdays':
      // Repeat on selected weekdays (0 = Sunday, 1 = Monday, etc.)
      return weekdays.includes(targetDate.getDay());

    case 'every_x_days': {
      const diff = daysBetween(startDate, dateStr);
      if (diff < 0) return false;
      const step = Math.max(1, interval);
      return diff % step === 0;
    }

    default:
      return task.createdDate === dateStr;
  }
}

/**
 * Format a date string (YYYY-MM-DD) for search result groups, e.g. "September 8"
 */
export function formatSearchGroupDate(dateStr: string): string {
  if (!dateStr) return 'Unscheduled';
  const d = parseDateString(dateStr);
  const currentYear = new Date().getFullYear();
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    ...(d.getFullYear() !== currentYear ? { year: 'numeric' } : {}),
  });
}
