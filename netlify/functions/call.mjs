import {createHmac, randomUUID} from 'node:crypto';
import {getUser} from '@netlify/identity';

const actions=new Set(['beginUpload','uploadChunk','finishUpload','getDocumentChunk','recordLogin','recordLogout','bootstrap','createCase','completeCase','createOrder','previewMaterials','confirmMaterials','addChainNode','updateTask','uploadEvidence','submitDocument','reviewDocument','getDocument','addComment','uploadProcessed','verifyProcessed','syncCalendar','getAiPrompt','importAiResult','saveGeo','reviewGeo','exportPackage','updateMaterialInfo','saveCertificate','saveCountryRisk','manageUser','manageSupplier','saveSettings','markNotification']);
const json=(status,value,id)=>Response.json({...value,requestId:id},{status,headers:{'cache-control':'no-store'}});
const error=(status,code,message,id)=>json(status,{ok:false,data:null,error:{code,message}},id);

// Netlify Functions v2 verifies the Identity session in the runtime.
// Browser-provided email, role and actor are never trusted.
export async function processCall(request,{identity=getUser,upstreamFetch=fetch}={}){
 const requestId=randomUUID();
 if(request.method!=='POST')return error(405,'METHOD_NOT_ALLOWED','POST required',requestId);
 const origin=request.headers.get('origin')||'';
 const origins=(process.env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
 if(!origins.length||!origins.includes(origin))return error(403,'ORIGIN_DENIED','Origin is not allowed',requestId);
 const secret=process.env.BRIDGE_SECRET||'',url=process.env.APPS_SCRIPT_WEBAPP_URL||'';
 if(secret.length<32||!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url))return error(503,'CONFIG_REQUIRED','Bridge is not configured',requestId);
 let user;try{user=await identity();}catch{return error(503,'UPSTREAM_UNAVAILABLE','Identity verification unavailable',requestId);}
 const actor=String(user?.email||'').trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(actor))return error(401,'AUTH_REQUIRED','Sign in required',requestId);
 const raw=await request.text();
 if(Buffer.byteLength(raw)>4400000)return error(413,'REQUEST_TOO_LARGE','Request too large',requestId);
 let body;try{body=JSON.parse(raw);}catch{return error(400,'INVALID_JSON','Invalid JSON',requestId);}
 if(!body||!actions.has(body.action)||!Array.isArray(body.args)||body.args.length>3)return error(400,'UNKNOWN_ACTION','Unknown action',requestId);
 if(body.requestKey!==undefined&&!/^[a-zA-Z0-9_-]{16,80}$/.test(body.requestKey))return error(400,'INVALID_INPUT','Invalid request key',requestId);
 const payload=JSON.stringify({ts:Date.now(),nonce:requestId,actor,action:body.action,args:body.args,requestKey:body.requestKey||requestId,origin});
 const signature=createHmac('sha256',secret).update(payload).digest('hex');
 try{
  const upstream=await upstreamFetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({payload,signature}),redirect:'follow',signal:AbortSignal.timeout(25000)});
  if(!upstream.ok)return error(502,'UPSTREAM_ERROR','Apps Script returned HTTP '+upstream.status,requestId);
  const resultText=await upstream.text();
  if(resultText.length>5500000)return error(413,'RESPONSE_TOO_LARGE','Response exceeds bridge limit',requestId);
  let result;try{result=JSON.parse(resultText);}catch{return error(502,'UPSTREAM_ERROR','Apps Script returned a non-JSON response',requestId);}
  if(result.ok)return json(200,{ok:true,data:result.data??result.result,error:null},requestId);
  const e=typeof result.error==='object'?result.error:{code:'UPSTREAM_ERROR',message:String(result.error||'Request failed')};
  return error(e.code==='INTERNAL_ERROR'?500:e.code==='AUTH_REQUIRED'?401:e.code==='PERMISSION_DENIED'?403:400,e.code,e.message,requestId);
 }catch{return error(502,'UPSTREAM_UNAVAILABLE','Cannot reach Apps Script; retry with the same request key',requestId);}
}
export default async function handler(request){return processCall(request);}
