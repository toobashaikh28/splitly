import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, HandCoins, PiggyBank, Plus, Users2, ArrowRightLeft } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TrendCard from "../components/TrendCard.jsx";
import BudgetGauge from "../components/BudgetGauge.jsx";

const DONUT_COLORS = ["#6C5DD3", "#FF9F6B", "#4AC8E0", "#F4676B", "#FFC75A", "#34C77B"];

export default function Dashboard() {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState(null);
  const [groups, setGroups] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    api.get("/settlements/mine").then((res) => setSettlements(res.data));
    api.get("/groups").then((res) => setGroups(res.data));
    api.get("/analytics/category-breakdown").then((res) => setCategoryData(res.data));
    api.get("/analytics/weekly").then((res) => setWeeklyData(res.data));
    api.get("/analytics/overview").then((res) => setOverview(res.data));
  }, []);

  const monthTotal = categoryData.reduce((sum, c) => sum + c.amount, 0);
  const recentActivity = [...(settlements?.owe || []), ...(settlements?.owed || [])]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const trend = overview?.trend || [];

  return (
    <div className="max-w-6xl px-6 md:px-10 py-8 md:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-ink/50 mb-1">Good to see you,</p>
          <h1 className="font-display font-semibold text-2xl text-ink">@{user?.username}</h1>
        </div>

        {/* Pastel quick actions, Cairo-style */}
        <div className="flex gap-2">
          <Link to="/groups" className="flex items-center gap-1.5 bg-marigold/20 text-marigoldDark text-sm font-medium px-4 py-2 rounded-full hover:bg-marigold/30 transition-colors">
            <Plus size={15} /> Add expense
          </Link>
          <Link to="/settlements" className="flex items-center gap-1.5 bg-chart3/15 text-chart3 text-sm font-medium px-4 py-2 rounded-full hover:bg-chart3/25 transition-colors">
            <ArrowRightLeft size={15} /> Settle up
          </Link>
          <Link to="/friends" className="flex items-center gap-1.5 bg-owedSoft text-owed text-sm font-medium px-4 py-2 rounded-full hover:bg-owed/20 transition-colors">
            <Users2 size={15} /> Add friend
          </Link>
        </div>
      </div>

      {/* Hero stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Wallet} label="You owe" value={`Rs. ${settlements?.totalOwed?.toLocaleString() ?? "..."}`} tint="red" />
        <StatCard icon={HandCoins} label="You're owed" value={`Rs. ${settlements?.totalOwedToYou?.toLocaleString() ?? "..."}`} tint="green" />
        <StatCard icon={PiggyBank} label="This month's spending" value={`Rs. ${monthTotal.toLocaleString()}`} tint="purple" />
      </div>

      {/* Financial overview — mini trend cards, Cairo-style */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <TrendCard label="This week" value={`Rs. ${overview.weekTotal.toLocaleString()}`} data={trend} color="#6C5DD3" />
          <TrendCard label="This month" value={`Rs. ${overview.monthTotal.toLocaleString()}`} data={trend} color="#4AC8E0" />
          <TrendCard label="Avg per expense" value={`Rs. ${overview.avgPerExpense.toLocaleString()}`} data={trend} color="#FF9F6B" />
          <TrendCard
            label="Top category"
            value={overview.topCategory?.name || "—"}
            sublabel={overview.topCategory ? `Rs. ${overview.topCategory.amount.toLocaleString()}` : ""}
            data={trend}
            color="#34C77B"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-7 gap-4 mb-8">
        <div className="md:col-span-3 bg-white border border-line rounded-md p-5">
          <h2 className="font-display font-semibold text-ink mb-4">Spending this week</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8B87A8" }} />
              <Tooltip
                cursor={{ fill: "#F7F6FC" }}
                formatter={(value) => [`Rs. ${value}`, "Spent"]}
                contentStyle={{ borderRadius: 10, border: "1px solid #ECE9F7", fontSize: 13 }}
              />
              <Bar dataKey="amount" fill="#FF9F6B" radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="md:col-span-2 bg-white border border-line rounded-md p-5">
          <h2 className="font-display font-semibold text-ink mb-4">Spending overview</h2>
          {categoryData.length === 0 ? (
            <p className="text-sm text-ink/50">No expenses yet this month.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryData} dataKey="amount" nameKey="category" innerRadius={45} outerRadius={70} paddingAngle={3}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`Rs. ${value}`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 mt-2">
                {categoryData.map((c, i) => (
                  <div key={c.category} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-ink/70">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      {c.category}
                    </span>
                    <span className="font-amount text-ink/70">Rs. {c.amount}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="md:col-span-2 bg-white border border-line rounded-md p-5 flex flex-col items-center justify-center">
          <h2 className="font-display font-semibold text-ink self-start mb-4">Budget usage</h2>
          {overview && overview.totalBudget > 0 ? (
            <BudgetGauge percent={overview.budgetUsedPercent} totalBudget={overview.totalBudget} totalSpent={overview.totalBudgetSpent} />
          ) : (
            <p className="text-sm text-ink/50 text-center">
              No budgets set yet.{" "}
              <Link to="/budgets" className="text-marigoldDark font-medium">
                Set one
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Recent activity + groups */}
      <div className="grid md:grid-cols-5 gap-4">
        <div className="md:col-span-3 bg-white border border-line rounded-md p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-ink">Recent activity</h2>
            <Link to="/settlements" className="text-sm text-marigoldDark font-medium">View all</Link>
          </div>
          <div className="flex flex-col divide-y divide-line">
            {recentActivity.map((s) => {
              const isOwe = settlements.owe.some((o) => o._id === s._id);
              return (
                <div key={s._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{isOwe ? `To @${s.to.username}` : `From @${s.from.username}`}</p>
                    <p className="text-xs text-ink/50">{s.group?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-amount text-sm font-semibold ${isOwe ? "text-owe" : "text-owed"}`}>
                      {isOwe ? "-" : "+"} Rs. {s.amount}
                    </p>
                    <StatusBadge status={s.status} />
                  </div>
                </div>
              );
            })}
            {recentActivity.length === 0 && <p className="text-sm text-ink/50 py-2">Nothing yet.</p>}
          </div>
        </div>

        <div className="md:col-span-2 bg-white border border-line rounded-md p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-ink">Your groups</h2>
            <Link to="/groups" className="text-sm text-marigoldDark font-medium">See all</Link>
          </div>
          <div className="flex flex-col gap-2">
            {groups.slice(0, 5).map((g) => (
              <Link
                key={g._id}
                to={`/groups/${g._id}`}
                className="px-3 py-2.5 bg-paper rounded-sm text-sm font-medium text-ink hover:bg-marigold/10 transition-colors"
              >
                {g.name}
              </Link>
            ))}
            {groups.length === 0 && <p className="text-sm text-ink/50">No groups yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
