
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getProductById,
  createPurchaseRequest,
} from "../services/api";

function BuyerProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [quantityRequested, setQuantityRequested] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const data = await getProductById(id);
        setProduct(data.product || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  async function handlePurchaseRequest(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const token = sessionStorage.getItem("token");
    const storedUser = sessionStorage.getItem("user");

    if (!token || !storedUser) {
      navigate("/login");
      return;
    }

    let user;
    try {
      user = JSON.parse(storedUser);
    } catch {
      navigate("/login");
      return;
    }

    if (user.role !== "buyer") {
      setError("Only buyer accounts can submit purchase requests.");
      return;
    }

    const quantity = Number(quantityRequested);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Please enter a valid quantity greater than zero.");
      return;
    }

    if (quantity > product.quantity) {
      setError("Requested quantity exceeds available stock.");
      return;
    }

    if (!deliveryAddress.trim()) {
      setError("Please enter your delivery address.");
      return;
    }

    if (deliveryAddress.trim().length > 300) {
      setError("Delivery address cannot exceed 300 characters.");
      return;
    }

    try {
      setSubmitting(true);

      await createPurchaseRequest({
        product: product._id,
        quantityRequested: quantity,
        deliveryAddress: deliveryAddress.trim(),
        message: message.trim(),
      });

      setSuccess("Purchase request sent successfully!");
      setQuantityRequested("");
      setDeliveryAddress("");
      setMessage("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading product details...</div>;
  }

  if (error && !product) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-red-600">{error}</p>
        <Link to="/buyer/marketplace" className="text-green-700 underline">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  if (!product) {
    return <div className="p-8 text-center">Product not found.</div>;
  }

  const category =
    typeof product.category === "object"
      ? product.category?.name
      : product.category;

  const farmer =
    typeof product.farmer === "object"
      ? product.farmer?.name
      : "Local Farmer";

  const location =
    product.location?.city ||
    product.location?.region ||
    "Location not specified";

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/buyer/marketplace"
          className="mb-6 inline-block text-green-700 hover:underline"
        >
          ← Back to Marketplace
        </Link>

        <div className="grid gap-8 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2">
          <div className="flex min-h-72 items-center justify-center rounded-xl bg-green-100">
            <span className="text-8xl">🌱</span>
          </div>

          <div>
            <h1 className="mb-3 text-3xl font-bold text-green-800">
              {product.name}
            </h1>

            <p className="mb-4 text-2xl font-bold text-green-700">
              D{product.price} / {product.unit}
            </p>

            <p className="mb-4 text-gray-700">
              {product.description || "No description available."}
            </p>

            <div className="space-y-3 text-gray-700">
              <p><strong>Category:</strong> {category || "Uncategorized"}</p>
              <p>
                <strong>Available Quantity:</strong>{" "}
                {product.quantity ?? "Not specified"} {product.unit}
              </p>
              <p><strong>Farmer:</strong> {farmer || "Local Farmer"}</p>
              <p><strong>Location:</strong> {location}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-2xl font-bold text-green-800">
            Request Purchase
          </h2>

          {error && (
            <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
              {error}
            </p>
          )}

          {success && (
            <p className="mb-4 rounded-lg bg-green-100 p-3 text-green-800">
              {success}
            </p>
          )}

          <form onSubmit={handlePurchaseRequest} className="space-y-5">
            <div>
              <label className="mb-2 block font-medium">
                Quantity ({product.unit})
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                max={product.quantity}
                required
                value={quantityRequested}
                onChange={(e) => setQuantityRequested(e.target.value)}
                className="w-full rounded-lg border p-3"
                placeholder="Enter quantity"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Delivery Address
              </label>
              <textarea
                required
                maxLength={300}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full rounded-lg border p-3"
                rows={3}
                placeholder="Enter your delivery address"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Message to Farmer (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg border p-3"
                rows={3}
                placeholder="Any additional information?"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || product.quantity <= 0}
              className="w-full rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Sending Request..." : "Send Purchase Request"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BuyerProductDetails;
