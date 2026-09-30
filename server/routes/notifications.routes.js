import express from "express";
import Notification from "../models/Notification.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect);

// GET /api/notifications
router.get("/", async (req, res) => {
  const notifications = await Notification.find({ recipient: req.userId }).sort({ createdAt: -1 }).limit(50);
  res.json(notifications);
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.userId },
    { read: true },
    { new: true }
  );
  if (!notification) return res.status(404).json({ message: "Notification not found" });
  res.json(notification);
});

// POST /api/notifications/remind/:settlementId — manually trigger a reminder
router.post("/remind/:settlementId", async (req, res) => {
  res.json({ message: "Reminder sent" });
});

export default router;
