import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getFarmerPurchaseRequests, respondToPurchaseRequest } from "../services/api";

const statusTone = (status) => {
  if (status === "accepted") return "bg-[#EAF3E6] text-[#24583D] border-[#D5E5CE]";
  if (status === "rejected") return "bg-[#FFF0ED] text-[#9B4136] border-[#F3D9D4]";
  return "bg-[#FFF6E4] text-[#92661F] border-[#F0E1BD]";
};
const money = (value) => value == null ? "N/A" : `D${Number(value).toLocaleString("en-GM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function FarmerPurchaseRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    async function loadRequests() {
      try {
        const data = await getFarmerPurchaseRequests();
        if (active) setRequests(data.requests || []);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadRequests();
    return () => { active = false; };
  }, []);

  async function handleRespond(requestId, status) {
    const action = status === "accepted" ? "accept" : "reject";
    if (!window.confirm(`Are you sure you want to ${action} this purchase request?`)) return;
    try {
      setError("");
      setNotice("");
      setProcessingId(requestId);
      const data = await respondToPurchaseRequest(requestId, status);
      setRequests((previous) => previous.map((request) => request._id === requestId ? { ...request, status: data.request.status } : request));
      setNotice(data.message || `Purchase request ${status}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  }

  const counts = useMemo(() => ({
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    accepted: requests.filter((r) => r.status === "accepted").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  }), [requests]);
  const visible = useMemo(() => requests.filter((request) => {
    const matchFilter = filter === "all" || request.status === filter;
    const query = search.trim().toLowerCase();
    const matchSearch = !query || [request.product?.name, request.buyer?.name, request.deliveryAddress].some((value) => String(value || "").toLowerCase().includes(query));
    return matchFilter && matchSearch;
  }), [requests, filter, search]);

  return (
    <main className="min-h-screen bg-[#FAF9F4] px-4 py-8 text-[#183B2B] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link to="/farmer/dashboard" className="text-sm font-medium text-[#477341] hover:underline">← Farmer Dashboard</Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#77975F]">Farm management</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold text-[#194C35]">Purchase Requests</h1>
            <p className="mt-2 text-sm text-[#6D7C70]">Review incoming requests and decide which orders to fulfill.</p>
          </div>
          <Link to="/farmer/orders" className="rounded-xl border border-[#DCE5D7] bg-white px-4 py-2.5 text-sm font-semibold text-[#194C35] hover:bg-[#EEF3E9]">View Sales Orders →</Link>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "All requests", value: counts.all },
            { label: "Awaiting response", value: counts.pending },
            { label: "Accepted", value: counts.accepted },
            { label: "Rejected", value: counts.rejected },
          ].map((item) => <div key={item.label} className="rounded-2xl border border-[#E1E7DD] bg-white p-5 shadow-sm"><p className="text-xs text-[#718073]">{item.label}</p><p className="mt-2 font-serif text-3xl font-semibold text-[#194C35]">{loading ? "—" : item.value}</p></div>)}
        </div>

        {error && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {notice && <div role="status" className="mt-6 rounded-xl border border-[#D5E5CE] bg-[#EAF3E6] px-4 py-3 text-sm text-[#24583D]">{notice}</div>}

        <section className="mt-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-2xl font-semibold text-[#194C35]">Incoming requests</h2>
            <div className="flex flex-wrap gap-2">
              <input aria-label="Search purchase requests" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requests..." className="w-48 rounded-xl border border-[#DEE5DA] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#77975F] sm:w-60" />
              <select aria-label="Filter purchase requests" value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border border-[#DEE5DA] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#77975F]">
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {loading ? <p className="mt-6 text-sm text-[#718073]">Loading purchase requests...</p> : visible.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-[#E1E7DD] bg-white px-6 py-12 text-center"><p className="font-serif text-xl text-[#194C35]">{requests.length ? "No matching requests" : "No purchase requests yet"}</p><p className="mt-2 text-sm text-[#718073]">{requests.length ? "Try another search or filter." : "New requests for your products will appear here."}</p></div>
          ) : (
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {visible.map((request) => <article key={request._id} className="flex flex-col overflow-hidden rounded-2xl border border-[#E1E7DD] bg-white shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EDF0E9] px-5 py-5 sm:px-6">
                  <div><p className="text-[11px] font-medium uppercase tracking-widest text-[#819082]">Product requested</p><h3 className="mt-1 font-serif text-xl font-semibold text-[#194C35]">{request.product?.name || "Product unavailable"}</h3></div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusTone(request.status)}`}>{request.status || "unknown"}</span>
                </div>
                <div className="grid flex-1 gap-x-5 gap-y-5 px-5 py-5 text-sm sm:grid-cols-2 sm:px-6">
                  {[
                    ["Requested by", request.buyer?.name || "Unknown"],
                    ["Phone", request.buyer?.phone || "Not available"],
                    ["Quantity", `${request.quantityRequested ?? "N/A"} ${request.product?.unit || ""}`],
                    ["Product price", money(request.product?.price)],
                    ["Delivery address", request.deliveryAddress || "Not provided"],
                    ["Buyer message", request.message || "No message"],
                  ].map(([label, value]) => <div key={label}><p className="text-xs text-[#819082]">{label}</p><p className="mt-1 break-words font-medium text-[#264534]">{value}</p></div>)}
                </div>
                {request.status === "pending" ? <div className="flex flex-wrap gap-3 border-t border-[#EDF0E9] px-5 py-4 sm:px-6">
                  <button type="button" disabled={processingId !== null} onClick={() => handleRespond(request._id, "accepted")} className="rounded-xl bg-[#194C35] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#286344] disabled:opacity-50">{processingId === request._id ? "Processing..." : "Accept Request"}</button>
                  <button type="button" disabled={processingId !== null} onClick={() => handleRespond(request._id, "rejected")} className="rounded-xl border border-[#EACBC5] px-4 py-2.5 text-sm font-semibold text-[#9B4136] hover:bg-[#FFF3F0] disabled:opacity-50">Reject Request</button>
                </div> : <div className="border-t border-[#EDF0E9] px-5 py-4 text-xs text-[#718073] sm:px-6">This request has been {request.status}. No further response is available.</div>}
              </article>)}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
