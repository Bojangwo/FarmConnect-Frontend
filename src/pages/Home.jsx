import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const categories = [
  { name: "Vegetables", emoji: "🥬" },
  { name: "Fruits", emoji: "🍉" },
  { name: "Grains", emoji: "🌾" },
  { name: "Root Crops", emoji: "🥔" },
];

function Home() {

  const navigate = useNavigate();

    const user = JSON.parse(sessionStorage.getItem("user") || "null");

const handleLogout = () => {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  window.location.href = "/";
};

  const [search, setSearch] = useState("");

 const handleSearch = (event) => {
  event.preventDefault();

  if (user?.role === "buyer") {
    navigate("/buyer/marketplace");
  } else if (!user) {
    navigate("/login");
  }
};

  return (
    <div className="min-h-screen bg-[#f8faf6] text-gray-900">
      {/* Navigation */}
      <header className="border-b border-green-100 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="/" className="text-xl font-extrabold text-green-800">
            🌾 FarmConnect
          </a>

      
<div className="hidden items-center gap-6 md:flex">
  <Link
    to="/"
    className="text-sm font-medium text-gray-700 hover:text-green-800"
  >
    Home
  </Link>

  {user?.role === "buyer" && (
    <>
      <Link
        to="/buyer/marketplace"
        className="text-sm font-medium text-gray-700 hover:text-green-800"
      >
        Marketplace
      </Link>

      <Link
        to="/buyer/orders"
        className="text-sm font-medium text-gray-700 hover:text-green-800"
      >
        My Orders
      </Link>
    </>
  )}

  {user?.role === "farmer" && (
    <Link
      to="/farmer/dashboard"
      className="text-sm font-medium text-gray-700 hover:text-green-800"
    >
      Farmer Dashboard
    </Link>
  )}

  {user?.role === "admin" && (
    <Link
      to="/admin/dashboard"
      className="text-sm font-medium text-gray-700 hover:text-green-800"
    >
      Admin Dashboard
    </Link>
  )}

  {user?.role === "deliveryAgent" && (
    <Link
      to="/delivery/dashboard"
      className="text-sm font-medium text-gray-700 hover:text-green-800"
    >
      My Deliveries
    </Link>
  )}

  <a
    href="#categories"
    className="text-sm font-medium text-gray-700 hover:text-green-800"
  >
    Categories
  </a>

  <a
    href="#about"
    className="text-sm font-medium text-gray-700 hover:text-green-800"
  >
    About
  </a>
</div>


          
<div className="flex items-center gap-3">
  {user ? (
    <>
      <div className="hidden text-right sm:block">
        <p className="text-sm font-bold text-green-900">
          {user.name}
        </p>
        <p className="text-xs capitalize text-gray-500">
          {user.role}
        </p>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
      >
        Logout
      </button>
    </>
  ) : (
    <>
      <Link
        to="/login"
        className="rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-800"
      >
        Login
      </Link>

      <Link
        to="/register"
        className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
      >
        Sign Up
      </Link>
    </>
  )}
</div>

        </nav>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 px-6 py-20 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium">
            Fresh from Gambian farms 🇬🇲
          </span>

          <h1 className="mt-8 text-4xl font-extrabold leading-tight md:text-6xl">
            Connecting Farmers
            <br />
            With Buyers
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-green-100">
            Discover fresh, locally grown agricultural produce.
            Support Gambian farmers and shop directly from the source.
          </p>

          <form
            onSubmit={handleSearch}
            className="mx-auto mt-9 flex max-w-xl flex-col gap-3 rounded-xl bg-white p-2 shadow-xl sm:flex-row"
          >
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search for fresh produce..."
              aria-label="Search produce"
              className="min-w-0 flex-1 px-4 py-3 text-gray-800 outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-amber-500 px-7 py-3 font-bold text-gray-900 hover:bg-amber-400"
            >
              Explore Produce
            </button>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-9 text-center">
          <h2 className="text-3xl font-bold">Explore Categories</h2>
          <p className="mt-3 text-gray-600">
            Find the agricultural products you need.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {categories.map((category) => (
            <div
              key={category.name}
              className="rounded-2xl border border-green-100 bg-white p-8 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 text-5xl">{category.emoji}</div>
              <h3 className="font-bold text-green-900">
                {category.name}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-green-50 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-green-900">
            Empowering Local Agriculture
          </h2>
          <p className="mt-5 leading-8 text-gray-600">
            Our marketplace helps farmers showcase their produce
            and connect with buyers across The Gambia.
            We aim to make agricultural trade more accessible,
            transparent, and convenient.
          </p>
        </div>
      </section>

      <footer className="bg-green-950 px-6 py-7 text-center text-sm text-green-100">
        © {new Date().getFullYear()} FarmConnect. Supporting Gambian agriculture.
      </footer>
    </div>
  );
}

export default Home;
