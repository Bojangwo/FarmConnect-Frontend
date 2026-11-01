
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCategories, updateProduct } from "../services/api";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    quantity: "",
    unit: "kg",
    status: "available",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const token = sessionStorage.getItem("token");

        const [productResponse, categoryData] = await Promise.all([
          fetch(`${API_BASE_URL}/products/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          getCategories(),
        ]);

        const productData = await productResponse.json();

        if (!productResponse.ok) {
          throw new Error(
            productData.message || "Failed to load product"
          );
        }

        const product = productData.product;

        const user = JSON.parse(
          sessionStorage.getItem("user") || "null"
        );

        if (
          !user ||
          String(product.farmer?._id || product.farmer) !==
            String(user.id)
        ) {
          throw new Error("You cannot edit this product.");
        }

        setCategories(
          categoryData.categories.filter(
            (category) => category.status === "active"
          )
        );

        setForm({
          name: product.name,
          category: product.category?._id || product.category,
          description: product.description,
          price: product.price,
          quantity: product.quantity,
          unit: product.unit,
          status: product.status,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  function handleChange(e) {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      setSaving(true);

      await updateProduct(id, {
        ...form,
        price: Number(form.price),
        quantity: Number(form.quantity),
      });

      navigate("/farmer/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="p-10 text-center text-gray-600">
        Loading product details...
      </p>
    );
  }

  if (error && !form.name) {
    return (
      <div className="mx-auto max-w-2xl p-10">
        <p className="text-red-600">{error}</p>
        <Link to="/farmer/dashboard" className="text-green-700">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
        <Link
          to="/farmer/dashboard"
          className="text-sm font-medium text-green-700"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-green-900">
          Edit Product
        </h1>

        <p className="mt-2 text-gray-600">
          Update your product information below.
        </p>

        {error && (
          <p className="mt-5 rounded-lg bg-red-50 p-3 text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block font-medium">Product Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 p-3"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="4"
              required
              className="w-full rounded-lg border border-gray-300 p-3"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium">Price (GMD)</label>
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">Quantity</label>
              <input
                type="number"
                name="quantity"
                min="0"
                value={form.quantity}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 p-3"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block font-medium">Unit</label>
            <select
              name="unit"
              value={form.unit}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-3"
            >
              {["kg", "bag", "basket", "piece", "bunch", "litre"].map(
                (unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-3"
            >
              <option value="available">Available</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="sold">Sold</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-green-700 p-3 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
          >
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProduct;
