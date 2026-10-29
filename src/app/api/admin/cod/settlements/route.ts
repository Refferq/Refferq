import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { egpToPiasters, previewCodCommission } from '@/lib/hv-cod-connector';

async function admin(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return false;
  const user = await prisma.user.findUnique({where:{id:userId},select:{role:true,status:true}});
  return user?.role === 'ADMIN' && user.status === 'ACTIVE';
}
export async function GET(req: NextRequest) {
  if (!(await admin(req))) return NextResponse.json({error:'Forbidden'}, {status:403});
  const rows = await prisma.hvCodOrder.findMany({orderBy:{updatedAt:'desc'},take:50});
  return NextResponse.json({success:true,orders:rows.map(o=>({
    orderName:o.orderName,currency:o.currency,subtotalPiasters:o.subtotalPiasters,
    orderTotalPiasters:o.orderTotalPiasters,referralCode:o.referralCode,
    bostaState:o.bostaState,delivered:o.delivered,courierCollected:o.courierCollected,
    merchantReconciled:o.merchantReconciled,settlementReference:o.merchantSettlementReference,
    ...previewCodCommission(o)
  }))});
}
export async function POST(req: NextRequest) {
  if (process.env.VERCEL_ENV !== 'preview') return NextResponse.json({error:'Staging only'}, {status:423});
  if (!(await admin(req))) return NextResponse.json({error:'Forbidden'}, {status:403});
  let body: {orderName?:string; evidenceReference?:string; receivedAmountEgp?:string; evidenceChecked?:boolean};
  try { body = await req.json(); } catch { return NextResponse.json({error:'Invalid body'}, {status:400}); }
  const reference = body.evidenceReference?.trim() || '';
  if (!body.orderName || !body.evidenceChecked || reference.length < 8 || reference.length > 160)
    return NextResponse.json({error:'Verified remittance evidence and order reference required'}, {status:422});
  let amount:number;
  try {amount = egpToPiasters(String(body.receivedAmountEgp));}
  catch {return NextResponse.json({error:'Invalid EGP amount'}, {status:422});}
  const order = await prisma.hvCodOrder.findUnique({where:{orderName:body.orderName}});
  if (!order || !order.delivered || !order.courierCollected || order.cancelled ||
      order.refunded || !order.isCod || amount !== order.orderTotalPiasters)
    return NextResponse.json({error:'COD order not eligible for settlement review'}, {status:409});
  if (order.merchantReconciled)
    return NextResponse.json({success:true,status:'already-reviewed'});
  const changed = await prisma.hvCodOrder.updateMany({
    where:{
      id:order.id,delivered:true,courierCollected:true,cancelled:false,refunded:false,
      merchantReconciled:false,orderTotalPiasters:amount
    },
    data:{merchantReconciled:true,merchantSettlementReference:reference,merchantSettledAt:new Date()}
  });
  if (changed.count !== 1) return NextResponse.json({error:'Concurrent update; review order again'}, {status:409});
  return NextResponse.json({success:true,status:'review-recorded',moneyMoved:false,commissionPaid:false});
}
