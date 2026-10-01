import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Plus, Trash2, Upload, ScanLine } from "lucide-react";
import api from "../api/axios.js";
import useResource from "../hooks/useResource.js";
import { useAuth } from "../context/AuthContext.jsx";
import { CATEGORIES } from "../utils/categories.js";
import { errorMessage } from "../utils/errors.js";
import { formatMoneyExact } from "../utils/format.js";
import { cn } from "../utils/cn.js";
import { shrinkImage } from "../utils/image.js";
import { Page, PageHeader, Section, Panel } from "../components/ui/Page.jsx";
import Button from "../components/ui/Button.jsx";
import Alert from "../components/ui/Alert.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { Input, Select } from "../components/ui/Field.jsx";
import ToggleChip from "../components/ui/ToggleChip.jsx";
import { ErrorState, Skeleton } from "../components/ui/States.jsx";

// Stable keys let rows be removed without inputs swapping contents.
let nextItemId = 1;
const newItem = (fields = {}) => ({ uid: nextItemId++, name: "", price: "", participants: [], ...fields });

export default function CreateExpense() {
  const { id: groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, error: loadError, loading, reload } = useResource(`/groups/${groupId}`);
  const group = data?.group;

  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("Food");
  const [taxPercent, setTaxPercent] = useState(0);
  const [paidBy, setPaidBy] = useState("");
  const [items, setItems] = useState(() => [newItem()]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanNote, setScanNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showItemErrors, setShowItemErrors] = useState(false);
  const errorRef = useRef(null);

  // Default the payer to you (if you're in the group), otherwise the first member.
  const defaultPayer = group ? (group.members.some((m) => m._id === user?.id) ? user.id : group.members[0]?._id || "") : "";
  const effectivePaidBy = paidBy || defaultPayer;

  useEffect(() => {
    if (submitError) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [submitError]);

  const addItem = () => setItems((prev) => [...prev, newItem()]);
  const removeItem = (uid) => setItems((prev) => prev.filter((it) => it.uid !== uid));
  const updateItem = (uid, field, value) =>
    setItems((prev) => prev.map((it) => (it.uid === uid ? { ...it, [field]: value } : it)));
  const toggleParticipant = (uid, memberId) =>
    setItems((prev) =>
      prev.map((it) =>
        it.uid !== uid
          ? it
          : {
              ...it,
              participants: it.participants.includes(memberId)
                ? it.participants.filter((p) => p !== memberId)
                : [...it.participants, memberId],
            }
      )
    );
  const toggleEveryone = (uid) =>
    setItems((prev) =>
      prev.map((it) => {
        if (it.uid !== uid) return it;
        const everyone = group.members.length > 0 && it.participants.length === group.members.length;
        return { ...it, participants: everyone ? [] : group.members.map((m) => m._id) };
      })
    );

  const subtotal = items.reduce((sum, it) => sum + (parseFloat(it.price) || 0), 0);
  const taxAmount = (subtotal * (parseFloat(taxPercent) || 0)) / 100;
  const total = subtotal + taxAmount;

  const handleScan = async (file) => {
    setScanning(true);
    setScanError("");
    setScanNote("");
    try {
      const formData = new FormData();
      formData.append("receipt", await shrinkImage(file));
      const res = await api.post("/ai/scan-receipt", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.merchant) setMerchant(res.data.merchant);
      if (res.data.taxPercent) setTaxPercent(res.data.taxPercent);
      if (res.data.items?.length > 0) {
        setItems(res.data.items.map((it) => newItem({ name: it.name, price: it.price })));
        setScanNote(`Filled in ${res.data.items.length} ${res.data.items.length === 1 ? "item" : "items"}. Check them, then choose who had each one.`);
      } else {
        setScanError("Couldn't read any items from that receipt. You can enter them by hand below.");
      }
    } catch (err) {
      setScanError(errorMessage(err, "The scan didn't work. You can enter the items by hand below."));
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    // The server rejects items nobody is assigned to, so catch it here with a clear message.
    if (items.some((it) => it.participants.length === 0)) {
      setShowItemErrors(true);
      setSubmitError("Choose at least one person for every item.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        groupId,
        merchant,
        category,
        taxPercent: parseFloat(taxPercent) || 0,
        paidBy: effectivePaidBy,
        items: items.map((it) => ({ name: it.name, price: parseFloat(it.price) || 0, participants: it.participants })),
      };
      await api.post("/expenses", payload);
      navigate(`/groups/${groupId}`);
    } catch (err) {
      setSubmitError(errorMessage(err, "Couldn't create the expense."));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Page width="page">
        <Skeleton className="h-8 w-48" />
        <div role="status" aria-label="Loading" className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-6">
            <Skeleton className="h-20" />
            <Skeleton className="h-40" />
          </div>
          <Skeleton className="h-56" />
        </div>
      </Page>
    );
  }

  if (loadError && !group) {
    return (
      <Page width="page">
        <PageHeader title="New expense" back={{ to: `/groups/${groupId}`, label: "Back to group" }} />
        <ErrorState message={loadError} onRetry={reload} />
      </Page>
    );
  }

  const allMembers = group.members;

  return (
    <Page width="page">
      <PageHeader
        back={{ to: `/groups/${groupId}`, label: group.name }}
        title="New expense"
        description="Add the items, then choose who had each one. Tax is shared in proportion."
      />

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="space-y-8">
          {/* Optional shortcut: fills the form below */}
          <div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-panel border border-dashed border-line-strong bg-surface p-4">
              <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-control bg-sunken sm:flex">
                <ScanLine className="h-5 w-5 text-muted" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1 basis-56">
                <p className="text-body font-medium text-ink">Scan a receipt</p>
                <p className="text-small text-muted">Upload a photo to fill in the items, or enter them by hand below.</p>
              </div>
              <label
                className={cn(
                  "inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-control border border-line-strong bg-surface px-4 text-body font-medium text-ink transition-colors hover:bg-sunken",
                  "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary",
                  scanning && "pointer-events-none opacity-60"
                )}
              >
                {scanning ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
                {scanning ? "Reading…" : "Choose photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={scanning}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    e.target.value = ""; // allow picking the same file again
                    if (file) handleScan(file);
                  }}
                />
              </label>
            </div>
            {scanError && <Alert tone="error" className="mt-3">{scanError}</Alert>}
            {scanNote && <Alert tone="success" className="mt-3">{scanNote}</Alert>}
          </div>

          <Section title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Merchant"
                required
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="Coconut Grove"
              />
              <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
              <Select label="Paid by" value={effectivePaidBy} onChange={(e) => setPaidBy(e.target.value)}>
                {allMembers.map((m) => (
                  <option key={m._id} value={m._id}>
                    @{m.username}
                  </option>
                ))}
              </Select>
              <Input
                label="Tax"
                type="number"
                step="0.1"
                min="0"
                inputMode="decimal"
                suffix="%"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                inputClassName="tnum"
              />
            </div>
          </Section>

          <Section title="Items">
            <Panel className="divide-y divide-line">
              {items.map((item, i) => {
                const missing = showItemErrors && item.participants.length === 0;
                const everyone = allMembers.length > 0 && item.participants.length === allMembers.length;
                return (
                  <fieldset key={item.uid} className="p-4">
                    <legend className="sr-only">Item {i + 1}</legend>
                    <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap sm:gap-3">
                      <Input
                        aria-label={`Item ${i + 1} name`}
                        required
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => updateItem(item.uid, "name", e.target.value)}
                        className="w-full min-w-0 sm:w-auto sm:flex-1"
                      />
                      <Input
                        aria-label={`Item ${i + 1} price`}
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        prefix="Rs."
                        placeholder="0"
                        value={item.price}
                        onChange={(e) => updateItem(item.uid, "price", e.target.value)}
                        inputClassName="tnum"
                        className="min-w-0 flex-1 sm:w-40 sm:flex-none"
                      />
                      <Button
                        variant="ghost"
                        icon={Trash2}
                        onClick={() => removeItem(item.uid)}
                        disabled={items.length === 1}
                        aria-label={`Remove item ${i + 1}`}
                        className="w-10 shrink-0 px-0 hover:text-negative"
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className={cn("text-small", missing ? "font-medium text-negative" : "text-muted")}>
                        {missing ? "Choose at least one person" : "Split between"}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleEveryone(item.uid)}
                        className="rounded-control text-small font-medium text-primary hover:underline"
                      >
                        {everyone ? "Clear" : "Everyone"}
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {allMembers.map((m) => (
                        <ToggleChip
                          key={m._id}
                          selected={item.participants.includes(m._id)}
                          onClick={() => toggleParticipant(item.uid, m._id)}
                        >
                          @{m.username}
                        </ToggleChip>
                      ))}
                    </div>
                  </fieldset>
                );
              })}
              <button
                type="button"
                onClick={addItem}
                className="flex w-full items-center gap-2 rounded-b-panel px-4 py-3 text-body font-medium text-primary transition-colors hover:bg-sunken"
              >
                <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                Add another item
              </button>
            </Panel>
          </Section>
        </div>

        {/* Live total, laid out like the receipt it will become */}
        <aside className="lg:sticky lg:top-8">
          <Panel padded>
            <p className="eyebrow">Summary</p>
            <dl className="mt-4 space-y-2 text-body">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tnum text-ink">{formatMoneyExact(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Tax ({parseFloat(taxPercent) || 0}%)</dt>
                <dd className="tnum text-ink">{formatMoneyExact(taxAmount)}</dd>
              </div>
            </dl>
            <div className="perforation my-4" />
            <div className="flex items-baseline justify-between">
              <span className="text-body font-medium text-ink">Total</span>
              <span className="tnum text-figure font-semibold text-ink">{formatMoneyExact(total)}</span>
            </div>

            {submitError && (
              <div ref={errorRef} className="mt-5">
                <Alert tone="error">{submitError}</Alert>
              </div>
            )}

            <Button type="submit" variant="primary" loading={submitting} className="mt-5 w-full">
              {submitting ? "Saving…" : "Confirm expense"}
            </Button>
            <Button as={Link} to={`/groups/${groupId}`} variant="ghost" className="mt-2 w-full">
              Cancel
            </Button>
            <p className="mt-4 text-small text-subtle">Everyone in the split is told what they owe.</p>
          </Panel>
        </aside>
      </form>
    </Page>
  );
}
