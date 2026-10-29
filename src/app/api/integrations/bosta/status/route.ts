import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeBostaStatus, verifyBostaKey } from '@/lib/hv-cod-connector';

export async function POST(req: NextRequest) {
  if (process.env.VERCEL_ENV !== 'preview') return NextResponse.json({error:'Staging only'}, {status:423});
  const secret = process.env.BOSTA_WEBHOOK_KEY;
  if (!secret) return NextResponse.json({error:'Bosta webhook is not configured'}, {status:503});
  if (!verifyBostaKey(req.headers.get('x-hv-bosta-key'),secret))
    return NextResponse.json({error:'Unauthorized'}, {status:401});
  try {
    const update = normalizeBostaStatus(await req.json());
    const existing = await prisma.hvCodOrder.findUnique({where:{orderName:update.orderName}});
    if (!existing || !existing.isCod) return NextResponse.json({error:'Unknown COD order'}, {status:409});
    if (existing.bostaDeliveryId && existing.bostaDeliveryId !== update.deliveryId)
      return NextResponse.json({error:'Different delivery ID'}, {status:409});
    if (existing.bostaUpdatedAt && existing.bostaUpdatedAt >= update.eventAt)
      return NextResponse.json({success:true,status:'duplicate-or-stale'});
    const delivered = update.delivered && !update.returned;
    const courierCollected = delivered && update.collectedPiasters >= existing.orderTotalPiasters;
    await prisma.hvCodOrder.update({
      where:{id:existing.id},
      data:{
        bostaDeliveryId:update.deliveryId,bostaTrackingNumber:update.trackingNumber,
        bostaState:update.state,bostaUpdatedAt:update.eventAt,
        delivered,courierCollected,
        collectedPiasters:delivered ? update.collectedPiasters : 0,
        merchantReconciled:delivered && courierCollected && existing.merchantReconciled
      }
    });
    return NextResponse.json({success:true,status:'recorded'});
  } catch {
    return NextResponse.json({error:'Invalid Bosta status event'}, {status:422});
  }
}
