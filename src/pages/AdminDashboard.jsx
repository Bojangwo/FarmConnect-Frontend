
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllUsers, updateUserStatus } from "../services/api";

const roleLabels = {
  farmer: "Farmer",
  buyer: "Buyer",
  deliveryAgent: "Delivery Agent",
  admin: "Administrator",
};

const statusStyles = {
  active: "bg-[#EAF3E6] text-[#32633C]",
  inactive: "bg-[#F0F0EC] text-[#777E74]",
  suspended: "bg-[#FCEBE8] text-[#B44B3B]",
};

function StatCard({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-[#E1E8DC] bg-white p-6 shadow-sm">
      <p className="text-xs font-medium text-[#718073]">
        {label}
      </p>

      <p className="mt-3 font-serif text-4xl font-semibold text-[#194C35]">
        {value}
      </p>

      <p className="mt-2 text-xs text-[#8A968A]">
        {description}
      </p>
    </div>
  );
}

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      try {
        const data = await getAllUsers();

        if (!cancelled) {
          setUsers(data.users || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    return {
      total: users.length,
      farmers: users.filter(
        (user) => user.role === "farmer"
      ).length,
      buyers: users.filter(
        (user) => user.role === "buyer"
      ).length,
      deliveryAgents: users.filter(
        (user) => user.role === "deliveryAgent"
      ).length,
      active: users.filter(
        (user) => user.status === "active"
      ).length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !term ||
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.phone?.toLowerCase().includes(term);

      const matchesRole =
        roleFilter === "all" ||
        user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  async function handleStatusChange(userId, newStatus) {
    const currentUser = users.find(
      (user) => user._id === userId
    );

    if (!currentUser || currentUser.role === "admin") {
      return;
    }

    if (currentUser.status === newStatus) {
      return;
    }

    const confirmed = window.confirm(
      `Change ${currentUser.name}'s account status from ${currentUser.status} to ${newStatus}?`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(userId);
      setError("");
      setSuccess("");

      const data = await updateUserStatus(
        userId,
        newStatus
      );

      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user._id === userId
            ? {
                ...user,
                status: data.user.status,
              }
            : user
        )
      );

      setSuccess(
        `${currentUser.name}'s account status has been updated to ${data.user.status}.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF9F4] px-4 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* PAGE HEADER */}
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#77975F]">
              Platform management
            </p>

            <h1 className="mt-2 font-serif text-4xl font-semibold text-[#183B2B]">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#718073]">
              Manage registered users and oversee FarmConnect operations.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/categories"
              className="rounded-full border border-[#CBD8C4] bg-white px-5 py-3 text-sm font-semibold text-[#194C35] transition hover:bg-[#F2F6EE]"
            >
              Manage Categories
            </Link>

            <Link
              to="/admin/orders"
              className="rounded-full bg-[#194C35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123D2A]"
            >
              Manage Orders
            </Link>
          </div>
        </div>

        {/* ALERTS */}
        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-800"
          >
            {success}
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-2xl border border-[#E1E8DC] bg-white p-10 text-center text-[#718073]">
            Loading marketplace users...
          </div>
        ) : (
          <>
            {/* STATISTICS */}
            <section className="mt-9">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-serif text-2xl font-semibold text-[#183B2B]">
                  Platform overview
                </h2>

                <span className="text-xs text-[#8A968A]">
                  Current registered accounts
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Total users"
                  value={stats.total}
                  description={`${stats.active} active accounts`}
                />

                <StatCard
                  label="Farmers"
                  value={stats.farmers}
                  description="Registered produce sellers"
                />

                <StatCard
                  label="Buyers"
                  value={stats.buyers}
                  description="Registered buyer accounts"
                />

                <StatCard
                  label="Delivery agents"
                  value={stats.deliveryAgents}
                  description="Registered delivery personnel"
                />
              </div>
            </section>

            {/* USER MANAGEMENT */}
            <section className="mt-10">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-[#183B2B]">
                    User management
                  </h2>

                  <p className="mt-1 text-sm text-[#718073]">
                    Search accounts, review roles, and manage access.
                  </p>
                </div>

                <span className="rounded-full bg-[#E9F0E2] px-4 py-2 text-xs font-semibold text-[#194C35]">
                  {filteredUsers.length} users shown
                </span>
              </div>

              {/* FILTERS */}
              <div className="mb-5 flex flex-wrap gap-3 rounded-2xl border border-[#E1E8DC] bg-white p-4 shadow-sm">
                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search name, email, or phone..."
                  aria-label="Search users"
                  className="min-w-0 flex-1 basis-64 rounded-xl border border-[#DCE5D6] bg-[#FAFBF8] px-4 py-3 text-sm text-[#183B2B] outline-none focus:border-[#77975F]"
                />

                <select
                  value={roleFilter}
                  onChange={(event) =>
                    setRoleFilter(event.target.value)
                  }
                  aria-label="Filter users by role"
                  className="rounded-xl border border-[#DCE5D6] bg-[#FAFBF8] px-4 py-3 text-sm text-[#183B2B] outline-none focus:border-[#77975F]"
                >
                  <option value="all">All roles</option>
                  <option value="farmer">Farmers</option>
                  <option value="buyer">Buyers</option>
                  <option value="deliveryAgent">
                    Delivery Agents
                  </option>
                  <option value="admin">
                    Administrators
                  </option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                  aria-label="Filter users by status"
                  className="rounded-xl border border-[#DCE5D6] bg-[#FAFBF8] px-4 py-3 text-sm text-[#183B2B] outline-none focus:border-[#77975F]"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* USERS TABLE */}
              <div className="overflow-hidden rounded-2xl border border-[#E1E8DC] bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="bg-[#F5F8F1] text-[#536E59]">
                      <tr>
                        <th className="px-5 py-4 font-semibold">
                          User
                        </th>
                        <th className="px-5 py-4 font-semibold">
                          Role
                        </th>
                        <th className="px-5 py-4 font-semibold">
                          Status
                        </th>
                        <th className="px-5 py-4 font-semibold">
                          Verified
                        </th>
                        <th className="px-5 py-4 font-semibold">
                          Account actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr
                          key={user._id}
                          className="border-t border-[#EEF1EA] transition hover:bg-[#FAFBF8]"
                        >
                          <td className="px-5 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E9F0E2] text-sm font-semibold text-[#194C35]">
                                {(user.name || "U")
                                  .trim()
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <p className="font-semibold text-[#183B2B]">
                                  {user.name}
                                </p>

                                <p className="mt-1 text-xs text-[#718073]">
                                  {user.email}
                                </p>

                                {user.phone && (
                                  <p className="mt-1 text-xs text-[#8A968A]">
                                    {user.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-5">
                            <span className="rounded-full border border-[#E1E8DC] bg-[#FAFBF8] px-3 py-1.5 text-xs font-medium text-[#194C35]">
                              {roleLabels[user.role] || user.role}
                            </span>
                          </td>

                          <td className="px-5 py-5">
                            <span
                              className={`inline-block rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                                statusStyles[user.status] ||
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {user.status}
                            </span>
                          </td>

                          <td className="px-5 py-5">
                            {user.isVerified ? (
                              <span className="text-sm font-medium text-[#32633C]">
                                ✓ Verified
                              </span>
                            ) : (
                              <span className="text-sm text-[#8A968A]">
                                Not verified
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-5">
                            {user.role === "admin" ? (
                              <span className="text-xs font-medium text-[#8A968A]">
                                Protected account
                              </span>
                            ) : (
                              <select
                                value={user.status}
                                disabled={
                                  updatingId === user._id
                                }
                                onChange={(event) =>
                                  handleStatusChange(
                                    user._id,
                                    event.target.value
                                  )
                                }
                                aria-label={`Change status for ${user.name}`}
                                className="rounded-lg border border-[#DCE5D6] bg-white px-3 py-2.5 text-xs font-medium text-[#194C35] outline-none focus:border-[#77975F] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="active">
                                  Active
                                </option>
                                <option value="inactive">
                                  Inactive
                                </option>
                                <option value="suspended">
                                  Suspended
                                </option>
                              </select>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredUsers.length === 0 && (
                  <div className="border-t border-[#EEF1EA] p-10 text-center">
                    <p className="font-medium text-[#183B2B]">
                      No matching users found
                    </p>
                    <p className="mt-2 text-sm text-[#718073]">
                      Try adjusting your search or filters.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default AdminDashboard;
