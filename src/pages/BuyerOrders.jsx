import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyOrders,
  confirmOrderDelivery,
  initiatePayment,
  createReview,
} from "../services/api";
import DeliveryTrackingMap from "../components/DeliveryTrackingMap";
import { getBuyerDeliveryLocation } from "../services/api";

function BuyerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
const [trackingLoading, setTrackingLoading] = useState(false);
const [trackingError, setTrackingError] = useState("");
const [currentTime, setCurrentTime] = useState(Date.now()); 
const [payingId, setPayingId] = useState(null);
const [reviewingOrderId, setReviewingOrderId] = useState(null);
const [reviewRating, setReviewRating] = useState(5);
const [reviewComment, setReviewComment] = useState("");
const [submittingReview, setSubmittingReview] = useState(false);
const [reviewSuccess, setReviewSuccess] = useState("");
const [reviewedOrderIds, setReviewedOrderIds] = useState([]);

async function handleSubmitReview(orderId) {
  try {
    setSubmittingReview(true);
    setError("");
    setReviewSuccess("");

    await createReview(orderId, reviewRating, reviewComment.trim());

    setReviewedOrderIds((previous) => [...previous, orderId]);

    setReviewSuccess("Your review was submitted successfully!");

    setReviewingOrderId(null);
    setReviewRating(5);
    setReviewComment("");
  } catch (err) {
    setError(err.message);

    if (err.message === "This order has already been reviewed") {
      setReviewedOrderIds((previous) => [...previous, orderId]);
      setReviewingOrderId(null);
    }
  } finally {
    setSubmittingReview(false);
  }
}

