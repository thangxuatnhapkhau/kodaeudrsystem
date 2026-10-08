import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {handler} from '../netlify/functions/call.mjs';
import {renderPdfPreview} from '../public/pdf-preview.mjs';

async function bridgeCase(upstream){
 const previous={...process.env},beforeFetch=globalThis.fetch,beforeLog=console.error,logs=[];
 const token='t'.repeat(40);
 try{
  Object.assign(process.env,{BRIDGE_SECRET:'s'.repeat(64),APPS_SCRIPT_WEBAPP_URL:'https://script.google.com/macros/s/staging/exec',ALLOWED_ORIGINS:'https://staging.example',LEGACY_TOKEN_LOGIN:'true',TOKEN_HASHES_JSON:JSON.stringify([{sha256:createHash('sha256').update(token).digest('hex'),email:'admin@test.example',active:true}])});
  console.error=(...items)=>logs.push(items.join(' '));
  globalThis.fetch=async(url,options)=>{assert.equal(url,process.env.APPS_SCRIPT_WEBAPP_URL);assert.equal(options.redirect,'follow');return upstream(options);};
  const result=await handler({httpMethod:'POST',headers:{origin:'https://staging.example',authorization:'Bearer '+token},body:JSON.stringify({action:'updateOrder',args:['case-1',{so:'SO-1'}],requestKey:'request-key-123456789'})});
  return {status:result.statusCode,body:JSON.parse(result.body),logs};
 }finally{process.env=previous;globalThis.fetch=beforeFetch;console.error=beforeLog;}
}
const response=(status,text,contentType='text/html')=>({ok:status>=200&&status<300,status,url:'https://script.googleusercontent.com/macros/echo?opaque=do-not-log',headers:{get:key=>key==='content-type'?contentType:null},text:async()=>text});
test('bridge identifies upstream HTTP, HTML, and timeout without leaking response content or replaying a write',async()=>{
 let attempts=0;
 const http=await bridgeCase(()=>{attempts++;return response(503,'PRIVATE_RESPONSE_BODY');});
 assert.equal(http.status,502);assert.equal(http.body.error.code,'UPSTREAM_HTTP');assert.equal(attempts,1);
 assert.match(http.logs.join(' '),/httpStatus":503/);
 const html=await bridgeCase(()=>response(200,'<html>PRIVATE_RESPONSE_BODY</html>'));
 assert.equal(html.body.error.code,'UPSTREAM_NON_JSON');assert.equal(html.status,502);
 const timeout=await bridgeCase(()=>{throw Object.assign(Error('PRIVATE_RESPONSE_BODY'),{name:'TimeoutError'});});
 assert.equal(timeout.status,504);assert.equal(timeout.body.error.code,'UPSTREAM_TIMEOUT');
 for(const item of [http,html,timeout]){assert.match(item.body.requestId,/^[a-f0-9-]{36}$/);assert.doesNotMatch(JSON.stringify(item),/PRIVATE_RESPONSE_BODY|request-key-123456789|opaque=do-not-log/);}
});
test('bridge accepts ContentService redirected JSON response',async()=>{
 const result=await bridgeCase(()=>response(200,JSON.stringify({ok:true,data:{id:'case-1'}}),'application/json'));
 assert.equal(result.status,200);assert.equal(result.body.data.id,'case-1');
});
test('self-hosted PDF preview uses canvas and a same-origin worker without inline style or iframe',async()=>{
 const dom=new JSDOM('<div id="preview"></div>'),beforeDocument=globalThis.document,beforeWindow=globalThis.window;
 let destroyed=0,renders=0,options;
 try{
  globalThis.document=dom.window.document;globalThis.window=dom.window;
  dom.window.HTMLCanvasElement.prototype.getContext=()=>({});
  const fake={GlobalWorkerOptions:{},getDocument(input){options=input;return {promise:Promise.resolve({numPages:2,getPage:async()=>({getViewport:({scale})=>({width:600*scale,height:800*scale}),render:()=>{renders++;return {promise:Promise.resolve(),cancel(){}};},cleanup(){}})}),destroy(){destroyed++;}};}};
  const host=dom.window.document.getElementById('preview');
  const cleanup=await renderPdfPreview(host,new Uint8Array([1,2,3]),{loadLibrary:async()=>fake});
  assert.equal(fake.GlobalWorkerOptions.workerSrc,'/vendor/pdfjs/pdf.worker.min.mjs');
  assert.equal(options.disableFontFace,true);
  assert.equal(options.useSystemFonts,false);
  assert.equal(host.querySelectorAll('canvas').length,1);
  assert.equal(host.querySelectorAll('iframe,[srcdoc],[style]').length,0);
  assert.equal(host.querySelector('[role="status"]').textContent,'Page 1 / 2');
  host.querySelector('button[aria-label="Next PDF page"]').click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(host.querySelector('[role="status"]').textContent,'Page 2 / 2');
  assert.equal(renders,2);
  cleanup();assert.equal(destroyed,1);
  const csp=fs.readFileSync(new URL('../netlify.toml',import.meta.url),'utf8');
  assert.match(csp,/worker-src 'self'; object-src 'none'; frame-src 'none'/);
  assert.match(csp,/script-src 'self' 'wasm-unsafe-eval'; style-src 'self'/);
  assert.doesNotMatch(csp,/unsafe-inline|(?<!wasm-)unsafe-eval/);
 }finally{globalThis.document=beforeDocument;globalThis.window=beforeWindow;dom.window.close();}
});
