
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyOrders,
  confirmOrderDelivery,
} from "../services/api";

function BuyerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await getMyOrders();

        const orderList = Array.isArray(data)
          ? data
          : data.orders || [];

        setOrders(orderList);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
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


                {order.buyerConfirmedDelivery && (
                  <p className="mt-4 rounded-lg bg-green-100 p-3 text-sm text-green-800">
                    Delivery confirmed. Thank you for shopping with FarmConnect!
                  </p>
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
