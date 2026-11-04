
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyOrders,
  updateOrderStatus,
} from "../services/api";

export default function FarmerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await getMyOrders();
        setOrders(data.orders || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  const formatStatus = (status) =>
    (status || "unknown").replaceAll("_", " ");

  
async function handleUpdateStatus(orderId, newStatus) {
  const action = newStatus.replaceAll("_", " ");

  const confirmed = window.confirm(
    `Are you sure you want to change this order to "${action}"?`
  );

  if (!confirmed) return;

  try {
    setError("");
    setProcessingId(orderId);

    const data = await updateOrderStatus(orderId, newStatus);

    setOrders((previousOrders) =>
      previousOrders.map((order) =>
        order._id === orderId
          ? { ...order, status: data.order.status }
          : order
      )
    );

    alert(data.message);
  } catch (err) {
    setError(err.message);
  } finally {
    setProcessingId(null);
  }
}


  return (
    <div className="min-h-screen bg-green-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/farmer/dashboard"
          className="mb-6 inline-block font-medium text-green-700 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-green-900">
          My Orders
        </h1>

        <p className="mt-2 text-gray-600">
          View orders placed for your farm products.
        </p>

        {loading && (
          <p className="mt-8 text-gray-600">Loading orders...</p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-100 p-4 text-red-700"
          >
            {error}
          </p>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="mt-8 rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-gray-600">
              You don't have any orders yet.
            </p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="mt-8 space-y-5">
            {orders.map((order) => (
              <div
                key={order._id}
                className="rounded-xl bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="break-all text-lg font-bold text-green-900">
                    {order.orderNumber || "Order"}
                  </h2>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold capitalize text-green-800">
                    {formatStatus(order.status)}
                  </span>
                </div>

                <div className="grid gap-3 text-gray-700 sm:grid-cols-2">
                  <p>
                    <strong>Product:</strong>{" "}
                    {order.product?.name || "Unavailable"}
                  </p>

                  <p>
                    <strong>Buyer:</strong>{" "}
                    {order.buyer?.name || "Unknown"}
                  </p>

                  <p>
                    <strong>Buyer phone:</strong>{" "}
                    {order.buyer?.phone || "Not available"}
                  </p>

                  <p>
                    <strong>Quantity:</strong>{" "}
                    {order.quantity} {order.product?.unit || ""}
                  </p>

                  <p>
                    <strong>Total:</strong> D
                    {order.totalAmount ?? "N/A"}
                  </p>

                  <p>
                    <strong>Payment:</strong>{" "}
                    <span className="capitalize">
                      {formatStatus(order.paymentStatus)}
                    </span>
                  </p>

                  <p>
                    <strong>Delivery:</strong>{" "}
                    <span className="capitalize">
                      {formatStatus(order.deliveryStatus)}
                    </span>
                  </p>

                  <p>
                    <strong>Delivery address:</strong>{" "}
                    {order.deliveryAddress || "Not provided"}
                  </p>
                </div>

                
<div className="mt-5 flex flex-wrap gap-3">
  {(
    {
      pending: [
        { status: "confirmed", label: "Confirm Order" },
        { status: "cancelled", label: "Cancel Order" },
      ],
      confirmed: [
        { status: "processing", label: "Start Processing" },
        { status: "cancelled", label: "Cancel Order" },
      ],
      processing: [
        {
          status: "ready_for_delivery",
          label: "Ready for Delivery",
        },
      ],
      ready_for_delivery: [],

    }[order.status] || []
    )
    .filter(
      (action) =>
        action.status === "cancelled" ||
        order.paymentStatus === "paid" ||
        order.paymentMethod === "cod"
    )
    .map((action) => (
    <button
      key={action.status}
      type="button"
      disabled={processingId !== null}
      onClick={() =>
        handleUpdateStatus(order._id, action.status)
      }
      className={
        action.status === "cancelled"
          ? "rounded-lg border border-red-500 px-5 py-2 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          : "rounded-lg bg-green-700 px-5 py-2 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
      }
    >
      {processingId === order._id
        ? "Updating..."
        : action.label}
    </button>
  ))}

  {["completed", "cancelled"].includes(order.status) && (
    <p className="text-sm text-gray-500">
      No further status changes are available.
    </p>
  )}
</div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
