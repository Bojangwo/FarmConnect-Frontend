import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyProducts, deleteProduct } from "../services/api";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

function productImageUrl(image) {
  if (!image) return "";
  const path = typeof image === "string" ? image : image.url || image.path || "";
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${BACKEND_URL}/${path.replace(/^\/+/, "")}`;
}

function formatPrice(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `D${number.toLocaleString("en-GB", { maximumFractionDigits: 2 })}` : "Price unavailable";
}

function FarmerDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [removingId, setRemovingId] = useState(null);

  let user = null;
  try {
    user = JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  useEffect(() => {
    let active = true;
    async function loadProducts() {
      try {
        const data = await getMyProducts();
        if (active) setProducts(Array.isArray(data.products) ? data.products : []);
      } catch (err) {
        if (active) setError(err.message || "Unable to load your products.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProducts();
    return () => { active = false; };
  }, []);

  const stats = useMemo(() => {
    const active = products.filter((p) => p.status === "available");
    const inactive = products.filter((p) => p.status === "inactive");
    const outOfStock = products.filter((p) => p.status === "out_of_stock" || (p.status !== "inactive" && Number(p.quantity) <= 0));
    return { total: products.length, active: active.length, inactive: inactive.length, outOfStock: outOfStock.length };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !query || [product.name, product.category?.name, product.location?.city]
        .some((value) => String(value || "").toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || product.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  async function handleRemoveProduct(productId) {
    if (!window.confirm("Are you sure you want to remove this product from the marketplace?")) return;
    try {
      setError("");
      setRemovingId(productId);
      await deleteProduct(productId);
      // The backend performs a soft removal; keep the product in the inventory.
      setProducts((previous) => previous.map((product) =>
        product._id === productId ? { ...product, status: "inactive" } : product
      ));
    } catch (err) {
      setError(err.message || "Could not remove the product.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF9F4] px-4 py-7 text-[#183B2B] sm:px-7 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#77975F]">Farm management</p>
            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#718073]">A clear view of your produce, inventory, and farm activity.</p>
          </div>
          <Link to="/farmer/add-product" className="inline-flex items-center justify-center rounded-xl bg-[#194C35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123A29]">
            + Add New Product
          </Link>
        </div>

        <section aria-label="Inventory overview" className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          {[
            { label: "Total listings", value: stats.total, note: "All products" },
            { label: "Available", value: stats.active, note: "Live on marketplace" },
            { label: "Out of stock", value: stats.outOfStock, note: "Need attention" },
            { label: "Removed", value: stats.inactive, note: "Inactive listings" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-[#E4E8DD] bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-medium text-[#718073]">{item.label}</p>
              <p className="mt-3 font-serif text-3xl font-semibold text-[#194C35]">{loading ? "—" : item.value}</p>
              <p className="mt-2 text-xs text-[#849185]">{item.note}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Quick actions">
          {[
            { title: "My Products", detail: "Manage your current listings", to: "#my-products", action: "View inventory" },
            { title: "Purchase Requests", detail: "Respond to interested buyers", to: "/farmer/purchase-requests", action: "View requests" },
            { title: "Sales Orders", detail: "Prepare and manage customer orders", to: "/farmer/orders", action: "Manage orders" },
          ].map((item) => (
            <Link key={item.title} to={item.to} className="group rounded-2xl border border-[#E4E8DD] bg-white p-5 transition hover:border-[#B9CDB5] hover:shadow-md sm:p-6">
              <h2 className="font-serif text-xl font-semibold text-[#194C35]">{item.title}</h2>
              <p className="mt-2 text-sm text-[#718073]">{item.detail}</p>
              <p className="mt-5 text-sm font-semibold text-[#477341] group-hover:underline">{item.action} →</p>
            </Link>
          ))}
        </section>

        <section id="my-products" className="mt-12 scroll-mt-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#77975F]">Your inventory</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-[#194C35]">My Products</h2>
              <p className="mt-2 text-sm text-[#718073]">Keep your listings accurate and ready for customers.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="farmer-product-search">Search products</label>
              <input id="farmer-product-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your products..." className="w-full rounded-xl border border-[#DCE4D8] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#77975F] sm:w-56" />
              <label className="sr-only" htmlFor="farmer-status-filter">Filter by status</label>
              <select id="farmer-status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-[#DCE4D8] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#77975F]">
                <option value="all">All statuses</option>
                <option value="available">Available</option>
                <option value="out_of_stock">Out of stock</option>
                <option value="inactive">Removed</option>
              </select>
            </div>
          </div>

          {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>}
          {loading && <p className="mt-6 text-sm text-[#718073]">Loading your products...</p>}

          {!loading && !error && products.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-[#C8D6C4] bg-white px-6 py-14 text-center">
              <h3 className="font-serif text-2xl font-semibold text-[#194C35]">Your farm's first listing starts here.</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#718073]">Add your produce to make it available to buyers across The Gambia.</p>
              <Link to="/farmer/add-product" className="mt-6 inline-block rounded-xl bg-[#194C35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#123A29]">Add a Product</Link>
            </div>
          )}

          {!loading && !error && products.length > 0 && filteredProducts.length === 0 && (
            <div className="mt-6 rounded-2xl border border-[#E4E8DD] bg-white px-6 py-10 text-center text-sm text-[#718073]">No products match your search or filter.</div>
          )}

          {!loading && !error && filteredProducts.length > 0 && (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const inactive = product.status === "inactive";
                const statusLabel = (product.status || "unknown").replaceAll("_", " ");
                const imageUrl = productImageUrl(product.images?.[0]);
                return (
                  <article key={product._id} className="overflow-hidden rounded-2xl border border-[#E4E8DD] bg-white shadow-sm">
                    <div className="relative h-48 bg-[#E9F0E2]">
                      {imageUrl ? (
                        <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-[#718073]">No product image</div>
                      )}
                      <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold capitalize ${inactive ? "bg-[#F2F1EC] text-[#697369]" : product.status === "available" ? "bg-[#E9F4E5] text-[#245B38]" : "bg-[#FFF1D8] text-[#90611E]"}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="p-5">
                      <p className="text-xs font-medium text-[#77975F]">{product.category?.name || "Uncategorized"}</p>
                      <h3 className="mt-1 font-serif text-xl font-semibold text-[#183B2B]">{product.name}</h3>
                      <p className="mt-3 text-lg font-semibold text-[#194C35]">{formatPrice(product.price)} <span className="text-sm font-normal text-[#718073]">/ {product.unit}</span></p>
                      <div className="mt-4 space-y-1.5 border-t border-[#EEF0E9] pt-4 text-sm text-[#718073]">
                        <p>Stock: <span className="font-medium text-[#183B2B]">{product.quantity} {product.unit}</span></p>
                        <p>Location: <span className="font-medium text-[#183B2B]">{product.location?.city || "Not specified"}</span></p>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <Link to={`/farmer/edit-product/${product._id}`} className="rounded-xl bg-[#194C35] px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#123A29]">Edit</Link>
                        <button type="button" onClick={() => handleRemoveProduct(product._id)} disabled={inactive || removingId === product._id} className="rounded-xl border border-[#E7C8C5] px-3 py-2.5 text-sm font-semibold text-[#A64E46] transition hover:bg-[#FFF4F2] disabled:cursor-not-allowed disabled:opacity-50">
                          {inactive ? "Removed" : removingId === product._id ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-10 flex flex-col gap-5 rounded-2xl bg-[#194C35] p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#BDD6AC]">Also buying on FarmConnect?</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold">Shop from other farmers</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">Use the same farmer account to discover produce and follow your purchases.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link to="/buyer/marketplace" className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#194C35] hover:bg-[#E9F0E2]">Marketplace</Link>
            <Link to="/buyer/orders" className="rounded-xl border border-white/40 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">My Purchases</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default FarmerDashboard;
