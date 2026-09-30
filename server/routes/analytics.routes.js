import express from "express";
import Expense from "../models/Expense.js";
import Budget from "../models/Budget.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect);

// GET /api/analytics/overview — everything the dashboard's summary cards need in one call
router.get("/overview", async (req, res) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 6);
  startOfWeek.setHours(0, 0, 0, 0);

  const monthExpenses = await Expense.find({
    createdAt: { $gte: startOfMonth },
    "perPersonShares.user": req.userId,
  });

  const byCategory = {};
  let monthTotal = 0;
  let expenseCount = 0;

  for (const exp of monthExpenses) {
    const myShare = exp.perPersonShares.find((s) => String(s.user) === req.userId);
    if (!myShare) continue;
    monthTotal += myShare.total;
    expenseCount += 1;
    byCategory[exp.category] = (byCategory[exp.category] || 0) + myShare.total;
  }

  let weekTotal = 0;
  for (const exp of monthExpenses) {
    if (new Date(exp.createdAt) < startOfWeek) continue;
    const myShare = exp.perPersonShares.find((s) => String(s.user) === req.userId);
    if (myShare) weekTotal += myShare.total;
  }

  const topCategoryEntry = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  const avgPerExpense = expenseCount > 0 ? monthTotal / expenseCount : 0;

  // 7-day sparkline (same series used across the mini trend cards, like the reference dashboards)
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const dailyTotals = Object.fromEntries(days.map((d) => [d, 0]));
  for (const exp of monthExpenses) {
    const key = new Date(exp.createdAt).toISOString().slice(0, 10);
    if (!(key in dailyTotals)) continue;
    const myShare = exp.perPersonShares.find((s) => String(s.user) === req.userId);
    if (myShare) dailyTotals[key] += myShare.total;
  }
  const trend = days.map((d) => ({ value: round2(dailyTotals[d]) }));

  // Overall budget usage across all categories combined
  const budgets = await Budget.find({ user: req.userId });
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalBudgetSpent = budgets.reduce((sum, b) => sum + (byCategory[b.category] || 0), 0);
  const budgetUsedPercent = totalBudget > 0 ? Math.round((totalBudgetSpent / totalBudget) * 100) : 0;

  res.json({
    monthTotal: round2(monthTotal),
    weekTotal: round2(weekTotal),
    avgPerExpense: round2(avgPerExpense),
    topCategory: topCategoryEntry ? { name: topCategoryEntry[0], amount: round2(topCategoryEntry[1]) } : null,
    budgetUsedPercent,
    totalBudget: round2(totalBudget),
    totalBudgetSpent: round2(totalBudgetSpent),
    trend,
  });
});

// GET /api/analytics/category-breakdown — this month's spending by category, for the logged-in user's share only
router.get("/category-breakdown", async (req, res) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const expenses = await Expense.find({
    createdAt: { $gte: startOfMonth },
    "perPersonShares.user": req.userId,
  });

  const byCategory = {};
  for (const exp of expenses) {
    const myShare = exp.perPersonShares.find((s) => String(s.user) === req.userId);
    if (!myShare) continue;
    byCategory[exp.category] = round2((byCategory[exp.category] || 0) + myShare.total);
  }

  const result = Object.entries(byCategory).map(([category, amount]) => ({ category, amount }));
  res.json(result);
});

// GET /api/analytics/weekly — this user's spending for each of the last 7 days
router.get("/weekly", async (req, res) => {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  const startRange = days[0];

  const expenses = await Expense.find({
    createdAt: { $gte: startRange },
    "perPersonShares.user": req.userId,
  });

  const totalsByDay = days.map((d) => ({
    day: d.toLocaleDateString("en-US", { weekday: "short" }),
    date: d.toISOString().slice(0, 10),
    amount: 0,
  }));

  for (const exp of expenses) {
    const myShare = exp.perPersonShares.find((s) => String(s.user) === req.userId);
    if (!myShare) continue;
    const dateKey = new Date(exp.createdAt).toISOString().slice(0, 10);
    const bucket = totalsByDay.find((b) => b.date === dateKey);
    if (bucket) bucket.amount = round2(bucket.amount + myShare.total);
  }

  res.json(totalsByDay.map(({ day, amount }) => ({ day, amount })));
});

function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export default router;
