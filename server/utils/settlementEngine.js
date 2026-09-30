/**
 * Given per-person shares and who paid, generates a list of
 * { from, to, amount } settlements — everyone except the payer owes the payer.
 */
export function generateSettlementsFromExpense(perPersonShares, paidByUserId) {
  const paidBy = String(paidByUserId);
  const settlements = [];

  for (const share of perPersonShares) {
    const userId = String(share.user);
    if (userId === paidBy) continue;
    if (share.total <= 0) continue;
    settlements.push({ from: userId, to: paidBy, amount: share.total });
  }

  return settlements;
}

/**
 * Debt simplification ("Simplify debts" / settlement optimization).
 *
 * Input: array of { from, to, amount } representing raw debts in a group
 * (can include multiple debts between the same pair, and circular chains).
 *
 * Output: the minimum set of { from, to, amount } transactions that
 * achieves the same net balances.
 *
 * Algorithm: compute each person's net balance (positive = owed money,
 * negative = owes money), then greedily match the largest debtor with
 * the largest creditor until all balances are zero.
 */
export function simplifyDebts(rawSettlements) {
  const net = new Map(); // userId -> net balance

  for (const { from, to, amount } of rawSettlements) {
    net.set(from, (net.get(from) || 0) - amount);
    net.set(to, (net.get(to) || 0) + amount);
  }

  // Round to avoid floating point dust, drop anyone who nets to ~0
  const balances = Array.from(net.entries())
    .map(([user, balance]) => ({ user, balance: round2(balance) }))
    .filter((b) => Math.abs(b.balance) > 0.01);

  const debtors = balances.filter((b) => b.balance < 0).map((b) => ({ ...b }));
  const creditors = balances.filter((b) => b.balance > 0).map((b) => ({ ...b }));

  const result = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(-debtor.balance, creditor.balance);

    if (amount > 0.01) {
      result.push({ from: debtor.user, to: creditor.user, amount: round2(amount) });
    }

    debtor.balance += amount;
    creditor.balance -= amount;

    if (Math.abs(debtor.balance) < 0.01) i++;
    if (Math.abs(creditor.balance) < 0.01) j++;
  }

  return result;
}

function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
