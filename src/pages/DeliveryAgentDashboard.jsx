import { useEffect, useRef, useState } from "react";
import {
  getMyDeliveries,
  updateDeliveryStatus,
  updateDeliveryLocation,
} from "../services/api";

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
  const [sharingLocationId, setSharingLocationId] = useState(null);
const [locationMessage, setLocationMessage] = useState("");
const [trackingOrderId, setTrackingOrderId] = useState(null);

// Store the browser's active GPS watcher.
const watchIdRef = useRef(null);

const lastLocationUpdateRef = useRef(0);
const locationRequestInProgressRef = useRef(false);
const trackingSessionRef = useRef(0);

// Remember which order is being tracked.
const trackingOrderIdRef = useRef(null);

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

  useEffect(() => {
  return () => {
    trackingSessionRef.current += 1;
    if (watchIdRef.current !== null) {
      navigator.geolocation?.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    trackingOrderIdRef.current = null;
  };
}, []);

  async function handleUpdate(order) {
    const status = nextStatus[order.deliveryStatus];
    if (!status) return;

    try {
      setUpdatingId(order._id);
      setError("");

      const result = await updateDeliveryStatus(order._id, status);

      // Stop GPS tracking when the delivery is marked as delivered.
if (status === "delivered" && trackingOrderIdRef.current === order._id) {
  handleStopTracking();
}

      
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

  async function handleShareLocation(order) {
  if (!navigator.geolocation) {
    setError("Your browser does not support GPS location.");
    return;
  }

  if (sharingLocationId) return;

  setSharingLocationId(order._id);
  setLocationMessage("");
  setError("");

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });

    await updateDeliveryLocation(
      order._id,
      position.coords.latitude,
      position.coords.longitude,
      position.coords.accuracy
    );

    setLocationMessage(
      `Location shared successfully for order ${order.orderNumber}!`
    );
  } catch (err) {
    setError(
      err.code === 1
        ? "Location permission denied. Please allow location access in your browser."
        : err.code === 2
          ? "Your location is unavailable. Check your device location settings."
          : err.code === 3
            ? "GPS request timed out. Please try again."
            : err.message || "Unable to share your location."
    );
  } finally {
    setSharingLocationId(null);
  }
}

function handleStartTracking(order) {
  if (!navigator.geolocation) {
    setError("Your browser does not support location tracking.");
    return;
  }

  if (watchIdRef.current !== null) {
    setError("Stop the current tracking session first.");
    return;
  }

  if (!["picked_up", "in_transit"].includes(order.deliveryStatus)) {
    setError("Tracking is only available for active deliveries.");
    return;
  }

  setError("");
  setLocationMessage("Waiting for your location...");

  trackingOrderIdRef.current = order._id;
  setTrackingOrderId(order._id);

  lastLocationUpdateRef.current = 0;
locationRequestInProgressRef.current = false;
const sessionId = ++trackingSessionRef.current;

  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
  if (
  trackingOrderIdRef.current !== order._id ||
  trackingSessionRef.current !== sessionId
) {
  return;
}

  const now = Date.now();

  // Allow only one request at a time.
  if (locationRequestInProgressRef.current) return;

  // Wait at least 15 seconds between requests.
  if (now - lastLocationUpdateRef.current < 15000) return;

  locationRequestInProgressRef.current = true;
lastLocationUpdateRef.current = now;

try {
  // Make sure this tracking session is still active.
  if (
    trackingOrderIdRef.current !== order._id ||
    trackingSessionRef.current !== sessionId
  ) {
    return;
  }

  await updateDeliveryLocation(
          order._id,
          position.coords.latitude,
          position.coords.longitude,
          position.coords.accuracy
        );

        if (
  trackingOrderIdRef.current === order._id &&
  trackingSessionRef.current === sessionId
) {
          setLocationMessage(
            `Live location updated for order ${order.orderNumber}.`
          );
        }
      } catch (err) {
  if (
  trackingOrderIdRef.current === order._id &&
  trackingSessionRef.current === sessionId
) {
    setError(err.message || "Unable to update live location.");
  }
} finally {
  if (trackingSessionRef.current === sessionId) {
    locationRequestInProgressRef.current = false;
  }
}
    },
    (err) => {
  if (
  trackingOrderIdRef.current !== order._id ||
  trackingSessionRef.current !== sessionId
) {
  return;
}

  const message =
    err.code === 1
      ? "Location permission denied. Please allow location access."
      : err.code === 2
        ? "Your location is unavailable. Check your device settings."
        : "GPS request timed out. Please try again.";

  // Stop the active GPS watcher.
  handleStopTracking();

  // Display the error after stopping tracking.
  setLocationMessage("");
  setError(message);
},
    {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 5000,
    }
  );

  watchIdRef.current = watchId;
}

function handleStopTracking() {
  trackingSessionRef.current += 1;
  // Prevent any more location updates for this order.
  trackingOrderIdRef.current = null;

  // Stop watching the device's GPS location.
  if (watchIdRef.current !== null) {
    navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
  }

  // Update the dashboard.
  setTrackingOrderId(null);
  setLocationMessage("Live GPS tracking stopped.");
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

        {locationMessage && (
  <p className="mb-5 rounded-lg bg-blue-100 p-4 text-blue-800">
    {locationMessage}
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

              {["picked_up", "in_transit"].includes(order.deliveryStatus) && (
  <button
    type="button"
    onClick={() => handleShareLocation(order)}
    disabled={sharingLocationId !== null || trackingOrderId !== null}
    className="mt-5 ml-3 rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
  >
    {sharingLocationId === order._id
      ? "Getting Location..."
      : "📍 Share My Location"}
  </button>
)}

{["picked_up", "in_transit"].includes(order.deliveryStatus) && (
  <>
    {trackingOrderId !== order._id ? (
      <button
        type="button"
        onClick={() => handleStartTracking(order)}
        disabled={trackingOrderId !== null}
        className="mt-5 ml-3 rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        ▶️ Start Tracking
      </button>
    ) : (
      <button
        type="button"
        onClick={handleStopTracking}
        className="mt-5 ml-3 rounded-lg bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-800"
      >
        ⏹️ Stop Tracking
      </button>
    )}
  </>
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
