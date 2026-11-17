import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const destinations = {
  farmer: "/farmer/dashboard",
  buyer: "/buyer/marketplace",
  admin: "/admin/dashboard",
  deliveryAgent: "/delivery/dashboard",
};

export default function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  let user = null;

  try {
    user = JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const workspacePath = destinations[user?.role] || "/buyer/marketplace";

  function handleLogout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/", { replace: true });
    window.location.reload();
  }

  return (
    <header className="relative z-50 border-b border-[#E5EBDD] bg-[#FAF9F4]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link
          to="/"
          className="flex items-center gap-3 font-semibold text-[#194C35]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#194C35] text-xl text-[#E6EDCD]">
            ✦
          </span>
          <span className="text-lg">FarmConnect</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium lg:flex">
          <Link to="/">Home</Link>
          <Link to="/buyer/marketplace">Marketplace</Link>
          <Link to="/#categories">Categories</Link>
          <Link to="/#about">Our story</Link>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <Link
                to={workspacePath}
                className="rounded-full border border-[#C9D8C3] px-5 py-2.5 text-sm font-semibold text-[#194C35]"
              >
                My workspace
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full bg-[#194C35] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold">
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-[#194C35] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Join FarmConnect
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg border border-[#D5E0CE] px-3 py-2 text-sm font-semibold lg:hidden"
        >
          Menu
        </button>
      </nav>

      {menuOpen && (
        <div className="space-y-4 border-t border-[#E5EBDD] px-6 py-5 text-sm lg:hidden">
          <Link to="/" className="block">
            Home
          </Link>
          <Link to="/buyer/marketplace" className="block">
            Marketplace
          </Link>
          <Link to="/#categories" className="block">
            Categories
          </Link>
          <Link to="/#about" className="block">
            Our story
          </Link>

          {user ? (
            <>
              <Link to={workspacePath} className="block">
                My workspace
              </Link>
              <button onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block">
                Sign in
              </Link>
              <Link
                to="/register"
                className="block font-semibold text-[#194C35]"
              >
                Join FarmConnect
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
