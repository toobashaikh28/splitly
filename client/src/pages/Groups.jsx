import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, X } from "lucide-react";
import api from "../api/axios.js";
import { categoryTagClass } from "../utils/categoryColors.js";

const CATEGORIES = ["Food", "Travel", "Home", "Entertainment", "Education", "Project", "Shopping", "Health", "Other"];

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Food");
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = () => api.get("/groups").then((res) => setGroups(res.data));

  useEffect(() => {
    load();
    api.get("/users/friends").then((res) => setFriends(res.data));
  }, []);

  const toggleFriend = (id) => {
    setSelectedFriends((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/groups", { name, category, memberIds: selectedFriends });
      setName("");
      setSelectedFriends([]);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl px-6 md:px-10 py-8 md:py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-semibold text-2xl text-ink2">Groups</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 bg-ink2 text-white text-sm font-medium px-4 py-2 rounded-sm hover:bg-ink transition-colors"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "New group"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-line rounded-md p-5 mb-8 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-ink/80">Group name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Friday Dinner"
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
          <div>
            <label className="text-sm font-medium text-ink/80">Add friends</label>
            {friends.length === 0 ? (
              <p className="text-sm text-ink/50 mt-1">
                No friends yet — <Link to="/friends" className="text-marigoldDark font-medium">add some first</Link>.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-2">
                {friends.map((f) => (
                  <button
                    type="button"
                    key={f._id}
                    onClick={() => toggleFriend(f._id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      selectedFriends.includes(f._id)
                        ? "bg-marigold border-marigold text-ink2 font-medium"
                        : "border-line text-ink/70"
                    }`}
                  >
                    @{f.username}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="self-start bg-marigold text-ink2 font-medium text-sm px-5 py-2 rounded-sm hover:bg-marigoldDark hover:text-white transition-colors disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create group"}
          </button>
        </form>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {groups.map((g) => (
          <Link
            key={g._id}
            to={`/groups/${g._id}`}
            className="bg-white border border-line rounded-md p-4 hover:border-marigold transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-semibold text-ink2">{g.name}</h3>
              <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${categoryTagClass(g.category)}`}>
                {g.category}
              </span>
            </div>
            <p className="text-sm text-ink/50">{g.members?.length || 0} members</p>
          </Link>
        ))}
        {groups.length === 0 && !showForm && (
          <p className="text-sm text-ink/50 col-span-2">No groups yet. Create your first one above.</p>
        )}
      </div>
    </div>
  );
}
