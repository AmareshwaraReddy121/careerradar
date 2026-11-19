import { describe, expect, it } from 'vitest';
import { api, registerUser } from './helpers';
import { UserProfile } from '../src/models';

const validProfile = {
  fullName: 'Asha Rao',
  dateOfBirth: '2001-05-14',
  highestQualification: 'graduate',
  education: [
    {
      level: 'graduate',
      degreeCode: 'BTECH',
      branchCode: 'CSE',
      university: 'JNTU Hyderabad',
      graduationYear: 2023,
      scoreType: 'cgpa',
      score: 8.4,
      scale: 10,
    },
  ],
  skills: [
    { name: 'Python', level: 'advanced' },
    { name: 'python', level: 'beginner' },
    { name: 'SQL' },
  ],
  experience: [
    { organization: 'Acme', title: 'Intern', startDate: '2023-01-01', endDate: '2023-07-01' },
  ],
  preferences: {
    categories: ['banking', 'it'],
    locations: ['Hyderabad'],
    sector: 'both',
    minSalaryLpa: 6,
  },
};

describe('profile', () => {
  it('creates an initial profile on registration', async () => {
    const { accessToken } = await registerUser();
    const res = await api().get('/api/v1/profile').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.profile).toMatchObject({
      fullName: 'Asha Rao',
      education: [],
      profileVersion: 1,
    });
  });

  it('updates the profile, derives experience, dedupes skills and bumps version', async () => {
    const { accessToken } = await registerUser();
    const res = await api()
      .put('/api/v1/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validProfile);
    expect(res.status).toBe(200);
    const p = res.body.profile;
    expect(p.totalExperienceMonths).toBe(6);
    expect(p.skills.map((s: { name: string }) => s.name)).toEqual(['python', 'SQL']);
    expect(p.profileVersion).toBe(2);
    expect(p.completeness).toBe(100);
  });

  it('validates profile input', async () => {
    const { accessToken } = await registerUser();
    const res = await api()
      .put('/api/v1/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...validProfile,
        education: [
          { level: 'graduate', degreeCode: 'BTECH', scoreType: 'cgpa', score: 11, scale: 10 },
        ],
      });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe('education.0.score');
  });

  it('requires authentication', async () => {
    expect((await api().get('/api/v1/profile')).status).toBe(401);
  });

  it('stores sensitive fields encrypted and only with consent', async () => {
    const { accessToken, user } = await registerUser();
    const auth = { Authorization: `Bearer ${accessToken}` };
    const noConsent = await api()
      .put('/api/v1/profile/sensitive')
      .set(auth)
      .send({ category: 'OBC_NCL' });
    expect(noConsent.status).toBe(400);

    const ok = await api()
      .put('/api/v1/profile/sensitive')
      .set(auth)
      .send({ category: 'OBC_NCL', pwbd: false, consent: true });
    expect(ok.status).toBe(200);
    expect(ok.body.sensitive).toMatchObject({ category: 'OBC_NCL', pwbd: false });

    const raw = await UserProfile.findOne({ userId: user.id }).select('+sensitiveEncrypted').lean();
    expect(raw?.sensitiveEncrypted).toBeTruthy();
    expect(raw?.sensitiveEncrypted).not.toContain('OBC');

    const read = await api().get('/api/v1/profile/sensitive').set(auth);
    expect(read.body.sensitive.category).toBe('OBC_NCL');

    expect((await api().delete('/api/v1/profile/sensitive').set(auth)).status).toBe(204);
    const after = await api().get('/api/v1/profile/sensitive').set(auth);
    expect(after.body.sensitive).toMatchObject({ category: null, consentGivenAt: null });
  });
});
