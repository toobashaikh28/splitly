import { useEffect, useState } from "react";
import { UserPlus, Search, UserRound } from "lucide-react";
import api from "../api/axios.js";
import useResource from "../hooks/useResource.js";
import { errorMessage } from "../utils/errors.js";
import { Page, PageHeader, PageColumns, Section, Panel, AsidePanel, TextLink } from "../components/ui/Page.jsx";
import Button from "../components/ui/Button.jsx";
import Alert from "../components/ui/Alert.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Badge from "../components/ui/Badge.jsx";
import { Input } from "../components/ui/Field.jsx";
import { EmptyState, ErrorState, ListSkeleton, Skeleton } from "../components/ui/States.jsx";
import PersonBalances from "../components/PersonBalances.jsx";
import { netByPerson } from "../utils/balances.js";

export default function Friends() {
  const friends = useResource("/users/friends");
  const settlements = useResource("/settlements/mine");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length === 0) {
      setResults([]);
      setSearching(false);
      setSearched(false);
      return;
    }
    setSearching(true);
    let cancelled = false;
    const timeout = setTimeout(() => {
      api
        .get(`/users/search?q=${encodeURIComponent(q)}`)
        .then((res) => {
          if (cancelled) return;
          setResults(res.data);
          setSearched(true);
        })
        .catch((err) => {
          if (cancelled) return;
          setError(errorMessage(err, "Search isn't working right now."));
        })
        .finally(() => !cancelled && setSearching(false));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  const friendIds = new Set((friends.data || []).map((f) => f._id));

  const addFriend = async (userId, username) => {
    setError("");
    setAddingId(userId);
    try {
      await api.post(`/users/friends/${userId}`);
      setMessage(`You and @${username} are now friends.`);
      setQuery("");
      setResults([]);
      friends.reload();
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError(errorMessage(err, "Couldn't add that friend. Try again."));
    } finally {
      setAddingId(null);
    }
  };

  const showResults = query.trim().length > 0;
  const balances = settlements.data ? netByPerson(settlements.data.owe, settlements.data.owed) : [];
  const aside = settlements.error && !settlements.data ? null : (
    <AsidePanel title="Open balances" action={<TextLink to="/settlements">Settle up</TextLink>}>
      {settlements.loading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : balances.length === 0 ? (
        <p className="text-body text-muted">No one owes you and you owe no one. Balances show up here once you split an expense.</p>
      ) : (
        <>
          <PersonBalances people={balances} />
          <p className="mt-3 text-small text-subtle">Net across all groups.</p>
        </>
      )}
    </AsidePanel>
  );

  return (
    <Page width="wide">
      <PageHeader className="max-w-form xl:max-w-none" title="Friends" description="Find people by username. They're added straight away, no approval needed." />

      <PageColumns aside={aside}>
      <Input
        label="Find someone"
        icon={Search}
        type="search"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by username"
      />

      <div aria-live="polite" className="mt-3 space-y-3">
        {message && <Alert tone="success">{message}</Alert>}
        {error && <Alert tone="error" onDismiss={() => setError("")}>{error}</Alert>}
      </div>

      {showResults && (
        <div className="mt-3">
          {results.length > 0 ? (
            <Panel className="divide-y divide-line">
              {results.map((u) => (
                <div key={u._id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={u.username} />
                  <span className="min-w-0 flex-1 truncate text-body font-medium text-ink">@{u.username}</span>
                  {friendIds.has(u._id) ? (
                    <Badge tone="neutral" dot={false}>Already friends</Badge>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={UserPlus}
                      loading={addingId === u._id}
                      onClick={() => addFriend(u._id, u.username)}
                    >
                      Add
                    </Button>
                  )}
                </div>
              ))}
            </Panel>
          ) : searching ? (
            <p role="status" className="px-1 text-body text-muted">Searching…</p>
          ) : searched ? (
            <p className="px-1 text-body text-muted">No one found for “{query.trim()}”. Check the spelling of their username.</p>
          ) : null}
        </div>
      )}

      <Section
        title="Your friends"
        action={friends.data ? <span className="tnum text-small text-muted">{friends.data.length}</span> : null}
        className="mt-10"
      >
        {friends.loading ? (
          <ListSkeleton rows={3} />
        ) : friends.error && !friends.data ? (
          <ErrorState message={friends.error} onRetry={friends.reload} />
        ) : friends.data.length === 0 ? (
          <EmptyState
            icon={UserRound}
            title="No friends yet"
            description="Search for a username above to add your first friend. You'll need friends to put them in groups."
          />
        ) : (
          <Panel className="divide-y divide-line">
            {friends.data.map((f) => (
              <div key={f._id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={f.username} />
                <span className="text-body font-medium text-ink">@{f.username}</span>
              </div>
            ))}
          </Panel>
        )}
      </Section>
      </PageColumns>
    </Page>
  );
}
