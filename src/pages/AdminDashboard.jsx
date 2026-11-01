import { useEffect, useState } from "react";
import { getAllUsers, updateUserStatus } from "../services/api";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await getAllUsers();
        setUsers(data.users || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  
const [updatingId, setUpdatingId] = useState(null);
const [success, setSuccess] = useState("");

async function handleStatusChange(userId, newStatus) {
  const confirmed = window.confirm(
    `Are you sure you want to change this account to ${newStatus}?`
  );

  if (!confirmed) return;

  try {
    setUpdatingId(userId);
    setError("");
    setSuccess("");

    const data = await updateUserStatus(userId, newStatus);

    setUsers((previousUsers) =>
      previousUsers.map((user) =>
        user._id === userId
          ? { ...user, status: data.user.status }
          : user
      )
    );

    setSuccess(`Account successfully updated to ${newStatus}.`);
  } catch (err) {
    setError(err.message);
  } finally {
    setUpdatingId(null);
  }
}


  const farmers = users.filter(
    (user) => user.role === "farmer"
  ).length;

  const buyers = users.filter(
    (user) => user.role === "buyer"
  ).length;

  const deliveryAgents = users.filter(
    (user) => user.role === "deliveryAgent"
  ).length;

  const stats = [
    { label: "Total Users", value: users.length },
    { label: "Farmers", value: farmers },
    { label: "Buyers", value: buyers },
    { label: "Delivery Agents", value: deliveryAgents },
  ];

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-2 text-3xl font-bold text-green-800">
          FarmConnect Admin Dashboard 🌾
        </h1>

        <p className="mb-8 text-gray-600">
          Manage marketplace users and monitor platform activity.
        </p>

        {loading && (
          <p className="text-gray-600">Loading users...</p>
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
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl bg-white p-6 shadow-sm"
                >
                  <p className="text-sm text-gray-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-green-800">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="border-b p-6">
                <h2 className="text-xl font-bold text-green-800">
                  Registered Users
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-green-100 text-green-900">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Verified</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user._id}
                        className="border-t hover:bg-green-50"
                      >
                        <td className="p-4 font-medium">
                          {user.name}
                        </td>

                        <td className="p-4">
                          {user.email}
                        </td>

                        <td className="p-4 capitalize">
                          {user.role}
                        </td>

                        <td className="p-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              user.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>

                        <td className="p-4">
                          {user.isVerified ? "Yes" : "No"}
                        </td>

                        
<td className="p-4">
  {user.role === "admin" ? (
    <span className="text-gray-400">Protected</span>
  ) : (
    <select
      value={user.status}
      disabled={updatingId === user._id}
      onChange={(e) =>
        handleStatusChange(user._id, e.target.value)
      }
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
    >
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
      <option value="suspended">Suspended</option>
    </select>
  )}
</td>

                        
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {users.length === 0 && (
                <p className="p-6 text-center text-gray-500">
                  No registered users found.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
