import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

const NAV_BY_ROLE = {
  buyer: [
    { label: "Marketplace", to: "/buyer/marketplace", icon: "market" },
    { label: "My Purchases", to: "/buyer/orders", icon: "bag" },
  ],
  farmer: [
    { label: "Marketplace", to: "/buyer/marketplace", icon: "market" },
    { label: "My Purchases", to: "/buyer/orders", icon: "bag" },
    { label: "Farmer Dashboard", to: "/farmer/dashboard", icon: "dashboard" },
    { label: "My Products", to: "/farmer/dashboard#my-products", icon: "box" },
    { label: "Add Product", to: "/farmer/add-product", icon: "plus" },
    { label: "Purchase Requests", to: "/farmer/purchase-requests", icon: "requests" },
    { label: "Sales Orders", to: "/farmer/orders", icon: "orders" },
    {label: "My Earnings",to: "/farmer/earnings",icon: "wallet",},
    {label: "Reports", to: "/farmer/reports", icon: "reports",}
  ],
  
admin: [
  { label: "Admin Dashboard", to: "/admin/dashboard", icon: "dashboard" },
  { label: "Categories", to: "/admin/categories", icon: "box" },
  { label: "Manage Orders", to: "/admin/orders", icon: "orders" },
  { label: "Manage Finances", to: "/admin/finances", icon: "wallet" },
  { label: "Reports", to: "/admin/reports", icon: "reports" },
],

  deliveryAgent: [
    { label: "My Deliveries", to: "/delivery/dashboard", icon: "truck" },
    {label: "Reports", to: "/delivery/reports", icon: "reports",}
  ],
};

// Self-contained icons: no additional icon package required.
function NavIcon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    market: <><path d="M3 10h18l-2-6H5l-2 6Z"/><path d="M5 10v10h14V10M9 20v-7h6v7"/><path d="M3 10c0 3 4 3 4 0 0 3 4 3 4 0 0 3 4 3 4 0 0 3 4 3 4 0"/></>,
    bag: <><path d="M4 8h16l-1 13H5L4 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>,
    dashboard: <><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/></>,
    box: <><path d="m12 2 9 5-9 5-9-5 9-5ZM3 7v10l9 5 9-5V7M12 12v10"/></>,
    plus: <><path d="M12 5v14M5 12h14"/><circle cx="12" cy="12" r="10"/></>,
    requests: <><path d="M8 4h11v16H5V7l3-3Z"/><path d="M8 4v3H5M9 12h7M9 16h7"/></>,
    orders: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3ZM9 8h6M9 12h6"/></>,
    
wallet: (
  <>
    <rect x="3" y="6" width="18" height="15" rx="2" />
    <path d="M3 10h18M7 6V4a2 2 0 0 1 2-2h9" />
    <path d="M15 14h6v4h-6a2 2 0 0 1 0-4Z" />
    <circle cx="17" cy="16" r="0.5" fill="currentColor" stroke="none" />
  </>
),


reports: (
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 17v-5M12 17V7M17 17v-8" />
  </>
),


    truck: <><path d="M3 6h12v11H3zM15 10h4l3 4v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
    close: <path d="M5 5l14 14M19 5 5 19"/>,
    logout: <><path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h10"/></>,
    home: <><path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7"/></>,
  };
  return <svg {...common}>{paths[name] || paths.box}</svg>;
}

function readUser() {
  try { return JSON.parse(sessionStorage.getItem("user") || "null"); }
  catch { return null; }
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = readUser();
  const role = user?.role;
  const navItems = NAV_BY_ROLE[role] || [];

  useEffect(() => { setMobileOpen(false); }, [location.pathname, location.hash]);

  // Public marketplace/product details remain accessible to guests.
  if (!user) return <Outlet />;

  function logout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/", { replace: true });
  }

  const initials = (user.name || "U").trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const pageLabel = navItems.find((item) => item.to === location.pathname)?.label || "FarmConnect";

  const sidebar = (
    <div className="flex h-full flex-col bg-[#194C35] text-white">
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
        <Link to="/" className="flex items-center gap-3 text-xl font-semibold tracking-tight" onClick={() => setMobileOpen(false)}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDE9C9] text-[#194C35]" aria-hidden="true">✦</span>
          FarmConnect
        </Link>
        <button type="button" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-white/80 hover:bg-white/10 lg:hidden" aria-label="Close menu"><NavIcon name="close" /></button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-7" aria-label="Main navigation">
        <p className="mb-4 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B4CAA9]">Workspace</p>
        {navItems.map((item) => {
          const isHashLink = item.to.includes("#");
          const active = isHashLink ? location.pathname === item.to.split("#")[0] && location.hash === `#${item.to.split("#")[1]}` : location.pathname === item.to;
          const styles = `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${active ? "bg-[#E7F0DC] text-[#194C35]" : "text-white/80 hover:bg-white/10 hover:text-white"}`;
          return isHashLink ? (
            <Link key={item.to} to={item.to} className={styles} onClick={() => setMobileOpen(false)}><NavIcon name={item.icon}/>{item.label}</Link>
          ) : (
            <NavLink key={item.to} to={item.to} className={styles} onClick={() => setMobileOpen(false)}><NavIcon name={item.icon}/>{item.label}</NavLink>
          );
        })}
        <div className="my-5 border-t border-white/10" />
        <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"><NavIcon name="home"/>Home</Link>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/10 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E7F0DC] text-sm font-bold text-[#194C35]">{initials}</span>
          <div className="min-w-0"><p className="truncate text-sm font-semibold">{user.name || "My account"}</p><p className="text-xs capitalize text-white/60">{role === "deliveryAgent" ? "Delivery agent" : role}</p></div>
        </div>
        <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white"><NavIcon name="logout"/>Log out</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F4] text-[#183B2B] lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-200 lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`} aria-hidden={!mobileOpen}>{sidebar}</aside>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#E2E8DD] bg-white/95 px-5 backdrop-blur sm:px-8">
        <div className="flex items-center gap-3">
          <button type="button" className="rounded-lg p-2 text-[#194C35] hover:bg-[#EAF0E5] lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu" aria-expanded={mobileOpen}><NavIcon name="menu"/></button>
          <div><p className="text-xs font-medium text-[#79907D]">Your workspace</p><h2 className="font-serif text-xl font-semibold text-[#194C35]">{pageLabel}</h2></div>
        </div>
        <div className="flex items-center gap-3"><span className="hidden text-sm text-[#6B7E70] sm:block">Welcome, {user.name?.split(" ")[0] || "there"}</span><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E7F0DC] text-xs font-bold text-[#194C35]">{initials}</span></div>
      </header>
      <main id="main-content" className="min-w-0"><Outlet /></main>
    </div>
  );
}
