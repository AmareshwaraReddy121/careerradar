import { randomBytes } from 'node:crypto';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-test-access-secret-0000';
process.env.FIELD_ENCRYPTION_KEY = randomBytes(32).toString('base64');
process.env.WEB_ORIGIN = 'http://localhost:5173';
delete process.env.SMTP_URL;

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const { connectDb } = await import('../src/lib/db');
  await connectDb(mongo.getUri('careerradar-test'));
  const models = await import('../src/models');
  await Promise.all(
    Object.values(models)
      .filter((m) => typeof m === 'function' && 'syncIndexes' in m)
      .map((m) => (m as { syncIndexes: () => Promise<unknown> }).syncIndexes()),
  );
});

afterEach(async () => {
  const mongoose = (await import('mongoose')).default;
  const cols = await mongoose.connection.db!.collections();
  await Promise.all(cols.map((c) => c.deleteMany({})));
  const { mailer, MemoryMailer } = await import('../src/lib/mailer');
  if (mailer instanceof MemoryMailer) mailer.sent = [];
});

afterAll(async () => {
  const { disconnectDb } = await import('../src/lib/db');
  await disconnectDb();
  await mongo?.stop();
});
