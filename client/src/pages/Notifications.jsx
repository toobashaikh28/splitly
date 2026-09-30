import { useState } from "react";
import { Bell, Receipt, Clock, CheckCircle2, UserPlus } from "lucide-react";
import api from "../api/axios.js";
import useResource from "../hooks/useResource.js";
import { errorMessage } from "../utils/errors.js";
import { formatDateTime } from "../utils/format.js";
import { cn } from "../utils/cn.js";
import { Page, PageHeader, Panel } from "../components/ui/Page.jsx";
import Alert from "../components/ui/Alert.jsx";
import { EmptyState, ErrorState, ListSkeleton } from "../components/ui/States.jsx";

const ICONS = {
  new_expense: Receipt,
  payment_reminder: Clock,
  payment_marked_paid: Clock,
  payment_cleared: CheckCircle2,
  group_invite: UserPlus,
};

export default function Notifications() {
  const { data: notifications, error, loading, reload } = useResource("/notifications");
  const [actionError, setActionError] = useState("");

  const markRead = async (id) => {
    setActionError("");
    try {
      await api.patch(`/notifications/${id}/read`);
      await reload();
      // Let the sidebar badge update without a page change.
      window.dispatchEvent(new Event("splitly:notifications"));
    } catch (err) {
      setActionError(errorMessage(err, "Couldn't mark that as read."));
    }
  };

  const unread = notifications ? notifications.filter((n) => !n.read).length : 0;

  return (
    <Page width="form">
      <PageHeader
        title="Notifications"
        description={notifications ? (unread ? `${unread} unread` : "You're all caught up.") : undefined}
      />

      {actionError && (
        <Alert tone="error" className="mb-6" onDismiss={() => setActionError("")}>
          {actionError}
        </Alert>
      )}

      {loading ? (
        <ListSkeleton rows={4} />
      ) : error && !notifications ? (
        <ErrorState message={error} onRetry={reload} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="You'll hear about new expenses and payments here."
        />
      ) : (
        <Panel as="ul" className="divide-y divide-line overflow-hidden">
          {notifications.map((n) => {
            const Icon = ICONS[n.type] || Bell;
            const body = (
              <>
                <span className="mt-1.5 flex h-2 w-2 shrink-0" aria-hidden="true">
                  {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", n.read ? "text-subtle" : "text-primary")} strokeWidth={1.75} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-body", n.read ? "text-muted" : "font-medium text-ink")}>{n.message}</span>
                  <span className="mt-0.5 block text-small text-subtle">{formatDateTime(n.createdAt)}</span>
                </span>
              </>
            );
            return (
              <li key={n._id}>
                {n.read ? (
                  <div className="flex items-start gap-3 px-4 py-3.5 sm:px-5">{body}</div>
                ) : (
                  <button
                    onClick={() => markRead(n._id)}
                    className="flex w-full items-start gap-3 bg-primary-soft/50 px-4 py-3.5 text-left transition-colors hover:bg-primary-soft sm:px-5"
                  >
                    {body}
                    <span className="sr-only">Mark as read</span>
                  </button>
                )}
              </li>
            );
          })}
        </Panel>
      )}
    </Page>
  );
}
