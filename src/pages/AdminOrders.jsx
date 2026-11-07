import { useEffect, useState } from "react";

import {
  getAllOrdersAdmin,
  getAllUsers,
  assignDeliveryAgentAdmin,
} from "../services/api";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [deliveryAgents, setDeliveryAgents] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigningId, setAssigningId] = useState(null);
  const [success, setSuccess] = useState("");


  
useEffect(() => {
  async function loadData() {
    try {
      const [ordersData, usersData] = await Promise.all([
        getAllOrdersAdmin(),
        getAllUsers(),
      ]);

      setOrders(ordersData.orders || []);

      const activeAgents = (usersData.users || []).filter(
        (user) =>
          user.role === "deliveryAgent" &&
          user.status === "active"
      );

      setDeliveryAgents(activeAgents);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  loadData();
}, []);


async function handleAssign(orderId) {
  const deliveryAgentId = selectedAgents[orderId];

  if (!deliveryAgentId) {
    setError("Please select a delivery agent first.");
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to assign this delivery agent?"
  );

  if (!confirmed) return;

  try {
    setAssigningId(orderId);
    setError("");
    setSuccess("");

    await assignDeliveryAgentAdmin(orderId, deliveryAgentId);

    const data = await getAllOrdersAdmin();
    setOrders(data.orders || []);

    setSelectedAgents((previous) => ({
      ...previous,
      [orderId]: "",
    }));

    setSuccess("Delivery agent assigned successfully!");
  } catch (err) {
    setError(err.message);
  } finally {
    setAssigningId(null);
  }
}

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-2 text-3xl font-bold text-green-800">
          FarmConnect Orders 🚚
        </h1>

        <p className="mb-8 text-gray-600">
          Monitor marketplace orders and delivery assignments.
        </p>

        {loading && (
          <p className="text-gray-600">Loading orders...</p>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        
{success && (
  <div className="mb-6 rounded-lg bg-green-100 p-4 text-green-800">
    {success}
  </div>
)}

        {!loading && !error && (
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-green-100 text-green-900">
                <tr>
                  <th className="p-4">Order</th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Buyer</th>
                  <th className="p-4">Farmer</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Order Status</th>
                  <th className="p-4">Delivery Status</th>
                  <th className="p-4">Delivery Agent</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-t hover:bg-green-50"
                  >
                    <td className="p-4 font-medium">
                      {order.orderNumber}
                    </td>

                    <td className="p-4">
                      {order.product?.name || "Unknown product"}
                    </td>

                    <td className="p-4">
                      {order.buyer?.name || "Unknown buyer"}
                    </td>

                    <td className="p-4">
                      {order.farmer?.name || "Unknown farmer"}
                    </td>

                    <td className="p-4 font-semibold">
                      D{Number(order.totalAmount || 0).toFixed(2)}
                    </td>

                    <td className="p-4 capitalize">
                      {order.status?.replaceAll("_", " ")}
                    </td>

                    <td className="p-4 capitalize">
                      {order.deliveryStatus?.replaceAll("_", " ") ||
                        "Not assigned"}
                    </td>

                    <td className="p-4">
                      {order.deliveryAgent?.name || "Not assigned"}
                    </td>
                    
<td className="p-4">
 {order.status === "ready_for_delivery" &&
  order.paymentStatus === "paid" &&
  ["not_assigned", "assigned", "failed"].includes(
    order.deliveryStatus
  ) ? (
    <div className="flex flex-col gap-2">
    <select
      value={selectedAgents[order._id] || ""}
      onChange={(e) =>
        setSelectedAgents((previous) => ({
          ...previous,
          [order._id]: e.target.value,
        }))
      }
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
    >
      <option value="">Select delivery agent</option>

      {deliveryAgents.map((agent) => (
        <option key={agent._id} value={agent._id}>
          {agent.name}
        </option>
      ))}
    </select>

    
<button
  onClick={() => handleAssign(order._id)}
  disabled={
    !selectedAgents[order._id] ||
    assigningId === order._id
  }
  className="rounded-lg bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
>
  {assigningId === order._id
    ? "Assigning..."
    : "Assign Agent"}
</button>
    
    </div>
  ) : (
    <span className="text-gray-400">
      Not available
    </span>
  )}
</td>

                  </tr>
                ))}
              </tbody>
            </table>

            {orders.length === 0 && (
              <p className="p-6 text-center text-gray-500">
                No orders found.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminOrders;