async function handlePayNow(orderId) {
  try {
    setPayingId(orderId);
    setError("");

    const data = await initiatePayment(orderId);

    if (!data.paymentLink) {
      throw new Error("Payment link was not returned");
    }

    // Redirect the buyer to ModemPay's checkout page.
    window.location.assign(data.paymentLink);
  } catch (err) {
    setError(err.message);
  } finally {
    setPayingId(null);
  }
}

  
useEffect(() => {
  let active = true;

  async function loadOrders() {
    try {
      const data = await getMyOrders();

      if (!active) return;

      const orderList = Array.isArray(data)
        ? data
        : data.orders || [];

      setOrders(orderList);
      setError("");
    } catch (err) {
      if (active) {
        setError(err.message);
      }
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  }

  loadOrders();

  // Refresh orders every 10 seconds.
  const interval = setInterval(loadOrders, 10000);

  return () => {
    active = false;
    clearInterval(interval);
  };
}, []);


  
const [confirmingId, setConfirmingId] = useState(null);

async function handleConfirmDelivery(orderId) {
  const confirmed = window.confirm(
    "Have you received your products? Confirming delivery will complete this order."
  );

  if (!confirmed) return;

  try {
    setConfirmingId(orderId);
    setError("");

    const data = await confirmOrderDelivery(orderId);

    
setOrders((previousOrders) =>
  previousOrders.map((order) =>
    order._id === orderId
      ? {
          ...order,
          ...data.order,
          product: order.product,
          farmer: order.farmer,
          buyer: order.buyer,
        }
      : order
  )
);

  } catch (err) {
    setError(err.message);
  } finally {
    setConfirmingId(null);
  }
}


useEffect(() => {
  if (!trackingOrderId) {
    return;
  }

  let active = true;

  setDeliveryLocation(null);
  setTrackingError("");
  setTrackingLoading(true);

  async function loadDeliveryLocation() {
    try {
      const data = await getBuyerDeliveryLocation(trackingOrderId);

      if (!active) return;

      if (data.trackingAvailable) {
        setDeliveryLocation(data.location);
        setTrackingError("");
      } else {
        setDeliveryLocation(null);
        setTrackingError(
          data.message || "Delivery tracking is not available yet."
        );
      }
    } catch (err) {
      if (active) {
        setTrackingError(err.message);
      }
    } finally {
      if (active) {
        setTrackingLoading(false);
      }
    }
  }

  loadDeliveryLocation();

  const interval = setInterval(loadDeliveryLocation, 15000);

  return () => {
    active = false;
    clearInterval(interval);
  };
}, [trackingOrderId]);


useEffect(() => {
  if (!trackingOrderId) return;

  setCurrentTime(Date.now());

  const timer = setInterval(() => {
    setCurrentTime(Date.now());
  }, 5000);

  return () => clearInterval(timer);
}, [trackingOrderId]);


  function formatStatus(status) {
    return status
      ? status.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Not Available";
  }

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/buyer/marketplace"
          className="mb-6 inline-block text-green-700 hover:underline"
        >
          ← Back to Marketplace
        </Link>

        <h1 className="mb-2 text-3xl font-bold text-green-800">
          My Orders
        </h1>

        <p className="mb-8 text-gray-600">
          Track your purchases and delivery progress.
        </p>

        {loading && <p>Loading your orders...</p>}

        {error && (
          <p className="rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </p>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="mb-4 text-gray-600">
              You don't have any orders yet.
            </p>

            <Link
              to="/buyer/marketplace"
              className="font-semibold text-green-700 hover:underline"
            >
              Browse Marketplace
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-5">
            {orders.map((order) => (
              <div
                key={order._id}
                className="rounded-xl bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-green-800">
                    Order #{order.orderNumber || order._id.slice(-8)}
                  </h2>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                    {formatStatus(order.status)}
                  </span>
                </div>

                <div className="grid gap-3 text-gray-700 sm:grid-cols-2">
                  <p>
                    <strong>Product:</strong>{" "}
                    {order.product?.name || "Product"}
                  </p>

                  <p>
                    <strong>Quantity:</strong> {order.quantity}{" "}
                    {order.product?.unit || ""}
                  </p>

                  <p>
                    
<strong>Total:</strong>{" "}
{order.totalAmount != null
  ? `D${Number(order.totalAmount).toFixed(2)}`
  : "N/A"}

                  </p>

                  <p>
                    <strong>Payment:</strong>{" "}
                    {formatStatus(order.paymentStatus)}
                  </p>

                  <p>
                    <strong>Delivery:</strong>{" "}
                    {formatStatus(order.deliveryStatus)}
                  </p>

                  <p>
                    <strong>Farmer:</strong>{" "}
                    {order.farmer?.name || "Not available"}
                  </p>
                </div>


{order.paymentStatus === "pending" && (
  <div className="mt-4 rounded-lg bg-yellow-50 p-4">
    <p className="text-sm text-yellow-800">
      Your payment is being processed or verified.
      This page checks for updates automatically.
      Please do not make another payment.
    </p>
  </div>
)}


{order.paymentStatus === "paid" && (
  <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
    <p className="font-semibold text-green-800">
      ✓ Payment Successful!
    </p>
    <p className="mt-1 text-sm text-green-700">
      Your payment has been confirmed.
      You don't need to pay again.
      You can now track your order and delivery progress.
    </p>
  </div>
)}


{order.paymentStatus === "failed" && (
  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
    <p className="font-semibold text-red-800">
      Payment Could Not Be Confirmed
    </p>
    <p className="mt-1 text-sm text-red-700">
      Your previous payment attempt was unsuccessful.
      If money was deducted, please contact support
      before trying again.
      Otherwise, you can use the Pay Now button
      to start a new payment.
    </p>
  </div>
)}

                
{order.status === "pending" &&
  ["unpaid", "failed"].includes(order.paymentStatus) && (
    <div className="mt-4 rounded-lg bg-blue-50 p-4">
      <p className="mb-3 text-sm text-blue-800">
        Complete your payment securely through ModemPay.
      </p>

      <button
        type="button"
        onClick={() => handlePayNow(order._id)}
        disabled={payingId === order._id}
        className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
      >
        {payingId === order._id ? "Preparing Payment..." : "Pay Now"}
      </button>
    </div>
  )}

  {order.status === "ready_for_delivery" &&
  ["picked_up", "in_transit"].includes(order.deliveryStatus) && (
    <div className="mt-4">
      <button
        type="button"
        onClick={() =>
          setTrackingOrderId((current) =>
            current === order._id ? null : order._id
          )
        }
        className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
      >
        {trackingOrderId === order._id
          ? "✕ Hide Delivery Tracking"
          : "📍 Track Delivery"}
      </button>
    </div>
  )}

             
{order.deliveryStatus === "delivered" &&
  order.status === "ready_for_delivery" &&
  !order.buyerConfirmedDelivery && (
    <div className="mt-4 rounded-lg bg-yellow-50 p-4">
      <p className="mb-3 text-sm text-yellow-800">
        Your delivery has been marked as delivered.
        Please confirm only after receiving your products.
      </p>

      <button
        type="button"
        onClick={() => handleConfirmDelivery(order._id)}
        disabled={confirmingId === order._id}
        className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
      >
        {confirmingId === order._id
          ? "Confirming..."
          : "Confirm Delivery"}
      </button>
    </div>
  )}


  {trackingOrderId === order._id && (
  <div className="mt-4 space-y-3">
    {trackingLoading && (
      <p className="text-sm text-gray-600">
        Loading delivery location...
      </p>
    )}

    {trackingError && (
      <p className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
        {trackingError}
      </p>
    )}

    {deliveryLocation && (
      <>
        <DeliveryTrackingMap location={deliveryLocation} />

        <p className="text-sm text-gray-600">
          Last GPS update:{" "}
          {new Date(deliveryLocation.updatedAt).toLocaleString()}
        </p>

        {(() => {
  const updatedAt = new Date(deliveryLocation.updatedAt).getTime();

  const isRecent =
    Number.isFinite(updatedAt) &&
    updatedAt <= currentTime &&
    currentTime - updatedAt <= 30000;

  return (
    <p
      className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
        isRecent
          ? "bg-green-100 text-green-800"
          : "bg-yellow-100 text-yellow-800"
      }`}
    >
      {isRecent
        ? "● Recently updated"
        : "● Location may be outdated"}
    </p>
  );
})()}

        <p className="text-xs text-gray-500">
          This shows the agent's last reported position.
          The location may be outdated if the agent has stopped sharing.
        </p>
      </>
    )}
  </div>
)}


                {order.buyerConfirmedDelivery && (
                  <p className="mt-4 rounded-lg bg-green-100 p-3 text-sm text-green-800">
                    Delivery confirmed. Thank you for shopping with FarmConnect!
                  </p>
                )}

                {order.status === "completed" &&
  order.paymentStatus === "paid" && (
    <div className="mt-4">
      <button
        type="button"
        onClick={() =>
          setReviewingOrderId((current) =>
            current === order._id ? null : order._id
          )
        }
        className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-white hover:bg-yellow-600"
      >
        ⭐ {reviewingOrderId === order._id
          ? "Cancel Review"
          : "Write a Review"}
      </button>
    </div>
  )}

  {reviewingOrderId === order._id &&
  order.status === "completed" &&
  order.paymentStatus === "paid" &&
  !reviewedOrderIds.includes(order._id) && (
    <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-5">
      <h3 className="mb-3 text-lg font-semibold text-gray-800">
        Review {order.product?.name || "this product"}
      </h3>

      <p className="mb-2 text-sm text-gray-600">
        How would you rate your experience?
      </p>

      <div className="mb-4 flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setReviewRating(star)}
            aria-label={`Rate ${star} stars`}
            aria-pressed={reviewRating === star}
            className={`text-3xl ${
              star <= reviewRating
                ? "text-yellow-500"
                : "text-gray-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={reviewComment}
        onChange={(e) => setReviewComment(e.target.value)}
        maxLength={1000}
        rows={4}
        placeholder="Share your experience with this farmer and product..."
        className="w-full rounded-lg border border-gray-300 p-3 focus:border-green-600 focus:outline-none"
      />

      <p className="mt-1 text-right text-xs text-gray-500">
        {reviewComment.length}/1000 characters
      </p>

      <button
  type="button"
  onClick={() => handleSubmitReview(order._id)}
  disabled={submittingReview}
  className="mt-3 rounded-lg bg-green-700 px-5 py-2 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
>
  {submittingReview ? "Submitting..." : "Submit Review"}
</button>
    </div>
  )}
                
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BuyerOrders;
