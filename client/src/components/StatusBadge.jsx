const STYLES = {
  pending: "bg-oweSoft text-owe",
  marked_paid: "bg-marigold/15 text-marigoldDark",
  cleared: "bg-owedSoft text-owed",
};

const LABELS = {
  pending: "Pending",
  marked_paid: "Marked paid",
  cleared: "Cleared",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STYLES[status] || STYLES.pending}`}>
      {LABELS[status] || status}
    </span>
  );
}
