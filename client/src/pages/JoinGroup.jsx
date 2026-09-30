import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Receipt } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function JoinGroup() {
  const { inviteCode } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    api
      .get(`/groups/join/${inviteCode}`)
      .then((res) => setPreview(res.data))
      .catch(() => setError("This invite link isn't valid."));
  }, [inviteCode]);

  useEffect(() => {
    if (!loading && !user) {
      // send them to login, then bounce back here after
      navigate(`/login?redirect=/join/${inviteCode}`);
    }
  }, [loading, user]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await api.post(`/groups/join/${inviteCode}`);
      navigate(`/groups/${res.data.groupId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't join this group.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm bg-white border border-line rounded-md p-6 text-center">
        <Receipt size={26} className="text-marigoldDark mx-auto mb-4" />
        {error && <p className="text-sm text-owe">{error}</p>}
        {!error && !preview && <p className="text-sm text-ink/50">Loading invite...</p>}
        {!error && preview && (
          <>
            <h1 className="font-display font-semibold text-lg text-ink2 mb-1">Join {preview.name}?</h1>
            <p className="text-sm text-ink/60 mb-6">
              {preview.category} · {preview.memberCount} member{preview.memberCount === 1 ? "" : "s"}
            </p>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-ink2 text-white rounded-sm py-2.5 text-sm font-medium hover:bg-ink transition-colors disabled:opacity-60"
            >
              {joining ? "Joining..." : "Join group"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
