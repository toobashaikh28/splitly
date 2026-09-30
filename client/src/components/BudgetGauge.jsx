import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

export default function BudgetGauge({ percent, totalBudget, totalSpent }) {
  const clamped = Math.min(percent, 100);
  const color = percent > 100 ? "#F4676B" : percent > 85 ? "#FFC75A" : "#4AC8E0";

  const data = [{ value: clamped, fill: color }];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[150px] h-[150px]">
        <RadialBarChart
          width={150}
          height={150}
          cx="50%"
          cy="50%"
          innerRadius="72%"
          outerRadius="100%"
          barSize={12}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background={{ fill: "#ECE9F7" }} dataKey="value" cornerRadius={20} />
        </RadialBarChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-semibold text-2xl text-ink">{percent}%</span>
          <span className="text-[11px] text-ink/45">of budget used</span>
        </div>
      </div>
      {totalBudget != null && (
        <p className="text-xs text-ink/50 mt-1">
          Rs. {totalSpent?.toLocaleString()} / {totalBudget?.toLocaleString()}
        </p>
      )}
    </div>
  );
}
