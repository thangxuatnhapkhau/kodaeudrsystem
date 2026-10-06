import {createHmac,randomUUID} from 'node:crypto';
export async function signedBridge(actor,action,args=[],origin='',requestKey=randomUUID(),authUid=''){
  const secret=process.env.BRIDGE_SECRET||'',url=process.env.APPS_SCRIPT_WEBAPP_URL||'';
  if(secret.length<32||!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url))throw Error('CONFIG_REQUIRED');
  const payload=JSON.stringify({ts:Date.now(),nonce:randomUUID(),actor,authUid,action,args,requestKey,origin});
  const signature=createHmac('sha256',secret).update(payload).digest('hex');
  const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({payload,signature}),signal:AbortSignal.timeout(25000)});
  if(!response.ok)throw Error('UPSTREAM_UNAVAILABLE');
  const result=await response.json();
  if(!result.ok)throw Error(result.error?.code||'UPSTREAM_ERROR');
  return result.data;
}
