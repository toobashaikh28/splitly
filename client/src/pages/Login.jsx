import { useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../utils/errors.js";
import { safeRedirect } from "../utils/format.js";
import { emailError } from "../utils/validate.js";
import AuthLayout from "../components/AuthLayout.jsx";
import Alert from "../components/ui/Alert.jsx";
import Button from "../components/ui/Button.jsx";
import { Input, PasswordInput } from "../components/ui/Field.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Invite links send signed-out people here; bring them back afterwards.
  const redirect = safeRedirect(params.get("redirect"));
  const carry = redirect === "/" ? "" : `?redirect=${encodeURIComponent(redirect)}`;
  const invited = redirect.startsWith("/join/");

  const errors = {
    email: emailError(email),
    password: password ? "" : "Enter your password.",
  };
  const shown = (field) => (submitted || touched[field] ? errors[field] : "");
  const touch = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitted(true);
    if (errors.email) return emailRef.current?.focus();
    if (errors.password) return passwordRef.current?.focus();

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(
        err?.response?.status === 401
          ? "That email and password don't match. Check them and try again."
          : errorMessage(err, "Couldn't log in. Try again in a moment.")
      );
      setLoading(false);
      passwordRef.current?.select();
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-title font-semibold text-ink">Log in</h1>
      <p className="mt-1 text-body text-muted">Welcome back. Pick up where you left off.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">
        {invited && <Alert tone="info">You've been invited to a group. Log in to join it.</Alert>}
        {error && <Alert tone="error">{error}</Alert>}
        <Input
          ref={emailRef}
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={touch("email")}
          error={shown("email")}
        />
        <PasswordInput
          ref={passwordRef}
          label="Password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={touch("password")}
          error={shown("password")}
        />
        <Button type="submit" variant="primary" loading={loading} className="mt-2 w-full">
          {loading ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-body text-muted">
        New to Splitly?{" "}
        <Link to={`/register${carry}`} className="rounded-control font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
