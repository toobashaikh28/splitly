import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../utils/errors.js";
import { pluralize } from "../utils/format.js";
import AuthLayout from "../components/AuthLayout.jsx";
import Alert from "../components/ui/Alert.jsx";
import Button from "../components/ui/Button.jsx";
import { Skeleton } from "../components/ui/States.jsx";

export default function JoinGroup() {
  const { inviteCode } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    api
      .get(`/groups/join/${inviteCode}`)
      .then((res) => setPreview(res.data))
      .catch(() => setError("This invite link isn't valid. Ask whoever sent it for a fresh one."));
  }, [inviteCode]);

  useEffect(() => {
    if (!loading && !user) {
      // send them to login, then bounce back here after
      navigate(`/login?redirect=${encodeURIComponent(`/join/${inviteCode}`)}`);
    }
  }, [loading, user]);

  const handleJoin = async () => {
    setJoinError("");
    setJoining(true);
    try {
      const res = await api.post(`/groups/join/${inviteCode}`);
      navigate(`/groups/${res.data.groupId}`);
    } catch (err) {
      setJoinError(errorMessage(err, "Couldn't join this group."));
      setJoining(false);
    }
  };

  return (
    <AuthLayout>
      {error ? (
        <>
          <h1 className="text-title font-semibold text-ink">Invite not found</h1>
          <p className="mt-1 text-body text-muted">{error}</p>
          <Button as={Link} to="/" variant="secondary" className="mt-8 w-full">
            Go to Splitly
          </Button>
        </>
      ) : !preview ? (
        <div role="status" aria-label="Loading invite" className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-6 h-10 w-full" />
        </div>
      ) : (
        <>
          <p className="eyebrow">You're invited</p>
          <h1 className="mt-2 break-words text-title font-semibold text-ink">Join {preview.name}</h1>
          <p className="mt-1 text-body text-muted">
            {preview.category} · {pluralize(preview.memberCount, "member")}
          </p>

          {joinError && (
            <Alert tone="error" className="mt-6">
              {joinError}
            </Alert>
          )}

          <div className="mt-8 flex flex-col gap-2">
            <Button variant="primary" onClick={handleJoin} loading={joining} className="w-full">
              {joining ? "Joining…" : "Join group"}
            </Button>
            <Button as={Link} to="/" variant="ghost" className="w-full">
              Not now
            </Button>
          </div>
        </>
      )}
    </AuthLayout>
  );
}
