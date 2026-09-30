import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import api from "../api/axios.js";
import ProgressBar from "../components/ProgressBar.jsx";

const CATEGORIES = ["Food", "Travel", "Home", "Entertainment", "Education", "Project", "Shopping", "Health", "Other"];

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => api.get("/budgets").then((res) => setBudgets(res.data));

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/budgets", { category, amount: parseFloat(amount) });
      setAmount("");
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl px-6 md:px-10 py-8 md:py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-semibold text-2xl text-ink2">Budgets</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 bg-ink2 text-white text-sm font-medium px-4 py-2 rounded-sm hover:bg-ink transition-colors"
        >
          <Plus size={16} /> Set budget
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-line rounded-md p-5 mb-8 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-ink/80">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full border border-line rounded-sm px-3 py-2 text-sm bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-ink/80">Monthly budget (Rs.)</label>
            <input
              required
              type="number"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="20000"
              className="mt-1 w-full border border-line rounded-sm px-3 py-2 text-sm font-amount focus:outline-none focus:ring-2 focus:ring-marigold"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="self-start bg-marigold text-ink2 font-medium text-sm px-5 py-2 rounded-sm hover:bg-marigoldDark hover:text-white transition-colors disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save budget"}
          </button>
        </form>
      )}

      <div className="flex flex-col gap-4">
        {budgets.map((b) => (
          <div key={b.id} className="bg-white border border-line rounded-md p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-ink">{b.category}</span>
              <span className="font-amount text-sm text-ink/70">
                Rs. {b.spent} / {b.amount}
              </span>
            </div>
            <ProgressBar percent={b.percent} overBudget={b.overBudget} />
            {b.overBudget && <p className="text-xs text-owe mt-1.5">Over budget by Rs. {(b.spent - b.amount).toFixed(2)}</p>}
          </div>
        ))}
        {budgets.length === 0 && !showForm && (
          <p className="text-sm text-ink/50">No budgets set yet — set one above to start tracking.</p>
        )}
      </div>
    </div>
  );
}
