import { useEffect, useMemo, useState } from "react";
import { getAllOrdersAdmin, getAllUsers, assignDeliveryAgentAdmin } from "../services/api";

const formatStatus = (value) => (value || "not_assigned").replaceAll("_", " ");
const money = (value) => `D${Number(value || 0).toFixed(2)}`;
const badgeClass = (status) => {
  if (["paid", "completed", "delivered"].includes(status)) return "bg-[#EAF3E6] text-[#32633C]";
  if (["cancelled", "failed", "refunded"].includes(status)) return "bg-[#FCEBE8] text-[#A94437]";
  if (["pending", "unpaid", "not_assigned"].includes(status)) return "bg-[#F8F1DD] text-[#936C2C]";
  return "bg-[#EDF2F4] text-[#496977]";
};

function StatusBadge({ value }) {
  return <span className={`inline-block rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${badgeClass(value)}`}>{formatStatus(value)}</span>;
}

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [deliveryAgents, setDeliveryAgents] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigningId, setAssigningId] = useState(null);
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const [ordersData, usersData] = await Promise.all([getAllOrdersAdmin(), getAllUsers()]);
        if (!active) return;
        setOrders(ordersData.orders || []);
        setDeliveryAgents((usersData.users || []).filter((user) => user.role === "deliveryAgent" && user.status === "active"));
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, []);

  const stats = useMemo(() => ({
    total: orders.length,
    awaitingAssignment: orders.filter((order) => order.status === "ready_for_delivery" && order.paymentStatus === "paid" && ["not_assigned", "failed"].includes(order.deliveryStatus)).length,
    inTransit: orders.filter((order) => ["picked_up", "in_transit"].includes(order.deliveryStatus)).length,
    completed: orders.filter((order) => order.status === "completed").length,
  }), [orders]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const searchable = [order.orderNumber, order.product?.name, order.buyer?.name, order.farmer?.name, order.deliveryAgent?.name].filter(Boolean).join(" ").toLowerCase();
      return (!term || searchable.includes(term)) && (statusFilter === "all" || order.status === statusFilter) && (deliveryFilter === "all" || (order.deliveryStatus || "not_assigned") === deliveryFilter);
    });
  }, [orders, search, statusFilter, deliveryFilter]);

  async function handleAssign(orderId) {
    const deliveryAgentId = selectedAgents[orderId];
    if (!deliveryAgentId) { setError("Please select a delivery agent first."); return; }
    if (!window.confirm("Are you sure you want to assign this delivery agent?")) return;
    setAssigningId(orderId);
    setError("");
    setSuccess("");
    try {
      await assignDeliveryAgentAdmin(orderId, deliveryAgentId);
      const data = await getAllOrdersAdmin();
      setOrders(data.orders || []);
      setSelectedAgents((previous) => ({ ...previous, [orderId]: "" }));
      setSuccess("Delivery agent assigned successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setAssigningId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF9F4] px-4 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#77975F]">Platform management</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-[#183B2B]">Manage Orders</h1>
        <p className="mt-2 text-sm text-[#718073]">Monitor marketplace orders and coordinate delivery assignments.</p>

        {error && <div role="alert" className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {success && <div role="status" className="mt-6 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-800">{success}</div>}

        {loading ? <div className="mt-8 rounded-2xl border border-[#E1E8DC] bg-white p-10 text-center text-[#718073]">Loading orders...</div> : (
          <>
            <section className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Total orders", stats.total, "All marketplace orders"],
                ["Awaiting assignment", stats.awaitingAssignment, "Paid and ready for dispatch"],
                ["On the way", stats.inTransit, "Picked up or in transit"],
                ["Completed", stats.completed, "Fulfilled orders"],
              ].map(([label, value, description]) => (
                <div key={label} className="rounded-2xl border border-[#E1E8DC] bg-white p-6 shadow-sm">
                  <p className="text-xs text-[#718073]">{label}</p>
                  <p className="mt-3 font-serif text-4xl font-semibold text-[#194C35]">{value}</p>
                  <p className="mt-2 text-xs text-[#8A968A]">{description}</p>
                </div>
              ))}
            </section>

            <section className="mt-10">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-[#183B2B]">Order history</h2>
                  <p className="mt-1 text-sm text-[#718073]">Review purchases, payments, and delivery progress.</p>
                </div>
                <span className="rounded-full bg-[#E9F0E2] px-4 py-2 text-xs font-semibold text-[#194C35]">{filteredOrders.length} orders shown</span>
              </div>

              <div className="mb-5 flex flex-wrap gap-3 rounded-2xl border border-[#E1E8DC] bg-white p-4 shadow-sm">
                <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order, product, buyer, farmer..." aria-label="Search orders" className="min-w-0 flex-1 basis-64 rounded-xl border border-[#DCE5D6] bg-[#FAFBF8] px-4 py-3 text-sm outline-none focus:border-[#77975F]" />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter order status" className="rounded-xl border border-[#DCE5D6] bg-[#FAFBF8] px-4 py-3 text-sm outline-none focus:border-[#77975F]">
                  <option value="all">All order statuses</option>
                  {["pending", "confirmed", "processing", "ready_for_delivery", "completed", "cancelled"].map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
                </select>
                <select value={deliveryFilter} onChange={(e) => setDeliveryFilter(e.target.value)} aria-label="Filter delivery status" className="rounded-xl border border-[#DCE5D6] bg-[#FAFBF8] px-4 py-3 text-sm outline-none focus:border-[#77975F]">
                  <option value="all">All delivery statuses</option>
                  {["not_assigned", "assigned", "picked_up", "in_transit", "delivered", "failed"].map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
                </select>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="rounded-2xl border border-[#E1E8DC] bg-white p-10 text-center text-sm text-[#718073]">No matching orders found.</div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    // Keep the exact eligibility rule from the working AdminOrders page.
                    const canAssign = order.status === "ready_for_delivery" && order.paymentStatus === "paid" && ["not_assigned", "assigned", "failed"].includes(order.deliveryStatus);
                    return (
                      <article key={order._id} className="overflow-hidden rounded-2xl border border-[#E1E8DC] bg-white shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF1EA] px-5 py-4 sm:px-6">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A968A]">Order reference</p>
                            <h3 className="mt-1 break-all font-serif text-lg font-semibold text-[#194C35]">{order.orderNumber || order._id}</h3>
                          </div>
                          <StatusBadge value={order.status} />
                        </div>

                        <div className="grid gap-5 px-5 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
                          <div><p className="text-xs text-[#8A968A]">Product</p><p className="mt-1 text-sm font-semibold text-[#183B2B]">{order.product?.name || "Unknown product"}</p></div>
                          <div><p className="text-xs text-[#8A968A]">Buyer</p><p className="mt-1 text-sm font-semibold text-[#183B2B]">{order.buyer?.name || "Unknown buyer"}</p></div>
                          <div><p className="text-xs text-[#8A968A]">Farmer</p><p className="mt-1 text-sm font-semibold text-[#183B2B]">{order.farmer?.name || "Unknown farmer"}</p></div>
                          <div><p className="text-xs text-[#8A968A]">Order total</p><p className="mt-1 text-sm font-semibold text-[#183B2B]">{money(order.totalAmount)}</p></div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 border-t border-[#EEF1EA] bg-[#FAFBF8] px-5 py-4 sm:px-6">
                          <div className="flex items-center gap-2"><span className="text-xs text-[#718073]">Payment</span><StatusBadge value={order.paymentStatus || "unpaid"} /></div>
                          <div className="flex items-center gap-2"><span className="text-xs text-[#718073]">Delivery</span><StatusBadge value={order.deliveryStatus || "not_assigned"} /></div>
                          <p className="text-xs text-[#718073]">Agent: <span className="font-semibold text-[#183B2B]">{order.deliveryAgent?.name || "Not assigned"}</span></p>
                        </div>

                        {canAssign && (
                          <div className="flex flex-wrap items-end gap-3 border-t border-[#EEF1EA] px-5 py-5 sm:px-6">
                            <div className="min-w-0 flex-1 basis-56">
                              <label htmlFor={`agent-${order._id}`} className="mb-2 block text-xs font-semibold text-[#183B2B]">Assign delivery agent</label>
                              <select id={`agent-${order._id}`} value={selectedAgents[order._id] || ""} onChange={(e) => setSelectedAgents((previous) => ({ ...previous, [order._id]: e.target.value }))} className="w-full rounded-xl border border-[#DCE5D6] bg-white px-4 py-3 text-sm outline-none focus:border-[#77975F]">
                                <option value="">Select an active delivery agent</option>
                                {deliveryAgents.map((agent) => <option key={agent._id} value={agent._id}>{agent.name}</option>)}
                              </select>
                            </div>
                            <button type="button" onClick={() => handleAssign(order._id)} disabled={!selectedAgents[order._id] || assigningId === order._id} className="rounded-full bg-[#194C35] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#123D2A] disabled:cursor-not-allowed disabled:opacity-50">{assigningId === order._id ? "Assigning..." : order.deliveryStatus === "assigned" ? "Reassign agent" : "Assign agent"}</button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default AdminOrders;
