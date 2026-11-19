import type { Role, UserStatus } from './enums';
import type { NotificationPrefs, SensitiveProfileInput } from './schemas';
import type { z } from 'zod';
import type { profileSchema } from './schemas';

export interface UserDTO {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
  notificationPrefs: NotificationPrefs;
}

export type ProfileDTO = z.output<typeof profileSchema> & {
  id: string;
  userId: string;
  totalExperienceMonths: number;
  profileVersion: number;
  completeness: number;
  updatedAt: string;
};

export type SensitiveProfileDTO = SensitiveProfileInput & { consentGivenAt: string | null };

export interface AuthResponse {
  accessToken: string;
  user: UserDTO;
}

export interface DashboardSummary {
  lastUpdatedAt: string | null;
  jobs: {
    active: number;
    newThisWeek: number;
    matchingProfile: number | null;
    closingSoon: number;
    government: number;
    private: number;
  };
  applications: { total: number; byStatus: Record<string, number> } | null;
  latestTechUpdates: unknown[];
  latestNews: unknown[];
  profileCompleteness: number | null;
  /** Modules whose data pipelines are not built yet; UI shows them as upcoming. */
  pendingModules: string[];
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}
