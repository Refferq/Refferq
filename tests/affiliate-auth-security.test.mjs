import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAffiliateEmail, hashOtp, canApproveAffiliate, canBootstrapFirstAdmin } from '../src/lib/affiliate-auth-policy.ts';

test('email normalization removes surrounding whitespace and case differences', () => {
  assert.equal(normalizeAffiliateEmail('  Example@HerbalVitaly.COM '), 'example@herbalvitaly.com');
});
test('OTP storage hash does not contain the numeric verification code', () => {
  const h = hashOtp('Test@Example.COM', '123456', 'secret');
  assert.match(h, /^[a-f0-9]{64}$/);
  assert.ok(!h.includes('123456'));
});
test('OTP hash is tied to normalized email, code, and signing key', () => {
  const first = hashOtp('test@example.com', '123456', 'secret');
  assert.equal(first, hashOtp('TEST@EXAMPLE.COM', '123456', 'secret'));
  assert.notEqual(first, hashOtp('different@example.com', '123456', 'secret'));
  assert.notEqual(first, hashOtp('test@example.com', '123457', 'secret'));
  assert.notEqual(first, hashOtp('test@example.com', '123456', 'other-secret'));
});
test('approval is only possible for verified affiliate emails', () => {
  const now = new Date();
  assert.equal(canApproveAffiliate('AFFILIATE', now), true);
  assert.equal(canApproveAffiliate('AFFILIATE', null), false);
  assert.equal(canApproveAffiliate('ADMIN', now), false);
  assert.equal(canApproveAffiliate('AFFILIATE', 'not-a-date'), false);
});

test('admin bootstrap requires an explicitly enabled Preview with a single allowlisted email', () => {
  const input = {
    email: '  OWNER@EXAMPLE.COM ', allowlist: 'manager@example.com, owner@example.com ',
    environment: 'preview', enabled: 'true', existingAdminCount: 0,
  };
  assert.equal(canBootstrapFirstAdmin(input), true);
  assert.equal(canBootstrapFirstAdmin({ ...input, email: 'stranger@example.com' }), false);
  assert.equal(canBootstrapFirstAdmin({ ...input, environment: 'production' }), false);
  assert.equal(canBootstrapFirstAdmin({ ...input, enabled: 'false' }), false);
  assert.equal(canBootstrapFirstAdmin({ ...input, existingAdminCount: 1 }), false);
});
