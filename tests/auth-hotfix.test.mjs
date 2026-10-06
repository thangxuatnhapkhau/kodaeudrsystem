import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
import {verifyActorToken,firebaseFailure,firebaseAuth} from '../netlify/functions/_firebase.mjs';
import {handler} from '../netlify/functions/call.mjs';

test('verified identities retain revocation checks and unverified email cannot reach the bridge',async()=>{
  const attempts=[];
  const auth={async verifyIdToken(token,checkRevoked){attempts.push({token,checkRevoked});return {uid:'firebase-uid',email:' ADMIN@EXAMPLE.COM ',email_verified:false};}};
  await assert.rejects(verifyActorToken('token',auth),/AUTH_EMAIL_UNVERIFIED/);
  assert.equal(attempts[0].checkRevoked,true);
  auth.verifyIdToken=async(token,checkRevoked)=>{assert.equal(checkRevoked,true);return {uid:'firebase-uid',email:' ADMIN@EXAMPLE.COM ',email_verified:true};};
  assert.deepEqual(await verifyActorToken('token',auth),{email:'admin@example.com',uid:'firebase-uid'});
  auth.verifyIdToken=async()=>{throw Object.assign(Error('sensitive SDK message'),{code:'auth/id-token-revoked'});};
  await assert.rejects(verifyActorToken('token',auth),e=>firebaseFailure(e).code==='AUTH_TOKEN_REVOKED');
});

test('server credential errors are distinct from expired/revoked/disabled/unverified accounts and never leak raw messages',()=>{
  for(const [key,status,code] of [
    ['AUTH_EMAIL_UNVERIFIED',401,'AUTH_EMAIL_UNVERIFIED'],
    ['auth/id-token-expired',401,'AUTH_TOKEN_EXPIRED'],
    ['auth/id-token-revoked',401,'AUTH_TOKEN_REVOKED'],
    ['auth/user-disabled',401,'AUTH_ACCOUNT_DISABLED'],
    ['auth/insufficient-permission',503,'FIREBASE_PERMISSION_DENIED'],
    ['auth/invalid-credential',503,'FIREBASE_CONFIG_INVALID']
  ]){
    const failure=firebaseFailure({code:key,message:'PRIVATE_SECRET_DO_NOT_RETURN'});
    assert.equal(failure.status,status);assert.equal(failure.code,code);
    assert.doesNotMatch(JSON.stringify(failure),/PRIVATE_SECRET/);
  }
  assert.doesNotMatch(JSON.stringify(firebaseFailure(Error('PRIVATE_SECRET_DO_NOT_RETURN'))),/PRIVATE_SECRET/);
});

test('malformed service-account JSON produces CONFIG status before contacting Apps Script',async()=>{
  const previous={...process.env},fetchBefore=globalThis.fetch,logs=[];
  const consoleBefore=console.error;
  try{
    Object.assign(process.env,{FIREBASE_PROJECT_ID:'test-project',FIREBASE_SERVICE_ACCOUNT_JSON:'PRIVATE_SECRET_NOT_JSON',BRIDGE_SECRET:'a'.repeat(64),APPS_SCRIPT_WEBAPP_URL:'https://script.google.com/macros/s/test/exec',ALLOWED_ORIGINS:'https://staging.example',LEGACY_TOKEN_LOGIN:'false'});
    globalThis.fetch=async()=>{assert.fail('Credential failure must not contact the bridge');};
    console.error=(...items)=>logs.push(items.join(' '));
    const response=await handler({httpMethod:'POST',headers:{origin:'https://staging.example',authorization:'Bearer example-token'},body:JSON.stringify({action:'recordLogin',args:[]})});
    const body=JSON.parse(response.body);
    assert.equal(response.statusCode,503);assert.equal(body.error.code,'FIREBASE_CONFIG_INVALID');
    assert.match(body.requestId,/^[a-f0-9-]{36}$/);
    assert.doesNotMatch(JSON.stringify({logs,body}),/PRIVATE_SECRET|example-token/);
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON=JSON.stringify({project_id:'other-project',client_email:'test@example.com',private_key:'PRIVATE_SECRET'});
    assert.throws(()=>firebaseAuth(),/FIREBASE_CONFIG_INVALID/);
  }finally{process.env=previous;globalThis.fetch=fetchBefore;console.error=consoleBefore;}
});

