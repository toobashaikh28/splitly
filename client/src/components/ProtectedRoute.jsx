import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { PageSpinner } from "./ui/States.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  // Remember where they were headed so login can send them back.
  if (!user) {
    const target = location.pathname + location.search;
    return <Navigate to={target === "/" ? "/login" : `/login?redirect=${encodeURIComponent(target)}`} replace />;
  }

  return children;
}
