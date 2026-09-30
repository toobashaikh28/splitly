import Avatar from "./ui/Avatar.jsx";
import Amount from "./ui/Amount.jsx";

/** List of people with the net amount owed either way. */
export default function PersonBalances({ people, limit = 6 }) {
  return (
    <ul className="-my-1.5 divide-y divide-line">
      {people.slice(0, limit).map((p) => (
        <li key={p.username} className="flex items-center gap-3 py-2.5">
          <Avatar name={p.username} size="sm" />
          <span className="min-w-0 flex-1 truncate text-body text-ink">@{p.username}</span>
          <Amount value={Math.abs(p.net)} tone={p.net > 0 ? "owed" : "owe"} sign className="text-body font-medium" />
        </li>
      ))}
    </ul>
  );
}
