export default function ProgressBar({ percent, overBudget }) {
  const clamped = Math.min(percent, 100);
  return (
    <div className="w-full h-2 rounded-full bg-line overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${overBudget ? "bg-owe" : "bg-marigold"}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
