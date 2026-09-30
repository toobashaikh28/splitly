import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ChevronRight, Users } from "lucide-react";
import api from "../api/axios.js";
import useResource from "../hooks/useResource.js";
import { CATEGORIES } from "../utils/categories.js";
import { errorMessage } from "../utils/errors.js";
import { pluralize } from "../utils/format.js";
import { Page, PageHeader, Panel } from "../components/ui/Page.jsx";
import Button from "../components/ui/Button.jsx";
import Alert from "../components/ui/Alert.jsx";
import { Input, Select } from "../components/ui/Field.jsx";
import ToggleChip from "../components/ui/ToggleChip.jsx";
import { AvatarStack } from "../components/ui/Avatar.jsx";
import { EmptyState, ErrorState, ListSkeleton } from "../components/ui/States.jsx";

export default function Groups() {
  const groups = useResource("/groups");
  const friends = useResource("/users/friends");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Food");
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const toggleFriend = (id) => {
    setSelectedFriends((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const closeForm = () => {
    setShowForm(false);
    setFormError("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      await api.post("/groups", { name, category, memberIds: selectedFriends });
      setName("");
      setSelectedFriends([]);
      setShowForm(false);
      groups.reload();
    } catch (err) {
      setFormError(errorMessage(err, "Couldn't create the group. Try again."));
    } finally {
      setSaving(false);
    }
  };

  const friendList = friends.data || [];

  return (
    <Page width="page">
      <PageHeader
        title="Groups"
        description="Keep shared expenses together with the people you split them with."
        actions={
          !showForm && (
            <Button variant="primary" icon={Plus} onClick={() => setShowForm(true)}>
              New group
            </Button>
          )
        }
      />

      {showForm && (
        <Panel padded className="mb-8">
          <form onSubmit={handleCreate} className="flex flex-col gap-5">
            <h2 className="text-heading font-semibold text-ink">New group</h2>
            {formError && <Alert tone="error">{formError}</Alert>}

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Group name"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Friday dinner"
              />
              <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </div>

            <fieldset>
              <legend className="mb-1.5 text-small font-medium text-ink">Add friends</legend>
              {friends.loading ? (
                <p className="text-body text-muted">Loading your friends…</p>
              ) : friendList.length === 0 ? (
                <p className="text-body text-muted">
                  You haven't added any friends yet.{" "}
                  <Link to="/friends" className="rounded-control font-medium text-primary hover:underline">
                    Add some first
                  </Link>
                  , or create the group now and invite people with a link.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {friendList.map((f) => (
                    <ToggleChip key={f._id} selected={selectedFriends.includes(f._id)} onClick={() => toggleFriend(f._id)}>
                      @{f.username}
                    </ToggleChip>
                  ))}
                </div>
              )}
            </fieldset>

            <div className="flex gap-2">
              <Button type="submit" variant="primary" loading={saving}>
                {saving ? "Creating…" : "Create group"}
              </Button>
              <Button variant="ghost" onClick={closeForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {groups.loading ? (
        <ListSkeleton rows={3} />
      ) : groups.error && !groups.data ? (
        <ErrorState message={groups.error} onRetry={groups.reload} />
      ) : groups.data.length === 0 ? (
        !showForm && (
          <EmptyState
            icon={Users}
            title="No groups yet"
            description="Create a group for a trip, a flat or a regular dinner, then add expenses to it."
            action={
              <Button variant="primary" icon={Plus} onClick={() => setShowForm(true)}>
                Create your first group
              </Button>
            }
          />
        )
      ) : (
        <Panel className="divide-y divide-line">
          {groups.data.map((g) => (
            <Link
              key={g._id}
              to={`/groups/${g._id}`}
              className="flex items-center gap-4 px-4 py-4 transition-colors first:rounded-t-panel last:rounded-b-panel hover:bg-sunken sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-body font-medium text-ink">{g.name}</h2>
                <p className="mt-0.5 text-small text-muted">
                  {g.category} · {pluralize(g.members?.length || 0, "member")}
                </p>
              </div>
              <AvatarStack names={(g.members || []).map((m) => m.username)} />
              <ChevronRight className="h-4 w-4 shrink-0 text-subtle" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          ))}
        </Panel>
      )}
    </Page>
  );
}
