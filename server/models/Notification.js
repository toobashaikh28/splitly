import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["new_expense", "payment_reminder", "payment_marked_paid", "payment_cleared", "group_invite"],
      required: true,
    },
    message: { type: String, required: true },
    relatedGroup: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    relatedSettlement: { type: mongoose.Schema.Types.ObjectId, ref: "Settlement" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