function appRuntime({verified=false,bridgeFailure=null}={}){
  const elements=new Map(),storage=new Map(),calls=[];
  const element=id=>{if(!elements.has(id))elements.set(id,{id,value:'',hidden:false,disabled:false,textContent:'',innerHTML:'',replaceChildren(){},addEventListener(){},close(){},focus(){}});return elements.get(id);};
  const account={localId:'firebase-uid',email:'admin@example.com',emailVerified:verified};
  const ctx={console,Date,Intl,URL,URLSearchParams,crypto:{randomUUID},location:{hash:''},
    window:{EudrI18n:{t:key=>key,translateUI(){},setLanguage(){}}},
    document:{getElementById:element,querySelectorAll:()=>[]},
    sessionStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)},
    fetch:async(url,options={})=>{
      const body=options.body?JSON.parse(String(url).includes('securetoken')?'{}':options.body):null;
      calls.push({url:String(url),options,body});
      let data,status=200;
      if(url==='/api/auth')data={enabled:true,apiKey:'public-test-key'};
      else if(String(url).includes('signInWithPassword'))data={idToken:'old-token',refreshToken:'refresh-token',localId:account.localId,email:account.email,expiresIn:3600};
      else if(String(url).includes('accounts:lookup'))data={users:[{...account}]};
      else if(String(url).includes('accounts:sendOobCode'))data={email:account.email};
      else if(String(url).includes('securetoken'))data={id_token:'fresh-token',refresh_token:'refresh-token-2',expires_in:3600};
      else if(url==='/api/call'){
        if(bridgeFailure){status=bridgeFailure.status;data={ok:false,error:{code:bridgeFailure.code,message:'safe server message'},requestId:'support-reference'};}
        else data={ok:true,data:body.action==='recordLogin'?true:{user:{name:'Admin',role:'ADMIN'},cases:[],tasks:[]}};
      }else assert.fail('Unexpected request '+url);
      return {status,ok:status<400,json:async()=>data};
    }
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8'),ctx);
  vm.runInContext('render=()=>{};',ctx);
  async function login(){element('loginEmail').value=account.email;element('loginPassword').value='test-password-not-logged';await element('loginForm').onsubmit({preventDefault(){},submitter:element('submit')});}
  return {ctx,element,storage,calls,account,login};
}

test('email verification waits for user action and refreshed verified token before recording login',async()=>{
  const app=appRuntime();await app.login();
  assert.match(app.element('main').innerHTML,/Send verification email/);
  assert.equal(app.calls.filter(c=>c.url==='/api/call').length,0);
  assert.equal(app.calls.filter(c=>c.url.includes('sendOobCode')).length,0);
  await app.element('sendVerification').onclick();
  const sent=app.calls.find(c=>c.url.includes('sendOobCode'));
  assert.deepEqual(JSON.parse(JSON.stringify(sent.body)),{requestType:'VERIFY_EMAIL',idToken:'old-token'});
  await app.element('checkVerification').onclick();
  assert.equal(app.calls.filter(c=>c.url==='/api/call').length,0);
  assert.match(app.element('msg').textContent,/not verified yet/);
  app.account.emailVerified=true;
  await app.element('checkVerification').onclick();
  const bridgeCalls=app.calls.filter(c=>c.url==='/api/call');
  assert.deepEqual(bridgeCalls.map(c=>c.body.action),['recordLogin','bootstrap']);
  assert.equal(bridgeCalls[0].options.headers.authorization,'Bearer fresh-token');
  assert.equal(app.element('identity').textContent,'Admin · ADMIN');
});

test('verified users see a safe configuration error and reference rather than a generic AUTH_REQUIRED',async()=>{
  const app=appRuntime({verified:true,bridgeFailure:{status:503,code:'FIREBASE_CONFIG_INVALID'}});await app.login();
  assert.match(app.element('msg').textContent,/FIREBASE_CONFIG_INVALID/);
  assert.match(app.element('msg').textContent,/support-reference/);
  assert.doesNotMatch(app.element('msg').textContent,/test-password|old-token|refresh-token/);
  assert.equal(app.storage.size,0);
});
