import {getApps,initializeApp,cert} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';

export function firebaseAuth() {
  const projectId=process.env.FIREBASE_PROJECT_ID;
  const raw=process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if(!projectId||!raw)throw Error('FIREBASE_CONFIG_INVALID');
  if(!getApps().length){
    let account;
    try{account=JSON.parse(raw);}catch{throw Error('FIREBASE_CONFIG_INVALID');}
    if(!account||account.project_id!==projectId||
       typeof account.client_email!=='string'||!account.client_email||
       typeof account.private_key!=='string'||!account.private_key)throw Error('FIREBASE_CONFIG_INVALID');
    try{initializeApp({credential:cert(account),projectId});}
    catch{throw Error('FIREBASE_CONFIG_INVALID');}
  }
  return getAuth();
}

export async function verifyActorToken(token,auth){
  // Keep signature, project, expiry, revocation and disabled-account checks.
  const decoded=await auth.verifyIdToken(token,true);
  if(typeof decoded.email!=='string'||!decoded.email.trim())throw Error('AUTH_REQUIRED');
  if(decoded.email_verified!==true)throw Error('AUTH_EMAIL_UNVERIFIED');
  return {email:decoded.email.trim().toLowerCase(),uid:decoded.uid};
}

export async function verifiedActor(event) {
  const header=event.headers?.authorization||event.headers?.Authorization||'';
  const token=header.startsWith('Bearer ')?header.slice(7):'';
  if(!token||token.length>8192)throw Error('AUTH_REQUIRED');
  return verifyActorToken(token,firebaseAuth());
}

// Only fixed messages and codes may leave the server. Never return SDK error
// messages, credentials, tokens or service-account JSON to the browser/logs.
export function firebaseFailure(error){
  const key=error?.code||error?.message;
  const known={
    AUTH_REQUIRED:[401,'AUTH_REQUIRED','Authentication required'],
    AUTH_EMAIL_UNVERIFIED:[401,'AUTH_EMAIL_UNVERIFIED','Verify your email before signing in'],
    FIREBASE_CONFIG_INVALID:[503,'FIREBASE_CONFIG_INVALID','Firebase server credentials are not configured correctly'],
    CONFIG_REQUIRED:[503,'FIREBASE_CONFIG_INVALID','Firebase server credentials are not configured correctly'],
    'auth/id-token-expired':[401,'AUTH_TOKEN_EXPIRED','Your session expired. Sign in again'],
    'auth/id-token-revoked':[401,'AUTH_TOKEN_REVOKED','Your session was revoked. Sign in again'],
    'auth/user-disabled':[401,'AUTH_ACCOUNT_DISABLED','This login account is disabled'],
    'auth/user-not-found':[401,'AUTH_TOKEN_INVALID','This login session is no longer valid'],
    'auth/invalid-id-token':[401,'AUTH_TOKEN_INVALID','This login session is not valid for this project'],
    'auth/argument-error':[401,'AUTH_TOKEN_INVALID','This login session is not valid for this project'],
    'auth/invalid-argument':[401,'AUTH_TOKEN_INVALID','This login session is not valid for this project'],
    'auth/invalid-credential':[503,'FIREBASE_CONFIG_INVALID','Firebase server credentials are not configured correctly'],
    'app/invalid-credential':[503,'FIREBASE_CONFIG_INVALID','Firebase server credentials are not configured correctly'],
    'auth/insufficient-permission':[503,'FIREBASE_PERMISSION_DENIED','Firebase service account lacks Authentication permissions']
  };
  const [status,code,message]=known[key]||[503,'FIREBASE_UNAVAILABLE','Firebase verification is temporarily unavailable'];
  return {status,code,message};
}
