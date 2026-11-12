import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const categories = [
  { name: "Vegetables", number: "01", description: "Fresh greens and everyday essentials" },
  { name: "Fruits", number: "02", description: "Seasonal produce from local farms" },
  { name: "Grains", number: "03", description: "Locally grown staples" },
  { name: "Root Crops", number: "04", description: "Harvested close to home" },
];

const destinations = {
  farmer: "/farmer/dashboard",
  buyer: "/buyer/marketplace",
  admin: "/admin/dashboard",
  deliveryAgent: "/delivery/dashboard",
};

function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const user = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const marketplacePath = "/buyer/marketplace";
  const workspacePath = destinations[user?.role] || marketplacePath;

  function browse(term = "") {
    const query = term.trim();
    navigate(query ? `${marketplacePath}?search=${encodeURIComponent(query)}` : marketplacePath);
  }

  function handleSearch(event) {
    event.preventDefault();
    browse(search);
  }

  function handleLogout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/", { replace: true });
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-[#FAF9F4] text-[#183B2B]">
      <header className="relative z-20 border-b border-[#E5EBDD] bg-[#FAF9F4]">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3 font-semibold tracking-tight text-[#194C35]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#194C35] text-xl text-[#E6EDCD]">✦</span>
            <span className="text-lg">FarmConnect</span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium lg:flex">
            <Link to="/" className="text-[#194C35]">Home</Link>
            <Link to={marketplacePath} className="transition hover:text-[#71915B]">Marketplace</Link>
            <a href="#categories" className="transition hover:text-[#71915B]">Categories</a>
            <a href="#about" className="transition hover:text-[#71915B]">Our story</a>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            {user ? (
              <>
                <Link to={workspacePath} className="rounded-full border border-[#C9D8C3] px-5 py-2.5 text-sm font-semibold text-[#194C35] hover:bg-[#E9F0E2]">My workspace</Link>
                <button type="button" onClick={handleLogout} className="rounded-full bg-[#194C35] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#123B29]">Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-semibold text-[#194C35]">Sign in</Link>
                <Link to="/register" className="rounded-full bg-[#194C35] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#123B29]">Join FarmConnect</Link>
              </>
            )}
          </div>
          <button type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="rounded-lg border border-[#D5E0CE] px-3 py-2 text-sm font-semibold lg:hidden">Menu</button>
        </nav>
        {menuOpen && (
          <div className="space-y-3 border-t border-[#E5EBDD] px-6 py-5 text-sm lg:hidden">
            <Link onClick={() => setMenuOpen(false)} to={marketplacePath} className="block">Marketplace</Link>
            <a onClick={() => setMenuOpen(false)} href="#categories" className="block">Categories</a>
            <a onClick={() => setMenuOpen(false)} href="#about" className="block">Our story</a>
            {user ? <><Link to={workspacePath} className="block">My workspace</Link><button onClick={handleLogout} className="block">Log out</button></> : <><Link to="/login" className="block">Sign in</Link><Link to="/register" className="block">Join FarmConnect</Link></>}
          </div>
        )}
      </header>

      <main>
        <section className="relative isolate flex min-h-[680px] items-center overflow-hidden bg-[#123827] text-white sm:min-h-[760px]">
          <img src="/images/hero-produce.jpg" alt="A basket of fresh vegetables and locally grown produce" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#082B1E]/95 via-[#082B1E]/80 to-[#082B1E]/25" />
          <div className="mx-auto w-full max-w-7xl px-6 py-24 sm:px-10 lg:px-12">
            <div className="max-w-2xl">
              <div className="mb-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#D3E7B3]">
                <span className="h-px w-9 bg-[#C5D99C]" /> Grown in The Gambia
              </div>
              <h1 className="font-serif text-5xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-[76px]">
                Good food starts<br />with <em className="font-serif text-[#C7DDA5]">local farmers.</em>
              </h1>
              <p className="mt-7 max-w-lg text-base leading-8 text-white/85 sm:text-lg">
                Discover fresh produce from farmers across The Gambia. Buy directly, support local agriculture, and bring the harvest closer to home.
              </p>
              <form onSubmit={handleSearch} className="mt-9 flex max-w-xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-xl sm:flex-row sm:rounded-full">
                <input type="search" aria-label="Search for produce" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="What are you looking for?" className="min-w-0 flex-1 rounded-full px-5 py-3 text-sm text-[#183B2B] outline-none placeholder:text-[#87998A]" />
                <button type="submit" className="rounded-xl bg-[#194C35] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2B6549] sm:rounded-full">Explore produce →</button>
              </form>
              <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-white/80">
                <span>Fresh from local farms</span><span className="hidden h-1 w-1 rounded-full bg-[#C7DDA5] sm:block" /><span>Made for Gambian communities</span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#B8D396]" />
        </section>

        {/* Curated produce categories */}
        <section id="categories" className="bg-[#FAF9F4] px-6 py-20 sm:px-10 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#75915D]">From the harvest</p>
                <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight text-[#183B2B] sm:text-5xl">Good things grow here.</h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-[#6F8072]">Find fresh ingredients, everyday staples, and produce grown by farmers across The Gambia.</p>
              </div>
              <Link to={marketplacePath} className="w-fit border-b border-[#79976B] pb-2 text-sm font-semibold text-[#194C35] transition hover:text-[#79976B]">Explore all produce ↗</Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category, index) => (
                <button
                  type="button"
                  key={category.name}
                  onClick={() => browse(category.name)}
                  className={`group relative flex min-h-[290px] flex-col justify-between overflow-hidden rounded-[24px] p-7 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl ${index === 0 ? "bg-[#DCE8D3]" : index === 1 ? "bg-[#F0E5D6]" : index === 2 ? "bg-[#E8EBD8]" : "bg-[#E7E3D9]"}`}
                >
                  <div className="absolute -bottom-16 -right-12 h-52 w-52 rounded-full border-[28px] border-white/35 transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute bottom-6 right-7 font-serif text-[110px] leading-none text-[#194C35]/[0.07]">{category.number}</div>
                  <span className="relative text-[11px] font-semibold uppercase tracking-[0.2em] text-[#69835E]">{category.number} / Explore</span>
                  <div className="relative">
                    <h3 className="font-serif text-3xl font-semibold text-[#194C35]">{category.name}</h3>
                    <p className="mt-3 max-w-[190px] text-sm leading-6 text-[#526D59]">{category.description}</p>
                    <span className="mt-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/75 text-lg text-[#194C35] transition group-hover:translate-x-1 group-hover:bg-white">↗</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* How FarmConnect works */}
        <section className="border-y border-[#E4E9DC] bg-white px-6 py-20 sm:px-10 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#75915D]">Simple by nature</p>
                <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight sm:text-5xl">From farm to your doorstep.</h2>
                <p className="mt-5 max-w-md leading-8 text-[#6F8072]">A simpler way to discover local produce and stay connected throughout your order.</p>
                <Link to={marketplacePath} className="mt-8 inline-flex rounded-full bg-[#194C35] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2B6549]">Start exploring ↗</Link>
              </div>
              <div className="grid gap-0 sm:grid-cols-3">
                {[
                  { number: "01", title: "Discover", description: "Browse produce listed by farmers in your community." },
                  { number: "02", title: "Connect", description: "Send a purchase request and arrange your order." },
                  { number: "03", title: "Follow along", description: "Pay securely and keep track of your delivery." },
                ].map((step) => (
                  <div key={step.number} className="border-b border-[#E1E8DC] py-6 last:border-b-0 sm:border-b-0 sm:border-l sm:px-7 sm:py-3">
                    <span className="font-serif text-5xl text-[#B4C8A6]">{step.number}</span>
                    <h3 className="mt-8 font-serif text-2xl font-semibold text-[#194C35]">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#6F8072]">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Full-bleed farmer story */}
        <section id="about" className="relative isolate flex min-h-[590px] items-center overflow-hidden bg-[#173D2B] px-6 py-20 text-white sm:px-10 lg:min-h-[650px] lg:py-24">
          <img
            src="/images/farmer-story.jpg"
            alt="A farmer holding a basket of freshly harvested produce"
            loading="lazy"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_35%] lg:object-center"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#09281C]/95 via-[#09281C]/85 to-[#09281C]/30" />
          <div className="mx-auto w-full max-w-7xl">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C7DDA5]">More than a marketplace</p>
              <h2 className="mt-5 font-serif text-4xl font-semibold leading-[1.12] sm:text-5xl lg:text-6xl">
                Every harvest has <em className="text-[#C7DDA5]">a story.</em>
              </h2>
              <div className="mt-7 h-px w-16 bg-[#C7DDA5]/70" />
              <p className="mt-7 text-base leading-8 text-white/85">
                Behind every basket of fresh produce is someone who planted, cared for, and harvested it. FarmConnect brings those farmers and their customers closer together.
              </p>
              <p className="mt-4 text-base leading-8 text-white/80">
                Farmers can showcase their harvests and manage sales, while buyers can discover local produce, place requests, and follow deliveries.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link to={marketplacePath} className="rounded-full bg-[#E8F0DD] px-7 py-3.5 text-sm font-semibold text-[#194C35] transition hover:bg-white">Discover the marketplace</Link>
                <Link to={user?.role === "farmer" ? "/farmer/dashboard" : "/register"} className="rounded-full border border-white/55 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">Grow with us ↗</Link>
              </div>
            </div>
          </div>
        </section>

      </main>
      <footer className="bg-[#0E3022] px-6 py-6 text-white sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#DCE8CC] text-[#194C35]">✦</span>
            FarmConnect
          </Link>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/75">
            <Link to={marketplacePath} className="hover:text-white">Marketplace</Link>
            <a href="#categories" className="hover:text-white">Categories</a>
            <a href="#about" className="hover:text-white">Our story</a>
            <Link to={user ? workspacePath : "/login"} className="hover:text-white">{user ? "My workspace" : "Sign in"}</Link>
          </nav>
          <p className="text-xs text-white/55">© {new Date().getFullYear()} FarmConnect · The Gambia</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
