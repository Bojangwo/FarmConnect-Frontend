import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCategories, createProduct } from "../services/api";

function AddProduct() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    quantity: "",
    unit: "kg",
  });

  const navigate = useNavigate();

const [images, setImages] = useState([]);
const [saving, setSaving] = useState(false);
const [success, setSuccess] = useState("");
const [location, setLocation] = useState(() => {
  const user = JSON.parse(sessionStorage.getItem("user") || "null");

  return {
    address: user?.location?.address || "",
    city: user?.location?.city || "",
    region: user?.location?.region || "",
    longitude: user?.location?.coordinates?.[0] ?? "",
    latitude: user?.location?.coordinates?.[1] ?? "",
  };
});

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getCategories();
        setCategories(
          data.categories.filter(
            (category) => category.status === "active"
          )
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, []);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  
async function handleSubmit(e) {
  e.preventDefault();
  setError("");
  setSuccess("");

  const longitude = Number(location.longitude);
  const latitude = Number(location.latitude);

  if (
    location.longitude === "" ||
    location.latitude === "" ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    setError("Please enter valid longitude and latitude.");
    return;
  }

  if (images.length > 5) {
    setError("You can upload a maximum of 5 images.");
    return;
  }

  const formData = new FormData();

  formData.append("name", form.name.trim());
  formData.append("category", form.category);
  formData.append("description", form.description.trim());
  formData.append("price", form.price);
  formData.append("quantity", form.quantity);
  formData.append("unit", form.unit);

  formData.append(
    "location",
    JSON.stringify({
      address: location.address,
      city: location.city,
      region: location.region,
      coordinates: [longitude, latitude],
    })
  );

  images.forEach((image) => {
    formData.append("images", image);
  });

  try {
    setSaving(true);

    await createProduct(formData);

    setSuccess("Product added successfully!");

    navigate("/farmer/dashboard", { replace: true });
  } catch (err) {
    setError(err.message);
  } finally {
    setSaving(false);
  }
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
          Add New Product
        </h1>

        <p className="mt-2 text-gray-600">
          Enter the details of the produce you want to sell.
        </p>

        {error && (
          <p className="mt-5 rounded-lg bg-red-50 p-3 text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block font-medium">
              Product Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Fresh Tomatoes"
              required
              className="w-full rounded-lg border border-gray-300 p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 p-3"
            >
              <option value="">
                {loading ? "Loading categories..." : "Select category"}
              </option>

              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe your product"
              rows="4"
              required
              className="w-full rounded-lg border border-gray-300 p-3"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium">
                Price (GMD)
              </label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                className="w-full rounded-lg border border-gray-300 p-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Quantity
              </label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                min="0"
                required
                className="w-full rounded-lg border border-gray-300 p-3"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Unit
            </label>
            <select
              name="unit"
              value={form.unit}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-3"
            >
              <option value="kg">Kilograms (kg)</option>
              <option value="bag">Bag</option>
              <option value="basket">Basket</option>
              <option value="piece">Piece</option>
              <option value="bunch">Bunch</option>
              <option value="litre">Litre</option>
            </select>
          </div>

          
<div className="border-t border-gray-200 pt-6">
  <h2 className="text-xl font-bold text-green-900">
    Product Location
  </h2>
  <p className="mt-1 text-sm text-gray-500">
    Your registered location is filled in automatically.
  </p>
</div>

<div>
  <label className="mb-2 block font-medium">Address</label>
  <input
    type="text"
    value={location.address}
    onChange={(e) =>
      setLocation({ ...location, address: e.target.value })
    }
    placeholder="e.g. Brikama Market"
    className="w-full rounded-lg border border-gray-300 p-3"
  />
</div>

<div className="grid gap-5 sm:grid-cols-2">
  <div>
    <label className="mb-2 block font-medium">City</label>
    <input
      type="text"
      value={location.city}
      onChange={(e) =>
        setLocation({ ...location, city: e.target.value })
      }
      className="w-full rounded-lg border border-gray-300 p-3"
    />
  </div>

  <div>
    <label className="mb-2 block font-medium">Region</label>
    <input
      type="text"
      value={location.region}
      onChange={(e) =>
        setLocation({ ...location, region: e.target.value })
      }
      className="w-full rounded-lg border border-gray-300 p-3"
    />
  </div>
</div>

<div className="grid gap-5 sm:grid-cols-2">
  <div>
    <label className="mb-2 block font-medium">Longitude</label>
    <input
      type="number"
      step="any"
      required
      value={location.longitude}
      onChange={(e) =>
        setLocation({ ...location, longitude: e.target.value })
      }
      className="w-full rounded-lg border border-gray-300 p-3"
    />
  </div>

  <div>
    <label className="mb-2 block font-medium">Latitude</label>
    <input
      type="number"
      step="any"
      required
      value={location.latitude}
      onChange={(e) =>
        setLocation({ ...location, latitude: e.target.value })
      }
      className="w-full rounded-lg border border-gray-300 p-3"
    />
  </div>
</div>

<div>
  <label className="mb-2 block font-medium">
    Product Images (Maximum 5)
  </label>
  <input
    type="file"
    accept="image/*"
    multiple
    onChange={(e) => setImages(Array.from(e.target.files))}
    className="w-full rounded-lg border border-gray-300 p-3"
  />
  <p className="mt-1 text-sm text-gray-500">
    {images.length} image(s) selected
  </p>
</div>


          <button
  type="submit"
  disabled={saving || loading}
  className="w-full rounded-lg bg-green-700 p-3 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
>
  {saving ? "Saving Product..." : "Save Product"}
</button>
        </form>
      </div>
    </div>
  );
}

export default AddProduct;
