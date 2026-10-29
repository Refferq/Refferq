'use client';

import { useEffect, useState } from 'react';

type CodRow = {
  orderName:string; currency:string;subtotalPiasters:number;orderTotalPiasters:number;
  referralCode:string|null;bostaState:number|null;delivered:boolean;
  courierCollected:boolean;merchantReconciled:boolean;
  eligibleForManualReview:boolean;proposedCommissionPiasters:number;
};
const egp=(v:number)=>new Intl.NumberFormat('en-EG',{style:'currency',currency:'EGP'}).format(v/100);
export default function CodReconciliationPage() {
  const [orders,setOrders]=useState<CodRow[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true;
    fetch('/api/admin/cod/settlements',{cache:'no-store'})
      .then(async r=>{if(!r.ok) throw new Error('Unable to load COD reconciliation');return r.json();})
      .then(data=>{if(active) setOrders(data.orders||[]);})
      .catch(e=>{if(active) setError(e.message);})
      .finally(()=>{if(active) setLoading(false);});
    return ()=>{active=false;};
  },[]);
  const delivered=orders.filter(o=>o.delivered).length;
  const reconciled=orders.filter(o=>o.merchantReconciled).length;
  const eligible=orders.filter(o=>o.eligibleForManualReview).length;
  return (
    <main className="space-y-6 p-3 md:p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] font-semibold" style={{color:'#1F6B3A'}}>Herbal Vitaly · Egypt</p>
        <h1 className="text-2xl font-semibold mt-1">Shopify × Bosta — COD Reconciliation</h1>
        <p className="mt-2 text-sm text-muted-foreground">Staging monitoring only. No commission or payout will be created here.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Imported orders',orders.length],['Delivered',delivered],
          ['Merchant reconciled',reconciled],['Eligible for review',eligible]
        ].map(([label,value])=>
          <section key={label} className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-2xl font-semibold" style={{color:'#1F6B3A'}}>{value}</p>
          </section>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>{['Shopify order','Items after discount','Order COD','Referral code','Bosta','Merchant transfer','Commission preview'].map(h=><th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {orders.map(o=><tr key={o.orderName} className="border-t">
              <td className="whitespace-nowrap px-4 py-3 font-semibold">{o.orderName}</td>
              <td className="whitespace-nowrap px-4 py-3">{egp(o.subtotalPiasters)}</td>
              <td className="whitespace-nowrap px-4 py-3">{egp(o.orderTotalPiasters)}</td>
              <td className="px-4 py-3">{o.referralCode||'—'}</td>
              <td className="px-4 py-3">{o.delivered&&o.courierCollected?'Delivered & collected':o.bostaState===null?'Not linked':'Unconfirmed / exception'}</td>
              <td className="px-4 py-3">{o.merchantReconciled?'Reviewed':'Awaiting verified remittance'}</td>
              <td className="whitespace-nowrap px-4 py-3 font-semibold">{o.eligibleForManualReview?egp(o.proposedCommissionPiasters):'Blocked'}</td>
            </tr>)}
            {!loading && orders.length===0 && <tr><td className="p-8 text-center text-slate-500" colSpan={7}>No COD orders imported. Webhooks are not yet connected.</td></tr>}
            {loading && <tr><td className="p-8 text-center text-slate-500" colSpan={7}>Loading reconciliation…</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">Reconciliation must match the Shopify order, Bosta delivery and confirmed merchant remittance. Indicative commissions are not payable.</p>
    </main>
  );
}
