import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Receipt } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't log in. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Receipt size={26} className="text-marigoldDark" />
          <span className="font-display font-semibold text-2xl text-ink2">Splitly</span>
        </div>

        <div className="bg-white border border-line rounded-md p-6">
          <h1 className="font-display font-semibold text-lg text-ink2 mb-1">Welcome back</h1>
          <p className="text-sm text-ink/60 mb-6">Log in to see who owes what.</p>

          {error && <div className="bg-oweSoft text-owe text-sm rounded-sm px-3 py-2 mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-ink/80">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border border-line rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marigold"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink/80">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border border-line rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marigold"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-ink2 text-white rounded-sm py-2.5 text-sm font-medium hover:bg-ink transition-colors disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink/60 mt-4">
          New here?{" "}
          <Link to="/register" className="text-marigoldDark font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
