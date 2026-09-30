// Maps each expense category to a distinct pastel color for tags/badges,
// so browsing groups/expenses has visual variety instead of everything
// reading as the same flat gray or the same purple.
const CATEGORY_STYLES = {
  Food: "bg-marigold/15 text-marigoldDark",
  Travel: "bg-chart3/15 text-chart3",
  Home: "bg-owed/15 text-owed",
  Entertainment: "bg-chart4/15 text-chart4",
  Education: "bg-ink2/15 text-ink2",
  Project: "bg-chart5/25 text-marigoldDark",
  Shopping: "bg-owe/15 text-owe",
  Health: "bg-chart3/25 text-chart3",
  Other: "bg-line text-ink/50",
};

export function categoryTagClass(category) {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.Other;
}
