'use strict';
const {database}=require('./core');

const QUERY=`query HvDiscountMirror($first: Int!, $after: String) {
  discountNodes(first:$first,after:$after) {
    pageInfo {hasNextPage endCursor}
    nodes {id discount {
      __typename
      ... on DiscountCodeBasic {
        title summary status startsAt endsAt usageLimit asyncUsageCount
        customerGets {value {__typename ... on DiscountPercentage {percentage} ... on DiscountAmount {amount {amount currencyCode}}}}
        codes(first:30) {pageInfo {hasNextPage} nodes{code}}
      }
      ... on DiscountCodeBxgy {
        title summary status startsAt endsAt usageLimit asyncUsageCount
        codes(first:30) {pageInfo {hasNextPage} nodes{code}}
      }
      ... on DiscountCodeFreeShipping {
        title summary status startsAt endsAt usageLimit asyncUsageCount
        codes(first:30) {pageInfo {hasNextPage} nodes{code}}
      }
      ... on DiscountCodeApp {
        title status startsAt endsAt usageLimit asyncUsageCount
        codes(first:30) {pageInfo {hasNextPage} nodes{code}}
      }
    }}
  }
}`;

function normalizeShopifyDiscount(node) {
  const d=node?.discount;
  if(!d || !Array.isArray(d.codes?.nodes) || d.codes.pageInfo?.hasNextPage)
    throw new Error('Unsupported Shopify discount/code pagination');
  if(!/^gid:\/\/shopify\/DiscountCodeNode\/\d+$/.test(node.id))
    throw new Error('Unexpected discount identifier');
  const v=d.customerGets?.value, num=Number(v?.percentage);
  let kind='OTHER',amount=0;
  if(v?.__typename==='DiscountPercentage'&&Number.isFinite(num)&&num>=0&&num<=1) {
    kind='PERCENTAGE';amount=Math.round(num*10000)/100;
  } else if(v?.__typename==='DiscountAmount' &&
    v.amount?.currencyCode==='EGP' && Number.isFinite(Number(v.amount.amount))) {
    kind='FIXED';amount=Number(v.amount.amount);
  }
  return d.codes.nodes.map(item=>{
    const raw=item?.code;
    if(typeof raw!=='string'||raw.length===0||raw.length>100||/[\r\n\x00]/.test(raw))throw new Error('Invalid discount code');
    const code=raw.toUpperCase();
    return {
      code,shopifyId:node.id,summary:String(d.summary||d.title||'').slice(0,1200),
      shopifyStatus:d.status,kind,amount,
      used:Math.max(0,Number(d.asyncUsageCount)||0),
      limit:d.usageLimit===null?null:Number(d.usageLimit),
      startsAt:d.startsAt||null,endsAt:d.endsAt||null
    };
  });
}
async function queryShopify(token,shop,after) {
  const resp=await fetch(`https://${shop}/admin/api/2026-10/graphql.json`,{
    method:'POST',
    headers:{'Content-Type':'application/json','X-Shopify-Access-Token':token},
    body:JSON.stringify({query:QUERY,variables:{first:20,after}}),
    signal:AbortSignal.timeout(9000)
  });
  if(!resp.ok)throw new Error('Shopify Admin query rejected: HTTP '+resp.status);
  const data=await resp.json();
  if(data.errors?.length||!data.data?.discountNodes)throw new Error('Shopify Admin discount query failed');
  return data.data.discountNodes;
}
async function loadShopifyCodes(token,shop){
  const all=[],seen=new Set();let after=null;
  for(let i=0;i<50;i++){
    const page=await queryShopify(token,shop,after);
    for(const n of page.nodes){
      if(!n.discount?.codes)continue; // skip automatic discounts
      const codes=normalizeShopifyDiscount(n);
      for(const c of codes){if(seen.has(c.code))throw new Error('Duplicate Shopify code');seen.add(c.code);all.push(c);}
    }
    if(!page.pageInfo.hasNextPage)return all;
    if(!page.pageInfo.endCursor)throw new Error('Missing Shopify pagination cursor');
    after=page.pageInfo.endCursor;
  }
  throw new Error('Too many Shopify discount pages — no partial synchronization');
}
async function syncDiscounts(records){
  const pool=database(); const client=await pool.connect();
  const counts={read:records.length,insertedOrUpdated:0,skippedExisting:0,inactive:0};
  try {
    await client.query('BEGIN');
    const started=new Date();
    for(const c of records){
      const existing=await client.query('SELECT source FROM coupons WHERE code=$1 FOR UPDATE',[c.code]);
      if(existing.rowCount && existing.rows[0].source!=='SHOPIFY'){counts.skippedExisting++;continue;}
      const q=`INSERT INTO coupons
        (id,code,description,discount_type,discount_value,currency,max_uses,used_count,is_active,starts_at,expires_at,created_by,created_at,updated_at,source,shopify_discount_id,shopify_summary,shopify_status,shopify_synced_at)
        VALUES ($1,$2,$3,$4,$5,'EGP',$6,$7,$8,$9,$10,'shopify-sync',NOW(),NOW(),'SHOPIFY',$11,$12,$13,$14)
        ON CONFLICT (code) DO UPDATE SET description=excluded.description,discount_type=excluded.discount_type,
          discount_value=excluded.discount_value,currency=excluded.currency,max_uses=excluded.max_uses,used_count=excluded.used_count,
          is_active=excluded.is_active,starts_at=excluded.starts_at,expires_at=excluded.expires_at,updated_at=NOW(),
          shopify_discount_id=excluded.shopify_discount_id,shopify_summary=excluded.shopify_summary,
          shopify_status=excluded.shopify_status,shopify_synced_at=excluded.shopify_synced_at
        WHERE coupons.source='SHOPIFY'`;
      const value=[crypto.randomUUID(),c.code,c.summary,c.kind,c.amount,c.limit,c.used,c.shopifyStatus==='ACTIVE',c.startsAt,c.endsAt,c.shopifyId,c.summary,c.shopifyStatus,started];
      await client.query(q,value);counts.insertedOrUpdated++;
    }
    // Only mark missing codes inactive after a complete successful Shopify crawl.
    const missing=await client.query(
      'UPDATE coupons SET is_active=false,shopify_status=$1,updated_at=NOW() WHERE source=$2 AND (shopify_synced_at IS NULL OR shopify_synced_at < $3)',
      ['NOT_FOUND_IN_SHOPIFY','SHOPIFY',started]);
    counts.inactive=missing.rowCount;
    await client.query('COMMIT');
    return counts;
  }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}
}
const crypto=require('node:crypto');
module.exports={QUERY,normalizeShopifyDiscount,loadShopifyCodes,syncDiscounts};
