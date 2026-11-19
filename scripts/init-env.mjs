// Creates apps/api/.env from .env.example with freshly generated secrets (skips if it exists).
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const target = 'apps/api/.env';
if (existsSync(target)) {
  console.log(`${target} already exists, leaving it unchanged.`);
  process.exit(0);
}
const content = readFileSync('.env.example', 'utf8')
  .replace(/^JWT_ACCESS_SECRET=.*$/m, `JWT_ACCESS_SECRET=${randomBytes(48).toString('base64')}`)
  .replace(
    /^FIELD_ENCRYPTION_KEY=.*$/m,
    `FIELD_ENCRYPTION_KEY=${randomBytes(32).toString('base64')}`,
  );
writeFileSync(target, content);
console.log(`Created ${target} with generated secrets.`);
