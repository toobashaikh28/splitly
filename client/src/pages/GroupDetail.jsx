import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Plus, Sparkles, Share2 } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [simplified, setSimplified] = useState(null);

  const load = () => api.get(`/groups/${id}`).then((res) => setData(res.data));

  useEffect(() => {
    load();
  }, [id]);

  const viewSimplified = async () => {
    const res = await api.get(`/settlements/group/${id}/simplify`);
    setSimplified(res.data);
  };

  if (!data) return <div className="p-8 text-ink/50">Loading...</div>;

  const { group, expenses, balances } = data;
  const inviteUrl = `${window.location.origin}/join/${group.inviteCode}`;

  return (
    <div className="max-w-4xl px-6 md:px-10 py-8 md:py-10">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-semibold text-2xl text-ink2">{group.name}</h1>
          <p className="text-sm text-ink/50">{group.category} · {group.members.length} members</p>
        </div>
        <button
          onClick={() => setShowInvite((s) => !s)}
          className="flex items-center gap-1.5 text-sm font-medium text-marigoldDark border border-marigold/40 rounded-sm px-3 py-1.5 hover:bg-marigold/10"
        >
          <Share2 size={14} /> Invite
        </button>
      </div>

      {showInvite && (
        <div className="bg-white border border-line rounded-md p-5 mb-8 flex flex-col items-center gap-3">
          <QRCodeSVG value={inviteUrl} size={140} fgColor="#1C3B36" />
          <p className="text-xs text-ink/50 break-all text-center">{inviteUrl}</p>
        </div>
      )}

      <div className="flex gap-3 mb-8">
        <Link
          to={`/groups/${id}/new-expense`}
          className="flex items-center gap-1.5 bg-ink2 text-white text-sm font-medium px-4 py-2 rounded-sm hover:bg-ink transition-colors"
        >
          <Plus size={16} /> Add expense
        </Link>
        <button
          onClick={viewSimplified}
          className="flex items-center gap-1.5 border border-line text-sm font-medium px-4 py-2 rounded-sm hover:border-marigold transition-colors"
        >
          <Sparkles size={16} className="text-marigoldDark" /> Simplify debts
        </button>
      </div>

      {simplified && (
        <div className="bg-owedSoft border border-owed/30 rounded-md p-4 mb-8">
          <p className="text-sm font-medium text-ink2 mb-2">
            {simplified.originalCount} debts can become {simplified.optimizedCount} payment
            {simplified.optimizedCount === 1 ? "" : "s"}
          </p>
          {simplified.optimized.map((s, i) => (
            <p key={i} className="text-sm text-ink/70 font-amount">
              {s.from} → {s.to}: Rs. {s.amount}
            </p>
          ))}
          {simplified.optimized.length === 0 && <p className="text-sm text-ink/60">Everyone's already settled up.</p>}
        </div>
      )}

      <section className="mb-8">
        <h2 className="font-display font-semibold text-ink2 mb-3">Balances</h2>
        <div className="bg-white border border-line rounded-md divide-y divide-dashed divide-line">
          {balances.map((b) => (
            <div key={b.user.id} className="p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-ink">
                @{b.user.username}
                {b.user.id === user?.id && <span className="text-ink/40"> (you)</span>}
              </span>
              <span className={`font-amount text-sm font-semibold ${b.net > 0 ? "text-owed" : b.net < 0 ? "text-owe" : "text-ink/40"}`}>
                {b.net > 0 ? `is owed Rs. ${b.net}` : b.net < 0 ? `owes Rs. ${Math.abs(b.net)}` : "settled up"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display font-semibold text-ink2 mb-3">Expenses</h2>
        <div className="flex flex-col gap-3">
          {expenses.map((e) => (
            <div key={e._id} className="bg-white border border-line rounded-md p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-ink">{e.merchant}</h3>
                <span className="font-amount text-sm font-semibold text-ink2">Rs. {e.total}</span>
              </div>
              <p className="text-xs text-ink/50">
                {e.category} · {new Date(e.createdAt).toLocaleDateString()} · {e.items.length} item
                {e.items.length === 1 ? "" : "s"}
              </p>
            </div>
          ))}
          {expenses.length === 0 && <p className="text-sm text-ink/50">No expenses yet — add the first one above.</p>}
        </div>
      </section>
    </div>
  );
}
