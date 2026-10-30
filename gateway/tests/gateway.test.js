'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {Readable}=require('node:stream');
const c=require('../lib/core');
const shopify=require('../api/shopify');
const bosta=require('../api/bosta');
function response(){return {statusCode:0,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(x){this.body=x;return this;}}}
function request(body,headers={},method='POST'){const r=Readable.from([Buffer.from(body||'')]);r.method=method;r.headers=headers;return r;}
const fixture={id:900001,name:'#HV-TEST-001',currency:'EGP',updated_at:'2026-10-30T06:00:00Z',current_subtotal_price:'1000.00',current_total_price:'1050.00',payment_gateway_names:['Cash on Delivery (COD)'],discount_codes:[{code:'HVTEST20'}],financial_status:'pending'};
const bostaFixture={_id:'test-delivery-001',businessReference:'#HV-TEST-001',trackingNumber:123456,type:'SEND',state:45,isConfirmedDelivery:true,cod:1050,timeStamp:1793340000000};
test('safe EGP amount handling and positive commission preview',()=>{const o=c.orderSnapshot(fixture);assert.equal(o.subtotal,100000);assert.equal(o.total,105000);assert.equal(o.preview,20000);assert.equal(o.isCod,true);assert.equal(o.referral,'HVTEST20');assert.throws(()=>c.piasters('100.001'));assert.throws(()=>c.piasters('99999999999.00'));});
test('Shopify accepts real Egyptian order number 2060, with or without optional #',()=>{
 const bare=c.orderSnapshot({...fixture,name:'2060',id:19092084228418,discount_codes:[{code:'MR14'}],current_subtotal_price:'637.50',current_total_price:'637.50'});
 assert.equal(bare.name,'2060');assert.equal(bare.referral,'MR14');assert.equal(bare.total,63750);
 assert.equal(c.orderSnapshot({...fixture,name:'#2060'}).name,'#2060');
 assert.throws(()=>c.orderSnapshot({...fixture,name:'2060\\nInjected'}));
 assert.throws(()=>c.orderSnapshot({...fixture,name:'2060 with spaces'}));
});
test('Shopify HMAC only matches original bytes',()=>{const raw=Buffer.from(JSON.stringify(fixture));const secret='test-secret-only';const signed=crypto.createHmac('sha256',secret).update(raw).digest('base64');assert.equal(c.verifyShopify(raw,signed,secret),true);assert.equal(c.verifyShopify(Buffer.concat([raw,Buffer.from(' ')]),signed,secret),false);assert.equal(c.verifyShopify(raw,signed,'wrong'),false);});
test('Bosta verification rejects incorrect authorization and controls delivery status',()=>{assert.equal(c.eq('test-key','test-key'),true);assert.equal(c.eq('bad','test-key'),false);const event=c.bostaSnapshot(bostaFixture);assert.equal(event.delivered,true);assert.equal(event.collected,105000);assert.equal(c.bostaSnapshot({...bostaFixture,isConfirmedDelivery:false}).delivered,false);assert.equal(c.bostaSnapshot({...bostaFixture,state:46}).returned,true);});
test('gateway rejects writes while disabled without any database access',async()=>{const v=process.env.INGEST_ENABLED;process.env.INGEST_ENABLED='false';try{let s=response();await shopify(request(JSON.stringify(fixture)),s);assert.equal(s.statusCode,503);s=response();await bosta(request(JSON.stringify(bostaFixture)),s);assert.equal(s.statusCode,503);}finally{if(v===undefined)delete process.env.INGEST_ENABLED;else process.env.INGEST_ENABLED=v;}});
test('unauthorized Shopify and Bosta callbacks blocked before database access',async()=>{const prev={enabled:process.env.INGEST_ENABLED,sh:process.env.SHOPIFY_WEBHOOK_SECRET,shop:process.env.SHOPIFY_SHOP_DOMAIN,bosta:process.env.BOSTA_WEBHOOK_KEY,db:process.env.GATEWAY_DATABASE_URL};try{process.env.INGEST_ENABLED='true';process.env.SHOPIFY_WEBHOOK_SECRET='test-shop-secret';process.env.SHOPIFY_SHOP_DOMAIN='test.myshopify.com';process.env.BOSTA_WEBHOOK_KEY='test-bosta-key';process.env.GATEWAY_DATABASE_URL='not-used-for-unauthorized-requests';let r=response();await shopify(request(JSON.stringify(fixture),{'x-shopify-topic':'orders/create','x-shopify-webhook-id':'evt1','x-shopify-shop-domain':'bad.myshopify.com'}),r);assert.equal(r.statusCode,401);r=response();await bosta(request(JSON.stringify(bostaFixture),{'x-hv-bosta-key':'wrong'}),r);assert.equal(r.statusCode,401);}finally{for(const [key,name]of Object.entries({enabled:'INGEST_ENABLED',sh:'SHOPIFY_WEBHOOK_SECRET',shop:'SHOPIFY_SHOP_DOMAIN',bosta:'BOSTA_WEBHOOK_KEY',db:'GATEWAY_DATABASE_URL'})){if(prev[key]===undefined)delete process.env[name];else process.env[name]=prev[key];}}});
test('strict order identity and COD amounts required',()=>{assert.throws(()=>c.orderSnapshot({...fixture,currency:'INR'}));assert.throws(()=>c.orderSnapshot({...fixture,name:'not a valid order name'}));assert.equal(c.orderSnapshot({...fixture,refunds:[{}]}).refunded,true);});
