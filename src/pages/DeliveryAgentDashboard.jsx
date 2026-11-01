
import { useEffect, useState } from "react";
import { getMyDeliveries, updateDeliveryStatus } from "../services/api";

const nextStatus = {
  assigned: "picked_up",
  picked_up: "in_transit",
  in_transit: "delivered",
};

function formatStatus(status) {
  return status
    ? status.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Not Available";
}

function DeliveryAgentDashboard() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    async function loadDeliveries() {
      try {
        const data = await getMyDeliveries();

        setDeliveries(
          Array.isArray(data) ? data : data.deliveries || []
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDeliveries();
  }, []);

  async function handleUpdate(order) {
    const status = nextStatus[order.deliveryStatus];
    if (!status) return;

    try {
      setUpdatingId(order._id);
      setError("");

      const result = await updateDeliveryStatus(order._id, status);

      
setDeliveries((previous) =>
  previous.map((item) =>
    item._id === order._id
      ? {
          ...item,
          ...(result.order || {}),
          deliveryStatus:
            result.order?.deliveryStatus || status,
          product: item.product,
          buyer: item.buyer,
          farmer: item.farmer,
          purchaseRequest: item.purchaseRequest,
        }
      : item
  )
);

    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-bold text-green-800">
          Delivery Agent Dashboard 🚚
        </h1>

        <p className="mb-8 text-gray-600">
          Manage your assigned deliveries and update their progress.
        </p>

        {loading && <p>Loading assigned deliveries...</p>}

        {error && (
          <p className="mb-5 rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </p>
        )}

        {!loading && deliveries.length === 0 && !error && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            No deliveries have been assigned to you yet.
          </div>
        )}

        <div className="space-y-5">
          {deliveries.map((order) => (
            <div
              key={order._id}
              className="rounded-xl bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-green-800">
                  Order #{order.orderNumber || order._id.slice(-8)}
                </h2>

                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                  {formatStatus(order.deliveryStatus)}
                </span>
              </div>

              <div className="grid gap-3 text-gray-700 sm:grid-cols-2">
                <p>
                  <strong>Product:</strong>{" "}
                  {order.product?.name || "Not available"}
                </p>

                <p>
                  <strong>Quantity:</strong>{" "}
                  {order.quantity} {order.product?.unit || ""}
                </p>

                <p>
                  <strong>Buyer:</strong>{" "}
                  {order.buyer?.name || "Not available"}
                </p>

                <p>
                  <strong>Buyer Phone:</strong>{" "}
                  {order.buyer?.phone || "Not available"}
                </p>

                <p>
                  <strong>Farmer:</strong>{" "}
                  {order.farmer?.name || "Not available"}
                </p>

                <p>
                  <strong>Order Status:</strong>{" "}
                  {formatStatus(order.status)}
                </p>

                <p className="sm:col-span-2">
                  <strong>Delivery Address:</strong>{" "}
                  {order.deliveryAddress ||
                    order.purchaseRequest?.deliveryAddress ||
                    "Not specified"}
                </p>
              </div>

              {nextStatus[order.deliveryStatus] && (
                <button
                  type="button"
                  onClick={() => handleUpdate(order)}
                  disabled={updatingId === order._id}
                  className="mt-5 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                >
                  {updatingId === order._id
                    ? "Updating..."
                    : `Mark as ${formatStatus(nextStatus[order.deliveryStatus])}`}
                </button>
              )}

              {order.deliveryStatus === "delivered" && (
                <p className="mt-4 rounded-lg bg-green-100 p-3 text-green-800">
                  Delivery marked as completed. Awaiting buyer confirmation.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DeliveryAgentDashboard;
