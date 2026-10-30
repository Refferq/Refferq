'use strict';
const crypto = require('node:crypto');
const { Pool } = require('pg');
const MAX_BODY_BYTES = 262144;
let pool;
function database() {
  if (!process.env.GATEWAY_DATABASE_URL) throw new Error('Database not configured');
  if (!pool) pool = new Pool({
    connectionString: process.env.GATEWAY_DATABASE_URL,
    max: 2, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: true },
    application_name: 'hv-webhook-gateway-staging'
  });
  return pool;
}
function reply(res, status, data) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  return res.status(status).json(data);
}
function stringHeader(req,name) {
  const v=req.headers[name.toLowerCase()];
  return typeof v==='string'?v:undefined;
}
async function rawBody(req) {
  let length=0, chunks=[];
  for await(const chunk of req) {
    const b=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
    length+=b.length;
    if(length>MAX_BODY_BYTES) throw Object.assign(new Error('Payload too large'),{statusCode:413});
    chunks.push(b);
  }
  return Buffer.concat(chunks);
}
function eq(a,b) {
  const x=crypto.createHash('sha256').update(a||'').digest();
  const y=crypto.createHash('sha256').update(b||'').digest();
  return crypto.timingSafeEqual(x,y) && Boolean(a) && Boolean(b);
}
function verifyShopify(raw,hmac,secret) {
  if(!hmac || !secret || !/^[A-Za-z0-9+/=]{44}$/.test(hmac)) return false;
  const expected=crypto.createHmac('sha256',secret).update(raw).digest('base64');
  return eq(hmac,expected);
}
function piasters(v) {
  const s=String(v);
  if(!/^(0|[1-9]\d{0,7})(?:\.\d{1,2})?$/.test(s)) throw new Error('Invalid EGP money');
  const [whole,frac='']=s.split('.');
  const n=Number(whole)*100+Number(frac.padEnd(2,'0'));
  if(!Number.isSafeInteger(n)||n>2147483647) throw new Error('EGP amount too large');
  return n;
}
function orderSnapshot(o) {
  if(!o || !/^\d+$/.test(String(o.id)) || typeof o.name!=='string' || o.name.length>90 ||
      !/^(?:#)?[A-Za-z0-9][A-Za-z0-9._\/-]*$/.test(o.name))
    throw new Error('Unsupported Shopify order identity');
  if(o.currency!=='EGP') throw new Error('Only EGP accepted');
  const updated=new Date(o.updated_at);
  if(Number.isNaN(updated.getTime())) throw new Error('Invalid Shopify timestamp');
  const subtotal=piasters(o.current_subtotal_price);
  const total=piasters(o.current_total_price);
  if(total===0 || subtotal>total) throw new Error('Invalid totals');
  const gateways=Array.isArray(o.payment_gateway_names)?o.payment_gateway_names:[];
  const isCod=gateways.some(v=>typeof v==='string' && /(cod|cash[ -]?on[ -]?delivery|الدفع عند الاستلام)/i.test(v));
  const referral=Array.isArray(o.discount_codes) ?
    o.discount_codes.map(v=>typeof v?.code==='string'?v.code.trim():'').find(Boolean) : null;
  return {
    id:String(o.id),name:o.name,currency:o.currency,updated,subtotal,total,isCod,
    referral:referral?.slice(0,100)||null,cancelled:Boolean(o.cancelled_at),
    refunded:Boolean(o.refunds?.length) || ['refunded','partially_refunded'].includes(o.financial_status),
    preview:Math.round(subtotal*0.20)
  };
}
function bostaSnapshot(o) {
  const event=o && typeof o.data==='object' && o.data!==null ? o.data : o;
  if(!event || typeof event!=='object') throw new Error('Missing Bosta event');
  const deliveryId=String(event._id||'');
  const orderName=String(event.businessReference||'');
  const tracking=String(event.trackingNumber||'');
  const state=Number(event.state);
  const time=Number(event.timeStamp);
  const type=String(event.type||'');
  if(!deliveryId || deliveryId.length>120 || !orderName || orderName.length>90 || !tracking ||
      !Number.isInteger(state) || !Number.isFinite(time) || !['SEND','FXF_SEND'].includes(type))
    throw new Error('Unsupported Bosta delivery event');
  const at=new Date(time);
  if(Number.isNaN(at.getTime()) || at.getTime()>Date.now()+86400000) throw new Error('Invalid Bosta time');
  const returned=[46,48,49,60,100,101].includes(state);
  const delivered=state===45 && event.isConfirmedDelivery===true && !returned;
  const collected=delivered?piasters(event.cod??0):0;
  return {deliveryId,orderName,tracking,state,at,returned,delivered,collected};
}
async function withTx(work) {
  const client=await database().connect();
  try {
    await client.query('BEGIN');
    const result=await work(client);
    await client.query('COMMIT');
    return result;
  } catch(e) {
    await client.query('ROLLBACK').catch(()=>{});
    throw e;
  } finally { client.release(); }
}
module.exports={MAX_BODY_BYTES,reply,stringHeader,rawBody,eq,verifyShopify,piasters,orderSnapshot,bostaSnapshot,withTx};
