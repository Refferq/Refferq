import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeCommissionRuleType,
  normalizeProgramSettingsPatch,
} from '../src/lib/program-settings-validation';

test('normalizeCommissionRuleType: maps legacy FLAT to FIXED', () => {
  assert.equal(normalizeCommissionRuleType('FLAT'), 'FIXED');
  assert.equal(normalizeCommissionRuleType('fixed'), 'FIXED');
  assert.equal(normalizeCommissionRuleType('PERCENTAGE'), 'PERCENTAGE');
  assert.equal(normalizeCommissionRuleType('something-else'), null);
});

test('normalizeProgramSettingsPatch: maps aliases and normalizes values', () => {
  const { data, errors } = normalizeProgramSettingsPatch({
    productName: 'StudioSlow',
    currency: 'rub',
    websiteUrl: 'https://studioslow.ru',
    minimumPayout: '120000',
    payoutFrequency: 'monthly',
    autoApprove: 'false',
  });

  assert.deepEqual(errors, []);
  assert.equal(data.productName, 'StudioSlow');
  assert.equal(data.currency, 'RUB');
  assert.equal(data.websiteUrl, 'https://studioslow.ru');
  assert.equal(data.minimumPayoutThreshold, 120000);
  assert.equal(data.minPayoutCents, 120000);
  assert.equal(data.payoutFrequency, 'MONTHLY');
  assert.equal(data.autoApprovePayouts, false);
});

test('normalizeProgramSettingsPatch: mirrors minPayoutCents to minimumPayoutThreshold', () => {
  const { data, errors } = normalizeProgramSettingsPatch({
    minPayoutCents: 150000,
  });

  assert.deepEqual(errors, []);
  assert.equal(data.minPayoutCents, 150000);
  assert.equal(data.minimumPayoutThreshold, 150000);
});

test('normalizeProgramSettingsPatch: validates invalid values', () => {
  const { errors } = normalizeProgramSettingsPatch({
    websiteUrl: 'ftp://studioslow.ru',
    currency: 'ruble',
    commissionHoldDays: -1,
    minPayoutCents: -5,
    autoApprovePayouts: 'maybe',
  });

  assert.equal(errors.length >= 4, true);
});
