import { describe, expect, it } from 'vitest';
import { cn, toDateInput } from '../utils';

describe('web utils', () => {
  it('joins class names and drops falsy values', () => {
    expect(cn('a', false, undefined, 'b')).toBe('a b');
  });

  it('formats ISO dates for <input type="date">', () => {
    expect(toDateInput('2001-05-17T00:00:00.000Z')).toBe('2001-05-17');
    expect(toDateInput(null)).toBe('');
  });
});
