// Preview deployments must never become a second UI writing through inherited production credentials.
export function stagingFailure(event){
 const host=String(event?.headers?.host||event?.headers?.Host||'').split(':')[0].toLowerCase();
 const preview=['deploy-preview','branch-deploy'].includes(process.env.CONTEXT)||host.endsWith('--koda-eudr-system.netlify.app');
 if(!preview)return null;
 const distinctConfig=process.env.EUDR_ENVIRONMENT==='STAGING'&&process.env.STAGING_BACKEND_VERIFIED==='true'&&process.env.STAGING_APPS_SCRIPT_WEBAPP_URL&&process.env.APPS_SCRIPT_WEBAPP_URL===process.env.STAGING_APPS_SCRIPT_WEBAPP_URL&&process.env.STAGING_BRIDGE_SECRET?.length>=32&&process.env.BRIDGE_SECRET===process.env.STAGING_BRIDGE_SECRET&&process.env.STAGING_FIREBASE_PROJECT_ID&&process.env.FIREBASE_PROJECT_ID===process.env.STAGING_FIREBASE_PROJECT_ID;
 if(distinctConfig)return null;
 return {statusCode:503,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'},body:JSON.stringify({ok:false,error:{code:'STAGING_CONFIG_REQUIRED',message:'Preview access is disabled until dedicated staging backend and authentication are verified.'}})};
}
