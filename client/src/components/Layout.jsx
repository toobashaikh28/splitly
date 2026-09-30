import { useCallback, useEffect, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, ArrowLeftRight, PiggyBank, UserRound, Bell, LogOut } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { cn } from "../utils/cn.js";
import Logo from "./Logo.jsx";
import Avatar from "./ui/Avatar.jsx";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/groups", label: "Groups", icon: Users },
  { to: "/settlements", label: "Settle up", icon: ArrowLeftRight },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/friends", label: "Friends", icon: UserRound },
];
const NOTIFICATIONS = { to: "/notifications", label: "Notifications", icon: Bell };

function UnreadCount({ count, className }) {
  if (!count) return null;
  return (
    <span className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-white tnum", className)}>
      <span aria-hidden="true">{count > 99 ? "99+" : count}</span>
      <span className="sr-only">{count} unread</span>
    </span>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(() => {
    api
      .get("/notifications")
      .then((res) => setUnread(res.data.filter((n) => !n.read).length))
      .catch(() => {}); // the badge is a nicety; never block the page on it
  }, []);

  // Refresh on navigation, and whenever the notifications page marks one read.
  useEffect(() => {
    refreshUnread();
  }, [pathname, refreshUnread]);
  useEffect(() => {
    window.addEventListener("splitly:notifications", refreshUnread);
    return () => window.removeEventListener("splitly:notifications", refreshUnread);
  }, [refreshUnread]);

  // New page, new scroll position.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sidebarLink = ({ isActive }) =>
    cn(
      "flex h-9 items-center gap-3 rounded-control px-3 text-body font-medium transition-colors",
      isActive ? "bg-primary-soft text-primary" : "text-muted hover:bg-sunken hover:text-ink"
    );

  return (
    <div className="min-h-screen lg:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link to="/" className="rounded-control" aria-label="Splitly home">
            <Logo />
          </Link>
        </div>

        <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2">
          {[...NAV_ITEMS, NOTIFICATIONS].map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={sidebarLink}>
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="flex-1">{label}</span>
              {to === NOTIFICATIONS.to && <UnreadCount count={unread} />}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2.5 px-2 pb-2 pt-1">
            <Avatar name={user?.username} size="sm" />
            <span className="min-w-0 truncate text-body font-medium text-ink">@{user?.username}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex h-9 w-full items-center gap-3 rounded-control px-3 text-body text-muted transition-colors hover:bg-sunken hover:text-ink"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile / tablet top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface px-4 sm:px-6 lg:hidden">
          <Link to="/" className="rounded-control" aria-label="Splitly home">
            <Logo />
          </Link>
          <div className="flex items-center gap-1">
            <Link
              to={NOTIFICATIONS.to}
              className="relative flex h-9 w-9 items-center justify-center rounded-control text-muted transition-colors hover:bg-sunken hover:text-ink"
              aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
              {unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-surface" aria-hidden="true" />}
            </Link>
            <button
              onClick={handleLogout}
              aria-label="Log out"
              className="flex h-9 w-9 items-center justify-center rounded-control text-muted transition-colors hover:bg-sunken hover:text-ink"
            >
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </header>

        <main id="main" tabIndex={-1} className="min-w-0 flex-1 pb-24 outline-none lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile / tablet tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "relative flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted hover:text-ink"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary" aria-hidden="true" />}
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.75} aria-hidden="true" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
