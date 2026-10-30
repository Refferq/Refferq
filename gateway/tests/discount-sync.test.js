'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {normalizeShopifyDiscount}=require('../lib/discount-sync');
const base={id:'gid://shopify/DiscountCodeNode/123',discount:{title:'MR14',summary:'15% off 2 products',status:'ACTIVE',
 codes:{pageInfo:{hasNextPage:false},nodes:[{code:'MR14'}]},customerGets:{value:{__typename:'DiscountPercentage',percentage:0.15}},
 asyncUsageCount:3,usageLimit:10,startsAt:'2026-10-30T09:00:00Z',endsAt:null}};
test('Shopify percentage imported without automatic affiliate mapping',()=>{
 const x=normalizeShopifyDiscount(base)[0]; assert.equal(x.code,'MR14');assert.equal(x.kind,'PERCENTAGE');assert.equal(x.amount,15);assert.equal(x.used,3);assert.equal(Object.hasOwn(x,'affiliateId'),false);
});
test('Fixed EGP discounts are represented in local currency',()=>{
 const x=normalizeShopifyDiscount({...base,discount:{...base.discount,customerGets:{value:{__typename:'DiscountAmount',amount:{amount:'100.00',currencyCode:'EGP'}}}}})[0];
 assert.equal(x.kind,'FIXED');assert.equal(x.amount,100);
});
test('Reject partial code group pagination and unsafe codes',()=>{
 assert.throws(()=>normalizeShopifyDiscount({...base,discount:{...base.discount,codes:{pageInfo:{hasNextPage:true},nodes:[{code:'MR14'}]}}}));
 assert.throws(()=>normalizeShopifyDiscount({...base,discount:{...base.discount,codes:{pageInfo:{hasNextPage:false},nodes:[{code:'MR14\nX'}]}}}));
});
