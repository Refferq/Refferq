'use strict';
const crypto=require('node:crypto');
const {reply,stringHeader,rawBody,verifyShopify,orderSnapshot,withTx}=require('../lib/core');
module.exports=async function(req,res) {
  if(req.method!=='POST')return reply(res,405,{error:'Method not allowed'});
  if(process.env.INGEST_ENABLED!=='true')return reply(res,503,{error:'Receiver disabled pending integration validation'});
  if(!process.env.SHOPIFY_WEBHOOK_SECRET || !process.env.SHOPIFY_SHOP_DOMAIN || !process.env.GATEWAY_DATABASE_URL)
    return reply(res,503,{error:'Receiver is not configured'});
  const topic=stringHeader(req,'x-shopify-topic');
  const shop=stringHeader(req,'x-shopify-shop-domain');
  const delivery=stringHeader(req,'x-shopify-webhook-id');
  if(!['orders/create','orders/updated','orders/cancelled'].includes(topic)||!delivery||delivery.length>150)
    return reply(res,422,{error:'Unsupported topic or missing delivery id'});
  if(shop!==process.env.SHOPIFY_SHOP_DOMAIN)
    return reply(res,401,{error:'Unauthorized shop'});
  try{
    const raw=await rawBody(req);
    if(!verifyShopify(raw,stringHeader(req,'x-shopify-hmac-sha256'),process.env.SHOPIFY_WEBHOOK_SECRET))
      return reply(res,401,{error:'Invalid Shopify HMAC'});
    const order=orderSnapshot(JSON.parse(raw.toString('utf8')));
    const deliveryHash=crypto.createHash('sha256').update(delivery).digest('hex');
    const status=await withTx(async c=>{
      const entry=await c.query(
        'INSERT INTO hv_cod_events (id,"dedupeKey",source,"orderName",state,"occurredAt") VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT ("dedupeKey") DO NOTHING RETURNING id',
        [crypto.randomUUID(),'shopify:'+deliveryHash,'SHOPIFY',order.name,topic,order.updated]);
      if(entry.rowCount===0)return 'duplicate';
      const existing=await c.query('SELECT * FROM hv_cod_orders WHERE "shopifyOrderId"=$1 FOR UPDATE',[order.id]);
      if(existing.rowCount && new Date(existing.rows[0].shopifyUpdatedAt)>=order.updated)return 'stale';
      const cancelled=topic==='orders/cancelled'||order.cancelled;
      const fields=[order.name,order.currency,order.subtotal,order.total,order.preview,order.referral,order.isCod,cancelled,order.refunded,order.updated];
      if(!existing.rowCount){
        await c.query(
          'INSERT INTO hv_cod_orders (id,"shopifyOrderId","orderName",currency,"subtotalPiasters","orderTotalPiasters","commissionPreviewPiasters","referralCode","isCod",cancelled,refunded,"shopifyUpdatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
          [crypto.randomUUID(),order.id,...fields]);
      }else{
        const before=existing.rows[0];
        const changed=before.subtotalPiasters!==order.subtotal||before.orderTotalPiasters!==order.total||
          before.referralCode!==order.referral||before.isCod!==order.isCod;
        await c.query(
          'UPDATE hv_cod_orders SET "orderName"=$2,currency=$3,"subtotalPiasters"=$4,"orderTotalPiasters"=$5,"commissionPreviewPiasters"=$6,"referralCode"=$7,"isCod"=$8,cancelled=$9,refunded=$10,"shopifyUpdatedAt"=$11,"merchantReconciled"=CASE WHEN $12 THEN false ELSE "merchantReconciled" END,"updatedAt"=NOW() WHERE id=$1',
          [before.id,...fields,changed||cancelled||order.refunded]);
      }
      return 'recorded';
    });
    return reply(res,200,{ok:true,status});
  }catch(e){
    if(e.statusCode===413)return reply(res,413,{error:'Request too large'});
    if(e instanceof SyntaxError||/Invalid|Unsupported|Only EGP/.test(e.message))
      return reply(res,422,{error:'Malformed or unsupported order payload'});
    // Valid Shopify requests should be retried on transient database failure.
    console.error('Shopify ingest failure',e.code||e.name||'unknown');
    return reply(res,503,{error:'Temporary ingestion failure'});
  }
};
module.exports.config={api:{bodyParser:false}};
