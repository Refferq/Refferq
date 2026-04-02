import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAutoPayoutPlan } from '../src/lib/payout-planning';

test('buildAutoPayoutPlan: returns payable affiliate when approved amount and balance are valid', () => {
  const result = buildAutoPayoutPlan(
    [
      {
        id: 'aff_1',
        balanceCents: 25000,
        user: {
          id: 'user_1',
          name: 'Alice',
          email: 'alice@example.com',
        },
        commissions: [
          { id: 'com_1', amountCents: 10000 },
          { id: 'com_2', amountCents: 11000 },
        ],
      },
    ],
    20000
  );

  assert.equal(result.payable.length, 1);
  assert.equal(result.payable[0]?.approvedAmountCents, 21000);
  assert.deepEqual(result.payable[0]?.commissionIds, ['com_1', 'com_2']);
  assert.equal(result.skipped.length, 0);
});

test('buildAutoPayoutPlan: skips affiliate when approved total is below threshold', () => {
  const result = buildAutoPayoutPlan(
    [
      {
        id: 'aff_2',
        balanceCents: 50000,
        user: {
          id: 'user_2',
          name: 'Bob',
          email: 'bob@example.com',
        },
        commissions: [{ id: 'com_3', amountCents: 15000 }],
      },
    ],
    20000
  );

  assert.equal(result.payable.length, 0);
  assert.equal(result.skipped.length, 1);
  assert.equal(result.skipped[0]?.reason, 'BELOW_MIN_PAYOUT_THRESHOLD');
});

test('buildAutoPayoutPlan: skips affiliate when approved total is higher than current balance', () => {
  const result = buildAutoPayoutPlan(
    [
      {
        id: 'aff_3',
        balanceCents: 10000,
        user: {
          id: 'user_3',
          name: 'Charlie',
          email: 'charlie@example.com',
        },
        commissions: [{ id: 'com_4', amountCents: 12000 }],
      },
    ],
    5000
  );

  assert.equal(result.payable.length, 0);
  assert.equal(result.skipped[0]?.reason, 'INSUFFICIENT_BALANCE');
});
