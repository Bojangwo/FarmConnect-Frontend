import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders, updateOrderStatus } from "../services/api";

const formatStatus = (value) => (value || "unknown").replaceAll("_", " ");
const money = (value) => value == null ? "N/A" : `D${Number(value).toLocaleString("en-GM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const statusTone = (status) => {
  if (["completed", "paid", "delivered", "confirmed"].includes(status)) return "bg-[#EAF3E6] text-[#24583D] border-[#D5E5CE]";
  if (["cancelled", "failed", "refunded"].includes(status)) return "bg-[#FFF0ED] text-[#9B4136] border-[#F3D9D4]";
  if (["pending", "unpaid", "not_assigned"].includes(status)) return "bg-[#FFF6E4] text-[#92661F] border-[#F0E1BD]";
  return "bg-[#F0F3ED] text-[#506B55] border-[#E0E8DD]";
};
const actionsByStatus = {
  pending: [{ status: "confirmed", label: "Confirm Order" }, { status: "cancelled", label: "Cancel Order" }],
  confirmed: [{ status: "processing", label: "Start Processing" }, { status: "cancelled", label: "Cancel Order" }],
  processing: [{ status: "ready_for_delivery", label: "Ready for Delivery" }],
};

export default function FarmerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    async function loadOrders() {
      try {
        const data = await getMyOrders("sales");
        if (active) setOrders(data.orders || []);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadOrders();
    return () => { active = false; };
  }, []);

  async function handleUpdateStatus(orderId, newStatus) {
    const action = formatStatus(newStatus);
    if (!window.confirm(`Are you sure you want to change this order to "${action}"?`)) return;
    try {
      setError("");
      setNotice("");
      setProcessingId(orderId);
      const data = await updateOrderStatus(orderId, newStatus);
      setOrders((previous) => previous.map((order) =>
        order._id === orderId ? { ...order, status: data.order.status } : order
      ));
      setNotice(data.message || "Order updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  }

  const counts = useMemo(() => ({
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    active: orders.filter((o) => ["confirmed", "processing", "ready_for_delivery"].includes(o.status)).length,
    completed: orders.filter((o) => o.status === "completed").length,
  }), [orders]);
  const visible = useMemo(() => orders.filter((order) => {
    const matchFilter = filter === "all" || (filter === "active" ? ["confirmed", "processing", "ready_for_delivery"].includes(order.status) : order.status === filter);
    const query = search.trim().toLowerCase();
    const matchSearch = !query || [order.orderNumber, order.product?.name, order.buyer?.name].some((value) => String(value || "").toLowerCase().includes(query));
    return matchFilter && matchSearch;
  }), [orders, filter, search]);

  return (
    <main className="min-h-screen bg-[#FAF9F4] px-4 py-8 text-[#183B2B] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link to="/farmer/dashboard" className="text-sm font-medium text-[#477341] hover:underline">← Farmer Dashboard</Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#77975F]">Farm management</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold text-[#194C35]">Sales Orders</h1>
            <p className="mt-2 text-sm text-[#6D7C70]">Manage customer orders, payments, and fulfillment.</p>
          </div>
          <Link to="/farmer/purchase-requests" className="rounded-xl border border-[#DCE5D7] bg-white px-4 py-2.5 text-sm font-semibold text-[#194C35] hover:bg-[#EEF3E9]">View Purchase Requests →</Link>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "All orders", value: counts.all },
            { label: "Pending", value: counts.pending },
            { label: "In progress", value: counts.active },
            { label: "Completed", value: counts.completed },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-[#E1E7DD] bg-white p-5 shadow-sm">
              <p className="text-xs text-[#718073]">{item.label}</p>
              <p className="mt-2 font-serif text-3xl font-semibold text-[#194C35]">{loading ? "—" : item.value}</p>
            </div>
          ))}
        </div>

        {error && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {notice && <div role="status" className="mt-6 rounded-xl border border-[#D5E5CE] bg-[#EAF3E6] px-4 py-3 text-sm text-[#24583D]">{notice}</div>}

        <section className="mt-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-2xl font-semibold text-[#194C35]">Order history</h2>
            <div className="flex flex-wrap gap-2">
              <input aria-label="Search sales orders" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..." className="w-48 rounded-xl border border-[#DEE5DA] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#77975F] sm:w-60" />
              <select aria-label="Filter orders" value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border border-[#DEE5DA] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#77975F]">
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="active">In progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {loading ? <p className="mt-6 text-sm text-[#718073]">Loading sales orders...</p> : visible.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-[#E1E7DD] bg-white px-6 py-12 text-center">
              <p className="font-serif text-xl text-[#194C35]">{orders.length ? "No matching orders" : "No sales orders yet"}</p>
              <p className="mt-2 text-sm text-[#718073]">{orders.length ? "Try another search or filter." : "Orders will appear here after you accept purchase requests."}</p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {visible.map((order) => {
                const actions = (actionsByStatus[order.status] || []).filter((action) => action.status === "cancelled" || order.paymentStatus === "paid");
                return (
                  <article key={order._id} className="overflow-hidden rounded-2xl border border-[#E1E7DD] bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDF0E9] px-5 py-4 sm:px-6">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-widest text-[#819082]">Order reference</p>
                        <h3 title={order.orderNumber || "Order"} className="mt-1 break-all font-serif text-lg font-semibold text-[#194C35]">{order.orderNumber || "Order"}</h3>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusTone(order.status)}`}>{formatStatus(order.status)}</span>
                    </div>
                    <div className="grid gap-x-8 gap-y-5 px-5 py-5 text-sm sm:grid-cols-2 lg:grid-cols-3 sm:px-6">
                      {[
                        ["Product", order.product?.name || "Unavailable"],
                        ["Customer", order.buyer?.name || "Unknown"],
                        ["Customer phone", order.buyer?.phone || "Not available"],
                        ["Quantity", `${order.quantity ?? "N/A"} ${order.product?.unit || ""}`],
                        ["Order total", money(order.totalAmount)],
                        ["Delivery address", order.deliveryAddress || "Not provided"],
                      ].map(([label, value]) => <div key={label}><p className="text-xs text-[#819082]">{label}</p><p className="mt-1 break-words font-medium text-[#264534]">{value}</p></div>)}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 border-t border-[#EDF0E9] bg-[#FCFDFB] px-5 py-4 sm:px-6">
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${statusTone(order.paymentStatus)}`}>Payment: {formatStatus(order.paymentStatus)}</span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${statusTone(order.deliveryStatus)}`}>Delivery: {formatStatus(order.deliveryStatus)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 px-5 pb-5 pt-4 sm:px-6">
                      {actions.map((action) => <button key={action.status} type="button" disabled={processingId !== null} onClick={() => handleUpdateStatus(order._id, action.status)} className={action.status === "cancelled" ? "rounded-xl border border-[#EACBC5] px-4 py-2.5 text-sm font-semibold text-[#9B4136] hover:bg-[#FFF3F0] disabled:opacity-50" : "rounded-xl bg-[#194C35] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#286344] disabled:opacity-50"}>{processingId === order._id ? "Updating..." : action.label}</button>)}
                      {order.paymentStatus !== "paid" && ["pending", "confirmed", "processing"].includes(order.status) && <p className="text-xs text-[#819082]">Fulfillment actions become available after payment.</p>}
                      {["completed", "cancelled"].includes(order.status) && <p className="text-xs text-[#819082]">This order is closed. No further status changes are available.</p>}
                      {order.status === "ready_for_delivery" && <p className="text-xs text-[#819082]">Ready for delivery agent assignment and fulfillment.</p>}
                    </div>
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
