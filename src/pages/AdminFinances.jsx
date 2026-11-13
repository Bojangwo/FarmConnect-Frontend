import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminFinances, getAdminPaymentSettings, updateAdminPaymentSettings, prepareAdminPayouts, recordAdminPayout } from "../services/api";
import PayoutAccountVerification from "../components/PayoutAccountVerification";

const money = (n) => `D${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const card = "rounded-2xl border border-[#E1E8DC] bg-white p-5 shadow-sm";
const field = "w-full rounded-xl border border-[#DCE5D6] bg-white px-3 py-2.5 text-sm text-[#183B2B] outline-none focus:border-[#77975F]";

export default function AdminFinances() {
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState({ commissionRate: 1, deliveryFee: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("all");
  const [orderId, setOrderId] = useState("");
  const [selected, setSelected] = useState(null);
  const [transfer, setTransfer] = useState({ provider: "wave", phoneNumber: "", accountHolderName: "", transactionReference: "", transferConfirmed: false });

  const refresh = useCallback(async () => {
    const [finances, configuration] = await Promise.all([getAdminFinances(), getAdminPaymentSettings()]);
    setData(finances);
    if (configuration.settings) setSettings({ commissionRate: configuration.settings.commissionRate, deliveryFee: configuration.settings.deliveryFee });
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([getAdminFinances(), getAdminPaymentSettings()]).then(([finances, configuration]) => {
      if (!active) return;
      setData(finances);
      if (configuration.settings) setSettings({ commissionRate: configuration.settings.commissionRate, deliveryFee: configuration.settings.deliveryFee });
    }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const payouts = useMemo(() => (data?.payouts || []).filter(p => filter === "all" || p.status === filter), [data, filter]);
  const summary = data?.summary || {};

  async function execute(action, message) {
    setBusy(true); setError(""); setSuccess("");
    try { await action(); await refresh(); setSuccess(message); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  function openRecord(p) {
    setSelected(p);
    setTransfer({ provider: p.payoutDestination?.provider || "wave", phoneNumber: p.payoutDestination?.phoneNumber || "", accountHolderName: p.payoutDestination?.accountHolderName || p.recipient?.name || "", transactionReference: "", transferConfirmed: false });
  }

  async function submitRecord(e) {
    e.preventDefault();
    if (!selected || !transfer.transferConfirmed) return;
    if (!window.confirm(`Have you actually sent ${money(selected.amount)} to ${transfer.provider.toUpperCase()} ${transfer.phoneNumber}, verified the receiving account, and obtained a genuine transfer reference? This action records the payout as paid.`)) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      await recordAdminPayout(selected._id, transfer);
      await refresh();
      setSelected(null);
      setSuccess("External transfer recorded. No transfer was initiated by FarmConnect.");
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-[#FAF9F4] px-4 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#77975F]">Platform management</p><h1 className="mt-2 font-serif text-4xl text-[#183B2B]">Finances & payouts</h1><p className="mt-2 text-sm text-[#718073]">Track collections, allocations and externally recorded transfers.</p></div>
          <Link to="/admin" className="rounded-full border border-[#CBD8C4] bg-white px-5 py-3 text-sm font-semibold text-[#194C35]">Back to dashboard</Link>
        </header>
        {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {success && <div role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-800">{success}</div>}
        {loading ? <div className={card}>Loading finances...</div> : <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[["Gross collected", money(summary.collectedGross), `${summary.paidOrders || 0} paid orders`], ["Gross commission", money(summary.commissionGross), "Before gateway fees"], ["Pending payouts", money(summary.payoutsPending), "Not yet recorded as transferred"], ["Recorded payouts", money(summary.payoutsPaid), "Admin-recorded external transfers"]].map(([label, value, sub]) => <div key={label} className={card}><p className="text-xs font-medium text-[#718073]">{label}</p><p className="mt-3 font-serif text-3xl font-semibold text-[#194C35]">{value}</p><p className="mt-2 text-xs text-[#8A968A]">{sub}</p></div>)}
          </section>
          <section className="grid gap-5 lg:grid-cols-2">
            <form className={card} onSubmit={e => { e.preventDefault(); execute(() => updateAdminPaymentSettings({ commissionRate: Number(settings.commissionRate), deliveryFee: Number(settings.deliveryFee) }), "Settings updated for future orders."); }}>
              <h2 className="font-serif text-2xl text-[#183B2B]">Payment settings</h2><p className="mt-1 text-xs text-[#718073]">Changes apply to future orders only.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm text-[#536E59]">Commission (%)<input className={`mt-1 ${field}`} type="number" min="0" max="100" step="0.01" required value={settings.commissionRate} onChange={e => setSettings(s => ({ ...s, commissionRate: e.target.value }))} /></label><label className="text-sm text-[#536E59]">Delivery fee (GMD)<input className={`mt-1 ${field}`} type="number" min="0" step="0.01" required value={settings.deliveryFee} onChange={e => setSettings(s => ({ ...s, deliveryFee: e.target.value }))} /></label></div>
              <button disabled={busy} className="mt-4 rounded-full bg-[#194C35] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Save settings</button>
            </form>
            <form className={card} onSubmit={e => { e.preventDefault(); if (window.confirm("Prepare payout records for this completed, buyer-confirmed order? No money will be transferred.")) execute(() => prepareAdminPayouts(orderId.trim()), "Payout records prepared (no transfer initiated)."); }}>
              <h2 className="font-serif text-2xl text-[#183B2B]">Prepare payouts</h2><p className="mt-1 text-xs text-[#718073]">Only paid, delivered and buyer-confirmed orders are eligible.</p>
              <label className="mt-4 block text-sm text-[#536E59]">Order ID<input className={`mt-1 ${field}`} value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="MongoDB order ID" required /></label>
              <button disabled={busy || !orderId.trim()} className="mt-4 rounded-full bg-[#194C35] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Prepare payout records</button>
            </form>
          </section>
          <PayoutAccountVerification />
          <section className="overflow-hidden rounded-2xl border border-[#E1E8DC] bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5"><div><h2 className="font-serif text-2xl text-[#183B2B]">Payout records</h2><p className="text-xs text-[#718073]">The transfer must be completed externally before recording payment.</p></div>
            
            <select className={field} style={{ width: "auto" }} value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All payouts</option><option value="pending">Pending</option><option value="paid">Paid</option></select>
            </div>
            <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-[#F5F8F1] text-[#536E59]"><tr>{["Order", "Recipient", "Amount", "Status", "Destination", "Action"].map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{payouts.map(p => <tr key={p._id} className="border-t border-[#EEF1EA]"><td className="px-4 py-4 text-xs">{p.order?.orderNumber || p.order?._id || "—"}</td><td className="px-4 py-4"><p className="font-semibold text-[#183B2B]">{p.recipient?.name || "Unknown"}</p><p className="text-xs text-[#718073]">{p.recipientType === "deliveryAgent" ? "Delivery agent" : "Farmer"}</p></td><td className="px-4 py-4 font-semibold">{money(p.amount)}</td><td className="px-4 py-4 capitalize">{p.status}</td><td className="px-4 py-4 text-xs">{p.payoutDestination?.provider ? `${p.payoutDestination.provider.toUpperCase()} · ${p.payoutDestination.phoneNumber}` : "Not recorded"}</td><td className="px-4 py-4">{p.status === "pending" ? <button className="rounded-full border border-[#CBD8C4] px-3 py-2 text-xs font-semibold text-[#194C35]" onClick={() => openRecord(p)}>Record external transfer</button> : <span className="text-xs text-[#718073]">{p.transactionReference || "Recorded"}</span>}</td></tr>)}</tbody></table></div>
            {payouts.length === 0 && <p className="p-6 text-sm text-[#718073]">No payouts match this filter.</p>}
          </section>
        </>}
        {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={submitRecord} className="w-full max-w-lg space-y-3 rounded-2xl bg-white p-6 shadow-xl"><h2 className="font-serif text-2xl text-[#183B2B]">Record external transfer</h2><p className="text-sm text-[#718073]">{selected.recipient?.name} · {money(selected.amount)}. Complete the real transfer first. No transfer is sent from this form.</p>
          <label className="block text-sm">Provider<select className={`mt-1 ${field}`} value={transfer.provider} onChange={e => setTransfer(t => ({ ...t, provider: e.target.value }))}><option value="wave">Wave</option><option value="aps">APS</option></select></label>
          <label className="block text-sm">Receiving number<input required className={`mt-1 ${field}`} value={transfer.phoneNumber} onChange={e => setTransfer(t => ({ ...t, phoneNumber: e.target.value }))} /></label>
          <label className="block text-sm">Account holder<input required className={`mt-1 ${field}`} value={transfer.accountHolderName} onChange={e => setTransfer(t => ({ ...t, accountHolderName: e.target.value }))} /></label>
          <label className="block text-sm">Real transfer reference<input required className={`mt-1 ${field}`} value={transfer.transactionReference} onChange={e => setTransfer(t => ({ ...t, transactionReference: e.target.value }))} /></label>
          <label className="flex items-start gap-2 text-sm text-[#183B2B]"><input type="checkbox" className="mt-1" checked={transfer.transferConfirmed} onChange={e => setTransfer(t => ({ ...t, transferConfirmed: e.target.checked }))} /><span>I checked the recipient and completed this transfer externally. The reference above is genuine.</span></label>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setSelected(null)} className="rounded-full border px-4 py-2 text-sm">Cancel</button><button disabled={busy || !transfer.transferConfirmed} className="rounded-full bg-[#194C35] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Record as paid</button></div>
        </form></div>}
      </div>
    </main>
  );
}



