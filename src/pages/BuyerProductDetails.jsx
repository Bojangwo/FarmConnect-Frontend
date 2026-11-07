
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getProductById,
  createPurchaseRequest,
  getFarmerReviews,
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
  const [farmerReviews, setFarmerReviews] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");
        setProduct(null);
        setImageFailed(false);

        const data = await getProductById(id);

        if (active) {
          setProduct(data.product || data);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load product.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    const farmerId = product?.farmer?._id;

    if (!farmerId) {
      setFarmerReviews(null);
      return;
    }

    let active = true;

    async function loadReviews() {
      try {
        setReviewsLoading(true);
        setReviewsError("");
        setFarmerReviews(null);

        const data = await getFarmerReviews(farmerId);

        if (active) setFarmerReviews(data);
      } catch (err) {
        if (active) {
          setReviewsError(
            err.message || "Unable to load customer reviews."
          );
        }
      } finally {
        if (active) setReviewsLoading(false);
      }
    }

    loadReviews();

    return () => {
      active = false;
    };
  }, [product?.farmer?._id]);

  const formatPrice = (value) =>
    new Intl.NumberFormat("en-GM", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  const getProductImage = (item) => {
    const image = item?.images?.[0];

    if (!image) return null;

    const imagePath =
      typeof image === "string"
        ? image
        : image.url || image.path;

    if (!imagePath) return null;

    if (/^https?:\/\//i.test(imagePath)) {
      return imagePath;
    }

    const backendUrl =
      import.meta.env.VITE_BACKEND_URL ||
      "http://localhost:5000";

    return `${backendUrl.replace(/\/$/, "")}/${imagePath.replace(
      /^\/+/,
      ""
    )}`;
  };

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
    const available = Number(
      product.quantityAvailable ?? product.quantity ?? 0
    );

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Please enter a valid quantity greater than zero.");
      return;
    }

    if (quantity > available) {
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
      setError(err.message || "Unable to send purchase request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F4] px-6 py-14">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="mb-8 h-5 w-40 rounded bg-gray-200" />
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="h-[460px] rounded-3xl bg-[#E5EADD]" />
            <div className="space-y-6 rounded-3xl bg-white p-8">
              <div className="h-10 w-3/4 rounded bg-gray-200" />
              <div className="h-7 w-1/3 rounded bg-gray-200" />
              <div className="h-24 rounded bg-gray-100" />
              <div className="h-36 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F4] px-6 text-center">
        <h1 className="font-serif text-3xl text-[#183B2B]">
          Product unavailable
        </h1>
        <p className="mt-4 text-gray-500">
          {error || "We couldn't find this product."}
        </p>
        <Link
          to="/buyer/marketplace"
          className="mt-7 rounded-full bg-[#194C35] px-7 py-3 text-white"
        >
          Return to Marketplace
        </Link>
      </div>
    );
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
    [
      product.location?.city,
      product.location?.region,
    ]
      .filter(Boolean)
      .join(", ") || "Location not specified";

  const availableQuantity = Number(
    product.quantityAvailable ?? product.quantity ?? 0
  );

  const imageUrl = getProductImage(product);

  const estimatedSubtotal =
    Number(quantityRequested) > 0
      ? Number(quantityRequested) * Number(product.price)
      : 0;

  return (
    <div className="min-h-screen bg-[#FAF9F4] text-[#183B2B]">
      {/* Page introduction */}
      <section className="border-b border-[#E4E9DE] bg-[#F0F2E8]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <Link
            to="/buyer/marketplace"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#507459] transition hover:text-[#194C35]"
          >
            ← Back to Marketplace
          </Link>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.25em] text-[#77975F]">
            Fresh from our farmers
          </p>

          <h1 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">
            {product.name}
          </h1>

          <p className="mt-3 text-[#728073]">
            Home / Marketplace / {product.name}
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        {/* Product overview */}
        <div className="grid gap-9 lg:grid-cols-2 lg:items-start">
          {/* Product image */}
          <div className="overflow-hidden rounded-[28px] border border-[#E3E9DC] bg-[#E9EEE2] shadow-sm">
            <div className="relative aspect-[4/4.5] sm:aspect-square">
              {imageUrl && !imageFailed ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#E8EEE0] px-6 text-center">
                  <span className="text-6xl">🌿</span>
                  <p className="text-sm text-[#789075]">
                    Product photograph unavailable
                  </p>
                </div>
              )}

              <span className="absolute left-5 top-5 rounded-full bg-white/95 px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#27563A] shadow-sm">
                Farm fresh
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 border-t border-[#E3E9DC] bg-white px-6 py-5 text-sm text-[#5B755E]">
              <span>🌱</span>
              <span>Fresh produce from local farmers</span>
            </div>
          </div>

          {/* Product information */}
          <div className="lg:py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#78965D]">
              {category || "Farm Produce"}
            </p>

            <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight sm:text-5xl">
              {product.name}
            </h2>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <p className="text-3xl font-bold text-[#1A6542]">
                D{formatPrice(product.price)}
                <span className="ml-2 text-base font-normal text-[#7A877D]">
                  / {product.unit}
                </span>
              </p>

              <span
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  availableQuantity > 0
                    ? "bg-[#E5F1DC] text-[#477341]"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {availableQuantity > 0 ? "In Stock" : "Out of Stock"}
              </span>
            </div>

            <div className="my-8 h-px bg-[#E1E7DB]" />

            <h3 className="font-serif text-xl font-semibold">
              About this product
            </h3>

            <p className="mt-3 leading-8 text-[#68786C]">
              {product.description || "No description available."}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#E3E9DD] bg-white p-5">
                <p className="text-xs uppercase tracking-wider text-[#819083]">
                  Farmer
                </p>
                <p className="mt-2 font-semibold text-[#254D36]">
                  {farmer || "Local Farmer"}
                </p>
              </div>

              <div className="rounded-2xl border border-[#E3E9DD] bg-white p-5">
                <p className="text-xs uppercase tracking-wider text-[#819083]">
                  Farm Location
                </p>
                <p className="mt-2 font-semibold text-[#254D36]">
                  {location}
                </p>
              </div>

              <div className="rounded-2xl border border-[#E3E9DD] bg-white p-5">
                <p className="text-xs uppercase tracking-wider text-[#819083]">
                  Available Quantity
                </p>
                <p className="mt-2 font-semibold text-[#254D36]">
                  {availableQuantity} {product.unit}
                </p>
              </div>

              <div className="rounded-2xl border border-[#E3E9DD] bg-white p-5">
                <p className="text-xs uppercase tracking-wider text-[#819083]">
                  Farmer Rating
                </p>
                <p className="mt-2 font-semibold text-[#254D36]">
                  {farmerReviews?.totalReviews > 0
                    ? `★ ${farmerReviews.averageRating}/5 (${farmerReviews.totalReviews})`
                    : "No reviews yet"}
                </p>
              </div>
            </div>

            <div className="mt-7 rounded-2xl bg-[#E9F0E2] px-6 py-5">
              <p className="font-semibold text-[#27583B]">
                🌾 Supporting local agriculture
              </p>
              <p className="mt-2 text-sm leading-7 text-[#647765]">
                Connect directly with farmers and request fresh
                produce through FarmConnect.
              </p>
            </div>
          </div>
        </div>

        {/* Purchase request */}
        <section
          id="request-purchase"
          className="mt-16 grid overflow-hidden rounded-[28px] border border-[#E3E9DD] bg-white shadow-sm lg:grid-cols-[0.8fr_1.2fr]"
        >
          <div className="bg-[#194C35] px-8 py-12 text-white sm:px-12">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#B6D5A2]">
              Ready to order?
            </p>

            <h2 className="mt-5 font-serif text-4xl font-semibold leading-tight">
              Fresh produce,
              <span className="block italic text-[#C5DCA9]">
                one request away.
              </span>
            </h2>

            <p className="mt-6 leading-8 text-white/75">
              Tell the farmer how much you need and where
              you'd like your produce delivered.
            </p>

            <div className="mt-10 space-y-5 border-t border-white/20 pt-8 text-sm text-white/85">
              <p>✓ Send a purchase request</p>
              <p>✓ Wait for the farmer's acceptance</p>
              <p>✓ Pay securely through ModemPay</p>
              <p>✓ Track delivery progress</p>
            </div>
          </div>

          <div className="p-7 sm:p-10 lg:p-12">
            <h3 className="font-serif text-3xl font-semibold">
              Request Purchase
            </h3>

            <p className="mt-3 text-sm leading-7 text-[#788579]">
              Complete the form below to send your request
              directly to the farmer.
            </p>

            {error && (
              <p
                role="alert"
                className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {success && (
              <div
                role="status"
                className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
              >
                <p className="font-bold">✓ Request submitted!</p>
                <p className="mt-1">{success}</p>
                <Link
                  to="/buyer/orders"
                  className="mt-3 inline-block font-semibold underline"
                >
                  View My Orders
                </Link>
              </div>
            )}

            <form onSubmit={handlePurchaseRequest} className="mt-8 space-y-6">
              <div>
                <label
                  htmlFor="purchase-quantity"
                  className="mb-2 block text-sm font-semibold"
                >
                  Quantity ({product.unit})
                </label>

                <input
                  id="purchase-quantity"
                  type="number"
                  min="0.01"
                  step="any"
                  max={availableQuantity}
                  required
                  value={quantityRequested}
                  onChange={(e) => setQuantityRequested(e.target.value)}
                  placeholder="How much would you like?"
                  className="w-full rounded-xl border border-[#DFE7DB] bg-[#FAFBF8] px-4 py-4 outline-none transition focus:border-[#77975F] focus:ring-2 focus:ring-[#77975F]/15"
                />
              </div>

              <div>
                <label
                  htmlFor="purchase-address"
                  className="mb-2 block text-sm font-semibold"
                >
                  Delivery Address
                </label>

                <textarea
                  id="purchase-address"
                  required
                  maxLength={300}
                  rows={3}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter your delivery location"
                  className="w-full resize-y rounded-xl border border-[#DFE7DB] bg-[#FAFBF8] px-4 py-4 outline-none transition focus:border-[#77975F] focus:ring-2 focus:ring-[#77975F]/15"
                />
                <p className="mt-2 text-right text-xs text-gray-400">
                  {deliveryAddress.length}/300
                </p>
              </div>

              <div>
                <label
                  htmlFor="purchase-message"
                  className="mb-2 block text-sm font-semibold"
                >
                  Message to Farmer
                  <span className="ml-2 font-normal text-gray-400">
                    (Optional)
                  </span>
                </label>

                <textarea
                  id="purchase-message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Any special instructions?"
                  className="w-full resize-y rounded-xl border border-[#DFE7DB] bg-[#FAFBF8] px-4 py-4 outline-none transition focus:border-[#77975F] focus:ring-2 focus:ring-[#77975F]/15"
                />
              </div>

              <div className="rounded-2xl bg-[#F1F5EB] p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-[#718073]">
                    Estimated product subtotal
                  </span>
                  <span className="text-xl font-bold text-[#1A6542]">
                    D{formatPrice(estimatedSubtotal)}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-6 text-[#829083]">
                  Based on your requested quantity. Final charges,
                  including any delivery fee, are determined
                  during order processing.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || availableQuantity <= 0}
                className="w-full rounded-full bg-[#194C35] px-6 py-4 font-bold text-white transition hover:bg-[#103725] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Sending Request..."
                  : availableQuantity <= 0
                  ? "Currently Out of Stock"
                  : "Send Purchase Request ↗"}
              </button>
            </form>
          </div>
        </section>

        {/* Farmer reviews */}
        <section className="mt-16">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#77975F]">
              From our community
            </p>

            <h2 className="mt-3 font-serif text-4xl font-semibold">
              Customer Reviews
            </h2>

            <p className="mt-3 text-[#718073]">
              Experiences shared by buyers who have purchased
              from this farmer.
            </p>
          </div>

          {reviewsLoading && (
            <p className="rounded-2xl bg-white p-6 text-gray-500">
              Loading customer reviews...
            </p>
          )}

          {reviewsError && (
            <p
              role="alert"
              className="rounded-2xl bg-red-50 p-5 text-red-700"
            >
              {reviewsError}
            </p>
          )}

          {!reviewsLoading && !reviewsError && farmerReviews && (
            <div className="grid gap-7 lg:grid-cols-[300px_1fr]">
              <div className="h-fit rounded-3xl bg-[#E9F0E2] p-8">
                <p className="text-xs font-bold uppercase tracking-wider text-[#718B64]">
                  Farmer's overall rating
                </p>

                {farmerReviews.totalReviews > 0 ? (
                  <>
                    <p className="mt-5 font-serif text-6xl font-semibold text-[#194C35]">
                      {farmerReviews.averageRating}
                      <span className="text-2xl text-[#80947C]">
                        /5
                      </span>
                    </p>

                    <p className="mt-3 text-xl text-[#C18C37]">
                      ★★★★★
                    </p>
                  </>
                ) : (
                  <p className="mt-5 font-serif text-2xl text-[#194C35]">
                    Not yet rated
                  </p>
                )}

                <p className="mt-4 text-sm text-[#70816E]">
                  Based on {farmerReviews.totalReviews} customer{" "}
                  {farmerReviews.totalReviews === 1
                    ? "review"
                    : "reviews"}
                </p>
              </div>

              <div className="space-y-5">
                {farmerReviews.reviews?.length === 0 ? (
                  <div className="rounded-3xl border border-[#E3E9DD] bg-white p-10 text-center">
                    <h3 className="font-serif text-2xl">
                      Be part of the story
                    </h3>
                    <p className="mt-3 text-gray-500">
                      This farmer hasn't received any reviews yet.
                    </p>
                  </div>
                ) : (
                  farmerReviews.reviews?.map((review) => (
                    <article
                      key={review._id}
                      className="rounded-3xl border border-[#E3E9DD] bg-white p-7 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-[#254D36]">
                            {review.buyer?.name || "Customer"}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {new Date(
                              review.createdAt
                            ).toLocaleDateString()}
                          </p>
                        </div>

                        <p
                          className="text-lg text-[#C18C37]"
                          aria-label={`${review.rating} out of 5 stars`}
                        >
                          {"★".repeat(review.rating)}
                          {"☆".repeat(5 - review.rating)}
                        </p>
                      </div>

                      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-[#78965D]">
                        Purchased:{" "}
                        {review.product?.name || "Farm product"}
                      </p>

                      {review.comment && (
                        <p className="mt-3 leading-8 text-[#647366]">
                          {review.comment}
                        </p>
                      )}
                    </article>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        {/* Closing banner */}
        <div className="mt-16 rounded-3xl bg-[#E9F0E2] px-8 py-10 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#78965D]">
            FarmConnect
          </p>
          <h3 className="mt-3 font-serif text-3xl font-semibold">
            Fresh food. Stronger communities.
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#718073]">
            Every connection helps create more opportunities
            for farmers and buyers across The Gambia.
          </p>
        </div>
      </main>
    </div>
  );
}

export default BuyerProductDetails;
