import { useCallback, useEffect, useMemo, useState } from "react";

// Set VITE_API_URL=http://localhost:5000/api in your frontend .env if needed.
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const panel = "rounded-2xl border border-[#E1E8DC] bg-white p-5 shadow-sm sm:p-6";
const field = "rounded-xl border border-[#DCE5D6] bg-white px-3 py-2.5 text-sm text-[#183B2B] focus:border-[#77975F] focus:outline-none";
const money = (value) => `D${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (value) => Number(value || 0).toLocaleString("en-US");
const monthLabel = (value) => {
  const [year, month] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
};
const todayUTC = () => new Date().toISOString().slice(0, 10);
const thisMonthStart = () => `${todayUTC().slice(0, 7)}-01`;

function Stat({ title, value, note }) {
  return <div className={panel}>
    <p className="text-xs font-medium text-[#718073]">{title}</p>
    <p className="mt-3 font-serif text-2xl font-semibold text-[#194C35] sm:text-3xl">{value}</p>
    {note && <p className="mt-2 text-xs text-[#8A968A]">{note}</p>}
  </div>;
}

function Bars({ items, valueKey, labelKey, format = fmt, emptyText = "No data in this period." }) {
  const max = Math.max(0, ...items.map(item => Number(item[valueKey]) || 0));
  if (!items.length) return <p className="py-8 text-center text-sm text-[#718073]">{emptyText}</p>;
  return <div className="space-y-4">
    {items.map((item, index) => {
      const value = Number(item[valueKey]) || 0;
      return <div key={`${item[labelKey]}-${index}`}>
        <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
          <span className="truncate font-medium text-[#194C35]" title={String(item[labelKey])}>{item[labelKey]}</span>
          <span className="shrink-0 font-semibold text-[#194C35]">{format(value)}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[#EEF3E9]">
          <div className="h-full rounded-full bg-[#77975F] transition-all" style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
        </div>
      </div>;
    })}
  </div>;
}

function downloadCSV(report) {
  const rows = [
    ["FarmConnect Admin Report"],
    ["Start date", report.period?.startDate || "All time"],
    ["End date", report.period?.endDate || "All time"],
    [], ["Financial metric", "GMD"],
    ...Object.entries(report.financial || {}),
    [], ["Order metric", "Value"],
    ["total", report.orders?.total ?? 0],
    ["completionRate", report.orders?.completionRate ?? 0],
    ["cancellationRate", report.orders?.cancellationRate ?? 0],
    ...Object.entries(report.orders?.byStatus || {}),
    [], ["Registration metric", "Value"],
    ["newRegistrationsInPeriod", report.users?.totalRegistered ?? 0],
    ...Object.entries(report.users?.byRole || {}),
    [], ["Month", "Gross collected (GMD)", "Payments"],
    ...(report.monthlySales || []).map(m => [m.month, m.grossCollected, m.payments]),
    [], ["Product", "Quantity", "Sales value (GMD)", "Orders"],
    ...(report.topProducts || []).map(p => [p.name, p.quantitySold, p.salesValue, p.orders]),
  ];
  const escapeCell = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + rows.map(row => row.map(escapeCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `farmconnect-admin-report-${report.period?.startDate || "all"}-${report.period?.endDate || "time"}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function AdminReports() {
  const [range, setRange] = useState("all");
  const [startDate, setStartDate] = useState(thisMonthStart());
  const [endDate, setEndDate] = useState(todayUTC());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const query = useMemo(() => {
    if (range === "all") return "";
    const start = range === "month" ? thisMonthStart() : startDate;
    const end = range === "month" ? todayUTC() : endDate;
    return `?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`;
  }, [range, startDate, endDate]);

  const load = useCallback(async (signal) => {
    if (range === "custom" && startDate > endDate) {
      setError("Start date must not be after end date.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`${API_URL}/admin/reports${query}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Unable to load reports.");
      setReport(body);
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message || "Unable to load reports.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [query, range, startDate, endDate]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  const monthly = (report?.monthlySales || []).map(item => ({ ...item, label: monthLabel(item.month) }));
  const products = report?.topProducts || [];
  const statusLabels = {
    pending: "Pending", confirmed: "Confirmed", processing: "Processing",
    ready_for_delivery: "Ready for delivery", completed: "Completed", cancelled: "Cancelled"
  };
  const roleLabels = { farmer: "Farmers", buyer: "Buyers", deliveryAgent: "Delivery agents", admin: "Administrators" };

  return <main className="min-h-screen bg-[#FAF9F4] px-4 py-8 text-[#183B2B] sm:px-8 lg:px-10">
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#77975F]">Platform management</p>
          <h1 className="mt-2 font-serif text-4xl text-[#183B2B]">Reports & analytics</h1>
          <p className="mt-2 text-sm text-[#718073]">Marketplace performance, sales trends and payout records.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setReloadKey(k => k + 1)} className="rounded-full border border-[#CBD8C4] bg-white px-5 py-2.5 text-sm font-semibold text-[#194C35] hover:bg-[#F2F6EE]">Refresh</button>
          <button type="button" disabled={!report || loading} onClick={() => downloadCSV(report)} className="rounded-full bg-[#194C35] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#276647] disabled:opacity-50">Export CSV</button>
        </div>
      </header>

      <section className={`${panel} flex flex-wrap items-end gap-4`} aria-label="Report date range">
        <label className="flex flex-col gap-1 text-xs font-semibold text-[#536E59]">Period
          <select value={range} onChange={e => setRange(e.target.value)} className={field}>
            <option value="all">All time</option>
            <option value="month">This month</option>
            <option value="custom">Custom dates</option>
          </select>
        </label>
        {range === "custom" && <>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[#536E59]">From
            <input className={field} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[#536E59]">To
            <input className={field} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </label>
        </>}
        <p className="text-xs text-[#718073]">All report figures use your selected period unless noted.</p>
      </section>

      {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {loading && <div className={panel} role="status">Loading reports...</div>}

      {!loading && report && <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat title="Gross payments collected" value={money(report.financial?.grossCollected)} note="Before refunds or gateway fees" />
          <Stat title="Gross platform commission" value={money(report.financial?.commissionGross)} note="Stored commission snapshots" />
          <Stat title="Orders created" value={fmt(report.orders?.total)} note="In the selected period" />
          <Stat title="Completed orders" value={fmt(report.orders?.byStatus?.completed)} note={`${fmt(report.orders?.completionRate)}% completion rate`} />
          <Stat title="Delivery fees" value={money(report.financial?.deliveryFeesGross)} />
          <Stat title="Farmer allocations" value={money(report.financial?.farmerAllocations)} />
          <Stat title="Pending payouts" value={money(report.financial?.pendingPayouts)} note="Prepared, not yet recorded paid" />
          <Stat title="Recorded payouts" value={money(report.financial?.recordedPayouts)} note="Admin-recorded; not provider-confirmed" />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className={panel}>
            <h2 className="font-serif text-2xl text-[#194C35]">Monthly collections</h2>
            <p className="mb-6 mt-1 text-xs text-[#718073]">Successful payment attempts grouped by payment month.</p>
            <Bars items={monthly} valueKey="grossCollected" labelKey="label" format={money} />
          </div>
          <div className={panel}>
            <h2 className="font-serif text-2xl text-[#194C35]">Order status</h2>
            <p className="mb-6 mt-1 text-xs text-[#718073]">Orders created during the selected period, grouped by current status.</p>
            <Bars items={Object.entries(report.orders?.byStatus || {}).map(([key, count]) => ({ label: statusLabels[key] || key, count }))} valueKey="count" labelKey="label" />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className={panel}>
            <h2 className="font-serif text-2xl text-[#194C35]">Top products</h2>
            <p className="mb-6 mt-1 text-xs text-[#718073]">Quantity on paid orders; includes paid orders not yet completed.</p>
            <Bars items={products.map(p => ({ ...p, label: p.name }))} valueKey="quantitySold" labelKey="label" />
          </div>
          <div className={panel}>
            <h2 className="font-serif text-2xl text-[#194C35]">Registrations by role</h2>
            <p className="mb-6 mt-1 text-xs text-[#718073]">New accounts created during the selected period, not all existing accounts.</p>
            <p className="mb-5 font-serif text-3xl font-semibold text-[#194C35]">{fmt(report.users?.totalRegistered)} <span className="font-sans text-sm font-normal text-[#718073]">new registrations</span></p>
            <Bars items={Object.entries(report.users?.byRole || {}).map(([key, count]) => ({ label: roleLabels[key] || key, count }))} valueKey="count" labelKey="label" />
          </div>
        </section>

        <section className={panel}>
          <h2 className="font-serif text-2xl text-[#194C35]">Top product details</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-[#F2F6EE] text-[#536E59]"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Quantity</th><th className="px-4 py-3">Order count</th><th className="px-4 py-3">Product value</th></tr></thead>
              <tbody>{products.map(p => <tr key={p.productId} className="border-b border-[#EEF1EA]"><td className="px-4 py-3 font-medium">{p.name}</td><td className="px-4 py-3">{fmt(p.quantitySold)}</td><td className="px-4 py-3">{fmt(p.orders)}</td><td className="px-4 py-3">{money(p.salesValue)}</td></tr>)}</tbody>
            </table>
            {!products.length && <p className="py-6 text-center text-sm text-[#718073]">No paid products in this period.</p>}
          </div>
        </section>
        <p className="pb-3 text-xs leading-relaxed text-[#718073]">Reporting notes: gross collections are not net revenue. Refunds and gateway fees are not deducted. Commission and allocations use saved order amounts. Historic orders may have zero-valued financial snapshots. Recorded payouts may include simulated development transactions and do not prove an external transfer.</p>
      </>}
    </div>
  </main>;
}
