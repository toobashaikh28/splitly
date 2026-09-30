import { useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../utils/errors.js";
import { safeRedirect } from "../utils/format.js";
import { emailError, newPasswordError, normalizeUsername, usernameError, PASSWORD_MIN } from "../utils/validate.js";
import AuthLayout from "../components/AuthLayout.jsx";
import PasswordStrength from "../components/PasswordStrength.jsx";
import Alert from "../components/ui/Alert.jsx";
import Button from "../components/ui/Button.jsx";
import { Input, PasswordInput } from "../components/ui/Field.jsx";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const refs = { username: useRef(null), email: useRef(null), password: useRef(null) };
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const redirect = safeRedirect(params.get("redirect"));
  const carry = redirect === "/" ? "" : `?redirect=${encodeURIComponent(redirect)}`;
  const invited = redirect.startsWith("/join/");

  const errors = {
    username: usernameError(username),
    email: emailError(email),
    password: newPasswordError(password),
  };
  const shown = (field) => (submitted || touched[field] ? errors[field] : "");
  const touch = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

  const handle = normalizeUsername(username);
  const usernameHint = !errors.username ? `You'll appear as @${handle}.` : "Friends find you by this. Letters, numbers, . and _";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitted(true);
    const firstBad = ["username", "email", "password"].find((f) => errors[f]);
    if (firstBad) return refs[firstBad].current?.focus();

    setLoading(true);
    try {
      await register(handle, email.trim(), password);
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(errorMessage(err, "Couldn't create your account. Try again in a moment."));
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-title font-semibold text-ink">Create your account</h1>
      <p className="mt-1 text-body text-muted">It takes a minute. Then add friends and start splitting.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">
        {invited && <Alert tone="info">You've been invited to a group. Create an account to join it.</Alert>}
        {error && <Alert tone="error">{error}</Alert>}
        <Input
          ref={refs.username}
          label="Username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onBlur={touch("username")}
          placeholder="ali123"
          hint={usernameHint}
          error={shown("username")}
        />
        <Input
          ref={refs.email}
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
        <div>
          <PasswordInput
            ref={refs.password}
            label="Password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={touch("password")}
            hint={`At least ${PASSWORD_MIN} characters.`}
            error={shown("password")}
          />
          <PasswordStrength password={password} />
        </div>
        <Button type="submit" variant="primary" loading={loading} className="mt-2 w-full">
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-body text-muted">
        Already have an account?{" "}
        <Link to={`/login${carry}`} className="rounded-control font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
