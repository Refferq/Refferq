import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HV_CURRENCY, HV_COMMISSION_RATE, HV_PAYOUT_FREQUENCY,
  calculateHvCommission, isEligibleCodSettlement, isCodFinanceWriteEnabled
} from '../src/lib/hv-egypt-finance.ts';

test('Egyptian settings are explicit', () => {
  assert.equal(HV_CURRENCY, 'EGP');
  assert.equal(HV_COMMISSION_RATE, 20);
  assert.equal(HV_PAYOUT_FREQUENCY, 'WEEKLY');
});
test('20% commission is calculated in piasters without float drift', () => {
  assert.equal(calculateHvCommission(100000), 20000);
  assert.equal(calculateHvCommission(75000), 15000);
  assert.equal(calculateHvCommission(101), 20);
  assert.throws(() => calculateHvCommission(-1));
  assert.throws(() => calculateHvCommission(1000.1));
});
test('COD eligibility requires delivery AND collection AND reconciliation', () => {
  const proof = { delivered: true, collected: true, reconciled: true, refunded: false, currency: 'EGP' };
  assert.equal(isEligibleCodSettlement(proof), true);
  for (const key of ['delivered','collected','reconciled']) {
    assert.equal(isEligibleCodSettlement({ ...proof, [key]: false }), false);
  }
  assert.equal(isEligibleCodSettlement({ ...proof, refunded: true }), false);
  assert.equal(isEligibleCodSettlement({ ...proof, currency: 'INR' }), false);
});
test('financial mutation endpoints remain explicitly disabled pending COD integration', () => {
  assert.equal(isCodFinanceWriteEnabled(), false);
});
