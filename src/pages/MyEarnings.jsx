import { useEffect, useMemo, useState } from "react";
import { getMyEarnings, updateMyPayoutDetails } from "../services/api";

const money = (value) => `D${Number(value || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateText = (value) => value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

function Stat({ label, value, note }) {
  return <div className="rounded-2xl border border-[#E0E8DB] bg-white p-5 shadow-sm">
    <p className="text-xs text-[#718073]">{label}</p>
    <p className="mt-3 font-serif text-3xl font-semibold text-[#194C35]">{value}</p>
    <p className="mt-2 text-xs text-[#89978A]">{note}</p>
  </div>;
}

export default function MyEarnings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ provider: "wave", phoneNumber: "", accountHolderName: "" });

  async function load() {
    const result = await getMyEarnings();
    setData(result);
    const p = result.user?.payoutDetails;
    setForm({ provider: p?.provider || "wave", phoneNumber: p?.phoneNumber || "", accountHolderName: p?.accountHolderName || "" });
  }

  useEffect(() => {
    let mounted = true;
    getMyEarnings().then((result) => {
      if (!mounted) return;
      setData(result);
      const p = result.user?.payoutDetails;
      setForm({ provider: p?.provider || "wave", phoneNumber: p?.phoneNumber || "", accountHolderName: p?.accountHolderName || "" });
    }).catch((err) => { if (mounted) setError(err.message || "Unable to load earnings."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const payouts = useMemo(() => (data?.payouts || []).filter((p) => filter === "all" || p.status === filter), [data, filter]);
  const profile = data?.user?.payoutDetails;
  const inputClass = "w-full rounded-xl border border-[#DCE5D7] bg-[#FCFDFB] px-4 py-3 text-sm text-[#183B2B] outline-none focus:border-[#77975F] focus:ring-2 focus:ring-[#77975F]/20";

  async function saveProfile(event) {
    event.preventDefault();
    setError(""); setNotice(""); setSaving(true);
    try {
      await updateMyPayoutDetails(form);
      await load();
      setNotice("Payout details saved. Admin verification is required before payouts can be recorded.");
    } catch (err) { setError(err.message || "Could not save payout details."); }
    finally { setSaving(false); }
  }

  return <main className="min-h-screen bg-[#FAF9F4] px-4 py-8 text-[#183B2B] sm:px-8 lg:px-12">
    <div className="mx-auto max-w-6xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#77975F]">Your finances</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">My Earnings & Payouts</h1>
      <p className="mt-2 text-sm text-[#718073]">Manage your receiving account and follow payouts prepared by FarmConnect.</p>

      {error && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="mt-6 rounded-xl border border-[#CFE3CB] bg-[#EFF7ED] p-4 text-sm text-[#276341]">{notice}</div>}
      {loading ? <div className="mt-8 rounded-2xl bg-white p-10 text-center text-[#718073]">Loading your earnings...</div> : data && <>
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Payout overview">
          <Stat label="Total prepared" value={money(data.summary?.totalAllocated)} note="All prepared payout records" />
          <Stat label="Pending payouts" value={money(data.summary?.pendingPayouts)} note="Awaiting external transfer recording" />
          <Stat label="Recorded payouts" value={money(data.summary?.recordedPayouts)} note="Admin-recorded transfers" />
          <Stat label="Payout records" value={data.summary?.payoutCount || 0} note="Orders with prepared payouts" />
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-[#E0E8DB] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-2xl font-semibold text-[#194C35]">Receiving account</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${profile?.isVerified ? "bg-[#E7F3E3] text-[#276341]" : "bg-[#FFF2DC] text-[#94631D]"}`}>
                {profile?.isVerified ? "Verified by admin" : "Not verified"}
              </span>
            </div>
            <p className="mt-2 text-sm text-[#718073]">Use the Wave or APS number that can receive your payouts.</p>
            <form onSubmit={saveProfile} className="mt-6 space-y-4">
              <label className="block text-sm font-medium">Payout provider
                <select className={`mt-2 ${inputClass}`} value={form.provider} onChange={(e) => setForm((s) => ({ ...s, provider: e.target.value }))}>
                  <option value="wave">Wave</option><option value="aps">APS</option>
                </select>
              </label>
              <label className="block text-sm font-medium">Receiving phone number
                <input className={`mt-2 ${inputClass}`} type="tel" inputMode="tel" required value={form.phoneNumber} onChange={(e) => setForm((s) => ({ ...s, phoneNumber: e.target.value }))} placeholder="7-digit Gambian number" />
              </label>
              <label className="block text-sm font-medium">Account holder name
                <input className={`mt-2 ${inputClass}`} required maxLength={100} value={form.accountHolderName} onChange={(e) => setForm((s) => ({ ...s, accountHolderName: e.target.value }))} placeholder="Name registered with provider" />
              </label>
              <button type="submit" disabled={saving} className="rounded-full bg-[#194C35] px-6 py-3 text-sm font-semibold text-white hover:bg-[#123B29] disabled:opacity-60">{saving ? "Saving..." : "Save payout details"}</button>
            </form>
          </div>
          <div className="rounded-2xl border border-[#E0E8DB] bg-white p-6 shadow-sm">
            <h2 className="font-serif text-2xl font-semibold text-[#194C35]">How payouts work</h2>
            <ol className="mt-5 space-y-4 text-sm text-[#536B59]">
              <li><strong className="text-[#194C35]">1.</strong> Add your Wave or APS receiving details.</li>
              <li><strong className="text-[#194C35]">2.</strong> An admin checks and verifies the account details.</li>
              <li><strong className="text-[#194C35]">3.</strong> After an eligible order is completed, the admin prepares your payout.</li>
              <li><strong className="text-[#194C35]">4.</strong> The admin transfers the money externally and records the payment.</li>
            </ol>
            <p className="mt-6 rounded-xl bg-[#F4F7F0] p-4 text-xs leading-5 text-[#657766]">Updating receiving details resets verification. A recorded payout does not independently prove that a provider completed the transfer.</p>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-[#E0E8DB] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 p-6">
            <div><h2 className="font-serif text-2xl font-semibold text-[#194C35]">Payout history</h2><p className="mt-1 text-xs text-[#718073]">Only prepared payouts are listed here.</p></div>
            <select aria-label="Filter payouts" className="rounded-xl border border-[#DCE5D7] bg-white px-4 py-2.5 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All payouts</option><option value="pending">Pending</option><option value="paid">Recorded paid</option>
            </select>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-[#F4F7F0] text-[#536B59]"><tr><th className="px-5 py-4">Order</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Provider</th><th className="px-5 py-4">Recorded date</th></tr></thead>
            <tbody>{payouts.map((p) => <tr key={p._id} className="border-t border-[#EDF1EA]">
              <td className="break-all px-5 py-4 text-xs font-medium text-[#194C35]">{p.orderNumber}</td>
              <td className="px-5 py-4 font-semibold">{money(p.amount)}</td>
              <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${p.status === "paid" ? "bg-[#E7F3E3] text-[#276341]" : "bg-[#FFF2DC] text-[#94631D]"}`}>{p.status === "paid" ? "Recorded paid" : "Pending"}</span></td>
              <td className="px-5 py-4 uppercase">{p.provider || "—"}</td>
              <td className="px-5 py-4">{dateText(p.paidAt)}</td>
            </tr>)}</tbody>
          </table></div>
          {payouts.length === 0 && <p className="p-8 text-center text-sm text-[#718073]">No matching payout records yet.</p>}
        </section>
      </>}
    </div>
  </main>;
}
