import { useEffect, useState } from "react";
import { Bell, Receipt, Clock, CheckCircle2, UserPlus } from "lucide-react";
import api from "../api/axios.js";

const ICONS = {
  new_expense: Receipt,
  payment_reminder: Clock,
  payment_marked_paid: Clock,
  payment_cleared: CheckCircle2,
  group_invite: UserPlus,
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  const load = () => api.get("/notifications").then((res) => setNotifications(res.data));

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    load();
  };

  return (
    <div className="max-w-3xl px-6 md:px-10 py-8 md:py-10">
      <h1 className="font-display font-semibold text-2xl text-ink2 mb-8">Notifications</h1>

      <div className="flex flex-col gap-2">
        {notifications.map((n) => {
          const Icon = ICONS[n.type] || Bell;
          return (
            <button
              key={n._id}
              onClick={() => !n.read && markRead(n._id)}
              className={`text-left flex items-start gap-3 p-4 rounded-md border transition-colors ${
                n.read ? "bg-white border-line" : "bg-marigold/10 border-marigold/30"
              }`}
            >
              <Icon size={18} className={n.read ? "text-ink/40 mt-0.5" : "text-marigoldDark mt-0.5"} />
              <div>
                <p className="text-sm text-ink">{n.message}</p>
                <p className="text-xs text-ink/40 mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </button>
          );
        })}
        {notifications.length === 0 && <p className="text-sm text-ink/50">Nothing yet.</p>}
      </div>
    </div>
  );
}
