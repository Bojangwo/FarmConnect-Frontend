import { useEffect, useState } from 'react';
import { getFarmerReport, getDeliveryReport } from '../services/api';

const money = n => `D${Number(n || 0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const card = 'rounded-2xl border border-[#E1E8DC] bg-white p-5 shadow-sm';
function downloadCSV(data, filename) {
  const rows = [];
  const walk = (value, prefix='') => {
    for (const [key,v] of Object.entries(value || {})) {
      const label = prefix ? `${prefix}.${key}` : key;
      if (Array.isArray(v)) v.forEach((item,i)=>walk(item,`${label}[${i}]`));
      else if (v && typeof v === 'object') walk(v,label);
      else rows.push([label,v ?? '']);
    }
  };
  walk(data);
  const csv = [['Metric','Value'],...rows].map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}
function Metric({label,value,sub}) {return <div className={card}><p className="text-xs text-[#718073]">{label}</p><p className="mt-3 font-serif text-3xl text-[#194C35]">{value}</p>{sub && <p className="mt-2 text-xs text-[#718073]">{sub}</p>}</div>}
function Bars({title,rows,format=v=>v}) {
  const max=Math.max(1,...rows.map(r=>Number(r.value)||0));
  return <section className={card}><h2 className="font-serif text-2xl text-[#194C35]">{title}</h2><div className="mt-5 space-y-4">{rows.length ? rows.map((r,i)=><div key={`${r.label}-${i}`}><div className="mb-1 flex justify-between gap-3 text-xs text-[#194C35]"><span>{r.label}</span><span className="font-semibold">{format(r.value)}</span></div><div className="h-2.5 rounded-full bg-[#EDF2E9]"><div className="h-full rounded-full bg-[#77975F]" style={{width:`${Math.max(0,Math.min(100,(Number(r.value)||0)/max*100))}%`}} /></div></div>):<p className="text-sm text-[#718073]">No records for this period.</p>}</div></section>
}
export default function RoleReports({role}) {
  const farmer=role==='farmer';
  const [startDate,setStartDate]=useState(''); const [endDate,setEndDate]=useState('');
  const [applied,setApplied]=useState({startDate:'',endDate:''});
  const [data,setData]=useState(null); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  useEffect(()=>{let active=true;setLoading(true);setError('');(farmer?getFarmerReport:getDeliveryReport)(applied).then(d=>{if(active)setData(d)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[farmer,applied]);
  const title=farmer?'Sales Reports':'Delivery Reports';
  return <main className="min-h-screen bg-[#FAF9F4] px-4 py-8 sm:px-8 lg:px-10"><div className="mx-auto max-w-7xl space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#77975F]">FarmConnect analytics</p><h1 className="mt-2 font-serif text-4xl text-[#183B2B]">{title}</h1><p className="mt-2 text-sm text-[#718073]">Your performance, earnings and externally recorded payouts.</p></header>
    <form className={`${card} flex flex-wrap items-end gap-3`} onSubmit={e=>{e.preventDefault();setApplied({startDate,endDate})}}><label className="text-xs text-[#536E59]">From<input type="date" className="mt-1 block rounded-lg border p-2" value={startDate} onChange={e=>setStartDate(e.target.value)}/></label><label className="text-xs text-[#536E59]">To<input type="date" className="mt-1 block rounded-lg border p-2" value={endDate} onChange={e=>setEndDate(e.target.value)}/></label><button className="rounded-full bg-[#194C35] px-5 py-2.5 text-sm font-semibold text-white">Apply dates</button><button type="button" className="rounded-full border px-5 py-2.5 text-sm" onClick={()=>{setStartDate('');setEndDate('');setApplied({startDate:'',endDate:''})}}>All time</button><button type="button" disabled={!data} onClick={()=>downloadCSV(data,`${farmer?'farmer':'delivery'}-report.csv`)} className="rounded-full border px-5 py-2.5 text-sm disabled:opacity-40">Export CSV</button></form>
    {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}
    {loading?<div className={card}>Loading reports...</div>:data&&<>
      {farmer?<><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Paid product sales" value={money(data.sales.grossProductSales)} sub={`${data.sales.paidOrders} paid orders`}/><Metric label="Recorded farmer allocations" value={money(data.sales.farmerEarnings)}/><Metric label="Commission deductions" value={money(data.sales.commission)}/><Metric label="Quantity sold" value={data.sales.quantitySold}/></section><section className="grid gap-4 sm:grid-cols-3"><Metric label="Completed orders" value={data.orders.completed}/><Metric label="Cancelled orders" value={data.orders.cancelled}/><Metric label="Orders created" value={data.orders.total}/></section><div className="grid gap-5 lg:grid-cols-2"><Bars title="Monthly product sales" rows={data.monthlySales.map(x=>({label:x.month,value:x.amount}))} format={money}/><Bars title="Top products by quantity" rows={data.topProducts.map(x=>({label:x.name,value:x.quantitySold}))}/></div></>:<><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Assigned orders in period" value={data.deliveries.assignedOrdersInPeriod}/><Metric label="Orders linked to agent" value={data.deliveries.currentAssignedOrders}/><Metric label="Delivered (current agent)" value={data.deliveries.delivered}/><Metric label="Failed (current agent)" value={data.deliveries.failed}/></section><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><Metric label="Earned on paid delivered orders" value={money(data.earnings.earnedOnPaidDeliveredOrders)}/><Metric label="Failed assignment events" value={data.deliveries.failedEvents}/><Metric label="Reassigned events" value={data.deliveries.reassignedEvents}/></section><Bars title="Monthly deliveries" rows={data.monthlyDeliveries.map(x=>({label:x.month,value:x.delivered}))}/></>}
      <section className="grid gap-4 sm:grid-cols-2"><Metric label="Pending payouts" value={money(data.payouts.pending)} sub={`${data.payouts.pendingCount} payout records`}/><Metric label="Recorded external payouts" value={money(data.payouts.recordedPaid)} sub="Admin-recorded transfers, not provider-verified"/></section>
      <p className="text-xs text-[#718073]">Reports are based on existing order snapshots and payout records. Date ranges use UTC. Sales and delivery performance may use different event dates; recorded payouts do not initiate transfers.</p>
    </>}
  </div></main>;
}
