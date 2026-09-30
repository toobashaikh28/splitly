import Badge from "./ui/Badge.jsx";

// Amount colour already says who owes whom, so status stays neutral until
// something is waiting on someone (amber) or finished (green).
const STATUS = {
  pending: { tone: "neutral", label: "Pending" },
  marked_paid: { tone: "warning", label: "Awaiting confirmation" },
  cleared: { tone: "positive", label: "Cleared" },
};

// When we know which side of the payment the viewer is on, say whose move it is.
const BY_DIRECTION = {
  owe: {
    pending: "To pay",
    marked_paid: "Awaiting confirmation", // you paid, they confirm
  },
  owed: {
    pending: "Waiting for payment",
    marked_paid: "Needs your confirmation", // they paid, you confirm
  },
};

export default function StatusBadge({ status, direction }) {
  const base = STATUS[status] || { tone: "neutral", label: status };
  const label = BY_DIRECTION[direction]?.[status] || base.label;
  return <Badge tone={base.tone}>{label}</Badge>;
}
