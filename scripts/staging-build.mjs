import { execFileSync } from 'node:child_process';

// One-time staging bootstrap. This file must not be merged into production.
if (process.env.VERCEL_ENV !== 'preview' ||
    process.env.VERCEL_GIT_COMMIT_REF !== 'fix/hv-staging-security-20261029') {
  console.error('Aborted: bootstrap is authorized only for Herbal Vitaly staging preview.');
  process.exit(1);
}
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  console.error('Missing staging environment variables.');
  process.exit(1);
}
for (const [command, args] of [
  ['npx', ['prisma', 'generate']],
  ['npx', ['prisma', 'db', 'push']],
  ['npm', ['run', 'build']],
]) {
  const result = execFileSync(command, args, { stdio: 'inherit', env: process.env });
}
