import type { UserDTO } from '@careerradar/shared';
import type { UserAttrs } from '../../models';
import type { Types } from 'mongoose';

type UserLike = UserAttrs & { _id: Types.ObjectId; createdAt: Date };

export function toUserDTO(user: UserLike): UserDTO {
  return {
    id: String(user._id),
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: !!user.emailVerifiedAt,
    createdAt: user.createdAt.toISOString(),
    notificationPrefs: user.notificationPrefs as UserDTO['notificationPrefs'],
  };
}
