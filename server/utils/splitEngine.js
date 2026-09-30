/**
 * Calculates each person's share of a multi-item expense.
 *
 * items: [{ name, price, participants: [userId, ...] }]
 * taxPercent: number, e.g. 7 for 7%
 *
 * Returns:
 * {
 *   subtotal, taxAmount, total,
 *   perPersonShares: [{ user, itemsSubtotal, taxShare, total }]
 * }
 *
 * Tax is distributed proportionally to each person's subtotal share —
 * e.g. someone who ate 40% of the pre-tax bill pays 40% of the tax.
 */
export function calculateSplit(items, taxPercent = 0) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("At least one item is required");
  }

  const shareByUser = new Map(); // userId (string) -> itemsSubtotal

  let subtotal = 0;

  for (const item of items) {
    const { price, participants } = item;
    if (!participants || participants.length === 0) {
      throw new Error(`Item "${item.name}" has no participants assigned`);
    }
    if (typeof price !== "number" || price < 0) {
      throw new Error(`Item "${item.name}" has an invalid price`);
    }

    subtotal += price;
    const perPersonPrice = price / participants.length;

    for (const rawId of participants) {
      const id = String(rawId);
      shareByUser.set(id, (shareByUser.get(id) || 0) + perPersonPrice);
    }
  }

  const taxAmount = round2((subtotal * taxPercent) / 100);
  const total = round2(subtotal + taxAmount);

  const perPersonShares = Array.from(shareByUser.entries()).map(([user, itemsSubtotal]) => {
    const proportion = subtotal > 0 ? itemsSubtotal / subtotal : 0;
    const taxShare = round2(taxAmount * proportion);
    return {
      user,
      itemsSubtotal: round2(itemsSubtotal),
      taxShare,
      total: round2(itemsSubtotal + taxShare),
    };
  });

  return {
    subtotal: round2(subtotal),
    taxAmount,
    total,
    perPersonShares,
  };
}

function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
