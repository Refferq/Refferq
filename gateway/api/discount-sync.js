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
  const token=process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const shop=process.env.SHOPIFY_SHOP_DOMAIN;
  if(!token || !/^[-a-z0-9]+\.myshopify\.com$/.test(shop||'')||!process.env.GATEWAY_DATABASE_URL)
    return reply(res,503,{error:'Shopify sync credentials not configured'});
  try{
    const all=await loadShopifyCodes(token,shop);
    const summary=await syncDiscounts(all);
    return reply(res,200,{ok:true,summary});
  }catch(e){
    console.error('Shopify discounts synchronization failed',e instanceof Error?e.message.split(':')[0]:'unknown');
    return reply(res,503,{error:'Shopify discounts synchronization could not complete'});
  }
};
