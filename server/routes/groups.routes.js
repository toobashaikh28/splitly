import express from "express";
import mongoose from "mongoose";
import Group from "../models/Group.js";
import Expense from "../models/Expense.js";
import Settlement from "../models/Settlement.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect);

// POST /api/groups
router.post("/", async (req, res) => {
  try {
    const { name, category, memberIds = [] } = req.body;
    if (!name) return res.status(400).json({ message: "Group name is required" });

    const members = Array.from(new Set([req.userId, ...memberIds]));

    const group = await Group.create({
      name,
      category: category || "Other",
      creator: req.userId,
      members,
    });

    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error creating group" });
  }
});

// GET /api/groups — groups the logged-in user belongs to
router.get("/", async (req, res) => {
  const groups = await Group.find({ members: req.userId }).populate("members", "username profile");
  res.json(groups);
});

// GET /api/groups/:id — group detail with balances
router.get("/:id", async (req, res) => {
  const group = await Group.findById(req.params.id).populate("members", "username profile");
  if (!group) return res.status(404).json({ message: "Group not found" });
  if (!group.members.some((m) => String(m._id) === req.userId)) {
    return res.status(403).json({ message: "You're not a member of this group" });
  }

  const expenses = await Expense.find({ group: group._id }).sort({ createdAt: -1 });
  const settlements = await Settlement.find({ group: group._id }).populate("from to", "username");

  // Net balance per member (positive = is owed money, negative = owes money)
  const netByUser = new Map();
  for (const m of group.members) netByUser.set(String(m._id), 0);

  for (const s of settlements) {
    if (s.status === "cleared") continue;
    const fromId = String(s.from._id);
    const toId = String(s.to._id);
    netByUser.set(fromId, (netByUser.get(fromId) || 0) - s.amount);
    netByUser.set(toId, (netByUser.get(toId) || 0) + s.amount);
  }

  const balances = group.members.map((m) => ({
    user: { id: m._id, username: m.username },
    net: round2(netByUser.get(String(m._id)) || 0),
  }));

  res.json({ group, expenses, settlements, balances });
});

// POST /api/groups/:id/members — add a member directly (no approval)
router.post("/:id/members", async (req, res) => {
  const { userId } = req.body;
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ message: "Group not found" });

  if (!group.members.map(String).includes(req.userId)) {
    return res.status(403).json({ message: "You're not a member of this group" });
  }

  group.members.addToSet(userId);
  await group.save();
  res.json(group);
});

// GET /api/groups/join/:inviteCode — preview a group before joining
router.get("/join/:inviteCode", async (req, res) => {
  const group = await Group.findOne({ inviteCode: req.params.inviteCode }).populate("members", "username");
  if (!group) return res.status(404).json({ message: "Invalid invite link" });
  res.json({ id: group._id, name: group.name, category: group.category, memberCount: group.members.length });
});

// POST /api/groups/join/:inviteCode — actually join
router.post("/join/:inviteCode", async (req, res) => {
  const group = await Group.findOne({ inviteCode: req.params.inviteCode });
  if (!group) return res.status(404).json({ message: "Invalid invite link" });

  group.members.addToSet(req.userId);
  await group.save();
  res.json({ message: `Joined ${group.name}`, groupId: group._id });
});

function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export default router;
