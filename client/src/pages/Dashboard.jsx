import { Link } from "react-router-dom";
import { Plus, UserPlus, ChevronRight, ReceiptText, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import useResource from "../hooks/useResource.js";
import { formatMoney, formatNumber, pluralize } from "../utils/format.js";
import { Page, PageHeader, Section, Panel, TextLink } from "../components/ui/Page.jsx";
import Button from "../components/ui/Button.jsx";
import Alert from "../components/ui/Alert.jsx";
import Amount from "../components/ui/Amount.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import { EmptyState, Skeleton } from "../components/ui/States.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import { CHART } from "../utils/chartColors.js";


/** One figure in the balance band. Zero is shown in plain ink, not alarm-red. */
function BalanceFigure({ label, value, tone, caption, loading, unavailable }) {
  const colour = value > 0 && !unavailable ? (tone === "owe" ? "text-negative" : tone === "owed" ? "text-positive" : "text-ink") : "text-ink";
  return (
    <div className="p-5 sm:p-6">
      <p className="eyebrow">{label}</p>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-36" />
      ) : (
        <p className={`tnum mt-2 text-figure font-semibold ${colour}`}>{unavailable ? "—" : formatMoney(value)}</p>
      )}
      <p className="mt-1 min-h-5 text-small text-muted">{loading ? "" : unavailable ? "Couldn't load" : caption}</p>
    </div>
  );
}

function Metric({ label, value, hint, loading }) {
  return (
    <div className="bg-surface px-5 py-4">
      <dt className="text-small text-muted">{label}</dt>
      {loading ? (
        <Skeleton className="mt-1.5 h-6 w-24" />
      ) : (
        <dd className="tnum mt-1 text-body font-semibold text-ink min-[380px]:text-heading">{value}</dd>
      )}
      <dd className="min-h-5 text-small text-subtle">{loading ? "" : hint}</dd>
    </div>
  );
}

function RowSkeleton({ rows = 3 }) {
  return (
    <Panel className="divide-y divide-line" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </Panel>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-control border border-line bg-surface px-3 py-2 text-small shadow-pop">
      <p className="text-muted">{label}</p>
      <p className="tnum font-medium text-ink">{formatMoney(payload[0].value)}</p>
    </div>
  );
}

