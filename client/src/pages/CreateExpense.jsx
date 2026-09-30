import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Trash2, Upload, Loader2 } from "lucide-react";
import api from "../api/axios.js";

const CATEGORIES = ["Food", "Travel", "Home", "Entertainment", "Education", "Project", "Shopping", "Health", "Other"];

export default function CreateExpense() {
  const { id: groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("Food");
  const [taxPercent, setTaxPercent] = useState(0);
  const [paidBy, setPaidBy] = useState("");
  const [items, setItems] = useState([{ name: "", price: "", participants: [] }]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/groups/${groupId}`).then((res) => {
      setGroup(res.data.group);
      setPaidBy(res.data.group.members[0]?._id || "");
    });
  }, [groupId]);

  const addItem = () => setItems([...items, { name: "", price: "", participants: [] }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    const next = [...items];
    next[i][field] = value;
    setItems(next);
  };
  const toggleParticipant = (i, memberId) => {
    const next = [...items];
    const has = next[i].participants.includes(memberId);
    next[i].participants = has
      ? next[i].participants.filter((p) => p !== memberId)
      : [...next[i].participants, memberId];
    setItems(next);
  };

  const subtotal = items.reduce((sum, it) => sum + (parseFloat(it.price) || 0), 0);
  const taxAmount = (subtotal * (parseFloat(taxPercent) || 0)) / 100;
  const total = subtotal + taxAmount;

  const handleScan = async (file) => {
    setScanning(true);
    setScanError("");
    try {
      const formData = new FormData();
      formData.append("receipt", file);
      const res = await api.post("/ai/scan-receipt", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.merchant) setMerchant(res.data.merchant);
      if (res.data.taxPercent) setTaxPercent(res.data.taxPercent);
      if (res.data.items?.length > 0) {
        setItems(res.data.items.map((it) => ({ name: it.name, price: it.price, participants: [] })));
      } else {
        setScanError("Couldn't read any items from that receipt — try manual entry below.");
      }
    } catch (err) {
      setScanError(err.response?.data?.message || "AI scan failed — try manual entry below.");
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        groupId,
        merchant,
        category,
        taxPercent: parseFloat(taxPercent) || 0,
        paidBy,
        items: items.map((it) => ({ name: it.name, price: parseFloat(it.price) || 0, participants: it.participants })),
      };
      await api.post("/expenses", payload);
      navigate(`/groups/${groupId}`);
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't create the expense");
    } finally {
      setSubmitting(false);
    }
  };

  if (!group) return <div className="p-8 text-ink/50">Loading...</div>;

  return (
    <div className="max-w-3xl px-6 md:px-10 py-8 md:py-10">
      <h1 className="font-display font-semibold text-2xl text-ink2 mb-1">Add expense</h1>
      <p className="text-sm text-ink/50 mb-8">{group.name}</p>

      {/* AI scan */}
      <div className="bg-white border border-dashed border-line rounded-md p-5 mb-8 text-center">
        <label className="flex flex-col items-center gap-2 cursor-pointer">
          {scanning ? (
            <Loader2 size={22} className="animate-spin text-marigoldDark" />
          ) : (
            <Upload size={22} className="text-marigoldDark" />
          )}
          <span className="text-sm font-medium text-ink">
            {scanning ? "Reading your receipt..." : "Scan a receipt to auto-fill items"}
          </span>
          <span className="text-xs text-ink/50">or fill in the form below manually</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={scanning}
            onChange={(e) => e.target.files[0] && handleScan(e.target.files[0])}
          />
        </label>
        {scanError && <p className="text-xs text-owe mt-3">{scanError}</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-ink/80">Merchant</label>
            <input
              required
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Coconet Grove"
              className="mt-1 w-full border border-line rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marigold"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink/80">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full border border-line rounded-sm px-3 py-2 text-sm bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-ink/80">Items</label>
            <button type="button" onClick={addItem} className="text-sm font-medium text-marigoldDark flex items-center gap-1">
              <Plus size={14} /> Add item
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {items.map((item, i) => (
              <div key={i} className="bg-white border border-line rounded-md p-4">
                <div className="flex gap-3 mb-3">
                  <input
                    required
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => updateItem(i, "name", e.target.value)}
                    className="flex-1 border border-line rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marigold"
                  />
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={item.price}
                    onChange={(e) => updateItem(i, "price", e.target.value)}
                    className="w-28 border border-line rounded-sm px-3 py-2 text-sm font-amount focus:outline-none focus:ring-2 focus:ring-marigold"
                  />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-ink/40 hover:text-owe">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-ink/50 mb-1.5">Split between:</p>
                <div className="flex flex-wrap gap-2">
                  {group.members.map((m) => (
                    <button
                      type="button"
                      key={m._id}
                      onClick={() => toggleParticipant(i, m._id)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        item.participants.includes(m._id)
                          ? "bg-marigold border-marigold text-ink2 font-medium"
                          : "border-line text-ink/60"
                      }`}
                    >
                      @{m.username}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-ink/80">Tax %</label>
            <input
              type="number"
              step="0.1"
              value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)}
              className="mt-1 w-full border border-line rounded-sm px-3 py-2 text-sm font-amount focus:outline-none focus:ring-2 focus:ring-marigold"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink/80">Who paid?</label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="mt-1 w-full border border-line rounded-sm px-3 py-2 text-sm bg-white"
            >
              {group.members.map((m) => (
                <option key={m._id} value={m._id}>
                  @{m.username}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live totals preview */}
        <div className="bg-white border border-line rounded-md p-4">
          <div className="flex justify-between text-sm text-ink/70 ledger-divider pb-2 mb-2">
            <span>Subtotal</span>
            <span className="font-amount">Rs. {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-ink/70 ledger-divider pb-2 mb-2">
            <span>Tax ({taxPercent || 0}%)</span>
            <span className="font-amount">Rs. {taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-ink2">
            <span>Total</span>
            <span className="font-amount">Rs. {total.toFixed(2)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-ink2 text-white rounded-sm py-3 text-sm font-medium hover:bg-ink transition-colors disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Confirm expense"}
        </button>
      </form>
    </div>
  );
}
