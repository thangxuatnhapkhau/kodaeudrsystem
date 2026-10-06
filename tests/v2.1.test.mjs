import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {processCall} from '../netlify/functions/call.mjs';

const previous={...process.env};
process.env.ALLOWED_ORIGINS='https://staging.example.netlify.app';
process.env.APPS_SCRIPT_WEBAPP_URL='https://script.google.com/macros/s/AKfycbTest/exec';
process.env.BRIDGE_SECRET='test-only-secret-with-more-than-32-chars';
test.after(()=>{process.env.ALLOWED_ORIGINS=previous.ALLOWED_ORIGINS;process.env.APPS_SCRIPT_WEBAPP_URL=previous.APPS_SCRIPT_WEBAPP_URL;process.env.BRIDGE_SECRET=previous.BRIDGE_SECRET;});
const req=(body,origin='https://staging.example.netlify.app')=>new Request('https://staging.example.netlify.app/api/call',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
const body={action:'bootstrap',args:[],requestKey:'stagingrequestkey123'};

test('only verified Identity email becomes signed actor; forged browser fields ignored',async()=>{
 let signed;
 const res=await processCall(req({...body,actor:'admin@example.com',role:'ADMIN'}),{
  identity:async()=>({email:'viewer@example.com',app_metadata:{roles:['ADMIN']}}),
  upstreamFetch:async(_url,options)=>{signed=JSON.parse(options.body);return Response.json({ok:true,data:{user:{role:'VIEWER'}}});}
 });
 assert.equal(res.status,200);
 const payload=JSON.parse(signed.payload);
 assert.equal(payload.actor,'viewer@example.com');
 assert.equal(payload.requestKey,body.requestKey);
 assert.equal(signed.signature,createHmac('sha256',process.env.BRIDGE_SECRET).update(signed.payload).digest('hex'));
});
test('missing Identity session and missing Origin fail closed',async()=>{
 assert.equal((await processCall(req(body),{identity:async()=>null})).status,401);
 assert.equal((await processCall(req(body,''),{identity:async()=>({email:'a@b.com'})})).status,403);
});
test('upstream authorization denial stays a 403 and carries requestId',async()=>{
 const res=await processCall(req(body),{identity:async()=>({email:'unknown@example.com'}),upstreamFetch:async()=>Response.json({ok:false,error:{code:'PERMISSION_DENIED',message:'Outside assigned scope'}})});
 const data=await res.json();assert.equal(res.status,403);assert.equal(data.error.code,'PERMISSION_DENIED');assert.ok(data.requestId);
});
test('prompt names the exact registered source, sheet, folder and target without inventing missing source',()=>{
 const code=readFileSync(new URL('../apps_script/PromptService.gs',import.meta.url),'utf8');
 const rows={};
 const root={getName:()=> 'SO25-2183',getParents:()=>({hasNext:()=>false})};
 const folder={getName:()=> '00_SO',getId:()=> 'sourceFolder',getParents:()=>({hasNext:()=>true,next:()=>rootFolder})};
 const rootFolder={getName:()=> 'SO25-2183',getId:()=> 'folder123',getParents:()=>({hasNext:()=>false})};
 const file={getName:()=> 'SO25-2183_SO.pdf',getId:()=> 'file123',getParents:()=>({hasNext:()=>true,next:()=>folder})};
 const sandbox={
  user_:()=>({email:'reviewer@example.com',role:'EUDR_REVIEWER'}),requireWrite_:()=>{},
  order_:()=>({id:'case123',so:'SO25-2183',customer:'AMPM',product:'STIGIDO END TABLE 5',folder:'folder123',so_document_id:'doc123'}),
  document_:()=>({id:'doc123',case_id:'case123',kind:'SO',status:'UPLOADED',name:'SO25-2183_SO.pdf',file_id:'file123'}),
  DriveApp:{getFileById:()=>file,getFolderById:()=>rootFolder},
  db_:()=>({getId:()=> 'sheet123'}),rows_:n=>rows[n]||[],uid_:()=> 'run123',now_:()=> '2026-10-06T00:00:00Z',
  add_:(n,v)=>rows[n]=[v],audit_:()=>{},fail_:(c,m)=>{const e=Error(m);e.code=c;throw e;}
 };
 vm.runInNewContext(code,sandbox);
 const result=sandbox.getAiPrompt('case123','MATERIAL_EXTRACTION',{actionMode:'PREPARE_UPDATE'});
 assert.match(result.prompt,/SO25-2183_SO\.pdf/);
 assert.match(result.prompt,/Internal Case ID: case123/);
 assert.match(result.prompt,/https:\/\/drive\.google\.com\/drive\/folders\/folder123/);
 assert.match(result.prompt,/https:\/\/drive\.google\.com\/file\/d\/file123\/view/);
 assert.match(result.prompt,/https:\/\/docs\.google\.com\/spreadsheets\/d\/sheet123\/edit/);
 assert.match(result.prompt,/Proposed output destination: 02_SO_ITEM_MATERIAL/);
 assert.match(result.prompt,/ACTION MODE: PREPARE_UPDATE/);
 assert.match(result.prompt,/Human approval required: YES/);
 assert.doesNotMatch(result.prompt,/test-only-secret-with-more-than-32-chars/);
 sandbox.DriveApp.getFileById=()=>{throw Error('missing');};
 assert.throws(()=>sandbox.getAiPrompt('case123','MATERIAL_EXTRACTION',''),{code:'SOURCE_NOT_FOUND'});
});
