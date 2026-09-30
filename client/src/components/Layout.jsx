import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Wallet, PiggyBank, Bell, LogOut, Receipt } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/groups", label: "Groups", icon: Users },
  { to: "/settlements", label: "Settle Up", icon: Wallet },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/notifications", label: "Alerts", icon: Bell },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-paper font-body">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-60 md:shrink-0 border-r border-line bg-white px-5 py-6">
        <div className="flex items-center gap-2 mb-10 px-1">
          <Receipt size={22} className="text-marigoldDark" />
          <span className="font-display font-semibold text-lg text-ink">Splitly</span>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? "bg-marigold/15 text-marigoldDark" : "text-ink/60 hover:bg-paper"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="pt-4 border-t border-line mt-4">
          <div className="px-1 text-sm text-ink/60 mb-2">@{user?.username}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-owe hover:bg-oweSoft w-full"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-line flex justify-around py-2 z-20">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-medium ${
                isActive ? "text-marigoldDark" : "text-ink/50"
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
