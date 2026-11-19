import { describe, expect, it } from 'vitest';
import {
  educationSchema,
  experienceSchema,
  passwordSchema,
  registerSchema,
  sensitiveConsentSchema,
} from '../src';

describe('shared schemas', () => {
  it('enforces password strength', () => {
    expect(passwordSchema.safeParse('short1').success).toBe(false);
    expect(passwordSchema.safeParse('allletters').success).toBe(false);
    expect(passwordSchema.safeParse('Passw0rdOk').success).toBe(true);
  });

  it('requires accepting terms on registration', () => {
    const base = { fullName: 'Asha Rao', email: 'asha@example.com', password: 'Passw0rdOk' };
    expect(registerSchema.safeParse({ ...base, acceptTerms: false }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, acceptTerms: true }).success).toBe(true);
  });

  it('rejects a CGPA above its scale', () => {
    const edu = {
      level: 'graduate',
      degreeCode: 'BTECH',
      scoreType: 'cgpa',
      score: 9.5,
      scale: 10,
    };
    expect(educationSchema.safeParse(edu).success).toBe(true);
    expect(educationSchema.safeParse({ ...edu, score: 11 }).success).toBe(false);
  });

  it('rejects experience ending before it starts', () => {
    const x = {
      organization: 'Acme',
      title: 'Engineer',
      startDate: '2024-01-01',
      endDate: '2023-01-01',
    };
    expect(experienceSchema.safeParse(x).success).toBe(false);
  });

  it('requires consent for sensitive fields', () => {
    expect(sensitiveConsentSchema.safeParse({ category: 'OBC_NCL', consent: false }).success).toBe(
      false,
    );
  });
});
