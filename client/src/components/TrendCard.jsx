import { LineChart, Line, ResponsiveContainer } from "recharts";

export default function TrendCard({ label, value, sublabel, data, color }) {
  return (
    <div className="bg-white border border-line rounded-md p-4">
      <p className="text-[11px] uppercase tracking-wide text-ink/40 mb-2">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="font-amount text-lg font-semibold text-ink">{value}</p>
          {sublabel && <p className="text-xs text-ink/45 mt-0.5">{sublabel}</p>}
        </div>
        <div className="w-16 h-8 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
