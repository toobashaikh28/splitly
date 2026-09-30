import express from "express";
import Budget from "../models/Budget.js";
import Expense from "../models/Expense.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect);

// POST /api/budgets — create or update a category budget
router.post("/", async (req, res) => {
  const { category, amount } = req.body;
  if (!category || amount == null) {
    return res.status(400).json({ message: "category and amount are required" });
  }

  const budget = await Budget.findOneAndUpdate(
    { user: req.userId, category },
    { amount },
    { upsert: true, new: true }
  );

  res.json(budget);
});

// GET /api/budgets — all budgets with current month's spend per category
router.get("/", async (req, res) => {
  const budgets = await Budget.find({ user: req.userId });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Spend = sum of this user's perPersonShares.total across expenses this month,
  // grouped by category, for expenses in any group this user belongs to.
  const expenses = await Expense.find({
    createdAt: { $gte: startOfMonth },
    "perPersonShares.user": req.userId,
  });

  const spendByCategory = {};
  for (const exp of expenses) {
    const myShare = exp.perPersonShares.find((s) => String(s.user) === req.userId);
    if (!myShare) continue;
    spendByCategory[exp.category] = (spendByCategory[exp.category] || 0) + myShare.total;
  }

  const result = budgets.map((b) => {
    const spent = round2(spendByCategory[b.category] || 0);
    return {
      id: b._id,
      category: b.category,
      amount: b.amount,
      spent,
      percent: b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0,
      overBudget: spent > b.amount,
    };
  });

  res.json(result);
});

function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export default router;
