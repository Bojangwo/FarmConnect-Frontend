
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getCategories,
  getProductById,
  updateProduct,
} from "../services/api";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.VITE_API_URL || "http://localhost:5000/api")
    .replace(/\/api\/?$/, "");

const inputClass =
  "mt-2 w-full rounded-xl border border-[#DCE5D6] bg-white px-4 py-3 text-sm text-[#183B2B] outline-none focus:border-[#77975F]";

function NewImagePreview({ file, onRemove }) {
  const preview = useMemo(
    () => URL.createObjectURL(file),
    [file]
  );

  useEffect(() => {
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#E1E8DC]">
      <img
        src={preview}
        alt={file.name}
        className="h-36 w-full object-cover"
      />
      <span className="absolute bottom-2 left-2 rounded-full bg-[#194C35] px-2 py-1 text-xs text-white">
        New
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-700 shadow"
      >
        Remove
      </button>
    </div>
  );
}

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);

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
    let cancelled = false;

    async function loadData() {
      try {
        const [productData, categoryData] = await Promise.all([
          getProductById(id),
          getCategories(),
        ]);

        if (cancelled) return;

        const product = productData.product;
        const user = JSON.parse(
          sessionStorage.getItem("user") || "null"
        );

        const ownerId =
          product.farmer?._id || product.farmer;

        const userId = user?._id || user?.id;

        if (!userId || String(ownerId) !== String(userId)) {
          throw new Error("You cannot edit this product.");
        }

        setCategories(
          categoryData.categories.filter(
            (category) => category.status === "active"
          )
        );

        setForm({
          name: product.name || "",
          category:
            product.category?._id || product.category || "",
          description: product.description || "",
          price: product.price ?? "",
          quantity: product.quantity ?? "",
          unit: product.unit || "kg",
          status: product.status || "available",
        });

        setExistingImages(product.images || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleNewImages(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";

    if (!selected.length) return;

    if (selected.some((file) => !file.type.startsWith("image/"))) {
      setError("Please select image files only.");
      return;
    }

    if (
      existingImages.length +
        newImages.length +
        selected.length >
      5
    ) {
      setError("You can keep a maximum of 5 product images.");
      return;
    }

    setError("");
    setNewImages((previous) => [...previous, ...selected]);
  }

  function removeExistingImage(path) {
    setExistingImages((previous) =>
      previous.filter((image) => image !== path)
    );
  }

  function removeNewImage(index) {
    setNewImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      setSaving(true);

      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      formData.append(
        "keepImages",
        JSON.stringify(existingImages)
      );

      newImages.forEach((file) => {
        formData.append("images", file);
      });

      await updateProduct(id, formData);

      navigate("/farmer/dashboard", {
        replace: true,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const imageCount = existingImages.length + newImages.length;

  if (loading) {
    return (
      <div className="p-10 text-center text-[#718073]">
        Loading product details...
      </div>
    );
  }

  if (error && !form.name) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <p className="text-red-700">{error}</p>
        <Link to="/farmer/dashboard" className="text-[#194C35]">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF9F4] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/farmer/dashboard"
          className="text-sm font-medium text-[#477341]"
        >
          ← Farmer Dashboard
        </Link>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#77975F]">
            Farm management
          </p>

          <h1 className="mt-2 font-serif text-4xl font-semibold text-[#183B2B]">
            Edit Product
          </h1>

          <p className="mt-2 text-sm text-[#718073]">
            Update your listing and manage your product photos.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-8 rounded-2xl border border-[#E1E8DC] bg-white p-6 shadow-sm sm:p-8"
        >
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <section>
            <h2 className="font-serif text-2xl text-[#183B2B]">
              Product information
            </h2>

            <div className="mt-5 space-y-5">
              <label className="block text-sm font-medium text-[#183B2B]">
                Product Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </label>

              <label className="block text-sm font-medium text-[#183B2B]">
                Category
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-[#183B2B]">
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  required
                  className={inputClass}
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-[#183B2B]">
                  Price (GMD)
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </label>

                <label className="block text-sm font-medium text-[#183B2B]">
                  Quantity
                  <input
                    type="number"
                    name="quantity"
                    min="0"
                    value={form.quantity}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </label>

                <label className="block text-sm font-medium text-[#183B2B]">
                  Unit
                  <select
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {["kg", "bag", "basket", "piece", "bunch", "litre"].map(
                      (unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="block text-sm font-medium text-[#183B2B]">
                  Status
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="available">Available</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="sold">Sold</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>
            </div>
          </section>

          <section className="border-t border-[#E1E8DC] pt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl text-[#183B2B]">
                  Product photos
                </h2>
                <p className="mt-1 text-sm text-[#718073]">
                  Remove old photos or upload fresh ones.
                </p>
              </div>

              <span className="rounded-full bg-[#E9F0E2] px-3 py-1 text-sm text-[#194C35]">
                {imageCount} / 5 photos
              </span>
            </div>

            {imageCount > 0 ? (
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {existingImages.map((path) => (
                  <div
                    key={path}
                    className="relative overflow-hidden rounded-xl border border-[#E1E8DC]"
                  >
                    <img
                      src={`${BACKEND_URL}${path}`}
                      alt="Existing product"
                      className="h-36 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(path)}
                      className="absolute right-2 top-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-700 shadow"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                {newImages.map((file, index) => (
                  <NewImagePreview
                    key={`${file.name}-${file.lastModified}-${index}`}
                    file={file}
                    onRemove={() => removeNewImage(index)}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-[#CBD8C4] bg-[#FAF9F4] p-8 text-center text-sm text-[#718073]">
                No product photos selected yet.
              </div>
            )}

            <label className="mt-5 block rounded-xl border border-dashed border-[#A8BDA0] bg-[#F6F9F2] p-6 text-center">
              <span className="block font-semibold text-[#194C35]">
                + Add product photos
              </span>
              <span className="mt-1 block text-xs text-[#718073]">
                Choose up to {5 - imageCount} more images
              </span>

              <input
                type="file"
                accept="image/*"
                multiple
                disabled={imageCount >= 5 || saving}
                onChange={handleNewImages}
                className="mt-4 block w-full text-sm text-[#718073] file:mr-4 file:rounded-full file:border-0 file:bg-[#194C35] file:px-4 file:py-2 file:text-white disabled:opacity-50"
              />
            </label>

            <p className="mt-3 text-xs text-[#718073]">
              Photos marked for removal will only be removed from the
              listing when you save your changes.
            </p>
          </section>

          <div className="flex flex-wrap justify-end gap-3 border-t border-[#E1E8DC] pt-6">
            <Link
              to="/farmer/dashboard"
              className="rounded-full border border-[#DCE5D6] px-6 py-3 text-sm font-semibold text-[#194C35]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#194C35] px-8 py-3 text-sm font-semibold text-white hover:bg-[#123D2A] disabled:opacity-60"
            >
              {saving ? "Saving changes..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default EditProduct;
