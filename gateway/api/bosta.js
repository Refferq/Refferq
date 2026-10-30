'use strict';
const crypto=require('node:crypto');
const {reply,stringHeader,rawBody,eq,bostaSnapshot,withTx}=require('../lib/core');
module.exports=async function(req,res){
  if(req.method!=='POST')return reply(res,405,{error:'Method not allowed'});
  if(process.env.INGEST_ENABLED!=='true')return reply(res,503,{error:'Receiver disabled pending integration validation'});
  if(!process.env.BOSTA_WEBHOOK_KEY||!process.env.GATEWAY_DATABASE_URL)
    return reply(res,503,{error:'Receiver is not configured'});
  if(!eq(stringHeader(req,'x-hv-bosta-key'),process.env.BOSTA_WEBHOOK_KEY))
    return reply(res,401,{error:'Unauthorized Bosta callback'});
  try{
    const raw=await rawBody(req);
    const data=bostaSnapshot(JSON.parse(raw.toString('utf8')));
    const status=await withTx(async c=>{
      const o=await c.query('SELECT * FROM hv_cod_orders WHERE "orderName"=$1 FOR UPDATE',[data.orderName]);
      if(!o.rowCount||!o.rows[0].isCod)return 'unmatched';
      const before=o.rows[0];
      if(before.bostaDeliveryId&&before.bostaDeliveryId!==data.deliveryId)return 'mismatched-delivery';
      const eventKey=['bosta',data.deliveryId,data.at.getTime(),data.state].join(':');
      const ev=await c.query('INSERT INTO hv_cod_events (id,"dedupeKey",source,"orderName",state,"occurredAt") VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT ("dedupeKey") DO NOTHING RETURNING id',
        [crypto.randomUUID(),eventKey,'BOSTA',data.orderName,String(data.state),data.at]);
      if(!ev.rowCount)return 'duplicate';
      if(before.bostaUpdatedAt&&new Date(before.bostaUpdatedAt)>=data.at)return 'stale';
      const returned=Boolean(before.bostaReturned)||data.returned;
      const delivered=data.delivered&&!returned;
      const collected=delivered&&data.collected>=before.orderTotalPiasters;
      await c.query('UPDATE hv_cod_orders SET "bostaDeliveryId"=$2,"bostaTrackingNumber"=$3,"bostaState"=$4,"bostaUpdatedAt"=$5,delivered=$6,"courierCollected"=$7,"collectedPiasters"=$8,"bostaReturned"=$9,"merchantReconciled"=CASE WHEN $10 THEN "merchantReconciled" ELSE false END,"updatedAt"=NOW() WHERE id=$1',
        [before.id,data.deliveryId,data.tracking,data.state,data.at,delivered,collected,delivered?data.collected:0,returned,delivered&&collected&&!returned]);
      return 'recorded';
    });
    if(status==='unmatched')return reply(res,503,{error:'Shopify order not yet imported — retry later'});
    if(status==='mismatched-delivery')return reply(res,409,{error:'Unexpected delivery id'});
    return reply(res,200,{ok:true,status});
  }catch(e){
    if(e.statusCode===413)return reply(res,413,{error:'Request too large'});
    if(e instanceof SyntaxError||/Invalid|Unsupported|Missing/.test(e.message))
      return reply(res,422,{error:'Malformed or unsupported status payload'});
    console.error('Bosta ingest failure',e.code||e.name||'unknown');
    return reply(res,503,{error:'Temporary ingestion failure'});
  }
};
module.exports.config={api:{bodyParser:false}};
