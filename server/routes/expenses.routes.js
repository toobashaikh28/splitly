import express from "express";
import Expense from "../models/Expense.js";
import Settlement from "../models/Settlement.js";
import Group from "../models/Group.js";
import Notification from "../models/Notification.js";
import protect from "../middleware/auth.middleware.js";
import { calculateSplit } from "../utils/splitEngine.js";
import { generateSettlementsFromExpense } from "../utils/settlementEngine.js";

const router = express.Router();
router.use(protect);

// POST /api/expenses
// body: { groupId, merchant, category, items: [{name, price, participants}], taxPercent, paidBy, source }
router.post("/", async (req, res) => {
  try {
    const { groupId, merchant, category, items, taxPercent = 0, paidBy, source = "manual" } = req.body;

    if (!groupId || !merchant || !items || !paidBy) {
      return res.status(400).json({ message: "groupId, merchant, items, and paidBy are required" });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.members.map(String).includes(req.userId)) {
      return res.status(403).json({ message: "You're not a member of this group" });
    }

    const { subtotal, taxAmount, total, perPersonShares } = calculateSplit(items, taxPercent);

    const expense = await Expense.create({
      group: groupId,
      createdBy: req.userId,
      merchant,
      category: category || "Food",
      items,
      subtotal,
      taxPercent,
      taxAmount,
      total,
      paidBy,
      perPersonShares,
      source,
    });

    const rawSettlements = generateSettlementsFromExpense(perPersonShares, paidBy);
    const createdSettlements = await Settlement.insertMany(
      rawSettlements.map((s) => ({ ...s, group: groupId, expense: expense._id }))
    );

    // Notify everyone in the settlement except the payer
    const notifications = createdSettlements.map((s) => ({
      recipient: s.from,
      type: "new_expense",
      message: `${merchant}: you owe Rs. ${s.amount} — added by a group member`,
      relatedGroup: groupId,
      relatedSettlement: s._id,
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);

    res.status(201).json({ expense, settlements: createdSettlements });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message || "Server error creating expense" });
  }
});

// GET /api/expenses/group/:groupId
router.get("/group/:groupId", async (req, res) => {
  const expenses = await Expense.find({ group: req.params.groupId }).sort({ createdAt: -1 });
  res.json(expenses);
});

export default router;
