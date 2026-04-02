type JsonValue = Record<string, unknown>;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function extractAuthTokenFromSetCookie(setCookie: string | null): string | null {
  if (!setCookie) {
    return null;
  }

  const tokenMatch = setCookie.match(/(?:^|,\s*)auth-token=([^;]+)/);
  return tokenMatch?.[1] ?? null;
}

async function postJson(
  url: string,
  body: JsonValue,
  headers: Record<string, string>
): Promise<{ status: number; json: any; headers: Headers }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

  const json = await response.json().catch(() => ({}));
  return { status: response.status, json, headers: response.headers };
}

async function main() {
  const baseUrl = requireEnv('STAGING_BASE_URL').replace(/\/$/, '');
  const trackingApiKey = requireEnv('STAGING_TRACKING_API_KEY');
  const referralCode = requireEnv('STAGING_REFERRAL_CODE');
  const adminUserId = process.env.STAGING_ADMIN_USER_ID?.trim();
  const adminAuthToken = process.env.STAGING_ADMIN_AUTH_TOKEN?.trim();
  const adminEmail = process.env.STAGING_ADMIN_EMAIL?.trim();
  const adminPassword = process.env.STAGING_ADMIN_PASSWORD?.trim();

  const suffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const orderId = `dryrun_order_${suffix}`;
  const customerEmail = `dryrun_${suffix}@example.com`;

  console.log('Staging dry run started');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Order ID: ${orderId}`);

  const conversionPayload = {
    referralCode,
    customerEmail,
    customerName: 'Dry Run Customer',
    amount: 1234.56,
    currency: 'USD',
    orderId,
    metadata: {
      source: 'staging-dry-run',
      runId: suffix,
    },
  };

  const first = await postJson(
    `${baseUrl}/api/track/conversion`,
    conversionPayload,
    { 'x-api-key': trackingApiKey }
  );

  if (first.status !== 200 || first.json?.success !== true) {
    throw new Error(
      `First conversion call failed: status=${first.status}, body=${JSON.stringify(first.json)}`
    );
  }
  console.log('✓ First conversion accepted');

  const second = await postJson(
    `${baseUrl}/api/track/conversion`,
    conversionPayload,
    { 'x-api-key': trackingApiKey }
  );

  if (second.status !== 200 || second.json?.success !== true || second.json?.idempotent !== true) {
    throw new Error(
      `Second conversion call did not behave idempotently: status=${second.status}, body=${JSON.stringify(second.json)}`
    );
  }
  console.log('✓ Duplicate conversion correctly treated as idempotent');

  if (adminUserId) {
    let resolvedAuthToken: string | null = adminAuthToken || null;

    if (!resolvedAuthToken && adminEmail && adminPassword) {
      const loginResult = await postJson(
        `${baseUrl}/api/auth/login`,
        { email: adminEmail, password: adminPassword },
        {}
      );

      if (loginResult.status !== 200 || loginResult.json?.success !== true) {
        throw new Error(
          `Admin login failed: status=${loginResult.status}, body=${JSON.stringify(loginResult.json)}`
        );
      }

      resolvedAuthToken = extractAuthTokenFromSetCookie(
        loginResult.headers.get('set-cookie')
      );

      if (!resolvedAuthToken) {
        throw new Error(
          'Admin login succeeded but auth-token cookie is missing in Set-Cookie header'
        );
      }
    }

    const adminHeaders: Record<string, string> = {};
    if (resolvedAuthToken) {
      adminHeaders.Cookie = `auth-token=${resolvedAuthToken}`;
    } else {
      adminHeaders['x-user-id'] = adminUserId;
    }

    const autoPayoutDryRun = await postJson(
      `${baseUrl}/api/admin/payouts/auto`,
      { dryRun: true },
      adminHeaders
    );

    if (autoPayoutDryRun.status !== 200 || autoPayoutDryRun.json?.success !== true) {
      throw new Error(
        `Auto payout dry run failed: status=${autoPayoutDryRun.status}, body=${JSON.stringify(autoPayoutDryRun.json)}. If middleware enforces auth-token, pass STAGING_ADMIN_AUTH_TOKEN or STAGING_ADMIN_EMAIL/STAGING_ADMIN_PASSWORD.`
      );
    }
    console.log('✓ Auto payout dry run endpoint responded successfully');
  } else {
    console.log('i Skipped auto payout dry run (STAGING_ADMIN_USER_ID not provided)');
  }

  console.log('✅ Staging dry run completed successfully');
}

main().catch((error) => {
  console.error('❌ Staging dry run failed');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
