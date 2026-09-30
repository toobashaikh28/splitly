import express from "express";
import Settlement from "../models/Settlement.js";
import Notification from "../models/Notification.js";
import protect from "../middleware/auth.middleware.js";
import { simplifyDebts } from "../utils/settlementEngine.js";

const router = express.Router();
router.use(protect);

// GET /api/settlements/mine — everything the logged-in user owes or is owed
router.get("/mine", async (req, res) => {
  const owe = await Settlement.find({ from: req.userId, status: { $ne: "cleared" } })
    .populate("to", "username")
    .populate("group", "name")
    .sort({ createdAt: -1 });

  const owed = await Settlement.find({ to: req.userId, status: { $ne: "cleared" } })
    .populate("from", "username")
    .populate("group", "name")
    .sort({ createdAt: -1 });

  const totalOwed = owe.reduce((sum, s) => sum + s.amount, 0);
  const totalOwedToYou = owed.reduce((sum, s) => sum + s.amount, 0);

  res.json({ owe, owed, totalOwed: round2(totalOwed), totalOwedToYou: round2(totalOwedToYou) });
});

// PATCH /api/settlements/:id/mark-paid — debtor marks it paid
router.patch("/:id/mark-paid", async (req, res) => {
  const settlement = await Settlement.findById(req.params.id);
  if (!settlement) return res.status(404).json({ message: "Settlement not found" });
  if (String(settlement.from) !== req.userId) {
    return res.status(403).json({ message: "Only the person who owes this can mark it as paid" });
  }

  settlement.status = "marked_paid";
  await settlement.save();

  await Notification.create({
    recipient: settlement.to,
    type: "payment_marked_paid",
    message: `Rs. ${settlement.amount} was marked as paid — confirm to clear it`,
    relatedGroup: settlement.group,
    relatedSettlement: settlement._id,
  });

  res.json(settlement);
});

// PATCH /api/settlements/:id/confirm — creditor confirms, clearing the debt
router.patch("/:id/confirm", async (req, res) => {
  const settlement = await Settlement.findById(req.params.id);
  if (!settlement) return res.status(404).json({ message: "Settlement not found" });
  if (String(settlement.to) !== req.userId) {
    return res.status(403).json({ message: "Only the person owed this can confirm it" });
  }
  if (settlement.status !== "marked_paid") {
    return res.status(400).json({ message: "This settlement hasn't been marked as paid yet" });
  }

  settlement.status = "cleared";
  settlement.clearedAt = new Date();
  await settlement.save();

  await Notification.create({
    recipient: settlement.from,
    type: "payment_cleared",
    message: `Your Rs. ${settlement.amount} payment was confirmed and cleared`,
    relatedGroup: settlement.group,
    relatedSettlement: settlement._id,
  });

  res.json(settlement);
});

// GET /api/settlements/group/:groupId/simplify — preview optimized settlements
router.get("/group/:groupId/simplify", async (req, res) => {
  const pending = await Settlement.find({ group: req.params.groupId, status: { $ne: "cleared" } });
  const raw = pending.map((s) => ({ from: String(s.from), to: String(s.to), amount: s.amount }));
  const optimized = simplifyDebts(raw);
  res.json({ originalCount: pending.length, optimizedCount: optimized.length, optimized });
});

function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export default router;
