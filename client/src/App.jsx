import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Groups from "./pages/Groups.jsx";
import GroupDetail from "./pages/GroupDetail.jsx";
import CreateExpense from "./pages/CreateExpense.jsx";
import Friends from "./pages/Friends.jsx";
import Settlements from "./pages/Settlements.jsx";
import Budgets from "./pages/Budgets.jsx";
import Notifications from "./pages/Notifications.jsx";
import JoinGroup from "./pages/JoinGroup.jsx";

function Protected({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/join/:inviteCode" element={<JoinGroup />} />

        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/groups" element={<Protected><Groups /></Protected>} />
        <Route path="/groups/:id" element={<Protected><GroupDetail /></Protected>} />
        <Route path="/groups/:id/new-expense" element={<Protected><CreateExpense /></Protected>} />
        <Route path="/friends" element={<Protected><Friends /></Protected>} />
        <Route path="/settlements" element={<Protected><Settlements /></Protected>} />
        <Route path="/budgets" element={<Protected><Budgets /></Protected>} />
        <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
      </Routes>
    </AuthProvider>
  );
}
