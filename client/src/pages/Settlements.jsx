import { useEffect, useState } from "react";
import api from "../api/axios.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Settlements() {
  const [data, setData] = useState(null);

  const load = () => api.get("/settlements/mine").then((res) => setData(res.data));

  useEffect(() => {
    load();
  }, []);

  const markPaid = async (id) => {
    await api.patch(`/settlements/${id}/mark-paid`);
    load();
  };

  const confirmPaid = async (id) => {
    await api.patch(`/settlements/${id}/confirm`);
    load();
  };

  if (!data) return <div className="p-8 text-ink/50">Loading...</div>;

  return (
    <div className="max-w-3xl px-6 md:px-10 py-8 md:py-10">
      <h1 className="font-display font-semibold text-2xl text-ink2 mb-8">Settle up</h1>

      <section className="mb-10">
        <h2 className="font-display font-semibold text-ink2 mb-3">
          You owe <span className="font-amount text-owe">Rs. {data.totalOwed}</span>
        </h2>
        <div className="flex flex-col gap-3">
          {data.owe.map((s) => (
            <div key={s._id} className="bg-white border border-line rounded-md p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">To @{s.to.username}</p>
                <p className="text-xs text-ink/50">{s.group?.name}</p>
              </div>
              <div className="text-right flex flex-col items-end gap-1.5">
                <span className="font-amount text-sm font-semibold text-owe">Rs. {s.amount}</span>
                {s.status === "pending" ? (
                  <button
                    onClick={() => markPaid(s._id)}
                    className="text-xs font-medium bg-marigold text-ink2 px-3 py-1 rounded-full hover:bg-marigoldDark hover:text-white"
                  >
                    Mark as paid
                  </button>
                ) : (
                  <StatusBadge status={s.status} />
                )}
              </div>
            </div>
          ))}
          {data.owe.length === 0 && <p className="text-sm text-ink/50">Nothing pending. You're all clear.</p>}
        </div>
      </section>

      <section>
        <h2 className="font-display font-semibold text-ink2 mb-3">
          You're owed <span className="font-amount text-owed">Rs. {data.totalOwedToYou}</span>
        </h2>
        <div className="flex flex-col gap-3">
          {data.owed.map((s) => (
            <div key={s._id} className="bg-white border border-line rounded-md p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">From @{s.from.username}</p>
                <p className="text-xs text-ink/50">{s.group?.name}</p>
              </div>
              <div className="text-right flex flex-col items-end gap-1.5">
                <span className="font-amount text-sm font-semibold text-owed">Rs. {s.amount}</span>
                {s.status === "marked_paid" ? (
                  <button
                    onClick={() => confirmPaid(s._id)}
                    className="text-xs font-medium bg-owed text-white px-3 py-1 rounded-full hover:bg-owed/80"
                  >
                    Confirm received
                  </button>
                ) : (
                  <StatusBadge status={s.status} />
                )}
              </div>
            </div>
          ))}
          {data.owed.length === 0 && <p className="text-sm text-ink/50">No one owes you right now.</p>}
        </div>
      </section>
    </div>
  );
}
