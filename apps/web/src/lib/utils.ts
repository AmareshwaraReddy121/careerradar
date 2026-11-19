import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return 'Not yet';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

/** Converts a Date/ISO value to the yyyy-mm-dd string used by <input type="date">. */
export function toDateInput(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}
