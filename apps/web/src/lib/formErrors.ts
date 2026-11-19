import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from './api';

/** Maps API validation details onto react-hook-form fields. Returns true if any were applied. */
export function applyServerErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
): boolean {
  if (!(err instanceof ApiError) || !err.details?.length) return false;
  for (const d of err.details) setError(d.path as Path<T>, { type: 'server', message: d.message });
  return true;
}
