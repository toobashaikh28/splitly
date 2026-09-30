import { useState } from "react";
import { CheckCircle2, HandCoins } from "lucide-react";
import api from "../api/axios.js";
import useResource from "../hooks/useResource.js";
import { errorMessage } from "../utils/errors.js";
import { formatMoney } from "../utils/format.js";
import { Page, PageHeader, PageColumns, Section, Panel, AsidePanel, StatList, Stat } from "../components/ui/Page.jsx";
import Button from "../components/ui/Button.jsx";
import Alert from "../components/ui/Alert.jsx";
import Amount from "../components/ui/Amount.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import PersonBalances from "../components/PersonBalances.jsx";
import { netByPerson } from "../utils/balances.js";
import { EmptyState, ErrorState, ListSkeleton } from "../components/ui/States.jsx";

function SettlementRow({ person, group, amount, tone, action }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 px-4 py-3.5 sm:grid-cols-[auto_minmax(0,1fr)_auto_11rem] sm:items-center sm:gap-x-4 sm:px-5">
      <Avatar name={person} className="row-span-2 sm:row-span-1" />
      <div className="min-w-0">
        <p className="break-words text-body font-medium text-ink sm:truncate">@{person}</p>
        <p className="truncate text-small text-muted">{group}</p>
      </div>
      <Amount value={amount} tone={tone} className="text-body font-semibold" />
      <div className="col-span-2 col-start-2 sm:col-span-1 sm:col-start-4 sm:text-right">{action}</div>
    </div>
  );
}

function Summary({ data }) {
  const net = Math.round((data.totalOwedToYou - data.totalOwed) * 100) / 100;
  const toPay = data.owe.filter((s) => s.status === "pending").length;
  const toConfirm = data.owed.filter((s) => s.status === "marked_paid").length;
  const waiting = data.owe.filter((s) => s.status === "marked_paid").length + data.owed.filter((s) => s.status === "pending").length;
  const people = netByPerson(data.owe, data.owed);
  const headline = net > 0 ? "You're owed more than you owe." : net < 0 ? "You owe more than you're owed." : "You're all square.";

  return (
    <>
      <AsidePanel title="Net position">
        <p className="text-figure font-semibold">
          {net === 0 ? <Amount value={0} /> : <Amount value={Math.abs(net)} tone={net > 0 ? "owed" : "owe"} sign />}
        </p>
        <p className="mt-1 text-small text-muted">{headline}</p>
        <div className="my-4 border-t border-dashed border-line-strong" />
        <StatList>
          <Stat label="You owe">
            <Amount value={data.totalOwed} tone={data.totalOwed > 0 ? "owe" : "neutral"} />
          </Stat>
          <Stat label="You're owed">
            <Amount value={data.totalOwedToYou} tone={data.totalOwedToYou > 0 ? "owed" : "neutral"} />
          </Stat>
        </StatList>
      </AsidePanel>

      <AsidePanel title="What's next">
        <StatList>
          <Stat label="Payments to make">{toPay}</Stat>
          <Stat label="Payments to confirm" emphasis={toConfirm > 0}>{toConfirm}</Stat>
          <Stat label="Waiting on someone else">{waiting}</Stat>
        </StatList>
      </AsidePanel>

      {people.length > 0 && (
        <AsidePanel title="By person">
          <PersonBalances people={people} />
          <p className="mt-3 text-small text-subtle">Net across all groups.</p>
        </AsidePanel>
      )}
    </>
  );
}

export default function Settlements() {
  const { data, error, loading, reload } = useResource("/settlements/mine");
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  const run = async (id, path, fallback) => {
    setActionError("");
    setNotice("");
    setBusyId(id);
    try {
      // Remember who and how much before the row leaves the list.
      const owed = data?.owed?.find((s) => s._id === id);
      const owe = data?.owe?.find((s) => s._id === id);
      await api.patch(`/settlements/${id}/${path}`);
      if (path === "confirm" && owed) {
        setNotice(`Confirmed. ${formatMoney(owed.amount)} from @${owed.from?.username} is cleared, so it has left this list.`);
      } else if (path === "mark-paid" && owe) {
        setNotice(`Marked as paid. Once @${owe.to?.username} confirms it, the payment is cleared.`);
      }
      await reload();
    } catch (err) {
      setActionError(errorMessage(err, fallback));
    } finally {
      setBusyId(null);
    }
  };

  const markPaid = (id) => run(id, "mark-paid", "Couldn't mark that as paid.");
  const confirmPaid = (id) => run(id, "confirm", "Couldn't confirm that payment.");

  return (
    <Page width="wide">
      <PageHeader className="max-w-form xl:max-w-none" title="Settle up" description="Mark what you've paid, and confirm what you've received." />

      {actionError && (
        <Alert tone="error" className="mb-6" onDismiss={() => setActionError("")}>
          {actionError}
        </Alert>
      )}

      {notice && (
        <Alert tone="success" className="mb-6" onDismiss={() => setNotice("")}>
          {notice}
        </Alert>
      )}

      <PageColumns aside={data ? <Summary data={data} /> : null}>
      {loading ? (
        <ListSkeleton rows={3} />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="space-y-10">
          <Section
            title="You owe"
            action={data.totalOwed > 0 && <Amount value={data.totalOwed} tone="owe" className="text-heading font-semibold" />}
          >
            {data.owe.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="You're all clear" description="You don't owe anyone right now." />
            ) : (
              <Panel className="divide-y divide-line">
                {data.owe.map((s) => (
                  <SettlementRow
                    key={s._id}
                    person={s.to.username}
                    group={s.group?.name}
                    amount={s.amount}
                    tone="owe"
                    action={
                      s.status === "pending" ? (
                        <Button variant="secondary" size="sm" loading={busyId === s._id} onClick={() => markPaid(s._id)}>
                          Mark as paid
                        </Button>
                      ) : (
                        <StatusBadge status={s.status} direction="owe" />
                      )
                    }
                  />
                ))}
              </Panel>
            )}
          </Section>

          <Section
            title="You're owed"
            action={data.totalOwedToYou > 0 && <Amount value={data.totalOwedToYou} tone="owed" className="text-heading font-semibold" />}
          >
            {data.owed.length === 0 ? (
              <EmptyState icon={HandCoins} title="Nothing to collect" description="No one owes you right now." />
            ) : (
              <Panel className="divide-y divide-line">
                {data.owed.map((s) => (
                  <SettlementRow
                    key={s._id}
                    person={s.from.username}
                    group={s.group?.name}
                    amount={s.amount}
                    tone="owed"
                    action={
                      s.status === "marked_paid" ? (
                        <Button variant="primary" size="sm" loading={busyId === s._id} onClick={() => confirmPaid(s._id)}>
                          Confirm received
                        </Button>
                      ) : (
                        <StatusBadge status={s.status} direction="owed" />
                      )
                    }
                  />
                ))}
              </Panel>
            )}
          </Section>
        </div>
      )}
      </PageColumns>
    </Page>
  );
}
