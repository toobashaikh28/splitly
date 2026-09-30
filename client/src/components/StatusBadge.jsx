import Badge from "./ui/Badge.jsx";

// Amount colour already says who owes whom, so status stays neutral until
// something is waiting on someone (amber) or finished (green).
const STATUS = {
  pending: { tone: "neutral", label: "Pending" },
  marked_paid: { tone: "warning", label: "Awaiting confirmation" },
  cleared: { tone: "positive", label: "Cleared" },
};

export default function StatusBadge({ status }) {
  const { tone, label } = STATUS[status] || { tone: "neutral", label: status };
  return <Badge tone={tone}>{label}</Badge>;
}
