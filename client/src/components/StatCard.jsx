export default function StatCard({ icon: Icon, label, value, tint }) {
  const tints = {
    purple: "bg-marigold/15 text-marigoldDark",
    red: "bg-oweSoft text-owe",
    green: "bg-owedSoft text-owed",
    blue: "bg-chart3/15 text-chart3",
  };

  return (
    <div className="bg-white border border-line rounded-md p-5">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${tints[tint] || tints.purple}`}>
        <Icon size={18} />
      </div>
      <p className="text-xs text-ink/50 mb-1">{label}</p>
      <p className="font-amount text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}
