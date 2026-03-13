import { formatDistanceToNow } from 'date-fns';

/**
 * Safely formats a date as "X ago". Falls back to the raw string if
 * the value is missing or not a valid date (e.g. fallback articles with
 * createdAt === undefined or "Just now").
 */
export function timeAgo(dateStr: string | undefined | null, fallback?: string): string {
  if (!dateStr) return fallback ?? '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return fallback ?? dateStr;
  return formatDistanceToNow(d, { addSuffix: true });
}
