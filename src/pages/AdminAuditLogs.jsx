import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const actionLabels = {
  USER_STATUS_CHANGED: "User status changed",
  PRODUCT_REMOVED: "Product removed",
  PRODUCT_RESTORED: "Product restored",
  PAYMENT_SETTINGS_UPDATED: "Payment settings updated",
  PAYOUT_RECORDED: "Payout recorded",
  PAYOUT_DETAILS_VERIFIED: "Payout details verified",
};

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLogs() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/admin/audit-logs?page=${page}`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load audit logs");
        }

        if (!cancelled) {
          setLogs(data.logs || []);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLogs();

    return () => {
      cancelled = true;
    };
  }, [page]);

  const formatDate = (date) => (date ? new Date(date).toLocaleString() : "—");

  return (
    <main className="min-h-screen bg-[#FAF9F4] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#77975F]">
          Security & accountability
        </p>

        <h1 className="mt-2 font-serif text-4xl font-semibold text-[#183B2B]">
          Admin Audit Logs
        </h1>

        <p className="mt-2 text-sm text-[#718073]">
          Review important administrative activities on FarmConnect.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-8 overflow-x-auto rounded-2xl border border-[#E1E8DC] bg-white shadow-sm">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-[#F5F8F1] text-[#536E59]">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Administrator</th>
                <th className="p-4">Action</th>
                <th className="p-4">Target</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>

            <tbody>
              {!loading &&
                logs.map((log) => (
                  <tr key={log._id} className="border-t border-[#EEF1EA]">
                    <td className="p-4 text-[#718073]">
                      {formatDate(log.createdAt)}
                    </td>

                    <td className="p-4 font-medium text-[#183B2B]">
                      {log.admin?.name || "Unknown admin"}
                    </td>

                    <td className="p-4">
                      {actionLabels[log.action] || log.action}
                    </td>

                    <td className="p-4">{log.targetType}</td>

                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="font-semibold text-[#194C35] underline"
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {loading && (
            <p className="p-8 text-center text-gray-500">
              Loading audit logs...
            </p>
          )}

          {!loading && logs.length === 0 && (
            <p className="p-8 text-center text-gray-500">
              No audit logs recorded yet.
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-[#CBD8C4] bg-white px-5 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-sm text-[#718073]">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg bg-[#194C35] px-5 py-2 text-sm text-white disabled:opacity-40"
          >
            Next
          </button>
        </div>

        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="audit-detail-title"
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            >
              <h2
                id="audit-detail-title"
                className="font-serif text-2xl font-semibold text-[#183B2B]"
              >
                Audit Log Details
              </h2>

              <p className="mt-3 text-sm text-[#718073]">
                {actionLabels[selectedLog.action] || selectedLog.action}
              </p>

              <pre className="mt-5 max-h-80 overflow-auto rounded-xl bg-[#F5F8F1] p-4 text-xs whitespace-pre-wrap break-words">
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="mt-5 rounded-lg bg-[#194C35] px-5 py-2 text-sm font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
