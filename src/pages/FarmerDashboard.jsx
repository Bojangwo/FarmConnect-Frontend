
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyProducts, deleteProduct } from "../services/api";

function FarmerDashboard() {
  const user = JSON.parse(sessionStorage.getItem("user") || "null");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getMyProducts();
        setProducts(data.products);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  
async function handleRemoveProduct(productId) {
  const confirmed = window.confirm(
    "Are you sure you want to remove this product from the marketplace?"
  );

  if (!confirmed) return;

  try {
    setError("");

    await deleteProduct(productId);

    // Keep the product visible but mark it as inactive
    setProducts((previousProducts) =>
      previousProducts.map((product) =>
        product._id === productId
          ? { ...product, status: "inactive" }
          : product
      )
    );

  } catch (err) {
    setError(err.message);
  }
}


  return (
    <div className="min-h-screen bg-green-50">
      <header className="bg-white px-6 py-5 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="text-xl font-bold text-green-800">
            🌾 FarmConnect
          </Link>
          <Link to="/" className="text-sm font-medium text-green-700">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold text-green-900">
          Welcome, {user?.name}!
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your farm business from one place.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "My Products", icon: "🥬", value: products.length },
            { title: <Link
  to="/farmer/purchase-requests"
  className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
>
  <div className="mb-3 text-2xl">📩</div>

  <h3 className="font-bold text-green-900">
    Purchase Requests
  </h3>

  <p className="mt-2 text-sm text-gray-500">
    View and respond to buyer requests
  </p>
</Link>,  },

            { title: 
              <Link
  to="/farmer/orders"
  className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
>
  <div className="mb-3 text-2xl">📦</div>

  <h3 className="font-bold text-green-900">
    Orders
  </h3>

  <p className="mt-2 text-sm text-gray-500">
    View and manage customer orders
  </p>
</Link>
             },

            { title: "Customer Reviews", icon: "⭐", value: "Coming soon" },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="text-4xl">{item.icon}</div>
              <h2 className="mt-4 text-lg font-bold text-green-900">
                {item.title}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                {item.title === "My Products" && loading
                  ? "Loading..."
                  : item.value}
              </p>
            </div>
          ))}
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-green-900">
            My Products
          </h2>
          <p className="mt-2 text-gray-600">
            View the produce you have listed on FarmConnect.
          </p>

          {loading && (
            <p className="mt-6 text-gray-600">Loading your products...</p>
          )}

          {error && (
            <p className="mt-6 text-red-600">{error}</p>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="mt-6 rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="text-gray-600">
                You haven't listed any products yet.
              </p>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm"
                >
                  <div className="flex h-40 items-center justify-center bg-green-100">
                    {product.images?.length > 0 ? (
                      <img
                        src={`http://localhost:5000${product.images[0]}`}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-6xl">🌱</span>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-green-900">
                      {product.name}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {product.category?.name || "Uncategorized"}
                    </p>

                    <p className="mt-4 font-semibold text-green-700">
                      D{product.price} / {product.unit}
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                      Stock: {product.quantity} {product.unit}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Location: {product.location?.city || "Not specified"}
                    </p>

                    <span className="mt-4 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                      {product.status?.replaceAll("_", " ")}
                    </span>

                    <Link
  to={`/farmer/edit-product/${product._id}`}
  className="mt-5 block rounded-lg bg-green-700 px-4 py-2 text-center font-semibold text-white hover:bg-green-800"
>
  Edit Product
</Link>

<button
  type="button"
  onClick={() => handleRemoveProduct(product._id)}
  disabled={product.status === "inactive"}
  className="mt-3 w-full rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
>
  {product.status === "inactive"
    ? "Product Removed"
    : "Remove Product"}
</button>

                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default FarmerDashboard;
