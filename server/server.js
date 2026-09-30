import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import groupsRoutes from "./routes/groups.routes.js";
import expensesRoutes from "./routes/expenses.routes.js";
import settlementsRoutes from "./routes/settlements.routes.js";
import budgetsRoutes from "./routes/budgets.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Connect to the database on demand and wait for it, so it also works where
// the server is paused between requests (Vercel).
let dbReady;
app.use(async (req, res, next) => {
  try {
    dbReady = dbReady || connectDB();
    await dbReady;
    next();
  } catch (err) {
    dbReady = null;
    next(err);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/groups", groupsRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/settlements", settlementsRoutes);
app.use("/api/budgets", budgetsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});

const PORT = process.env.PORT || 5000;

// On Vercel the app runs on demand, so it must not open a port there.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  // On your own computer, connect straight away like before.
  dbReady = connectDB();
}

export default app;