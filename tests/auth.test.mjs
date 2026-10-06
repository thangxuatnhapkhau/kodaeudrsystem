import test from 'node:test';
import assert from 'node:assert/strict';
import {handler} from '../netlify/functions/auth.mjs';

test('public Firebase config has no service account and auth mutation requires allowed origin',async()=>{
 const previous={...process.env};try{
  Object.assign(process.env,{ALLOWED_ORIGINS:'https://staging.example',FIREBASE_PROJECT_ID:'staging-project',FIREBASE_WEB_API_KEY:'public-test-key',FIREBASE_SERVICE_ACCOUNT_JSON:'server-secret-test'});
  const config=JSON.parse((await handler({httpMethod:'GET',headers:{}})).body);
  assert.equal(config.apiKey,'public-test-key');assert.equal(config.enabled,true);
  assert.doesNotMatch(JSON.stringify(config),/server-secret-test/);
  const denied=await handler({httpMethod:'POST',headers:{origin:'https://evil.example'},body:'{"action":"provision"}'});
  assert.equal(denied.statusCode,403);
 }finally{process.env=previous;}
});
