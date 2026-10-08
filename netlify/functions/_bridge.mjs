import {createHmac,randomUUID} from 'node:crypto';
export async function signedBridge(actor,action,args=[],origin='',requestKey=randomUUID(),authUid=''){
  const secret=process.env.BRIDGE_SECRET||'',url=process.env.APPS_SCRIPT_WEBAPP_URL||'';
  if(secret.length<32||!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url))throw Error('CONFIG_REQUIRED');
  const requestId=randomUUID(),payload=JSON.stringify({ts:Date.now(),nonce:requestId,actor,authUid,action,args,requestKey,origin});
  const signature=createHmac('sha256',secret).update(payload).digest('hex');
  let response;try{response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({payload,signature}),redirect:'follow',signal:AbortSignal.timeout(45000)});}catch(e){console.error('AUTH_BRIDGE_UPSTREAM',JSON.stringify({requestId,action,kind:e?.name==='TimeoutError'?'TIMEOUT':'NETWORK'}));throw Error('UPSTREAM_UNAVAILABLE');}
  if(!response.ok){console.error('AUTH_BRIDGE_UPSTREAM',JSON.stringify({requestId,action,kind:'HTTP',status:response.status}));throw Error('UPSTREAM_ERROR');}
  let result;try{result=await response.json();}catch{console.error('AUTH_BRIDGE_UPSTREAM',JSON.stringify({requestId,action,kind:'NON_JSON'}));throw Error('UPSTREAM_ERROR');}
  if(!result||typeof result.ok!=='boolean')throw Error('UPSTREAM_ERROR');
  if(!result.ok)throw Error(result.error?.code||'UPSTREAM_ERROR');
  return result.data;
}
