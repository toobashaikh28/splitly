import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Plus, Share2, Merge, Copy, Check, ReceiptText } from "lucide-react";
import api from "../api/axios.js";
import useResource from "../hooks/useResource.js";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../utils/errors.js";
import { formatDate, formatMoney, pluralize } from "../utils/format.js";
import { Page, PageHeader, Section, Panel } from "../components/ui/Page.jsx";
import Button from "../components/ui/Button.jsx";
import Alert from "../components/ui/Alert.jsx";
import Amount from "../components/ui/Amount.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import { EmptyState, ErrorState, Skeleton } from "../components/ui/States.jsx";
import { CHART } from "../utils/chartColors.js";

function BalanceLine({ net }) {
  if (net > 0) return <span className="text-small text-muted">is owed <Amount value={net} tone="owed" className="text-body font-semibold" /></span>;
  if (net < 0) return <span className="text-small text-muted">owes <Amount value={Math.abs(net)} tone="owe" className="text-body font-semibold" /></span>;
  return <span className="text-small text-subtle">Settled up</span>;
}

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, error, loading, reload } = useResource(`/groups/${id}`);
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [simplified, setSimplified] = useState(null);
  const [simplifying, setSimplifying] = useState(false);
  const [actionError, setActionError] = useState("");

  const viewSimplified = async () => {
    setActionError("");
    setSimplifying(true);
    try {
      const res = await api.get(`/settlements/group/${id}/simplify`);
      setSimplified(res.data);
    } catch (err) {
      setActionError(errorMessage(err, "Couldn't work out simplified payments."));
    } finally {
      setSimplifying(false);
    }
  };

  if (loading) {
    return (
      <Page width="page">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-36" />
        <div role="status" aria-label="Loading group" className="mt-10 grid gap-8 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </Page>
    );
  }

  if (error && !data) {
    return (
      <Page width="page">
        <PageHeader title="Group" back={{ to: "/groups", label: "All groups" }} />
        <ErrorState message={error} onRetry={reload} />
      </Page>
    );
  }

  const { group, expenses, balances } = data;

  // The simplify endpoint returns user ids, so look names up from the balances.
  const nameOf = (id) => {
    const match = balances.find((b) => String(b.user.id) === String(id));
    return match ? `@${match.user.username}` : "Someone";
  };
  const isMe = (id) => Boolean(user) && String(id) === String(user.id);
  const inviteUrl = `${window.location.origin}/join/${group.inviteCode}`;

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable: the link is still visible to copy by hand */
    }
  };

  return (
    <Page width="page">
      <PageHeader
        back={{ to: "/groups", label: "All groups" }}
        title={group.name}
        description={`${group.category} · ${pluralize(group.members.length, "member")}`}
        actions={
          <>
            <Button variant="secondary" icon={Share2} onClick={() => setShowInvite((s) => !s)} aria-expanded={showInvite}>
              Invite
            </Button>
            <Button as={Link} to={`/groups/${id}/new-expense`} variant="primary" icon={Plus}>
              Add expense
            </Button>
          </>
        }
      />

      {showInvite && (
        <Panel padded className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="shrink-0 self-start rounded-control border border-line p-2">
            <QRCodeSVG value={inviteUrl} size={112} fgColor={CHART.ink} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-heading font-semibold text-ink">Invite people to this group</h2>
            <p className="mt-1 text-body text-muted">Anyone with this link can join. Share it or let them scan the code.</p>
            <div className="mt-3 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-control bg-sunken px-3 py-2 font-mono text-small text-ink">{inviteUrl}</code>
              <Button variant="secondary" icon={copied ? Check : Copy} onClick={copyInvite}>
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        </Panel>
      )}

      {actionError && <Alert tone="error" className="mb-6" onDismiss={() => setActionError("")}>{actionError}</Alert>}

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Balances lead on small screens: they answer "who owes what?" */}
        <div className="space-y-10 lg:order-2">
          <Section title="Balances">
            <Panel className="divide-y divide-line">
              {balances.map((b) => (
                <div key={b.user.id} className="flex items-center gap-3 px-4 py-3.5">
                  <Avatar name={b.user.username} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-medium text-ink">
                      @{b.user.username}
                      {b.user.id === user?.id && <span className="font-normal text-subtle"> (you)</span>}
                    </p>
                    <BalanceLine net={b.net} />
                  </div>
                </div>
              ))}
            </Panel>

            <Button variant="secondary" size="sm" icon={Merge} onClick={viewSimplified} loading={simplifying} className="mt-3 w-full">
              Simplify debts
            </Button>

            {simplified && (
              <div className="mt-3 rounded-panel border border-line bg-surface p-4">
                {simplified.optimized.length === 0 ? (
                  <p className="text-body text-muted">Everyone's already settled up.</p>
                ) : (
                  <>
                    <p className="text-body font-medium text-ink">
                      {simplified.originalCount} {simplified.originalCount === 1 ? "debt" : "debts"} can become{" "}
                      {pluralize(simplified.optimizedCount, "payment")}
                    </p>
                    <ul className="mt-3 space-y-2">
                      {simplified.optimized.map((s, i) => (
                        <li key={i} className="flex items-baseline justify-between gap-3 text-body">
                          <span className="min-w-0 truncate text-muted">
                            <span className="text-ink">{isMe(s.from) ? "You" : nameOf(s.from)}</span> {isMe(s.from) ? "pay" : "pays"}{" "}
                            <span className="text-ink">{isMe(s.to) ? "you" : nameOf(s.to)}</span>
                          </span>
                          <span className="tnum shrink-0 font-medium text-ink">{formatMoney(s.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </Section>
        </div>

        <Section title="Expenses" className="lg:order-1 lg:col-span-2">
          {expenses.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="No expenses yet"
              description="Add the first one to start tracking who owes what."
              action={
                <Button as={Link} to={`/groups/${id}/new-expense`} variant="primary" icon={Plus}>
                  Add expense
                </Button>
              }
            />
          ) : (
            <Panel className="overflow-hidden">
              <table className="w-full text-left">
                <caption className="sr-only">Expenses in {group.name}</caption>
                <thead>
                  <tr className="border-b border-line bg-canvas text-small text-muted">
                    <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">Expense</th>
                    <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">Date</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium sm:px-5">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {expenses.map((e) => (
                    <tr key={e._id}>
                      <td className="px-4 py-3.5 sm:px-5">
                        <p className="text-body font-medium text-ink">{e.merchant}</p>
                        <p className="mt-0.5 text-small text-muted">
                          {e.category} · {pluralize(e.items.length, "item")}
                          <span className="sm:hidden"> · {formatDate(e.createdAt)}</span>
                        </p>
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3.5 text-body text-muted sm:table-cell">{formatDate(e.createdAt)}</td>
                      <td className="px-4 py-3.5 text-right sm:px-5">
                        <Amount value={e.total} className="text-body font-semibold" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}
        </Section>
      </div>
    </Page>
  );
}
