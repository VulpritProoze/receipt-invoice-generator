/**
 * Next.js Instrumentation Hook
 *
 * Called once when the server worker boots (both in dev and production).
 * Logs the runtime environment configuration so issues with missing or
 * misconfigured env vars are visible immediately in Vercel Function logs.
 *
 * Sensitive values (UPSTASH_REDIS_REST_TOKEN, NEXTAUTH_SECRET,
 * ADMIN_PASSWORD) are partially masked — only the first 4 characters
 * are shown so you can confirm a value is present and correct without
 * leaking the full secret.
 */

function mask(value: string | undefined, visible = 4): string {
  if (!value) return '(not set)';
  if (value.length <= visible) return '****';
  return value.slice(0, visible) + '*'.repeat(Math.min(value.length - visible, 8)) + '…';
}

function present(value: string | undefined): string {
  return value ? '✓ set' : '✗ NOT SET';
}

export async function register() {
  // Only emit on the Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'edge') return;

  const useRedis = process.env.USE_REDIS;
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const nodeEnv = process.env.NODE_ENV;

  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║          BillGen — Runtime Environment Check         ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  NODE_ENV            : ${nodeEnv ?? '(not set)'}`);
  console.log(`  NEXT_RUNTIME        : ${process.env.NEXT_RUNTIME ?? 'nodejs'}`);
  console.log('');
  console.log('  — Database —');
  console.log(`  USE_REDIS           : ${useRedis ?? '(not set)'} ${useRedis === 'true' ? '← Redis mode' : '← SQLite mode'}`);
  console.log(`  UPSTASH_REDIS_URL   : ${redisUrl ? redisUrl.replace(/\/\/.*@/, '//***@') : '(not set)'}`);
  console.log(`  UPSTASH_REDIS_TOKEN : ${mask(redisToken)}`);
  console.log('');
  console.log('  — Auth —');
  console.log(`  NEXTAUTH_URL        : ${nextAuthUrl ?? '(not set)'}`);
  console.log(`  NEXTAUTH_SECRET     : ${mask(nextAuthSecret)}`);
  console.log(`  ADMIN_EMAIL         : ${adminEmail ?? '(not set)'}`);
  console.log(`  ADMIN_PASSWORD      : ${mask(adminPassword)}`);
  console.log('');

  // Warn about common misconfigurations
  if (useRedis === 'true' && (!redisUrl || !redisToken)) {
    console.warn(
      '⚠️  USE_REDIS=true but UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing!'
    );
    console.warn('   All data operations will fail. Add the missing vars in Vercel → Settings → Environment Variables.');
  }

  if (!nextAuthSecret) {
    console.warn('⚠️  NEXTAUTH_SECRET is not set — authentication will fail in production!');
  }

  if (!adminEmail || !adminPassword) {
    console.warn('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD is not set — login will be impossible!');
  }

  console.log(`  ${present(useRedis)} USE_REDIS | ${present(redisUrl)} REDIS_URL | ${present(redisToken)} REDIS_TOKEN | ${present(nextAuthSecret)} NEXTAUTH_SECRET`);
  console.log('══════════════════════════════════════════════════════════');
  console.log('');
}
