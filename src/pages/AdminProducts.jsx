
import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reason, setReason] = useState("");

  const getToken = () => sessionStorage.getItem("token");

  const loadProducts = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/admin/products`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load products");
      }

      setProducts(data.products || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const stats = useMemo(() => ({
    total: products.length,
    available: products.filter(
      (p) =>
        p.status === "available" &&
        p.moderation?.status !== "removed"
    ).length,
    removed: products.filter(
      (p) => p.moderation?.status === "removed"
    ).length,
  }), [products]);

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase().trim();

    return products.filter((product) => {
      const matchesSearch =
        !term ||
        product.name?.toLowerCase().includes(term) ||
        product.farmer?.name?.toLowerCase().includes(term);

      const removed = product.moderation?.status === "removed";

      const matchesFilter =
        filter === "all" ||
        (filter === "removed" && removed) ||
        (filter === "approved" && !removed);

      return matchesSearch && matchesFilter;
    });
  }, [products, search, filter]);

  const moderate = async (product, action, removalReason = "") => {
    try {
      setSavingId(product._id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/admin/products/${product._id}/moderation`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            action,
            reason: removalReason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Moderation failed");
      }

      setSuccess(data.message);
      setSelectedProduct(null);
      setReason("");
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleRemove = () => {
    if (!selectedProduct || !reason.trim()) return;
    moderate(selectedProduct, "remove", reason.trim());
  };

  const handleRestore = (product) => {
    if (
      window.confirm(
        `Restore "${product.name}" to its previous listing status?`
      )
    ) {
      moderate(product, "restore");
    }
  };

  const imageUrl = (path) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  return (
    <main className="min-h-screen bg-[#FAF9F4] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#77975F]">
          Marketplace administration
        </p>

        <h1 className="mt-2 font-serif text-4xl font-semibold text-[#183B2B]">
          Manage Products
        </h1>

        <p className="mt-2 text-sm text-[#718073]">
          Review listings and protect the FarmConnect marketplace.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Total listings", stats.total],
            ["Available listings", stats.available],
            ["Removed by admin", stats.removed],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-[#E1E8DC] bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-[#718073]">{label}</p>
              <p className="mt-2 font-serif text-3xl font-semibold text-[#194C35]">
                {value}
              </p>
            </div>
          ))}
        </div>

        {error && (
          <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-800">
            {success}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3 rounded-2xl border border-[#E1E8DC] bg-white p-4">
          <input
            type="search"
            placeholder="Search products or farmers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 basis-60 rounded-xl border border-[#DCE5D6] px-4 py-3 text-sm outline-none"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-[#DCE5D6] bg-white px-4 py-3 text-sm"
          >
            <option value="all">All products</option>
            <option value="approved">Not removed</option>
            <option value="removed">Removed by admin</option>
          </select>
        </div>

        {loading ? (
          <p className="mt-8 text-center text-gray-500">
            Loading products...
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-[#E1E8DC] bg-white shadow-sm">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-[#F5F8F1] text-[#536E59]">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">Farmer</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Listing</th>
                  <th className="p-4">Moderation</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => {
                  const removed =
                    product.moderation?.status === "removed";

                  return (
                    <tr
                      key={product._id}
                      className="border-t border-[#EEF1EA]"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <img
                              src={imageUrl(product.images[0])}
                              alt={product.name}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-[#E7F0DC]" />
                          )}
                          <span className="font-semibold text-[#183B2B]">
                            {product.name}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        {product.farmer?.name || "Unknown"}
                      </td>

                      <td className="p-4">
                        D{Number(product.price).toFixed(2)}
                      </td>

                      <td className="p-4">
                        {product.quantity} {product.unit}
                      </td>

                      <td className="p-4 capitalize">
                        {product.status?.replaceAll("_", " ")}
                      </td>

                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            removed
                              ? "bg-red-50 text-red-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {removed ? "Removed" : "Approved"}
                        </span>
                        {removed && product.moderation?.reason && (
                          <p className="mt-2 max-w-48 text-xs text-gray-500">
                            {product.moderation.reason}
                          </p>
                        )}
                      </td>

                      <td className="p-4">
                        {removed ? (
                          <button
                            type="button"
                            disabled={savingId === product._id}
                            onClick={() => handleRestore(product)}
                            className="rounded-lg bg-[#194C35] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={savingId === product._id}
                            onClick={() => {
                              setSelectedProduct(product);
                              setReason("");
                            }}
                            className="rounded-lg bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <p className="p-8 text-center text-gray-500">
                No matching products found.
              </p>
            )}
          </div>
        )}

        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="moderation-title"
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            >
              <h2
                id="moderation-title"
                className="text-xl font-semibold text-[#183B2B]"
              >
                Remove product listing
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                Explain why "{selectedProduct.name}" is being removed.
              </p>

              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                rows={4}
                className="mt-4 w-full rounded-xl border border-gray-300 p-3 text-sm"
                placeholder="Reason for removal..."
              />

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="rounded-lg border px-4 py-2 text-sm"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={!reason.trim() || Boolean(savingId)}
                  onClick={handleRemove}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Confirm removal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
