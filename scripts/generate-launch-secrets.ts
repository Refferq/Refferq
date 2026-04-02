import crypto from 'node:crypto';

function generateSecret(bytes = 48): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

function main() {
  const jwtSecret = generateSecret(48);
  const webhookSecret = generateSecret(48);

  console.log('Launch Secrets Template');
  console.log('Use these values in your staging/production environment variables.\n');

  console.log(`JWT_SECRET=${jwtSecret}`);
  console.log(`WEBHOOK_SECRET=${webhookSecret}\n`);

  console.log('Env Checklist (fill real values):');
  console.log('DATABASE_URL=postgresql://<user>:<pass>@<host>:5432/<db>?schema=public');
  console.log('NEXT_PUBLIC_APP_URL=https://<your-domain>');
  console.log('RESEND_API_KEY=re_...');
  console.log('RESEND_FROM_EMAIL=noreply@<your-domain>');
  console.log('TRACKING_ALLOWED_ORIGINS=https://<your-domain>,https://<other-origin>');
  console.log(`JWT_SECRET=${jwtSecret}`);
  console.log(`WEBHOOK_SECRET=${webhookSecret}\n`);

  console.log('After setting env vars run:');
  console.log('npm run launch:env:strict');
}

main();
