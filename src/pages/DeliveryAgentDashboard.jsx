import { useEffect, useMemo, useRef, useState } from "react";
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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

  const stats = useMemo(() => ({
    total: deliveries.length,
    assigned: deliveries.filter((d) => d.deliveryStatus === "assigned").length,
    active: deliveries.filter((d) => ["picked_up", "in_transit"].includes(d.deliveryStatus)).length,
    delivered: deliveries.filter((d) => d.deliveryStatus === "delivered").length,
  }), [deliveries]);

  const filteredDeliveries = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rank = { assigned: 0, picked_up: 1, in_transit: 2, delivered: 3 };
    return deliveries.filter((order) => {
      if (statusFilter !== "all" && order.deliveryStatus !== statusFilter) return false;
      const text = [order.orderNumber, order.product?.name, order.buyer?.name,
        order.farmer?.name, order.deliveryAddress, order.purchaseRequest?.deliveryAddress]
        .filter(Boolean).join(" ").toLowerCase();
      return !term || text.includes(term);
    }).sort((a, b) => (rank[a.deliveryStatus] ?? 4) - (rank[b.deliveryStatus] ?? 4));
  }, [deliveries, search, statusFilter]);

  const statCards = [
    { label: "Assigned deliveries", value: stats.total, detail: "All deliveries assigned to you" },
    { label: "Awaiting pickup", value: stats.assigned, detail: "Ready for collection" },
    { label: "In progress", value: stats.active, detail: "Picked up or in transit" },
    { label: "Delivered", value: stats.delivered, detail: "Handed over to customers" },
  ];

  const statusClasses = {
    assigned: "bg-[#EDF2E8] text-[#28563C]",
    picked_up: "bg-[#FFF4DE] text-[#96611C]",
    in_transit: "bg-[#E7F0FA] text-[#285B88]",
    delivered: "bg-[#E8F3E5] text-[#276341]",
    failed: "bg-red-50 text-red-700",
  };

  return (
    <main className="min-h-full bg-[#FAF9F4] px-5 pb-16 pt-8 text-[#183B2B] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#77975F]">Delivery operations</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Delivery Dashboard</h1>
          <p className="mt-2 text-sm text-[#718073]">Manage your assigned orders, update delivery progress, and share your location.</p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Delivery overview">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-[#E0E8DB] bg-white p-5 shadow-sm">
              <p className="text-xs text-[#718073]">{stat.label}</p>
              <p className="mt-3 font-serif text-3xl font-semibold text-[#194C35]">{stat.value}</p>
              <p className="mt-1 text-xs text-[#89978A]">{stat.detail}</p>
            </div>
          ))}
        </section>

        {error && (
          <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
        )}
        {locationMessage && (
          <div role="status" className="mt-6 rounded-xl border border-[#D4E6D0] bg-[#EFF7ED] px-5 py-4 text-sm text-[#276341]">{locationMessage}</div>
        )}

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl font-semibold">My deliveries</h2>
              <p className="mt-1 text-sm text-[#718073]">Active deliveries appear first so you can focus on what needs attention.</p>
            </div>
            <span className="rounded-full bg-[#E9F0E2] px-3 py-1 text-xs font-medium text-[#194C35]">
              {filteredDeliveries.length} shown
            </span>
          </div>

          <div className="mb-5 grid gap-3 rounded-2xl border border-[#E0E8DB] bg-white p-4 shadow-sm sm:grid-cols-[1fr_210px]">
            <label className="sr-only" htmlFor="delivery-search">Search deliveries</label>
            <input id="delivery-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order, product, buyer, or address..."
              className="w-full rounded-xl border border-[#DCE5D7] bg-[#FCFDFB] px-4 py-3 text-sm outline-none focus:border-[#77975F] focus:ring-2 focus:ring-[#77975F]/20" />
            <label className="sr-only" htmlFor="delivery-filter">Filter delivery status</label>
            <select id="delivery-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-[#DCE5D7] bg-[#FCFDFB] px-4 py-3 text-sm outline-none focus:border-[#77975F] focus:ring-2 focus:ring-[#77975F]/20">
              <option value="all">All delivery statuses</option>
              <option value="assigned">Assigned</option>
              <option value="picked_up">Picked up</option>
              <option value="in_transit">In transit</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-[#E0E8DB] bg-white p-10 text-center text-sm text-[#718073]">Loading assigned deliveries...</div>
          ) : filteredDeliveries.length === 0 ? (
            <div className="rounded-2xl border border-[#E0E8DB] bg-white p-10 text-center">
              <h3 className="font-serif text-xl font-semibold">No deliveries found</h3>
              <p className="mt-2 text-sm text-[#718073]">
                {deliveries.length === 0 ? "No deliveries have been assigned to you yet." : "Try changing your search or status filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDeliveries.map((order) => {
                const active = ["picked_up", "in_transit"].includes(order.deliveryStatus);
                const trackingThis = trackingOrderId === order._id;
                const next = nextStatus[order.deliveryStatus];
                const deliveryAddress = order.deliveryAddress || order.purchaseRequest?.deliveryAddress || "Not specified";
                return (
                  <article key={order._id} className="overflow-hidden rounded-2xl border border-[#E0E8DB] bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDF0E9] px-5 py-4 sm:px-6">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#839584]">Order reference</p>
                        <h3 className="mt-1 break-all font-serif text-lg font-semibold text-[#194C35]">
                          {order.orderNumber || order._id.slice(-8)}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {trackingThis && <span className="rounded-full bg-[#E7F0FA] px-3 py-1 text-xs font-semibold text-[#285B88]">Live GPS active</span>}
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[order.deliveryStatus] || "bg-gray-100 text-gray-700"}`}>
                          {formatStatus(order.deliveryStatus)}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-x-6 gap-y-5 px-5 py-6 text-sm sm:grid-cols-2 lg:grid-cols-3 sm:px-6">
                      {[
                        ["Product", order.product?.name || "Not available"],
                        ["Quantity", `${order.quantity ?? "—"} ${order.product?.unit || ""}`],
                        ["Order status", formatStatus(order.status)],
                        ["Customer", order.buyer?.name || "Not available"],
                        ["Customer phone", order.buyer?.phone || "Not available"],
                        ["Farmer", order.farmer?.name || "Not available"],
                      ].map(([label, value]) => (
                        <div key={label} className="min-w-0">
                          <p className="text-xs text-[#839584]">{label}</p>
                          <p className="mt-1 break-words font-medium text-[#183B2B]">{value}</p>
                        </div>
                      ))}
                      <div className="sm:col-span-2 lg:col-span-3 rounded-xl bg-[#F5F7F1] px-4 py-3">
                        <p className="text-xs text-[#839584]">Delivery address</p>
                        <p className="mt-1 font-medium text-[#183B2B]">{deliveryAddress}</p>
                      </div>
                    </div>

                    {(next || active || order.deliveryStatus === "delivered") && (
                      <div className="border-t border-[#EDF0E9] bg-[#FCFDFB] px-5 py-4 sm:px-6">
                        <div className="flex flex-wrap gap-3">
                          {next && (
                            <button type="button" onClick={() => handleUpdate(order)} disabled={updatingId === order._id}
                              className="rounded-full bg-[#194C35] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#123B29] disabled:cursor-not-allowed disabled:opacity-60">
                              {updatingId === order._id ? "Updating..." : `Mark as ${formatStatus(next)}`}
                            </button>
                          )}
                          {active && (
                            <>
                              <button type="button" onClick={() => handleShareLocation(order)} disabled={sharingLocationId !== null || trackingOrderId !== null}
                                className="rounded-full border border-[#CBDAC4] bg-white px-5 py-2.5 text-sm font-semibold text-[#194C35] transition hover:bg-[#F1F6ED] disabled:cursor-not-allowed disabled:opacity-50">
                                {sharingLocationId === order._id ? "Getting location..." : "Share location once"}
                              </button>
                              {trackingThis ? (
                                <button type="button" onClick={handleStopTracking}
                                  className="rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100">
                                  Stop live tracking
                                </button>
                              ) : (
                                <button type="button" onClick={() => handleStartTracking(order)} disabled={trackingOrderId !== null}
                                  className="rounded-full border border-[#CBDAC4] bg-white px-5 py-2.5 text-sm font-semibold text-[#194C35] transition hover:bg-[#F1F6ED] disabled:cursor-not-allowed disabled:opacity-50">
                                  Start live tracking
                                </button>
                              )}
                            </>
                          )}
                        </div>
                        {order.deliveryStatus === "delivered" && (
                          <p className="mt-2 text-sm text-[#477341]">
                            {order.buyerConfirmedDelivery ? "Buyer confirmed receipt. Delivery complete." : "Marked as delivered. Awaiting buyer confirmation."}
                          </p>
                        )}
                        {trackingThis && <p className="mt-3 text-xs text-[#718073]">Location updates are sent at most once every 15 seconds while this page stays open.</p>}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default DeliveryAgentDashboard;
