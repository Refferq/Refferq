import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { normalizeBostaStatus, verifyBostaKey } from '@/lib/hv-cod-connector';

export async function POST(req: NextRequest) {
  if (process.env.VERCEL_ENV !== 'preview') return NextResponse.json({error:'Staging only'}, {status:423});
  const secret = process.env.BOSTA_WEBHOOK_KEY;
  if (!secret) return NextResponse.json({error:'Bosta webhook is not configured'}, {status:503});
  if (!verifyBostaKey(req.headers.get('x-hv-bosta-key'),secret))
    return NextResponse.json({error:'Unauthorized'}, {status:401});
  try {
    const update = normalizeBostaStatus(await req.json());
    const outcome = await prisma.$transaction(async tx => {
      const existing = await tx.hvCodOrder.findUnique({where:{orderName:update.orderName}});
      if (!existing || !existing.isCod) return 'unknown-order';
      if (existing.bostaDeliveryId && existing.bostaDeliveryId !== update.deliveryId) return 'different-delivery';
      await tx.hvCodEvent.create({data:{
        id:randomUUID(),
        dedupeKey:['bosta',update.deliveryId,update.eventAt.getTime(),update.state].join(':'),
        source:'BOSTA',
        orderName:update.orderName,
        state:String(update.state),
        occurredAt:update.eventAt
      }});
      if (existing.bostaUpdatedAt && existing.bostaUpdatedAt >= update.eventAt) return 'stale';
      const delivered = update.delivered && !update.returned;
      const courierCollected = delivered && update.collectedPiasters >= existing.orderTotalPiasters;
      const changed = await tx.hvCodOrder.updateMany({
        where:{id:existing.id,OR:[{bostaUpdatedAt:null},{bostaUpdatedAt:{lt:update.eventAt}}]},
        data:{
          bostaDeliveryId:update.deliveryId,bostaTrackingNumber:update.trackingNumber,
          bostaState:update.state,bostaUpdatedAt:update.eventAt,
          delivered,courierCollected,
          collectedPiasters:delivered ? update.collectedPiasters : 0,
          merchantReconciled:delivered && courierCollected && existing.merchantReconciled
        }
      });
      return changed.count === 1 ? 'recorded' : 'stale';
    });
    if (outcome === 'unknown-order' || outcome === 'different-delivery')
      return NextResponse.json({error:outcome}, {status:409});
    return NextResponse.json({success:true,status:outcome});
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      return NextResponse.json({success:true,status:'duplicate'});
    return NextResponse.json({error:'Invalid Bosta status event'}, {status:422});
  }
}
