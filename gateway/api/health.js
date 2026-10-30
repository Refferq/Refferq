'use strict';
const {reply,withTx}=require('../lib/core');
module.exports=async(req,res)=>{
  if(req.method!=='GET')return reply(res,405,{error:'Method not allowed'});
  const databaseConfigured=Boolean(process.env.GATEWAY_DATABASE_URL);
  let databaseReachable=false;
  if(databaseConfigured){
    try{
      databaseReachable=await withTx(async c=>{
        const r=await c.query('SELECT 1 AS alive');
        return r.rows?.[0]?.alive===1;
      });
    }catch(e){
      // Never expose credentials, database host, error text or stack trace.
      databaseReachable=false;
    }
  }
  return reply(res,200,{
    service:'Herbal Vitaly isolated webhook receiver',
    staging:true,
    shopifyConfigured:Boolean(process.env.SHOPIFY_WEBHOOK_SECRET),
    bostaConfigured:Boolean(process.env.BOSTA_WEBHOOK_KEY),
    databaseConfigured,
    databaseReachable,
    ingestEnabled:process.env.INGEST_ENABLED==='true'
  });
};
