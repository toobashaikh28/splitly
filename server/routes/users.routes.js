import express from "express";
import User from "../models/User.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect);

// GET /api/users/me
router.get("/me", async (req, res) => {
  const user = await User.findById(req.userId).select("-password").populate("friends", "username profile");
  res.json(user);
});

// GET /api/users/search?q=ali
router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length === 0) return res.json([]);

  const users = await User.find({
    username: { $regex: q.trim(), $options: "i" },
    _id: { $ne: req.userId },
  })
    .select("username profile")
    .limit(10);

  res.json(users);
});

// POST /api/users/friends/:userId  — add a friend, no approval needed
router.post("/friends/:userId", async (req, res) => {
  const { userId } = req.params;
  if (userId === req.userId) {
    return res.status(400).json({ message: "You can't add yourself as a friend" });
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) return res.status(404).json({ message: "User not found" });

  await User.findByIdAndUpdate(req.userId, { $addToSet: { friends: userId } });
  await User.findByIdAndUpdate(userId, { $addToSet: { friends: req.userId } });

  res.json({ message: `You and ${targetUser.username} are now friends` });
});

// GET /api/users/friends
router.get("/friends", async (req, res) => {
  const user = await User.findById(req.userId).populate("friends", "username profile");
  res.json(user.friends);
});

export default router;