export default function Dashboard() {
  const settlements = useResource("/settlements/mine");
  const groups = useResource("/groups");
  const categories = useResource("/analytics/category-breakdown");
  const weekly = useResource("/analytics/weekly");
  const overview = useResource("/analytics/overview");

  const all = [settlements, groups, categories, weekly, overview];
  const failed = all.filter((r) => r.error && !r.data);
  const retryAll = () => failed.forEach((r) => r.reload());

  const s = settlements.data;
  const o = overview.data;
  const categoryData = [...(categories.data || [])].sort((a, b) => b.amount - a.amount);
  const monthTotal = categoryData.reduce((sum, c) => sum + c.amount, 0);
  const weekData = weekly.data || [];
  const weekHasSpend = weekData.some((d) => d.amount > 0);

  const oweIds = new Set((s?.owe || []).map((x) => x._id));
  const recentActivity = [...(s?.owe || []), ...(s?.owed || [])]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <Page width="wide">
      <PageHeader
        title="Overview"
        description="Where you stand across all your groups."
        actions={
          <>
            <Button as={Link} to="/groups" variant="primary" icon={Plus}>
              Add expense
            </Button>
            <Button as={Link} to="/settlements" variant="secondary">
              Settle up
            </Button>
            <Button as={Link} to="/friends" variant="ghost" icon={UserPlus}>
              Add friend
            </Button>
          </>
        }
      />

      {failed.length > 0 && (
        <Alert
          tone="error"
          className="mb-6"
          action={
            <Button variant="secondary" size="sm" onClick={retryAll}>
              Retry
            </Button>
          }
        >
          {failed[0].error}
        </Alert>
      )}

      {/* Where you stand: the first thing to read */}
      <Panel className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <BalanceFigure
          label="You owe"
          tone="owe"
          value={s?.totalOwed ?? 0}
          loading={settlements.loading}
          unavailable={failed.includes(settlements)}
          caption={s ? (s.owe.length ? `${pluralize(s.owe.length, "payment")} outstanding` : "Nothing to pay") : ""}
        />
        <BalanceFigure
          label="You're owed"
          tone="owed"
          value={s?.totalOwedToYou ?? 0}
          loading={settlements.loading}
          unavailable={failed.includes(settlements)}
          caption={s ? (s.owed.length ? `${pluralize(s.owed.length, "payment")} to collect` : "Nothing to collect") : ""}
        />
        <BalanceFigure
          label="Spent this month"
          value={monthTotal}
          loading={categories.loading}
          unavailable={failed.includes(categories)}
          caption="Your share of group expenses"
        />
      </Panel>

      {/* What needs doing, and where */}
      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <Section
          title="Recent activity"
          className="lg:col-span-2"
          action={<TextLink to="/settlements">View all</TextLink>}
        >
          {settlements.loading ? (
            <RowSkeleton />
          ) : failed.includes(settlements) ? (
            <Panel padded className="text-body text-muted">
              Couldn't load your payments.
            </Panel>
          ) : recentActivity.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="No open payments"
              description="When an expense is added to one of your groups, what you owe or are owed shows up here."
            />
          ) : (
            <Panel className="divide-y divide-line">
              {recentActivity.map((item) => {
                const isOwe = oweIds.has(item._id);
                const person = isOwe ? item.to.username : item.from.username;
                return (
                  <div key={item._id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1.5 px-4 py-3.5 sm:grid-cols-[auto_minmax(0,1fr)_auto_6rem] sm:items-center sm:gap-x-4">
                    <Avatar name={person} className="row-span-2 sm:row-span-1" />
                    <div className="min-w-0">
                      <p className="text-body font-medium text-ink sm:truncate">
                        {isOwe ? "You owe" : "Owes you"} @{person}
                      </p>
                      <p className="truncate text-small text-muted">{item.group?.name}</p>
                    </div>
                    <Amount value={item.amount} tone={isOwe ? "owe" : "owed"} sign className="text-body font-semibold sm:col-start-4 sm:row-start-1 sm:text-right" />
                    <div className="col-start-2 justify-self-start sm:col-start-3 sm:row-start-1">
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                );
              })}
            </Panel>
          )}
        </Section>

        <div className="space-y-10">
          <Section title="Budget" action={<TextLink to="/budgets">Manage</TextLink>}>
            {overview.loading ? (
              <Panel padded>
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="mt-4 h-1.5 w-full" />
              </Panel>
            ) : failed.includes(overview) ? (
              <Panel padded className="text-body text-muted">
                Couldn't load your budget.
              </Panel>
            ) : o && o.totalBudget > 0 ? (
              <Panel padded>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="tnum text-heading font-semibold text-ink">{o.budgetUsedPercent}% used</span>
                  <span className="tnum text-small text-muted">
                    {formatNumber(o.totalBudgetSpent)} of {formatMoney(o.totalBudget)}
                  </span>
                </div>
                <div className="mt-3">
                  <ProgressBar percent={o.budgetUsedPercent} overBudget={o.budgetUsedPercent > 100} label="Total budget used this month" />
                </div>
              </Panel>
            ) : (
              <Panel padded className="text-body text-muted">
                No budgets yet.{" "}
                <Link to="/budgets" className="rounded-control font-medium text-primary hover:underline">
                  Set your first
                </Link>
              </Panel>
            )}
          </Section>

          <Section title="Your groups" action={<TextLink to="/groups">See all</TextLink>}>
            {groups.loading ? (
              <RowSkeleton rows={2} />
            ) : failed.includes(groups) ? (
              <Panel padded className="text-body text-muted">
                Couldn't load your groups.
              </Panel>
            ) : groups.data.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No groups yet"
                description="A group holds the expenses you share with the same people."
                action={
                  <Button as={Link} to="/groups" size="sm">
                    Create a group
                  </Button>
                }
              />
            ) : (
              <Panel className="divide-y divide-line">
                {groups.data.slice(0, 5).map((g) => (
                  <Link
                    key={g._id}
                    to={`/groups/${g._id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors first:rounded-t-panel last:rounded-b-panel hover:bg-sunken"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body font-medium text-ink">{g.name}</p>
                      <p className="text-small text-muted">{pluralize(g.members?.length || 0, "member")}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-subtle" strokeWidth={1.75} aria-hidden="true" />
                  </Link>
                ))}
              </Panel>
            )}
          </Section>
        </div>
      </div>

      {/* Reading your numbers: secondary, so it comes last */}
      <Section
        title="Your spending"
        description="Your share of group expenses, not the full bills."
        className="mt-10"
      >
        <Panel className="overflow-hidden">
          <dl className="grid grid-cols-2 gap-px bg-line lg:grid-cols-4">
            <Metric label="Last 7 days" value={o ? formatMoney(o.weekTotal) : ""} loading={overview.loading} />
            <Metric label="This month" value={o ? formatMoney(o.monthTotal) : ""} loading={overview.loading} />
            <Metric label="Average per expense" value={o ? formatMoney(o.avgPerExpense) : ""} loading={overview.loading} />
            <Metric
              label="Top category"
              value={o?.topCategory?.name || "—"}
              hint={o?.topCategory ? formatMoney(o.topCategory.amount) : ""}
              loading={overview.loading}
            />
          </dl>

          <div className="grid border-t border-line lg:grid-cols-5">
            <div className="p-5 lg:col-span-3">
              <h3 className="text-body font-medium text-ink">Last 7 days</h3>
              {weekly.loading ? (
                <Skeleton className="mt-4 h-[200px] w-full" />
              ) : failed.includes(weekly) ? (
                <p className="mt-4 flex h-[200px] items-center justify-center text-body text-muted">Couldn't load this.</p>
              ) : !weekHasSpend ? (
                <p className="mt-4 flex h-[200px] items-center justify-center text-body text-muted">No spending in the last 7 days.</p>
              ) : (
                <div
                  role="img"
                  aria-label={`Bar chart of your daily spending over the last 7 days. ${weekData.map((d) => `${d.day}: ${formatMoney(d.amount)}`).join(", ")}`}
                  className="mt-4"
                >
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weekData} margin={{ top: 4, right: 0, left: -8, bottom: 0 }}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: CHART.axis }} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        width={44}
                        tick={{ fontSize: 12, fill: CHART.axis }}
                        tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                      />
                      <Tooltip cursor={{ fill: CHART.hover }} content={<ChartTooltip />} />
                      <Bar dataKey="amount" fill={CHART.primary} radius={[3, 3, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="border-t border-line p-5 lg:col-span-2 lg:border-l lg:border-t-0">
              <h3 className="text-body font-medium text-ink">By category this month</h3>
              {categories.loading ? (
                <div className="mt-4 space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : failed.includes(categories) ? (
                <p className="mt-4 text-body text-muted">Couldn't load this.</p>
              ) : categoryData.length === 0 ? (
                <p className="mt-4 text-body text-muted">No expenses yet this month.</p>
              ) : (
                <ul className="mt-4 space-y-3.5">
                  {categoryData.map((c) => {
                    const pct = monthTotal > 0 ? Math.round((c.amount / monthTotal) * 100) : 0;
                    return (
                      <li key={c.category}>
                        <div className="flex items-baseline justify-between gap-3 text-body">
                          <span className="text-ink">{c.category}</span>
                          <span className="tnum text-muted">{formatMoney(c.amount)}</span>
                        </div>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-sunken" aria-hidden="true">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </Panel>
      </Section>
    </Page>
  );
}
