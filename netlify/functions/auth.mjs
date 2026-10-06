import {randomBytes,randomUUID} from 'node:crypto';
import {firebaseAuth,verifiedActor} from './_firebase.mjs';
import {signedBridge} from './_bridge.mjs';

const reply=(statusCode,value)=>({statusCode,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'},body:JSON.stringify(value)});
export async function handler(event){
 const origin=event.headers?.origin||event.headers?.Origin||'',allowed=(process.env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim());
 if(event.httpMethod==='GET')return reply(200,{ok:true,apiKey:process.env.FIREBASE_WEB_API_KEY||'',projectId:process.env.FIREBASE_PROJECT_ID||'',enabled:!!(process.env.FIREBASE_PROJECT_ID&&process.env.FIREBASE_WEB_API_KEY&&process.env.FIREBASE_SERVICE_ACCOUNT_JSON)});
 if(!origin||!allowed.includes(origin))return reply(403,{ok:false,code:'ORIGIN_DENIED'});
 if(event.httpMethod!=='POST'||!event.body||event.body.length>4096)return reply(400,{ok:false,code:'INVALID_INPUT'});
 try{
  const actor=await verifiedActor(event),input=JSON.parse(event.body),auth=firebaseAuth();
  if(input.action==='changePassword'){
   if(typeof input.password!=='string'||input.password.length<12||input.password.length>256)return reply(400,{ok:false,code:'WEAK_PASSWORD'});
   const gate=await signedBridge(actor.email,'authState',[],origin,randomUUID(),actor.uid);
   if(gate.must_change_password!=='YES'||gate.auth_uid!==actor.uid)return reply(403,{ok:false,code:'AUTH_STATE_INVALID'});
   await auth.updateUser(actor.uid,{password:input.password});
   await auth.revokeRefreshTokens(actor.uid);
   await signedBridge(actor.email,'authPasswordChanged',[actor.uid],origin,randomUUID(),actor.uid);
   return reply(200,{ok:true});
  }
  if(input.action==='provision'){
   const email=String(input.email||'').trim().toLowerCase();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return reply(400,{ok:false,code:'INVALID_INPUT'});
   const target=await signedBridge(actor.email,'authProvisionCheck',[email],origin,randomUUID(),actor.uid);
   if(target.auth_uid)return reply(409,{ok:false,code:'ACCOUNT_EXISTS'});
   const password=randomBytes(24).toString('base64url');
   const user=await auth.createUser({email,password,emailVerified:true,disabled:false,displayName:target.name||email});
   try{await signedBridge(actor.email,'authProvisioned',[email,user.uid],origin,randomUUID(),actor.uid);}
   catch(e){await auth.updateUser(user.uid,{disabled:true});throw e;}
   return reply(200,{ok:true,email,temporaryPassword:password});
  }
  if(input.action==='setEnabled'){
   const email=String(input.email||'').trim().toLowerCase(),enabled=input.enabled===true;
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof input.enabled!=='boolean')return reply(400,{ok:false,code:'INVALID_INPUT'});
   const target=await signedBridge(actor.email,'authAccountStateCheck',[email,enabled],origin,randomUUID(),actor.uid);
   await auth.updateUser(target.uid,{disabled:!enabled});
   if(!enabled)await auth.revokeRefreshTokens(target.uid);
   await signedBridge(actor.email,'authAccountStateRecorded',[email,enabled],origin,randomUUID(),actor.uid);
   return reply(200,{ok:true});
  }
  return reply(400,{ok:false,code:'UNKNOWN_ACTION'});
 }catch(e){
  const code=['AUTH_REQUIRED','CONFIG_REQUIRED','PERMISSION_DENIED','UPSTREAM_UNAVAILABLE','ACCOUNT_EXISTS','AUTH_STATE_INVALID'].includes(e.message)?e.message:'AUTH_FAILED';
  return reply(code==='AUTH_REQUIRED'?401:code==='CONFIG_REQUIRED'||code==='UPSTREAM_UNAVAILABLE'?503:code==='ACCOUNT_EXISTS'?409:403,{ok:false,code});
 }
}
