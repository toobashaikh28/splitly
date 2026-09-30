/**
 * Net position with each person, across all groups.
 * Positive = they owe you, negative = you owe them. Sorted by size.
 */
export function netByPerson(owe = [], owed = []) {
  const totals = new Map();
  const add = (name, delta) => {
    if (!name) return;
    totals.set(name, Math.round(((totals.get(name) || 0) + delta) * 100) / 100);
  };
  owe.forEach((s) => add(s.to?.username, -s.amount));
  owed.forEach((s) => add(s.from?.username, s.amount));
  return [...totals.entries()]
    .map(([username, net]) => ({ username, net }))
    .filter((p) => p.net !== 0)
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
}
