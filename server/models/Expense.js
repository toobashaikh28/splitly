import mongoose from "mongoose";

const expenseItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { _id: false }
);

const personShareSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    itemsSubtotal: { type: Number, required: true },
    taxShare: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    merchant: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Food", "Travel", "Home", "Entertainment", "Education", "Project", "Shopping", "Health", "Other"],
      default: "Food",
    },
    items: [expenseItemSchema],
    subtotal: { type: Number, required: true },
    taxPercent: { type: Number, default: 0 },
    taxAmount: { type: Number, required: true },
    total: { type: Number, required: true },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    perPersonShares: [personShareSchema],
    source: { type: String, enum: ["manual", "ai-scan"], default: "manual" },
  },
  { timestamps: true }
);

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;
