import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

// Login/register return `{ id }` but /users/me returns a Mongo document with
// `_id`. Normalise so `user.id` is always available, including after a refresh.
const withId = (u) => (u ? { ...u, id: u.id ?? u._id } : u);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("splitly_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/users/me")
      .then((res) => setUser(withId(res.data)))
      .catch(() => localStorage.removeItem("splitly_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("splitly_token", res.data.token);
    setUser(withId(res.data.user));
    return res.data.user;
  };

  const register = async (username, email, password) => {
    const res = await api.post("/auth/register", { username, email, password });
    localStorage.setItem("splitly_token", res.data.token);
    setUser(withId(res.data.user));
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("splitly_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
