import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: {
      type: String,
      enum: ["Food", "Travel", "Home", "Entertainment", "Education", "Project", "Shopping", "Health", "Other"],
      required: true,
    },
    amount: { type: Number, required: true },
    period: { type: String, enum: ["monthly"], default: "monthly" },
  },
  { timestamps: true }
);

budgetSchema.index({ user: 1, category: 1 }, { unique: true });

const Budget = mongoose.model("Budget", budgetSchema);
export default Budget;
