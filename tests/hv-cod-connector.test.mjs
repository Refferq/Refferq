import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import {
 verifyShopifyHmac, verifyBostaKey, egpToPiasters, normalizeShopifyOrder,
 normalizeBostaStatus, previewCodCommission
} from '../src/lib/hv-cod-connector.ts';

const SHOPIFY = {id: 999000111, name:'#HV-TEST-001', currency:'EGP',
 current_subtotal_price:'1000.00',current_total_price:'1050.00',
 updated_at:'2026-10-29T12:00:00Z',payment_gateway_names:['Cash on Delivery (COD)'],
 discount_codes:[{code:'TESTAFF20'}],refunds:[],cancelled_at:null,financial_status:'pending'};
const BOSTA = {_id:'fictitious-bosta-001',trackingNumber:100000001,businessReference:'#HV-TEST-001',
 type:'SEND',state:45,cod:1050,isConfirmedDelivery:true,timeStamp:1793276400000};
test('Shopify verifies base64 raw-body HMAC and rejects bad signatures',()=>{
 const body=JSON.stringify(SHOPIFY), secret='example-test-secret';
 const h=createHmac('sha256',secret).update(body).digest('base64');
 assert.equal(verifyShopifyHmac(body,h,secret),true);
 assert.equal(verifyShopifyHmac(body+' ',h,secret),false);
 assert.equal(verifyShopifyHmac(body,'invalid',secret),false);
});
test('Bosta callback requires the correct configured authorization key',()=>{
 assert.equal(verifyBostaKey('a-demo-key','a-demo-key'),true);
 assert.equal(verifyBostaKey('wrong','a-demo-key'),false);
});
test('EGP is converted to piasters exactly',()=>{
 assert.equal(egpToPiasters('1050.00'),105000);
 assert.equal(egpToPiasters('0.09'),9);
 assert.throws(()=>egpToPiasters('15.123'));
});
test('one fictitious Shopify order can be matched to Bosta by order reference',()=>{
 const s=normalizeShopifyOrder(SHOPIFY),b=normalizeBostaStatus(BOSTA);
 assert.equal(s.orderName,b.orderName);
 assert.equal(s.commissionPreviewPiasters,20000);
 assert.equal(b.collectedPiasters,105000);
 assert.equal(b.delivered,true);
 const state={...s,delivered:b.delivered,courierCollected:true,merchantReconciled:false,collectedPiasters:b.collectedPiasters};
 assert.equal(previewCodCommission(state).eligibleForManualReview,false);
 const ready=previewCodCommission({...state,merchantReconciled:true});
 assert.equal(ready.eligibleForManualReview,true);
 assert.equal(ready.proposedCommissionPiasters,20000);
 assert.equal(ready.ledgerWriteEnabled,false);
 assert.equal(ready.payoutEnabled,false);
});
test('delivery without proof, insufficient collection, refund and wrong payment method block commission',()=>{
 const s=normalizeShopifyOrder(SHOPIFY),b=normalizeBostaStatus(BOSTA);
 const ready={...s,delivered:b.delivered,courierCollected:true,merchantReconciled:true,collectedPiasters:b.collectedPiasters};
 assert.equal(previewCodCommission({...ready,delivered:false}).eligibleForManualReview,false);
 assert.equal(previewCodCommission({...ready,collectedPiasters:104999}).eligibleForManualReview,false);
 assert.equal(previewCodCommission({...ready,refunded:true}).eligibleForManualReview,false);
 assert.equal(previewCodCommission({...ready,cancelled:true}).eligibleForManualReview,false);
 assert.equal(previewCodCommission({...ready,isCod:false}).eligibleForManualReview,false);
 assert.equal(previewCodCommission({...ready,referralCode:null}).eligibleForManualReview,false);
 assert.equal(normalizeBostaStatus({...BOSTA,isConfirmedDelivery:false}).delivered,false);
 assert.equal(normalizeBostaStatus({...BOSTA,state:46}).returned,true);
});
