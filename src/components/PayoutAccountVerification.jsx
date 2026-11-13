import { useCallback, useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

export default function PayoutAccountVerification() {
  const [accounts, setAccounts] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadAccounts = useCallback(async () => {
    try {
      setError("");

      const token = sessionStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/admin/payout-accounts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not load payout accounts"
        );
      }

      setAccounts(data.accounts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const verifyAccount = async (account) => {
    const confirmed = window.confirm(
      `Have you checked the account ownership?\n\n` +
      `Recipient: ${account.name}\n` +
      `Provider: ${account.provider.toUpperCase()}\n` +
      `Number: ${account.phoneNumber}\n` +
      `Account holder: ${account.accountHolderName}\n\n` +
      `Click OK only after verifying these details.`
    );

    if (!confirmed) return;

    try {
      setBusyId(account.userId);
      setError("");
      setMessage("");

      const token = sessionStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/admin/users/${account.userId}/verify-payout`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Verification failed"
        );
      }

      setMessage(`${account.name}'s account verified.`);
      await loadAccounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const visibleAccounts = accounts.filter((account) => {
    if (filter === "pending") return !account.isVerified;
    if (filter === "verified") return account.isVerified;
    return true;
  });

  const pendingCount = accounts.filter(
    (account) => !account.isVerified
  ).length;

  return (
    <section className="rounded-2xl border border-[#DFE6D8] bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#194C35]">
            Payout account verification
          </h2>
          <p className="mt-1 text-sm text-[#718274]">
            Review Wave and APS receiving details before approving them.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAccounts}
          className="rounded-full border border-[#CBD8C4] px-4 py-2 text-sm font-medium text-[#194C35] hover:bg-[#F2F6EE]"
        >
          Refresh
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-[#F4ECDD] px-3 py-1.5 text-xs font-semibold text-[#795B27]">
          {pendingCount} awaiting verification
        </span>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="rounded-xl border border-[#DDE5D7] bg-white px-3 py-2 text-sm text-[#194C35]"
        >
          <option value="pending">Awaiting verification</option>
          <option value="verified">Verified accounts</option>
          <option value="all">All accounts</option>
        </select>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          {message}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-[#718274]">
          Loading payout accounts...
        </p>
      ) : visibleAccounts.length === 0 ? (
        <p className="rounded-xl bg-[#F7F9F4] p-5 text-sm text-[#718274]">
          No accounts found for this filter.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-[#F2F6EE] text-[#194C35]">
              <tr>
                {[
                  "Recipient",
                  "Provider",
                  "Receiving number",
                  "Account holder",
                  "Status",
                  "Action",
                ].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-semibold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {visibleAccounts.map((account) => (
                <tr
                  key={account.userId}
                  className="border-b border-[#E8EDE4]"
                >
                  <td className="px-4 py-4">
                    <p className="font-semibold text-[#194C35]">
                      {account.name}
                    </p>
                    <p className="text-xs text-[#718274]">
                      {account.role === "deliveryAgent"
                        ? "Delivery agent"
                        : "Farmer"}
                    </p>
                  </td>

                  <td className="px-4 py-4 capitalize">
                    {account.provider}
                  </td>

                  <td className="px-4 py-4">
                    {account.phoneNumber}
                  </td>

                  <td className="px-4 py-4">
                    {account.accountHolderName}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        account.isVerified
                          ? "bg-green-50 text-green-800"
                          : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {account.isVerified
                        ? "Verified"
                        : "Pending"}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    {account.isVerified ? (
                      <span className="text-xs text-[#718274]">
                        Approved
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => verifyAccount(account)}
                        className="rounded-full bg-[#194C35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#276647] disabled:opacity-50"
                      >
                        {busyId === account.userId
                          ? "Verifying..."
                          : "Verify account"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
