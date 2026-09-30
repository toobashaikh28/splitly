import mongoose from "mongoose";
import { nanoid } from "nanoid";

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Food", "Travel", "Home", "Entertainment", "Education", "Project", "Shopping", "Health", "Other"],
      default: "Other",
    },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    inviteCode: { type: String, unique: true, default: () => nanoid(10) },
  },
  { timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);
export default Group;
