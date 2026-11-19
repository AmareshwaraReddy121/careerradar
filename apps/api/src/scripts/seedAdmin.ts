import { passwordSchema, emailSchema } from '@careerradar/shared';
import { env } from '../config/env';
import { connectDb, disconnectDb } from '../lib/db';
import { User, UserProfile } from '../models';
import { hashPassword } from '../modules/auth/auth.service';

/** Creates or promotes the admin account from ADMIN_EMAIL / ADMIN_PASSWORD. */
async function main() {
  const email = emailSchema.parse(process.env.ADMIN_EMAIL);
  const password = passwordSchema.parse(process.env.ADMIN_PASSWORD);
  await connectDb(env.MONGODB_URI);

  let user = await User.findOne({ email });
  if (user) {
    user.role = 'admin';
    user.status = 'active';
    await user.save();
    console.log(`Promoted existing user ${email} to admin`);
  } else {
    user = await User.create({
      email,
      passwordHash: await hashPassword(password),
      role: 'admin',
      emailVerifiedAt: new Date(),
      consents: [{ type: 'terms_privacy', version: '2026-11', grantedAt: new Date() }],
    });
    await UserProfile.create({ userId: user._id, fullName: 'Administrator' });
    console.log(`Created admin ${email}`);
  }
  await disconnectDb();
}

main().catch(async (err) => {
  console.error(err instanceof Error ? err.message : err);
  await disconnectDb();
  process.exit(1);
});
