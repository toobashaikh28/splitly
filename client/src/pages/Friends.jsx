import { useEffect, useState } from "react";
import { UserPlus, Search } from "lucide-react";
import api from "../api/axios.js";

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");

  const loadFriends = () => api.get("/users/friends").then((res) => setFriends(res.data));

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      api.get(`/users/search?q=${encodeURIComponent(query)}`).then((res) => setResults(res.data));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const addFriend = async (userId, username) => {
    await api.post(`/users/friends/${userId}`);
    setMessage(`You and @${username} are now friends`);
    setQuery("");
    setResults([]);
    loadFriends();
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="max-w-3xl px-6 md:px-10 py-8 md:py-10">
      <h1 className="font-display font-semibold text-2xl text-ink2 mb-8">Friends</h1>

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username"
          className="w-full border border-line rounded-sm pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-marigold"
        />
      </div>

      {message && <div className="bg-owedSoft text-owed text-sm rounded-sm px-3 py-2 mb-4">{message}</div>}

      {results.length > 0 && (
        <div className="bg-white border border-line rounded-md divide-y divide-dashed divide-line mb-8">
          {results.map((u) => (
            <div key={u._id} className="p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-ink">@{u.username}</span>
              <button
                onClick={() => addFriend(u._id, u.username)}
                className="flex items-center gap-1.5 text-sm font-medium text-marigoldDark hover:text-ink2"
              >
                <UserPlus size={15} /> Add
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 className="font-display font-semibold text-ink2 mb-3">Your friends ({friends.length})</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {friends.map((f) => (
          <div key={f._id} className="bg-white border border-line rounded-md px-4 py-3 text-sm font-medium text-ink">
            @{f.username}
          </div>
        ))}
        {friends.length === 0 && <p className="text-sm text-ink/50">No friends added yet — search above.</p>}
      </div>
    </div>
  );
}
