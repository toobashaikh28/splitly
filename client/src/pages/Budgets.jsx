import { useState } from "react";
import { Plus, PiggyBank } from "lucide-react";
import api from "../api/axios.js";
import useResource from "../hooks/useResource.js";
import { CATEGORIES } from "../utils/categories.js";
import { errorMessage } from "../utils/errors.js";
import { formatMoney } from "../utils/format.js";
import { Page, PageHeader, PageColumns, Panel, AsidePanel, StatList, Stat } from "../components/ui/Page.jsx";
import Button from "../components/ui/Button.jsx";
import Alert from "../components/ui/Alert.jsx";
import Amount from "../components/ui/Amount.jsx";
import { Input, Select } from "../components/ui/Field.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import { EmptyState, ErrorState, ListSkeleton } from "../components/ui/States.jsx";

function daysLeftInMonth() {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return last - now.getDate() + 1; // today still counts
}

function Summary({ budgets, unbudgeted, onSet }) {
  const totalBudget = budgets.reduce((n, b) => n + b.amount, 0);
  const totalSpent = budgets.reduce((n, b) => n + b.spent, 0);
  const remaining = totalBudget - totalSpent;
  const percent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const over = budgets.filter((b) => b.overBudget);
  const days = daysLeftInMonth();

  return (
    <>
      {budgets.length > 0 && (
        <AsidePanel title="This month">
          <p className="text-figure font-semibold text-ink">{percent}%</p>
          <p className="mb-3 text-small text-muted">of your total budget used</p>
          <ProgressBar percent={percent} overBudget={totalSpent > totalBudget} label="Total budget used this month" />
          <div className="my-4 border-t border-dashed border-line-strong" />
          <StatList>
            <Stat label="Budgeted">{formatMoney(totalBudget)}</Stat>
            <Stat label="Spent">{formatMoney(totalSpent)}</Stat>
            <Stat label={remaining < 0 ? "Over by" : "Left"} emphasis>
              {remaining < 0 ? <Amount value={Math.abs(remaining)} tone="owe" /> : formatMoney(remaining)}
            </Stat>
          </StatList>
          {remaining > 0 && (
            <p className="mt-4 text-small text-muted">
              {days === 1
                ? "Today is the last day of the month."
                : `About ${formatMoney(Math.floor(remaining / days))} a day for the next ${days} days.`}
            </p>
          )}
          {over.length > 0 && (
            <p className="mt-4 text-small font-medium text-negative">
              Over budget: {over.map((b) => b.category).join(", ")}
            </p>
          )}
        </AsidePanel>
      )}

      {unbudgeted.length > 0 && (
        <AsidePanel title="Spending without a budget">
          <ul className="-my-1.5 divide-y divide-line">
            {unbudgeted.map((c) => (
              <li key={c.category} className="flex items-center gap-3 py-2.5 text-body">
                <span className="min-w-0 flex-1 truncate text-ink">{c.category}</span>
                <span className="tnum text-muted">{formatMoney(c.amount)}</span>
                <button
                  type="button"
                  onClick={() => onSet(c.category)}
                  aria-label={`Set a budget for ${c.category}`}
                  className="rounded-control text-small font-medium text-primary hover:underline"
                >
                  Set
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-small text-subtle">Your share this month, in categories with no limit yet.</p>
        </AsidePanel>
      )}

      <p className="px-1 text-small text-subtle">
        Budgets reset each month and count your share of group expenses, not the full bill.
      </p>
    </>
  );
}

export default function Budgets() {
  const { data: budgets, error, loading, reload } = useResource("/budgets");
  const categorySpend = useResource("/analytics/category-breakdown");
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const openForm = (prefill) => {
    setCategory(prefill?.category || "Food");
    setAmount(prefill ? String(prefill.amount) : "");
    setFormError("");
    setShowForm(true);
    window.scrollTo?.({ top: 0, behavior: "smooth" });
  };
  const closeForm = () => {
    setShowForm(false);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      await api.post("/budgets", { category, amount: parseFloat(amount) });
      setAmount("");
      setShowForm(false);
      reload();
    } catch (err) {
      setFormError(errorMessage(err, "Couldn't save that budget. Try again."));
    } finally {
      setSaving(false);
    }
  };

  const hasExisting = budgets?.some((b) => b.category === category);
  const unbudgeted = budgets
    ? [...(categorySpend.data || [])]
        .filter((c) => c.amount > 0 && !budgets.some((b) => b.category === c.category))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
    : [];

  return (
    <Page width="wide">
      <PageHeader
        className="max-w-form xl:max-w-none"
        title="Budgets"
        description="Monthly limits by category. Spending counts your share of group expenses."
        actions={
          !showForm && (
            <Button variant="primary" icon={Plus} onClick={() => openForm()}>
              Set budget
            </Button>
          )
        }
      />

      <PageColumns aside={budgets ? <Summary budgets={budgets} unbudgeted={unbudgeted} onSet={(c) => openForm({ category: c, amount: "" })} /> : null}>
      {showForm && (
        <Panel padded className="mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <h2 className="text-heading font-semibold text-ink">Set a monthly budget</h2>
            {formError && <Alert tone="error">{formError}</Alert>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                hint={hasExisting ? "This category already has a budget. Saving replaces it." : undefined}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
              <Input
                label="Monthly limit"
                required
                autoFocus
                type="number"
                step="1"
                min="1"
                inputMode="numeric"
                prefix="Rs."
                inputClassName="tnum"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="20000"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" loading={saving}>
                {saving ? "Saving…" : "Save budget"}
              </Button>
              <Button variant="ghost" onClick={closeForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {loading ? (
        <ListSkeleton rows={3} />
      ) : error && !budgets ? (
        <ErrorState message={error} onRetry={reload} />
      ) : budgets.length === 0 ? (
        !showForm && (
          <EmptyState
            icon={PiggyBank}
            title="No budgets yet"
            description="Set a monthly limit for a category like Food or Travel to see how much of it you've used."
            action={
              <Button variant="primary" icon={Plus} onClick={() => openForm()}>
                Set your first budget
              </Button>
            }
          />
        )
      ) : (
        <Panel className="divide-y divide-line">
          {budgets.map((b) => {
            const remaining = b.amount - b.spent;
            return (
              <div key={b.id} className="px-4 py-4 sm:px-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="text-body font-medium text-ink">{b.category}</h2>
                  <p className="tnum text-body text-muted">
                    <span className="font-medium text-ink">{formatMoney(b.spent)}</span> of {formatMoney(b.amount)}
                  </p>
                </div>
                <div className="mt-3">
                  <ProgressBar percent={b.percent} overBudget={b.overBudget} label={`${b.category} budget used`} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-4 text-small">
                  <span className={b.overBudget ? "font-medium text-negative" : "text-muted"}>
                    {b.overBudget ? (
                      <>Over by <Amount value={Math.abs(remaining)} tone="owe" /></>
                    ) : (
                      <>{formatMoney(remaining)} left · {b.percent}% used</>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => openForm(b)}
                    aria-label={`Edit ${b.category} budget`}
                    className="rounded-control font-medium text-primary hover:underline"
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </Panel>
      )}
      </PageColumns>
    </Page>
  );
}
