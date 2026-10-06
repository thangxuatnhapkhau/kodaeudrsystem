import {getApps,initializeApp,cert} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';

export function firebaseAuth() {
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) throw Error('CONFIG_REQUIRED');
  if(!getApps().length){
    const account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    if (account.project_id !== process.env.FIREBASE_PROJECT_ID) throw Error('CONFIG_REQUIRED');
    initializeApp({credential:cert(account),projectId:process.env.FIREBASE_PROJECT_ID});
  }
  return getAuth();
}

export async function verifiedActor(event) {
  const header=event.headers?.authorization||event.headers?.Authorization||'';
  const token=header.startsWith('Bearer ')?header.slice(7):'';
  if(!token||token.length>8192) throw Error('AUTH_REQUIRED');
  const decoded=await firebaseAuth().verifyIdToken(token,true);
  if(!decoded.email || !decoded.email_verified) throw Error('AUTH_REQUIRED');
  return {email:decoded.email.trim().toLowerCase(),uid:decoded.uid};
}
