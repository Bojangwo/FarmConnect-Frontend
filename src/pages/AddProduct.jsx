
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCategories, createProduct } from "../services/api";

const inputClass =
  "mt-2 w-full rounded-xl border border-[#DCE5D6] bg-white px-4 py-3 text-sm text-[#183B2B] outline-none transition focus:border-[#77975F] focus:ring-2 focus:ring-[#E9F0E2]";

const labelClass = "block text-sm font-medium text-[#183B2B]";

function ImagePreview({ file, onRemove }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-[#E1E8DC] bg-[#F2F5ED]">
      {url && (
        <img
          src={url}
          alt={file.name}
          className="h-36 w-full object-cover"
        />
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-3 pt-8">
        <p className="truncate text-xs text-white">
          {file.name}
        </p>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="absolute right-2 top-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm hover:bg-red-50"
      >
        Remove
      </button>
    </div>
  );
}

function AddProduct() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    quantity: "",
    unit: "kg",
  });

  const [images, setImages] = useState([]);

  const [location, setLocation] = useState(() => {
    const user = JSON.parse(
      sessionStorage.getItem("user") || "null"
    );

    return {
      address: user?.location?.address || "",
      city: user?.location?.city || "",
      region: user?.location?.region || "",
      longitude: user?.location?.coordinates?.[0] ?? "",
      latitude: user?.location?.coordinates?.[1] ?? "",
    };
  });

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const data = await getCategories();

        if (!cancelled) {
          setCategories(
            (data.categories || []).filter(
              (category) => category.status === "active"
            )
          );
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleLocationChange(event) {
    const { name, value } = event.target;

    setLocation((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleImages(event) {
    const selected = Array.from(event.target.files || []);

    // Allow the same file to be selected again later.
    event.target.value = "";

    if (!selected.length) return;

    if (selected.some((file) => !file.type.startsWith("image/"))) {
      setError("Please select image files only.");
      return;
    }

    if (images.length + selected.length > 5) {
      setError("You can upload a maximum of 5 images.");
      return;
    }

    setImages((previous) => [...previous, ...selected]);
    setError("");
  }

  function removeImage(index) {
    setImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    );
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setError("Your browser does not support GPS location.");
      return;
    }

    setError("");
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation((previous) => ({
          ...previous,
          longitude: position.coords.longitude.toString(),
          latitude: position.coords.latitude.toString(),
        }));

        setLocating(false);
      },
      (geoError) => {
        const message =
          geoError.code === 1
            ? "Location permission was denied. You can enter coordinates manually."
            : "Unable to determine your location. Please enter coordinates manually.";

        setError(message);
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
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

    if (
      form.price === "" ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) < 0
    ) {
      setError("Please enter a valid product price.");
      return;
    }

    if (
      form.quantity === "" ||
      !Number.isFinite(Number(form.quantity)) ||
      Number(form.quantity) < 0
    ) {
      setError("Please enter a valid quantity.");
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
        address: location.address.trim(),
        city: location.city.trim(),
        region: location.region.trim(),
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
      setError(err.message || "Failed to add product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF9F4] px-4 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/farmer/dashboard"
          className="text-sm font-medium text-[#477341] hover:text-[#194C35]"
        >
          ← Farmer Dashboard
        </Link>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#77975F]">
            Farm management
          </p>

          <h1 className="mt-2 font-serif text-4xl font-semibold text-[#183B2B]">
            Add New Product
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#718073]">
            Create a fresh listing for your farm produce.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-9 rounded-2xl border border-[#E1E8DC] bg-white p-5 shadow-sm sm:p-8"
        >
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-800"
            >
              {success}
            </div>
          )}

          {/* PRODUCT INFORMATION */}
          <section>
            <div className="mb-6">
              <h2 className="font-serif text-2xl font-semibold text-[#183B2B]">
                Product information
              </h2>
              <p className="mt-1 text-sm text-[#718073]">
                Tell buyers what you're offering.
              </p>
            </div>

            <div className="space-y-5">
              <label className={labelClass}>
                Product Name
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Fresh Tomatoes"
                  required
                  disabled={saving}
                  className={inputClass}
                />
              </label>

              <label className={labelClass}>
                Category
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  disabled={loading || saving}
                  className={inputClass}
                >
                  <option value="">
                    {loading
                      ? "Loading categories..."
                      : "Select category"}
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category._id}
                      value={category._id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClass}>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the quality, freshness, and details of your produce..."
                  rows={4}
                  required
                  disabled={saving}
                  className={inputClass}
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClass}>
                  Price (GMD)
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="e.g. 150"
                    required
                    disabled={saving}
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Quantity Available
                  <input
                    type="number"
                    name="quantity"
                    min="0"
                    value={form.quantity}
                    onChange={handleChange}
                    placeholder="e.g. 25"
                    required
                    disabled={saving}
                    className={inputClass}
                  />
                </label>
              </div>

              <label className={labelClass}>
                Unit of Measurement
                <select
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  disabled={saving}
                  className={inputClass}
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="bag">Bag</option>
                  <option value="basket">Basket</option>
                  <option value="piece">Piece</option>
                  <option value="bunch">Bunch</option>
                  <option value="litre">Litre</option>
                </select>
              </label>
            </div>
          </section>

          {/* PRODUCT PHOTOS */}
          <section className="border-t border-[#E1E8DC] pt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-[#183B2B]">
                  Product photos
                </h2>
                <p className="mt-1 text-sm text-[#718073]">
                  Add clear pictures so buyers can see your produce.
                </p>
              </div>

              <span className="rounded-full bg-[#E9F0E2] px-3 py-1 text-sm font-medium text-[#194C35]">
                {images.length} / 5 photos
              </span>
            </div>

            {images.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {images.map((file, index) => (
                  <ImagePreview
                    key={`${file.name}-${file.lastModified}-${index}`}
                    file={file}
                    onRemove={() => removeImage(index)}
                  />
                ))}
              </div>
            )}

            <label className="mt-6 block rounded-xl border border-dashed border-[#A8BDA0] bg-[#F6F9F2] p-6 text-center">
              <span className="block text-sm font-semibold text-[#194C35]">
                + Choose product photos
              </span>

              <span className="mt-2 block text-xs text-[#718073]">
                JPG, PNG, or other supported image formats.
                Maximum 5 pictures.
              </span>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImages}
                disabled={saving || images.length >= 5}
                className="mt-5 block w-full text-sm text-[#718073] file:mr-4 file:rounded-full file:border-0 file:bg-[#194C35] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#123D2A] disabled:opacity-50"
              />
            </label>

            <p className="mt-3 text-xs text-[#718073]">
              You can remove selected photos before publishing.
              You'll also be able to edit them later.
            </p>
          </section>

          {/* PRODUCT LOCATION */}
          <section className="border-t border-[#E1E8DC] pt-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-[#183B2B]">
                  Product location
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-[#718073]">
                  Your registered location is filled in automatically.
                  Update it if this produce is stored elsewhere.
                </p>
              </div>

              <button
                type="button"
                onClick={captureLocation}
                disabled={locating || saving}
                className="rounded-full border border-[#CBD8C4] bg-[#F6F9F2] px-5 py-2.5 text-sm font-semibold text-[#194C35] transition hover:bg-[#E9F0E2] disabled:opacity-60"
              >
                {locating ? "Getting location..." : "Use my current location"}
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <label className={labelClass}>
                Address
                <input
                  type="text"
                  name="address"
                  value={location.address}
                  onChange={handleLocationChange}
                  placeholder="e.g. Brikama Market"
                  disabled={saving}
                  className={inputClass}
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClass}>
                  City
                  <input
                    type="text"
                    name="city"
                    value={location.city}
                    onChange={handleLocationChange}
                    placeholder="e.g. Brikama"
                    disabled={saving}
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Region
                  <input
                    type="text"
                    name="region"
                    value={location.region}
                    onChange={handleLocationChange}
                    placeholder="e.g. West Coast Region"
                    disabled={saving}
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClass}>
                  Longitude
                  <input
                    type="number"
                    name="longitude"
                    step="any"
                    min="-180"
                    max="180"
                    value={location.longitude}
                    onChange={handleLocationChange}
                    placeholder="Longitude"
                    required
                    disabled={saving}
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Latitude
                  <input
                    type="number"
                    name="latitude"
                    step="any"
                    min="-90"
                    max="90"
                    value={location.latitude}
                    onChange={handleLocationChange}
                    placeholder="Latitude"
                    required
                    disabled={saving}
                    className={inputClass}
                  />
                </label>
              </div>

              <p className="rounded-xl bg-[#F6F9F2] p-4 text-xs leading-5 text-[#718073]">
                Coordinates are saved in longitude, latitude order.
                The location button updates coordinates only;
                check the address, city, and region before saving.
                GPS works on localhost or a secure HTTPS website,
                and requires your permission.
              </p>
            </div>
          </section>

          {/* FORM ACTIONS */}
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#E1E8DC] pt-6">
            <Link
              to="/farmer/dashboard"
              className="rounded-full border border-[#DCE5D6] px-6 py-3 text-sm font-semibold text-[#194C35] transition hover:bg-[#F6F9F2]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving || loading || locating}
              className="rounded-full bg-[#194C35] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#123D2A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Publishing product..." : "Publish Product"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default AddProduct;
