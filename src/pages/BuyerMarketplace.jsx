
import { useEffect, useState } from "react";
import {
  getMarketplaceProducts,
  getCategories,
} from "../services/api";
import { Link } from "react-router-dom";

function BuyerMarketplace() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMarketplace() {
      try {
        const [productsData, categoriesData] = await Promise.all([
          getMarketplaceProducts(),
          getCategories(),
        ]);

        setProducts(
          Array.isArray(productsData)
            ? productsData
            : productsData.products || []
        );

        setCategories(
          Array.isArray(categoriesData)
            ? categoriesData
            : categoriesData.categories || []
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadMarketplace();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const categoryId =
      typeof product.category === "object"
        ? product.category?._id
        : product.category;

    const matchesCategory =
      !selectedCategory || categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-2 text-3xl font-bold text-green-800">
          FarmConnect Marketplace 🌾
        </h1>

        <p className="mb-6 text-gray-600">
          Discover fresh farm products from local farmers.
        </p>

        <div className="mb-8 flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm md:flex-row">
          <input
            type="text"
            placeholder="Search for products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border p-3 outline-green-600"
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border p-3 outline-green-600"
          >
            <option value="">All Categories</option>

            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {loading && <p>Loading products...</p>}

        {error && (
          <p className="rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <p className="mb-4 text-sm text-gray-600">
              {filteredProducts.length} products found
            </p>

            {filteredProducts.length === 0 ? (
              <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                <p className="text-gray-500">
                  No products found. Try another search.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-lg"
                  >
                    <div className="flex h-48 items-center justify-center bg-green-100">
                      <span className="text-6xl">🌱</span>
                    </div>

                    <div className="p-5">
                      <h2 className="text-lg font-bold text-gray-800">
                        {product.name}
                      </h2>

                      <p className="mt-2 text-xl font-bold text-green-700">
                        D{product.price} / {product.unit}
                      </p>

                      <p className="mt-2 text-sm text-gray-500">
                        Available: {product.quantity ?? "Not specified"} {product.unit}
                      </p>

                     <Link
  to={`/buyer/products/${product._id}`}
  className="mt-4 block w-full rounded-lg bg-green-700 px-4 py-3 text-center font-semibold text-white hover:bg-green-800"
>
  View Details
</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default BuyerMarketplace;
