'use strict';
const crypto=require('node:crypto');
const {reply,eq}=require('../lib/core');
const {loadShopifyCodes,syncDiscounts}=require('../lib/discount-sync');
module.exports=async(req,res)=>{
  if(req.method!=='GET')return reply(res,405,{error:'Method not allowed'});
  if(process.env.SHOPIFY_DISCOUNT_SYNC_ENABLED!=='true')
    return reply(res,200,{enabled:false,status:'disabled',reason:'awaiting Shopify Admin discount token'});
  const secret=process.env.CRON_SECRET;
  const provided=req.headers.authorization;
  if(!secret || typeof provided!=='string' || !eq(provided,'Bearer '+secret))
    return reply(res,401,{error:'Unauthorized scheduled sync'});
  const shop=process.env.SHOPIFY_SHOP_DOMAIN;
  const id=process.env.SHOPIFY_CLIENT_ID;
  const clientSecret=process.env.SHOPIFY_CLIENT_SECRET;
  const fallbackToken=process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if(!/^[-a-z0-9]+\.myshopify\.com$/.test(shop||'')||!process.env.GATEWAY_DATABASE_URL||
      (!(id&&clientSecret)&&!fallbackToken))
    return reply(res,503,{error:'Shopify sync credentials not configured'});
  try {
    let token=fallbackToken;
    if(id&&clientSecret) {
      const response=await fetch(`https://${shop}/admin/oauth/access_token`,{
        method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body:new URLSearchParams({grant_type:'client_credentials',client_id:id,client_secret:clientSecret}),
        signal:AbortSignal.timeout(9000)
      });
      if(!response.ok)throw new Error('Shopify token acquisition failed');
      const data=await response.json();
      if(!data.access_token||!String(data.scope||'').split(',').includes('read_discounts'))
        throw new Error('Shopify token lacks read_discounts');
      token=data.access_token;
    }
    const all=await loadShopifyCodes(token,shop);
    const summary=await syncDiscounts(all);
    return reply(res,200,{ok:true,summary});
  }catch(e){
    console.error('Shopify discounts synchronization failed',e instanceof Error?e.message.split(':')[0]:'unknown');
    return reply(res,503,{error:'Shopify discounts synchronization could not complete'});
  }
};
