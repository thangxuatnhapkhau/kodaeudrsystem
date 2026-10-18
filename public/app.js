let state,view='Dashboard',selected='',material='',selectedChainNode='',selectedSource='',workspaceTab='evidence',workspaceStep='order',busy=false,month=new Date(),calendarMode='Month',documentUrl='',pdfPreviewAbort=null,pdfPreviewCleanup=null,dashboardKpiFilter='',myTasksFilter='';
const i18n=window.EudrI18n,tt=(s,v)=>i18n.t(s,v);
let firebaseConfig,verificationPending=false,verificationEmail='';
async function authConfig(){if(!firebaseConfig){const response=await fetch('/api/auth');firebaseConfig=await response.json();}return firebaseConfig;}
async function firebaseRequest(path,body){const config=await authConfig();if(!config.enabled)throw Error('CONFIG_REQUIRED');const response=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:'+path+'?key='+encodeURIComponent(config.apiKey),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw Error('AUTH_FAILED');return data;}
async function authToken(forceRefresh=false){let token=sessionStorage.getItem('eudr_id_token');if(!token)return '';if(!forceRefresh&&Number(sessionStorage.getItem('eudr_token_expires')||0)>Date.now()+60000)return token;const refresh=sessionStorage.getItem('eudr_refresh_token');if(!refresh)return '';const config=await authConfig();const response=await fetch('https://securetoken.googleapis.com/v1/token?key='+encodeURIComponent(config.apiKey),{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:refresh})});if(!response.ok){clearAuth();return '';}const data=await response.json();saveAuth({idToken:data.id_token,refreshToken:data.refresh_token,expiresIn:data.expires_in});return data.id_token;}
function saveAuth(data){sessionStorage.setItem('eudr_id_token',data.idToken);sessionStorage.setItem('eudr_refresh_token',data.refreshToken);sessionStorage.setItem('eudr_token_expires',String(Date.now()+Number(data.expiresIn||3600)*1000));}
function clearAuth(){['eudr_id_token','eudr_refresh_token','eudr_token_expires','eudr_token','eudr_nav_state'].forEach(k=>sessionStorage.removeItem(k));if(typeof DOCUMENT_BYTE_CACHE!=='undefined')DOCUMENT_BYTE_CACHE.clear();window.EudrGeo?.clearSavedViews?.();window.EudrNav?.reset?.(true);window.EudrOps?.reset?.();verificationPending=false;verificationEmail='';}
async function authAction(input){const response=await fetch('/api/auth',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+await authToken()},body:JSON.stringify(input)});const data=await response.json();if(!data.ok){const error=Error(data.code||'AUTH_FAILED');error.code=data.code;error.status=response.status;error.requestId=data.requestId;throw error;}return data;}
function errorLabel(error){const code=error?.code||error?.message||'AUTH_FAILED',label=tt(code);return error?.requestId?label+' ['+code+'; '+error.requestId+']':label;}
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roles=(...rs)=>rs.includes(state?.user.role),cap=c=>(state?.user.capabilities||[]).includes(c),manage=()=>cap('ORDER_EDIT'),review=()=>cap('EVIDENCE_REVIEW'),supplier=()=>roles('SUPPLIER_USER'),write=()=>!roles('VIEWER');
const today=()=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(k=>p.find(x=>x.type===k).value).join('-');};
const retryKeys=new Map(),filter={q:'',status:'',supplier:'',owner:'',material:'',block:'',geo:'',due:'',from:'',to:''};

/* P2-D: Centralized Operation & Loading Status Manager */
const EudrOps=(()=>{
 const STATES={IDLE:'IDLE',QUEUED:'QUEUED',RUNNING:'RUNNING',SUCCEEDED:'SUCCEEDED',FAILED:'FAILED',OUTCOME_UNKNOWN:'OUTCOME_UNKNOWN',CANCELLED:'CANCELLED'};
 const ops=new Map();
 let seq=0,panelOpen=false;
 function validProgress(progress,unitLabel){
  return typeof progress==='number'&&Number.isFinite(progress)&&progress>=0&&progress<=100&&Boolean(unitLabel)?Math.round(progress):null;
 }
 function syncBusy(){
  const blocking=[...ops.values()].some(o=>o.status===STATES.RUNNING&&o.level>=3);
  busy=blocking;
  renderStatusUI();
 }
 function start({id='',action='operation',label='Working…',level=1,status=STATES.RUNNING,progress=null,unitLabel='',caseId='',step=''}={}){
  const opId=id||`op_${++seq}_${Date.now()}`;
  const entry={id:opId,action,label,level,status:STATES[status]||STATES.RUNNING,progress:validProgress(progress,unitLabel),unitLabel:unitLabel||'',caseId:caseId||selected||'',step:step||'',startedAt:Date.now(),updatedAt:Date.now(),error:'',requestId:''};
  ops.set(opId,entry);
  if(ops.size>40){const first=ops.keys().next().value;if(first!==opId)ops.delete(first);}
  syncBusy();
  return opId;
 }
 function update(id,patch={}){
  const entry=ops.get(id);if(!entry)return null;
  if(patch.label!==undefined)entry.label=patch.label;
  if(patch.step!==undefined)entry.step=patch.step;
  if(patch.status&&STATES[patch.status])entry.status=STATES[patch.status];
  if(patch.unitLabel!==undefined)entry.unitLabel=patch.unitLabel;
  if(patch.progress!==undefined)entry.progress=validProgress(patch.progress,entry.unitLabel);
  if(patch.error!==undefined)entry.error=patch.error;
  if(patch.requestId!==undefined)entry.requestId=patch.requestId;
  entry.updatedAt=Date.now();
  syncBusy();
  return entry;
 }
 function succeed(id,summary=''){
  const entry=ops.get(id);if(!entry)return null;
  entry.status=STATES.SUCCEEDED;
  if(summary)entry.step=summary;
  if(entry.progress!==null&&entry.unitLabel)entry.progress=100;
  entry.updatedAt=Date.now();
  syncBusy();
  return entry;
 }
 function fail(id,error,{uncertain=false}={}){
  const entry=ops.get(id);if(!entry)return null;
  const isUncertain=uncertain||Number(error?.status)>=500||['UPSTREAM_TIMEOUT','NETWORK_ERROR'].includes(error?.code);
  entry.status=isUncertain?STATES.OUTCOME_UNKNOWN:STATES.FAILED;
  entry.error=typeof error==='string'?error:errorLabel(error);
  entry.requestId=error?.requestId||'';
  entry.updatedAt=Date.now();
  syncBusy();
  return entry;
 }
 function cancel(id,reason=''){
  const entry=ops.get(id);if(!entry)return null;
  entry.status=STATES.CANCELLED;
  if(reason)entry.step=reason;
  entry.updatedAt=Date.now();
  syncBusy();
  return entry;
 }
 function lockButton(btn,loadingLabel=''){
  if(!btn)return ()=>{};
  const prevDisabled=btn.disabled,prevText=btn.textContent;
  btn.disabled=true;
  btn.setAttribute('aria-busy','true');
  if(btn.classList)btn.classList.add('is-loading');
  if(loadingLabel)btn.textContent=tt(loadingLabel);
  return ()=>{
   if(!btn.isConnected)return;
   btn.disabled=prevDisabled;
   btn.removeAttribute('aria-busy');
   if(btn.classList)btn.classList.remove('is-loading');
   if(loadingLabel)btn.textContent=prevText;
  };
 }
 function skeleton(label='Loading…',rows=3){
  const count=Math.max(1,Math.min(8,Number(rows)||3));
  return `<div class="p2-skeleton" role="status" aria-busy="true" aria-label="${esc(tt(label))}"><span class="sr-only">${esc(tt(label))}</span>${'<div class="p2-skeleton-line"></div>'.repeat(count)}</div>`;
 }
 function renderStatusUI(){
  const list=[...ops.values()].sort((a,b)=>b.updatedAt-a.updatedAt);
  const running=list.filter(o=>o.status===STATES.RUNNING||o.status===STATES.QUEUED);
  const uncertain=list.filter(o=>o.status===STATES.OUTCOME_UNKNOWN);
  const failed=list.filter(o=>o.status===STATES.FAILED);
  const btn=$('opsStatusBtn'),dot=$('opsStatusDot'),lbl=$('opsStatusLabel'),banner=$('operationBanner'),panel=$('operationCenterPanel');
  if(btn&&lbl){
   const tone=uncertain.length?'uncertain':running.length?'running':failed.length?'failed':'ready';
   if(btn.dataset)btn.dataset.opsTone=tone;
   if(dot?.dataset)dot.dataset.opsTone=tone;
   lbl.textContent=running.length?`${running.length} ${tt('running')}`:uncertain.length?`${uncertain.length} ${tt('Verify status')}`:failed.length?`${failed.length} ${tt('Failed')}`:tt('Operations ready');
  }
  if(banner){
   const activeBlocking=running.find(o=>o.level>=3);
   const latestUncertain=uncertain[0];
   if(activeBlocking){
    const elapsedSec=Math.floor((Date.now()-activeBlocking.startedAt)/1000);
    const slowHint=elapsedSec>=8?` · ${tt('Still working — waiting for Google Drive / Sheets…')}`:'';
    const progMarkup=activeBlocking.progress!==null?`<progress value="${activeBlocking.progress}" max="100">${activeBlocking.progress}%</progress> <span>${activeBlocking.progress}% (${esc(activeBlocking.unitLabel)})</span>`:'<span class="spinner spinner--inline" aria-hidden="true"></span>';
    banner.hidden=false;
    banner.className='operation-banner operation-banner--running';
    banner.setAttribute('role','status');
    banner.innerHTML=`<div class="operation-banner-inner">${progMarkup}<div><strong>${esc(tt(activeBlocking.label))}</strong>${activeBlocking.step?` · <span>${esc(tt(activeBlocking.step))}</span>`:''}${esc(slowHint)}</div></div>`;
   }else if(latestUncertain){
    banner.hidden=false;
    banner.className='operation-banner operation-banner--uncertain';
    banner.setAttribute('role','alert');
    banner.innerHTML=`<div class="operation-banner-inner"><strong>${esc(tt('OUTCOME UNKNOWN'))}: ${esc(tt(latestUncertain.label))}</strong><span>${esc(latestUncertain.error||tt('Save status is uncertain. Check the latest record before retrying; this form remains open.'))}</span><button type="button" class="quiet-button" id="dismissUncertainBanner">${esc(tt('Dismiss'))}</button></div>`;
    const dismiss=$('dismissUncertainBanner');if(dismiss)dismiss.onclick=()=>{ops.delete(latestUncertain.id);syncBusy();};
   }else{
    banner.hidden=true;banner.innerHTML='';
   }
  }
  if(panel&&!panel.hidden){
   panel.innerHTML=`<div class="ops-center-head"><h3>${esc(tt('Operation Status Center'))}</h3><div class="row"><button type="button" class="quiet-button" id="opsClearDone">${esc(tt('Clear finished'))}</button><button type="button" class="quiet-button" id="opsClosePanel">${esc(tt('Close'))}</button></div></div>`+(list.length?`<ul class="ops-center-list">${list.map(o=>`<li class="ops-item ops-item--${esc(o.status.toLowerCase())}" data-op-id="${esc(o.id)}" data-op-status="${esc(o.status)}"><div class="ops-item-main"><strong>${esc(tt(o.label))}</strong> <span class="status-pill">${esc(tt(o.status))}</span>${o.step?`<small>${esc(tt(o.step))}</small>`:''}${o.error?`<small class="ops-item-error" role="alert">${esc(o.error)}</small>`:''}</div>${o.progress!==null?`<div class="ops-item-progress"><progress value="${o.progress}" max="100">${o.progress}%</progress><small>${o.progress}% · ${esc(o.unitLabel)}</small></div>`:o.status===STATES.RUNNING?'<span class="spinner spinner--inline" aria-hidden="true"></span>':''}</li>`).join('')}</ul>`:`<p class="muted">${esc(tt('No recent background or write operations in this session.'))}</p>`);
   const clr=$('opsClearDone');if(clr)clr.onclick=()=>{clearCompleted();};
   const cls=$('opsClosePanel');if(cls)cls.onclick=()=>togglePanel(false);
  }
 }
 function togglePanel(force){
  panelOpen=typeof force==='boolean'?force:!panelOpen;
  const panel=$('operationCenterPanel'),btn=$('opsStatusBtn');
  if(panel)panel.hidden=!panelOpen;
  if(btn)btn.setAttribute('aria-expanded',String(panelOpen));
  renderStatusUI();
 }
 function clearCompleted(){
  for(const [k,v] of ops.entries())if([STATES.SUCCEEDED,STATES.CANCELLED].includes(v.status))ops.delete(k);
  syncBusy();
 }
 function reset(){ops.clear();panelOpen=false;busy=false;const p=$('operationCenterPanel');if(p)p.hidden=true;renderStatusUI();}
 return {STATES,start,update,succeed,fail,cancel,lockButton,skeleton,togglePanel,clearCompleted,reset,get:id=>ops.get(id)||null,list:()=>[...ops.values()],active:()=>[...ops.values()].filter(o=>o.status===STATES.RUNNING||o.status===STATES.QUEUED)};
})();
window.EudrOps=EudrOps;

/* P2-A: Context-Aware Navigation & Workspace State Manager */
const EudrNav=(()=>{
 const STORAGE_KEY='eudr_nav_state',MAX_HISTORY=50;
 const navHistory=[],navForward=[],viewerStack=[],orderContexts=new Map(),recentOrders=[];
 let formDirty=false,suppressPush=false,returnContext=null,restoringViewer=false;

 function captureState(overrides={}){
  const topViewer=viewerStack.at(-1)||null;
  return {
   view:view||'Dashboard',
   caseId:selected||'',
   productId:selectedProduct||'',
   materialId:material||'',
   sourceId:selectedSource||'',
   chainNodeId:selectedChainNode||'',
   workspaceTab:workspaceTab||'evidence',
   workspaceStep:workspaceStep||'order',
   viewer:topViewer?.type||'',
   documentId:topViewer?.type==='document'?topViewer.id:'',
   geoId:topViewer?.type==='geo'?topViewer.id:topViewer?.type==='reviewGeo'?topViewer.id:'',
   viewerPage:topViewer?.page||1,
   dashboardKpiFilter:dashboardKpiFilter||'',
   myTasksFilter:myTasksFilter||'',
   filterSnapshot:{...filter},
   scrollY:typeof window!=='undefined'?Number(window.scrollY||0):0,
   returnContext:returnContext?{...returnContext}:null,
   ...overrides
  };
 }
 function isSameState(a,b){
  if(!a||!b)return false;
  return a.view===b.view&&a.caseId===b.caseId&&a.productId===b.productId&&a.materialId===b.materialId&&a.sourceId===b.sourceId&&a.chainNodeId===b.chainNodeId&&a.workspaceTab===b.workspaceTab&&a.workspaceStep===b.workspaceStep&&a.viewer===b.viewer&&a.documentId===b.documentId&&a.geoId===b.geoId&&a.dashboardKpiFilter===b.dashboardKpiFilter&&a.myTasksFilter===b.myTasksFilter;
 }
 function saveOrderContext(caseId=selected){
  if(!caseId)return;
  orderContexts.set(caseId,{
   caseId,
   productId:selectedProduct||'',
   materialId:material||'',
   sourceId:selectedSource||'',
   chainNodeId:selectedChainNode||'',
   workspaceTab:workspaceTab||'evidence',
   workspaceStep:workspaceStep||'order'
  });
  const idx=recentOrders.indexOf(caseId);
  if(idx>=0)recentOrders.splice(idx,1);
  recentOrders.unshift(caseId);
  if(recentOrders.length>5)recentOrders.length=5;
 }
 function persist(){
  if(!sessionStorage.getItem('eudr_id_token')&&!state)return;
  try{
   const snap=captureState();
   const payload={
    current:{view:snap.view,caseId:snap.caseId,productId:snap.productId,materialId:snap.materialId,sourceId:snap.sourceId,chainNodeId:snap.chainNodeId,workspaceTab:snap.workspaceTab,workspaceStep:snap.workspaceStep,dashboardKpiFilter:snap.dashboardKpiFilter,myTasksFilter:snap.myTasksFilter,filterSnapshot:snap.filterSnapshot},
    recentOrders:[...recentOrders],
    orderContexts:[...orderContexts.entries()].slice(0,10)
   };
   sessionStorage.setItem(STORAGE_KEY,JSON.stringify(payload));
  }catch{}
 }
 function markDirty(dirty=true){formDirty=Boolean(dirty);}
 function isDirty(){return formDirty;}
 function canNavigateAway(){
  if(!formDirty)return true;
  if(typeof window!=='undefined'&&typeof window.confirm==='function'){
   const ok=window.confirm(tt('You have unsaved changes. Leave this view and discard changes?'));
   if(!ok)return false;
  }
  formDirty=false;
  return true;
 }
 function recordStep(snapshot=captureState()){
  if(suppressPush)return;
  const top=navHistory.at(-1);
  if(top&&isSameState(top,snapshot)){navHistory[navHistory.length-1]=snapshot;return;}
  navHistory.push(snapshot);
  if(navHistory.length>MAX_HISTORY)navHistory.shift();
  navForward.length=0;
 }
 function pushWorkspaceStep(nextStep,applyFn){
  const before=captureState();
  recordStep(before);
  applyFn?.();
  workspaceStep=nextStep;
  saveOrderContext(selected);
  persist();
 }
 async function restoreViewerState(snap){
  if(!snap?.viewer){
   viewerStack.length=0;
   if($('drawer')?.open)closeDrawer({fromHistory:true});
   updateNavChrome();
   return;
  }
  restoringViewer=true;
  try{
   if(snap.viewer==='geo'&&snap.geoId){
    viewerStack.length=0;
    viewerStack.push({type:'geo',id:snap.geoId,title:(state?.materials?.find(m=>m.id===snap.geoId)?.material||'')+' · '+tt('Plot map'),caseId:snap.caseId,productId:snap.productId,materialId:snap.materialId,sourceId:snap.sourceId,chainNodeId:snap.chainNodeId});
    await geoDialog(snap.geoId,{fromHistory:true});
   }else if(snap.viewer==='document'&&snap.documentId){
    await documentView(snap.documentId,snap.viewerPage||1,{fromHistory:true});
   }else if(snap.viewer==='reviewGeo'&&snap.geoId){
    reviewGeoDialog(snap.geoId,{fromHistory:true});
   }
  }finally{restoringViewer=false;updateNavChrome();}
 }
 async function applySnapshot(snap,{fromHistory=false}={}){
  if(!snap)return false;
  suppressPush=true;
  try{
   view=snap.view||'Dashboard';
   selected=snap.caseId||'';
   selectedProduct=snap.productId||'';
   material=snap.materialId||'';
   selectedSource=snap.sourceId||'';
   selectedChainNode=snap.chainNodeId||'';
   workspaceTab=snap.workspaceTab||'evidence';
   workspaceStep=snap.workspaceStep||'order';
   dashboardKpiFilter=snap.dashboardKpiFilter||'';
   myTasksFilter=snap.myTasksFilter||'';
   returnContext=snap.returnContext||null;
   if(snap.filterSnapshot)Object.keys(filter).forEach(k=>{filter[k]=snap.filterSnapshot[k]||'';});
   if(selected)saveOrderContext(selected);
   render();
   await restoreViewerState(snap);
   if(typeof window!=='undefined'&&typeof window.scrollTo==='function'&&Number.isFinite(snap.scrollY)){
    try{window.scrollTo(0,snap.scrollY);}catch{}
   }
   persist();
  }finally{suppressPush=false;}
  return true;
 }
 function navigate(target={},options={}){
  if(!options.skipDirtyCheck&&!canNavigateAway())return false;
  const current=captureState();
  const nextView=target.view||view;
  const nextCaseId=target.caseId!==undefined?target.caseId:(nextView==='Workspace'?selected:selected);
  let savedCtx=nextView==='Workspace'&&nextCaseId?orderContexts.get(nextCaseId):null;
  const nextSnap={
   ...current,
   view:nextView,
   caseId:nextCaseId||'',
   productId:target.productId!==undefined?target.productId:(savedCtx?.productId||''),
   materialId:target.materialId!==undefined?target.materialId:(savedCtx?.materialId||''),
   sourceId:target.sourceId!==undefined?target.sourceId:(savedCtx?.sourceId||''),
   chainNodeId:target.chainNodeId!==undefined?target.chainNodeId:(savedCtx?.chainNodeId||''),
   workspaceTab:target.workspaceTab!==undefined?target.workspaceTab:(savedCtx?.workspaceTab||'evidence'),
   workspaceStep:target.workspaceStep!==undefined?target.workspaceStep:(savedCtx?.workspaceStep||'order'),
   viewer:target.viewer!==undefined?target.viewer:'',
   documentId:target.documentId||'',
   geoId:target.geoId||'',
   viewerPage:target.viewerPage||1,
   dashboardKpiFilter:target.dashboardKpiFilter!==undefined?target.dashboardKpiFilter:'',
   myTasksFilter:target.myTasksFilter!==undefined?target.myTasksFilter:'',
   returnContext:target.returnContext!==undefined?target.returnContext:returnContext
  };
  if(!options.replace&&!isSameState(current,nextSnap))recordStep(current);
  viewerStack.length=0;
  if($('drawer')?.open&&!nextSnap.viewer)closeDrawer({fromHistory:true});
  view=nextSnap.view;
  selected=nextSnap.caseId;
  selectedProduct=nextSnap.productId;
  material=nextSnap.materialId;
  selectedSource=nextSnap.sourceId;
  selectedChainNode=nextSnap.chainNodeId;
  workspaceTab=nextSnap.workspaceTab;
  workspaceStep=nextSnap.workspaceStep;
  dashboardKpiFilter=nextSnap.dashboardKpiFilter;
  myTasksFilter=nextSnap.myTasksFilter;
  returnContext=nextSnap.returnContext;
  if(target.filterSnapshot)Object.keys(filter).forEach(k=>{filter[k]=target.filterSnapshot[k]||'';});
  if(view==='Workspace'&&selected)saveOrderContext(selected);
  persist();
  render();
  return true;
 }
 function openViewer(type,id,meta={}){
  if(restoringViewer)return;
  const current=captureState();
  const nextViewer={type,id:id||'',page:meta.page||1,title:meta.title||type,caseId:selected,productId:selectedProduct,materialId:material,sourceId:selectedSource,chainNodeId:selectedChainNode};
  const top=viewerStack.at(-1);
  if(!top||top.type!==type||top.id!==id){
   recordStep(current);
   viewerStack.push(nextViewer);
  }else{
   viewerStack[viewerStack.length-1]={...top,...nextViewer};
  }
  persist();
  updateNavChrome();
 }
 function updateViewerPage(docId,page){
  const top=viewerStack.at(-1);
  if(top&&top.type==='document'&&top.id===docId)top.page=page;
 }
 async function closeViewer({fromCloseButton=false}={}){
  if(fromCloseButton&&!canNavigateAway())return false;
  formDirty=false;
  if(fromCloseButton&&viewerStack.length>1){
   const closed=viewerStack.pop();
   while(navHistory.length&&navHistory.at(-1).viewer===closed.type&&(navHistory.at(-1).documentId===closed.id||navHistory.at(-1).geoId===closed.id)){
    navHistory.pop();
   }
   const parent=viewerStack.at(-1);
   if(parent){
    if(navHistory.length&&navHistory.at(-1).viewer===parent.type)navHistory.pop();
    await restoreViewerState({
     ...captureState(),
     viewer:parent.type,
     documentId:parent.type==='document'?parent.id:'',
     geoId:parent.type==='geo'||parent.type==='reviewGeo'?parent.id:'',
     viewerPage:parent.page||1
    });
    return true;
   }
  }
  viewerStack.length=0;
  while(navHistory.length&&navHistory.at(-1).viewer){
   navHistory.pop();
  }
  closeDrawer({fromHistory:true});
  updateNavChrome();
  return true;
 }
 async function back(){
  if(!canNavigateAway())return false;
  if(!navHistory.length)return false;
  const current=captureState();
  const prev=navHistory.pop();
  navForward.push(current);
  if(prev.viewer){
   const idx=viewerStack.findIndex(v=>v.type===prev.viewer&&v.id===(prev.documentId||prev.geoId));
   if(idx>=0)viewerStack.length=idx+1;
   else viewerStack.push({type:prev.viewer,id:prev.documentId||prev.geoId,page:prev.viewerPage||1,caseId:prev.caseId,productId:prev.productId,materialId:prev.materialId,sourceId:prev.sourceId,chainNodeId:prev.chainNodeId});
  }else{
   viewerStack.length=0;
  }
  await applySnapshot(prev,{fromHistory:true});
  return true;
 }
 async function forward(){
  if(!canNavigateAway())return false;
  if(!navForward.length)return false;
  const current=captureState();
  const next=navForward.pop();
  navHistory.push(current);
  if(next.viewer){
   viewerStack.push({type:next.viewer,id:next.documentId||next.geoId,page:next.viewerPage||1,caseId:next.caseId,productId:next.productId,materialId:next.materialId,sourceId:next.sourceId,chainNodeId:next.chainNodeId});
  }else{
   viewerStack.length=0;
  }
  await applySnapshot(next,{fromHistory:true});
  return true;
 }
 function backToOrder(orderId=''){
  const targetId=orderId||selected||recentOrders.find(id=>state?.cases?.some(c=>c.id===id))||'';
  if(!targetId||!state?.cases?.some(c=>c.id===targetId))return false;
  const saved=orderContexts.get(targetId)||{};
  return navigate({
   view:'Workspace',
   caseId:targetId,
   productId:saved.productId||selectedProduct||'',
   materialId:saved.materialId||material||'',
   sourceId:saved.sourceId||selectedSource||'',
   chainNodeId:saved.chainNodeId||selectedChainNode||'',
   workspaceTab:saved.workspaceTab||workspaceTab||'evidence',
   workspaceStep:saved.workspaceStep||workspaceStep||'order',
   viewer:''
  });
 }
 function openKpiTarget(kpiKey){
  if(kpiKey==='ACTIVE_ORDERS'){
   return navigate({view:'Orders',dashboardKpiFilter:'ACTIVE_ORDERS',returnContext:{view:'Dashboard',kpi:kpiKey}});
  }
  return navigate({view:'My Tasks',myTasksFilter:kpiKey,returnContext:{view:'Dashboard',kpi:kpiKey}});
 }
 function breadcrumbs(){
  if(!state)return [];
  const items=[];
  if(view==='Workspace'){
   const c=state.cases?.find(x=>x.id===selected);
   items.push({label:tt('Orders'),view:'Orders',action:()=>navigate({view:'Orders',viewer:''})});
   if(c){
    items.push({label:c.so,view:'Workspace',caseId:c.id,step:'order',action:()=>navigate({view:'Workspace',caseId:c.id,productId:selectedProduct,materialId:material,sourceId:selectedSource,chainNodeId:'',workspaceStep:'order',viewer:''})});
    const prod=(state.products||[]).find(p=>p.id===selectedProduct&&p.case_id===c.id);
    if(prod&&['product','material','source','chain'].includes(workspaceStep)){
     items.push({label:prod.product_name,step:'product',action:()=>navigate({view:'Workspace',caseId:c.id,productId:prod.id,materialId:material,sourceId:selectedSource,chainNodeId:'',workspaceStep:'product',viewer:''})});
    }
    const mat=(state.materials||[]).find(m=>m.id===material&&m.case_id===c.id);
    if(mat&&(workspaceStep==='material'||workspaceStep==='source'||workspaceStep==='chain'||viewerStack.length>0||Boolean(material))){
     items.push({label:mat.material,step:'material',action:()=>navigate({view:'Workspace',caseId:c.id,productId:selectedProduct,materialId:mat.id,sourceId:selectedSource,chainNodeId:'',workspaceStep:'material',viewer:''})});
    }
    const src=(state.trace?.sources||[]).find(s=>s.id===selectedSource&&s.material_id===material);
    if(src&&(workspaceStep==='source'||workspaceStep==='chain'||viewerStack.length>0||Boolean(selectedSource))){
     items.push({label:src.supplier_po||src.lot_no||tt('Selected source'),step:'source',action:()=>navigate({view:'Workspace',caseId:c.id,productId:selectedProduct,materialId:material,sourceId:src.id,chainNodeId:'',workspaceStep:'source',viewer:''})});
    }
    const node=(state.chain||[]).find(n=>n.id===selectedChainNode&&n.material_id===material);
    if(node){
     items.push({label:node.display_name||node.id,step:'chain',action:()=>navigate({view:'Workspace',caseId:c.id,productId:selectedProduct,materialId:material,sourceId:selectedSource,chainNodeId:node.id,workspaceStep:'chain',viewer:''})});
    }
   }
  }else{
   if(returnContext?.view==='Dashboard'&&(dashboardKpiFilter||myTasksFilter)){
    items.push({label:tt('Dashboard'),view:'Dashboard',action:()=>navigate({view:'Dashboard',dashboardKpiFilter:'',myTasksFilter:''})});
   }
   items.push({label:tt(view),view,action:()=>navigate({view,viewer:''})});
  }
  viewerStack.forEach((v,idx)=>{
   const label=v.type==='geo'?tt('GeoJSON Map'):v.type==='document'?(state?.docs?.find(d=>d.id===v.id)?.name||tt('Document preview')):v.title||v.type;
   items.push({
    label,
    viewer:v.type,
    viewerId:v.id,
    action:async()=>{
     if(idx===viewerStack.length-1)return;
     viewerStack.length=idx+1;
     await restoreViewerState({
      ...captureState(),
      viewer:v.type,
      documentId:v.type==='document'?v.id:'',
      geoId:v.type==='geo'||v.type==='reviewGeo'?v.id:'',
      viewerPage:v.page||1
     });
    }
   });
  });
  return items;
 }
 function updateNavChrome(){
  const backBtn=$('navBackBtn'),fwdBtn=$('navForwardBtn'),backOrderBtn=$('backToOrderBtn'),bar=$('breadcrumbBar'),drawerBar=$('drawerNavBar'),sideCtx=$('sidebarOrderContext');
  if(backBtn){
   backBtn.disabled=navHistory.length===0;
   backBtn.onclick=()=>back();
  }
  if(fwdBtn){
   fwdBtn.disabled=navForward.length===0;
   fwdBtn.onclick=()=>forward();
  }
  const activeOrderId=(selected&&state?.cases?.some(c=>c.id===selected))?selected:(recentOrders.find(id=>state?.cases?.some(c=>c.id===id))||'');
  const activeOrder=activeOrderId?state?.cases?.find(c=>c.id===activeOrderId):null;
  if(backOrderBtn){
   if(activeOrder&&(view!=='Workspace'||viewerStack.length>0)){
    backOrderBtn.hidden=false;
    backOrderBtn.textContent=`← ${tt('Back to')} ${activeOrder.so}`;
    backOrderBtn.onclick=()=>backToOrder(activeOrder.id);
   }else{
    backOrderBtn.hidden=true;
   }
  }
  if(sideCtx){
   if(state&&activeOrder){
    const saved=orderContexts.get(activeOrder.id)||{};
    const matName=state.materials?.find(m=>m.id===(saved.materialId||material)&&m.case_id===activeOrder.id)?.material||'';
    sideCtx.hidden=false;
    sideCtx.innerHTML=`<div class="sidebar-active-card"><span class="sidebar-active-eyebrow">${esc(tt('Active order context'))}</span><strong class="sidebar-active-so">${esc(activeOrder.so)}</strong>${matName?`<small class="sidebar-active-sub">${esc(matName)}</small>`:''}<button type="button" id="sidebarQuickReturnBtn" class="sidebar-quick-return" data-nav-recent-order="${esc(activeOrder.id)}">${esc(tt(view==='Workspace'&&selected===activeOrder.id&&!viewerStack.length?'Active in workspace':'Return to order →'))}</button></div>`;
    const qBtn=$('sidebarQuickReturnBtn');if(qBtn)qBtn.onclick=()=>backToOrder(activeOrder.id);
   }else{
    sideCtx.hidden=true;sideCtx.innerHTML='';
   }
  }
  if(bar){
   if(!state){bar.innerHTML='';}
   else{
    const crumbs=breadcrumbs();
    bar.innerHTML=crumbs.map((c,i)=>`${i>0?'<span class="breadcrumb-sep" aria-hidden="true">/</span>':''}<button type="button" class="breadcrumb-item${i===crumbs.length-1?' is-current':''}" data-breadcrumb-index="${i}" ${i===crumbs.length-1?'aria-current="location"':''}>${esc(c.label)}</button>`).join('');
    bar.querySelectorAll('[data-breadcrumb-index]').forEach(b=>{
     b.onclick=()=>{const idx=Number(b.dataset.breadcrumbIndex);crumbs[idx]?.action?.();};
    });
   }
  }
  if(drawerBar){
   if(viewerStack.length>1){
    const prev=viewerStack[viewerStack.length-2];
    const prevLabel=prev.type==='geo'?tt('GeoJSON Map'):prev.title||tt('Previous view');
    drawerBar.innerHTML=`<button type="button" id="drawerBackBtn" class="quiet-button drawer-back-btn">← ${esc(tt('Back to'))} ${esc(prevLabel)}</button>`;
    const dBack=$('drawerBackBtn');if(dBack)dBack.onclick=()=>back();
   }else if(viewerStack.length===1&&selected){
    const c=state?.cases?.find(x=>x.id===selected);
    const mat=state?.materials?.find(m=>m.id===material&&m.case_id===selected);
    const originLabel=mat?`${c?.so||''} · ${mat.material}`:(c?.so||tt('Order workspace'));
    drawerBar.innerHTML=`<button type="button" id="drawerBackBtn" class="quiet-button drawer-back-btn">← ${esc(tt('Back to'))} ${esc(originLabel)}</button>`;
    const dBack=$('drawerBackBtn');if(dBack)dBack.onclick=()=>back();
   }else{
    drawerBar.innerHTML='';
   }
  }
 }
 function revalidateAndRestore(){
  if(!state)return {revoked:false};
  let revoked=false;
  try{
   const raw=sessionStorage.getItem(STORAGE_KEY);
   if(raw){
    const parsed=JSON.parse(raw);
    if(Array.isArray(parsed.orderContexts)){
     for(const [cid,ctx] of parsed.orderContexts){
      if(state.cases?.some(c=>c.id===cid))orderContexts.set(cid,ctx);
     }
    }
    if(Array.isArray(parsed.recentOrders)){
     recentOrders.length=0;
     parsed.recentOrders.filter(cid=>state.cases?.some(c=>c.id===cid)).forEach(cid=>recentOrders.push(cid));
    }
    if(parsed.current&&!selected&&view==='Dashboard'){
     const cur=parsed.current;
     if(cur.caseId&&!state.cases?.some(c=>c.id===cur.caseId)){
      revoked=true;
     }else{
      if(cur.view)view=cur.view;
      if(cur.caseId)selected=cur.caseId;
      if(cur.productId)selectedProduct=cur.productId;
      if(cur.materialId)material=cur.materialId;
      if(cur.sourceId)selectedSource=cur.sourceId;
      if(cur.chainNodeId)selectedChainNode=cur.chainNodeId;
      if(cur.workspaceTab)workspaceTab=cur.workspaceTab;
      if(cur.workspaceStep)workspaceStep=cur.workspaceStep;
     }
    }
   }
  }catch{}
  const params=new URLSearchParams(String(location.hash||'').slice(1));
  const hashCase=params.get('case')||params.get('caseId');
  if(hashCase){
   if(state.cases?.some(c=>c.id===hashCase)){
    selected=hashCase;
    view=params.get('view')||'Workspace';
    if(params.get('product')||params.get('productId'))selectedProduct=params.get('product')||params.get('productId');
    if(params.get('material')||params.get('materialId'))material=params.get('material')||params.get('materialId');
    if(params.get('source')||params.get('sourceId'))selectedSource=params.get('source')||params.get('sourceId');
    if(params.get('node')||params.get('chainNodeId'))selectedChainNode=params.get('node')||params.get('chainNodeId');
    if(params.get('tab')||params.get('workspaceTab'))workspaceTab=params.get('tab')||params.get('workspaceTab');
   }else{
    revoked=true;
    selected='';selectedProduct='';material='';selectedSource='';selectedChainNode='';
    view=supplier()?'My Tasks':'Orders';
   }
  }
  if(selected&&!state.cases?.some(c=>c.id===selected)){
   revoked=true;
   selected='';selectedProduct='';material='';selectedSource='';selectedChainNode='';
   view=supplier()?'My Tasks':'Orders';
  }
  if(selected){
   if(selectedProduct&&!(state.products||[]).some(p=>p.id===selectedProduct&&p.case_id===selected))selectedProduct='';
   if(material&&!(state.materials||[]).some(m=>m.id===material&&m.case_id===selected&&m.active!=='NO')){material='';selectedSource='';selectedChainNode='';}
   if(selectedSource&&!(state.trace?.sources||[]).some(s=>s.id===selectedSource&&s.material_id===material))selectedSource='';
   if(selectedChainNode&&!(state.chain||[]).some(n=>n.id===selectedChainNode&&n.material_id===material))selectedChainNode='';
   saveOrderContext(selected);
  }
  persist();
  if(revoked){
   if($('msg'))$('msg').textContent=tt('Access to the previously selected record is no longer available.');
  }
  return {revoked};
 }
 function reset(clearStorage=false){
  navHistory.length=0;navForward.length=0;viewerStack.length=0;orderContexts.clear();recentOrders.length=0;
  formDirty=false;returnContext=null;dashboardKpiFilter='';myTasksFilter='';
  if(clearStorage)sessionStorage.removeItem(STORAGE_KEY);
  updateNavChrome();
 }
 return {
  captureState,navigate,pushWorkspaceStep,openViewer,updateViewerPage,closeViewer,
  back,forward,backToOrder,openKpiTarget,breadcrumbs,updateNavChrome,revalidateAndRestore,
  restoreFromUrlOrSession:revalidateAndRestore,revalidateAccess:revalidateAndRestore,
  markDirty,isDirty,canNavigateAway,reset,
  currentViewer:()=>viewerStack.at(-1)||null,
  canBack:()=>navHistory.length>0,
  canForward:()=>navForward.length>0,
  canGoBack:()=>navHistory.length>0,
  canGoForward:()=>navForward.length>0,
  getHistory:()=>[...navHistory],
  getForward:()=>[...navForward],
  getViewerStack:()=>[...viewerStack],
  getOrderContext:id=>orderContexts.get(id)||null,
  getRecentOrders:()=>[...recentOrders]
 };
})();
window.EudrNav=EudrNav;

async function call(action,...args){const fingerprint=JSON.stringify({action,args}),requestKey=retryKeys.get(fingerprint)||crypto.randomUUID();retryKeys.set(fingerprint,requestKey);
 let response;try{response=await fetch('/api/call',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+await authToken()},body:JSON.stringify({action,args,requestKey})});}catch{const e=Error('Connection failed');e.code='NETWORK_ERROR';e.status=502;throw e;}
 let result;try{result=await response.json();}catch{const e=Error('Invalid server response');e.code='UPSTREAM_FORMAT';e.status=response.status||502;throw e;}
 if(!response.ok||!result.ok){const e=Error(result.error?.message||result.error||'Request failed');e.status=response.status;e.code=result.error?.code;e.requestId=result.requestId;if(response.status<500)retryKeys.delete(fingerprint);throw e;}retryKeys.delete(fingerprint);return result.data;
}
function signIn(message=''){
 window.EudrWorkspaceChat?.stop?.(); window.EudrIntelligence?.stop?.();
 state=null;verificationPending=false;$('identity').textContent='';$('pageTitle').textContent=tt('Secure access');$('logout').hidden=true;$('nav').replaceChildren();$('msg').textContent=message;EudrNav.updateNavChrome();
 $('main').innerHTML='<div class="card login"><p class="eyebrow">KODA EUDR WORKSPACE</p><h2>Your evidence workspace</h2><p>Structured evidence for traceable and accountable review</p><form id="loginForm"><label>Username / Email<input id="loginEmail" type="email" autocomplete="username" required></label><label>Password<input id="loginPassword" type="password" autocomplete="current-password" required></label><button>Sign In</button></form><button class="quiet-button" id="forgotPassword" type="button">Forgot Password?</button><small class="muted">Access follows your assigned orders and role.</small></div>';
 $('loginForm').onsubmit=async e=>{e.preventDefault();const button=e.submitter;button.disabled=true;$('msg').textContent='';try{const result=await firebaseRequest('signInWithPassword',{email:$('loginEmail').value.trim(),password:$('loginPassword').value,returnSecureToken:true});saveAuth(result);$('loginPassword').value='';const account=await firebaseRequest('lookup',{idToken:await authToken()}),user=account.users?.[0];if(!user||user.localId!==result.localId)throw Error('AUTH_FAILED');if(user.emailVerified!==true){emailVerification(user.email||result.email);return;}await call('recordLogin');await load();}catch(error){if(error.code==='AUTH_EMAIL_UNVERIFIED'){emailVerification();$('msg').textContent=errorLabel(error);}else{clearAuth();$('msg').textContent=errorLabel(error);}}finally{button.disabled=false;}};
 $('forgotPassword').onclick=async()=>{const email=$('loginEmail').value.trim();if(!email){$('loginEmail').focus();return;}try{await firebaseRequest('sendOobCode',{requestType:'PASSWORD_RESET',email});}catch{}$('msg').textContent=tt('If this account exists, a password reset message will be sent.');};
 i18n.translateUI($('main'));
}
function emailVerification(email=verificationEmail){
 verificationPending=true;verificationEmail=email||'';state=null;
 $('identity').textContent='';$('pageTitle').textContent=tt('Verify your email');$('logout').hidden=true;$('nav').replaceChildren();$('msg').textContent='';EudrNav.updateNavChrome();
 $('main').innerHTML='<div class="card login"><p class="eyebrow">KODA EUDR WORKSPACE</p><h2>Verify your email</h2><p>Your password was accepted. Verify your email before opening the workspace.</p><p>'+esc(verificationEmail)+'</p><button id="sendVerification" type="button">Send verification email</button><button id="checkVerification" type="button">I have verified my email</button><button id="verificationBack" class="quiet-button" type="button">Back to sign in</button></div>';
 $('sendVerification').onclick=async()=>{const button=$('sendVerification');button.disabled=true;try{await firebaseRequest('sendOobCode',{requestType:'VERIFY_EMAIL',idToken:await authToken()});$('msg').textContent=tt('Verification email sent. Open the link in your inbox, then return here.');}catch{ $('msg').textContent=tt('Could not send the verification email. Try again or sign in again.');}finally{button.disabled=false;}};
 $('checkVerification').onclick=async()=>{const button=$('checkVerification');button.disabled=true;try{const account=await firebaseRequest('lookup',{idToken:await authToken()}),user=account.users?.[0];if(!user||user.emailVerified!==true){$('msg').textContent=tt('Your email is not verified yet. Open the verification link first.');return;}if(!await authToken(true))throw Error('AUTH_REQUIRED');await call('recordLogin');verificationPending=false;verificationEmail='';await load();}catch(error){$('msg').textContent=errorLabel(error);}finally{button.disabled=false;}};
 $('verificationBack').onclick=()=>{const email=verificationEmail;clearAuth();signIn();$('loginEmail').value=email;};
 i18n.translateUI($('main'));
}
function changePassword(){const email=state.user.email;$('nav').replaceChildren();$('pageTitle').textContent=tt('Change Your Password');$('main').innerHTML='<div class="card login"><h2>Change Your Password</h2><p>At least 12 characters.</p><form id="passwordForm"><label>New password<input name="newPassword" type="password" minlength="12" autocomplete="new-password" required></label><label>Confirm new password<input name="confirmPassword" type="password" minlength="12" autocomplete="new-password" required></label><button>Change password</button></form></div>';$('passwordForm').onsubmit=async e=>{e.preventDefault();const form=e.target,newPassword=form.elements.newPassword.value;if(newPassword!==form.elements.confirmPassword.value){$('msg').textContent=tt('Passwords do not match.');return;}form.querySelector('button').disabled=true;try{await authAction({action:'changePassword',password:newPassword});clearAuth();signIn(tt('Password changed. Sign in with your new password.'));$('loginEmail').value=email;}catch(error){$('msg').textContent=errorLabel(error);form.querySelector('button').disabled=false;}};i18n.translateUI($('main'));}
async function load(){if(!sessionStorage.getItem('eudr_id_token'))return signIn();if(verificationPending)return emailVerification();try{state=await call('bootstrap');$('identity').textContent=state.user.name+' · '+(state.user.role||'');$('logout').hidden=false;if(state.authRequiredPasswordChange)return changePassword();EudrNav.revalidateAndRestore();const taskId=new URLSearchParams(location.hash.slice(1)).get('task');if(taskId){const t=state.tasks.find(t=>t.id===taskId);if(t){selected=t.case_id;if(t.material_id)material=t.material_id;if(t.source_id)selectedSource=t.source_id;if(t.chain_node_id)selectedChainNode=t.chain_node_id;view='Workspace';}}render();}catch(e){if(e.code==='AUTH_EMAIL_UNVERIFIED')return emailVerification();if(e.status===401||e.code==='AUTH_REQUIRED'){clearAuth();signIn(errorLabel(e));}else $('main').textContent=errorLabel(e);}}
async function act(action,...args){if(busy)return;const opId=EudrOps.start({action,label:`Saving ${action.replace(/([A-Z])/g,' $1').toLowerCase()}`,level:3,step:'Saving…'});$('msg').textContent='Saving…';const buttons=[...document.querySelectorAll('button')].map(b=>[b,b.disabled]);buttons.forEach(([b])=>b.disabled=true);try{const result=await call(action,...args);EudrNav.markDirty(false);EudrOps.succeed(opId,'Saved.');closeDrawer();await load();$('msg').textContent=result?.calendar?.status==='MANUAL_SYNC_REQUIRED'?tt('Saved. Calendar is in manual mode; use Sync task invitations to send new invitations.'):result?.calendar&&!['SYNCED','NOT_SCHEDULED'].includes(result.calendar.status)?'Saved. Calendar synchronization needs review: '+result.calendar.status:'Saved.';return result;}catch(e){const uncertain=e.status>=500||['UPSTREAM_TIMEOUT','NETWORK_ERROR'].includes(e.code);EudrOps.fail(opId,e,{uncertain});$('msg').textContent=errorLabel(e)+(uncertain?' · '+tt('Save status is uncertain. Check the latest record before retrying; this form remains open.'):'');}finally{busy=false;buttons.forEach(([b,disabled])=>{if(b.isConnected)b.disabled=disabled;});}}
function go(v,id=''){
 const isOrderSwitch=Boolean(id&&id!==selected);
 const saved=id?EudrNav.getOrderContext(id):null;
 EudrNav.navigate({
  view:v,
  caseId:id||selected,
  productId:isOrderSwitch?(saved?.productId||''):selectedProduct,
  materialId:isOrderSwitch?(saved?.materialId||''):material,
  sourceId:isOrderSwitch?(saved?.sourceId||''):selectedSource,
  chainNodeId:isOrderSwitch?(saved?.chainNodeId||''):selectedChainNode,
  workspaceTab:isOrderSwitch?(saved?.workspaceTab||'evidence'):workspaceTab,
  workspaceStep:isOrderSwitch?(saved?.workspaceStep||'order'):(v==='Workspace'?workspaceStep:'order'),
  dashboardKpiFilter:v==='Orders'?dashboardKpiFilter:'',
  myTasksFilter:v==='My Tasks'?myTasksFilter:''
 });
}
function clearDocumentPreview(){window.EudrGeo?.close?.();pdfPreviewAbort?.abort();pdfPreviewAbort=null;pdfPreviewCleanup?.();pdfPreviewCleanup=null;if(documentUrl){URL.revokeObjectURL(documentUrl);documentUrl='';}}
function closeDrawer(opts={}){clearDocumentPreview();if(!opts.fromHistory)EudrNav.markDirty(false);$('drawer').close();}
function drawer(html){closeDrawer({fromHistory:true});$('drawerContent').innerHTML=html;$('drawer').showModal();bindDirtyTracking($('drawerContent'));EudrNav.updateNavChrome();i18n.translateUI($('drawer'));}
function bindDirtyTracking(root){
 if(!root?.querySelectorAll)return;
 root.querySelectorAll('form').forEach(f=>{
  if(f.id==='loginForm'||f.classList?.contains('filters'))return;
  f.addEventListener?.('input',()=>EudrNav.markDirty(true));
  f.addEventListener?.('change',()=>EudrNav.markDirty(true));
  f.addEventListener?.('submit',()=>EudrNav.markDirty(false));
 });
}
$('closeDrawer').onclick=()=>{EudrNav.closeViewer({fromCloseButton:true});};
$('drawer').addEventListener('close',()=>{if(!$('drawer').open)clearDocumentPreview();});
$('logout').onclick=()=>{clearAuth();retryKeys.clear();closeDrawer();signIn();};
$('language').onchange=e=>{i18n.setLanguage(e.target.value);if(verificationPending)emailVerification();else if(state?.authRequiredPasswordChange)changePassword();else if(state)render();else signIn();};
if($('opsStatusBtn'))$('opsStatusBtn').onclick=()=>EudrOps.togglePanel();
if($('sidebarCollapseBtn'))$('sidebarCollapseBtn').onclick=()=>{
 const shell=$('appShell')||document.querySelector('.app-shell');
 if(!shell)return;
 const collapsed=shell.classList.toggle('sidebar-collapsed');
 $('sidebarCollapseBtn').setAttribute('aria-expanded',String(!collapsed));
 $('sidebarCollapseBtn').textContent=collapsed?'▸':'◂';
 try{if(typeof localStorage!=='undefined')localStorage.setItem('eudr_sidebar_collapsed',collapsed?'1':'0');}catch{}
};
if($('mobileMenuBtn'))$('mobileMenuBtn').onclick=()=>{
 const sb=$('sidebar')||document.querySelector('.sidebar');
 if(!sb)return;
 const open=sb.classList.toggle('mobile-open');
 $('mobileMenuBtn').setAttribute('aria-expanded',String(open));
};
if(typeof window!=='undefined'&&window.addEventListener){
 window.addEventListener('popstate',()=>{if(state&&EudrNav.canBack())EudrNav.back();});
}
function button(label,action,id='',disabled=false){return `<button data-action="${action}" data-id="${esc(id)}" ${disabled?'disabled':''}>${esc(label)}</button>`;}
function field(name,label,type='text',value='',required=false){return `<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(value)}" ${required?'required':''} maxlength="2000"></label>`;}
function select(name,label,options,value=''){return `<label>${esc(label)}<select name="${name}">${options.map(o=>{const [v,l]=Array.isArray(o)?o:[o,o];return `<option value="${esc(v)}" ${v===value?'selected':''}>${esc(l)}</option>`;}).join('')}</select></label>`;}
function render(){
 if(view!=='Workspace')window.EudrWorkspaceChat?.stop?.(); window.EudrIntelligence?.stop?.();
 let tabs=supplier()?['Orders','My Tasks','Calendar']:['Dashboard','Orders','My Tasks','Calendar'];
 if(!supplier()&&!roles('VIEWER'))tabs.push('AI Assistant');
 if(cap('EXPORT'))tabs.push('Export');
 if(!supplier())tabs.push('Audit Trail');
 if(cap('SUPPLIER_EDIT'))tabs.push('Suppliers');if(roles('ADMIN'))tabs.push('Users','Settings');
 if(supplier()&&!['Workspace',...tabs].includes(view))view='My Tasks';
 $('pageTitle').textContent=tt(view==='Workspace'?'Order workspace':view);
 if($('defaultSidebarSection'))$('defaultSidebarSection').hidden=true;
 const navShort={Dashboard:'DB',Orders:'SO','My Tasks':'TK',Calendar:'CL',Suppliers:'SP','AI Assistant':'AI',Export:'EX','Audit Trail':'AU',Users:'US',Settings:'ST'};
 const groups=[
  {label:'OPERATIONS',items:['Dashboard','Orders','My Tasks','Calendar'].filter(t=>tabs.includes(t))},
  {label:'EUDR MANAGEMENT',items:['Suppliers','AI Assistant','Export'].filter(t=>tabs.includes(t))},
  {label:'ADMINISTRATION',items:['Audit Trail','Users','Settings'].filter(t=>tabs.includes(t))}
 ].filter(g=>g.items.length>0);
 $('nav').innerHTML=groups.map(g=>`<div class="nav-group" role="group" aria-label="${esc(tt(g.label))}"><div class="sidebar-section" data-i18n="${esc(g.label)}">${esc(tt(g.label))}</div>${g.items.map(t=>`<button data-view="${t}" data-short="${navShort[t]||t.slice(0,2).toUpperCase()}" class="${view===t||(view==='Workspace'&&t==='Orders')?'active':''}" ${view===t?'aria-current="page"':''} title="${esc(tt(t))}"><span class="nav-label" data-i18n="${esc(t)}">${esc(tt(t))}</span></button>`).join('')}</div>`).join('');
 $('nav').querySelectorAll('button').forEach(b=>b.onclick=()=>{
  const sb=$('sidebar')||document.querySelector('.sidebar');
  if(sb?.classList?.contains('mobile-open')){sb.classList.remove('mobile-open');$('mobileMenuBtn')?.setAttribute('aria-expanded','false');}
  if(b.dataset.view==='Orders')dashboardKpiFilter='';
  if(b.dataset.view==='My Tasks')myTasksFilter='';
  go(b.dataset.view);
 });
 const screens={Dashboard:dashboard,Orders:orders,'My Tasks':myTasks,Calendar:calendar,'AI Assistant':promptStudio,Export:exports,'Audit Trail':audit,Workspace:workspace,Users:users,Suppliers:suppliers,Settings:settings};
 $('main').classList.toggle('my-tasks-screen',view==='My Tasks');
 (screens[view]||orders)();bind();bindDirtyTracking($('main'));EudrNav.updateNavChrome();EudrOps.togglePanel(false);i18n.translateUI(document);
}
function orderProductNames(c){const names=(state.products||[]).filter(p=>p.case_id===c.id&&p.active==='YES').sort((a,b)=>Number(a.sequence||0)-Number(b.sequence||0)).map(p=>p.product_name).filter(Boolean);return names.join(', ')||c.product||c.customer||'—';}
function isRequiredTask(t){return Boolean(t&&t.active!=='NO'&&t.required!=='NO'&&t.override_state!=='NOT_REQUIRED'&&t.override_state!=='OPTIONAL');}
function filtered(){return state.cases.filter(c=>{
 if(dashboardKpiFilter==='ACTIVE_ORDERS'&&c.status==='CLOSED')return false;
 const mats=state.materials.filter(m=>m.case_id===c.id),tasks=state.tasks.filter(t=>t.case_id===c.id),docs=state.docs.filter(d=>d.case_id===c.id),supIds=new Set(tasks.map(t=>t.supplier_id)),supNames=state.suppliers.filter(s=>supIds.has(s.id)).map(s=>s.name),geos=state.geo.filter(g=>g.case_id===c.id);
 const search=[c.so,c.customer,c.product,orderProductNames(c),...mats.map(m=>m.material),...supNames,...docs.map(d=>d.name),...tasks.map(t=>t.assigned_reviewer)].join(' ').toLowerCase();return (!filter.q||search.includes(filter.q.toLowerCase()))&&(!filter.status||c.status===filter.status)&&(!filter.supplier||supIds.has(filter.supplier))&&(!filter.owner||tasks.some(t=>t.owner===filter.owner)||c.owner===filter.owner)&&(!filter.material||mats.some(m=>m.material===filter.material))&&(!filter.block||tasks.some(t=>t.evidence_block===filter.block))&&(!filter.geo||geos.some(g=>g.verification_status===filter.geo))&&(!filter.from||String(c.created_at).slice(0,10)>=filter.from)&&(!filter.to||String(c.created_at).slice(0,10)<=filter.to)&&(!filter.due||filter.due==='OVERDUE'&&c.due&&c.due<today()||filter.due==='DUE_TODAY'&&c.due===today());});}
function filters(){return `<div class="card filters"><label>Global search<input id="f-q" value="${esc(filter.q)}" placeholder="Order, product, supplier, material, document, reviewer"></label>${select('f-status','Stage',[['','All'],...new Set(state.cases.map(c=>c.status))],filter.status)}${select('f-supplier','Supplier',[['','All'],...state.suppliers.filter(s=>s.active==='YES'&&!s.merged_into_id&&s.identity_status!=='MERGED').map(s=>[s.id,s.name])],filter.supplier)}${select('f-owner','Assigned user',[['','All'],...new Set(state.tasks.map(t=>t.owner).filter(Boolean))],filter.owner)}${select('f-material','Material',[['','All'],...new Set(state.materials.map(m=>m.material))],filter.material)}${select('f-block','Evidence block',[['','All'],...new Set(state.tasks.map(t=>t.evidence_block).filter(Boolean))],filter.block)}${select('f-geo','GEO status',[['','All'],'REVIEW_REQUIRED','VERIFIED','REJECTED'],filter.geo)}${select('f-due','Due status',[['','All'],['OVERDUE','Overdue'],['DUE_TODAY','Due today']],filter.due)}${field('f-from','Created from','date',filter.from)}${field('f-to','Created to','date',filter.to)}<button id="applyFilters">Apply filters</button><button id="clearFilters">Clear</button></div>`;}
function bindFilters(draw){$('applyFilters').onclick=()=>{Object.keys(filter).forEach(k=>filter[k]=k==='q'?$('f-q').value:document.querySelector(`[name="f-${k}"]`).value);draw();bind();};$('clearFilters').onclick=()=>{Object.keys(filter).forEach(k=>filter[k]='');dashboardKpiFilter='';draw();bind();};}
function orderTable(cases){
 if(!cases.length)return '<div class="empty-state order-empty"><div class="empty-icon">◇</div><h3>No orders found</h3><p>Adjust the search or filters to see matching orders.</p></div>';
 return '<div class="order-board">'+cases.map(c=>{
  const mats=state.materials.filter(m=>m.case_id===c.id&&m.active!=='NO'),ts=state.tasks.filter(t=>t.case_id===c.id&&t.active!=='NO'),ss=state.suppliers.filter(s=>ts.some(t=>t.supplier_id===s.id));
  const pct=Math.max(0,Math.min(100,Number(c.readiness)||0));
  const missing=ts.filter(t=>isRequiredTask(t)&&t.status==='MISSING').length;
  const label=c.status==='CLOSED'?'Closed':missing?'Needs attention':String(c.status||'In progress').replace(/_/g,' ');
  return `<div class="order-item"><div class="order-mark">SO</div><div class="order-copy"><strong>${esc(c.so)} – ${esc(orderProductNames(c))}</strong><small>${esc(c.customer)} · ${mats.length} material${mats.length===1?'':'s'} · ${ss.length} supplier${ss.length===1?'':'s'}</small><div class="order-progress" aria-label="${pct}% evidence approved"><progress value="${pct}" max="100">${pct}%</progress></div></div><div class="order-meta"><span class="status-pill ${missing?'warning':''}">${esc(label)}</span><strong>${esc(c.accepted)}/${esc(c.total)} approved</strong><span class="${c.due&&c.due<today()&&c.status!=='CLOSED'?'overdue':''}">${esc(c.due||'No due date')}</span></div>${button('Open →','open',c.id)}</div>`;
 }).join('')+'</div>';
}
function computeDashboardMetrics(){
 const cases=state?.cases||[],active=cases.filter(c=>c.status!=='CLOSED'),ids=new Set(cases.map(c=>c.id)),activeIds=new Set(active.map(c=>c.id));
 const activeTasks=(state?.tasks||[]).filter(t=>ids.has(t.case_id)&&t.active!=='NO');
 const openOrderTasks=activeTasks.filter(t=>activeIds.has(t.case_id));
 const requiredTasks=activeTasks.filter(isRequiredTask);
 const openRequiredTasks=openOrderTasks.filter(isRequiredTask);
 const docs=(state?.docs||[]).filter(d=>ids.has(d.case_id));
 const overdueOrders=active.filter(c=>c.due&&c.due<today());
 const overdueTasks=openRequiredTasks.filter(t=>t.status!=='APPROVED'&&t.due&&t.due<today());
 const missingRequired=openRequiredTasks.filter(t=>t.status==='MISSING');
 const reviewingAll=activeTasks.filter(t=>['UPLOADED','SUBMITTED','IN_REVIEW'].includes(t.status));
 const awaitingMyReview=reviewingAll.filter(t=>t.assigned_reviewer===state?.user?.email||(!t.assigned_reviewer&&(review()||roles('ADMIN'))&&taskForUser(t)));
 const waitingSupplier=openRequiredTasks.filter(t=>Boolean(t.supplier_id)&&['MISSING','REQUESTED','MORE_INFO_REQUIRED','REJECTED'].includes(t.status));
 const approvedRequired=requiredTasks.filter(t=>t.status==='APPROVED');
 const attentionTasks=openRequiredTasks.filter(t=>t.status!=='APPROVED'&&(t.due&&t.due<today()||['MISSING','REJECTED','MORE_INFO_REQUIRED','SUBMITTED','UPLOADED','IN_REVIEW'].includes(t.status)));
 const approvedDocs=docs.filter(d=>d.kind==='EVIDENCE'&&d.status==='APPROVED'&&d.active_version==='YES').length;
 const totalRequired=requiredTasks.length,pct=totalRequired?Math.round(approvedRequired.length/totalRequired*100):0;
 return {cases,active,activeTasks,requiredTasks,openRequiredTasks,overdueOrders,overdueTasks,missingRequired,reviewingAll,awaitingMyReview,waitingSupplier,approvedRequired,attentionTasks,approvedDocs,totalRequired,pct};
}
function dashboard(){
 const m=computeDashboardMetrics();
 const {cases,active,requiredTasks,overdueOrders,overdueTasks,missingRequired,reviewingAll,awaitingMyReview,waitingSupplier,approvedRequired,attentionTasks,approvedDocs,totalRequired,pct}=m;
 const actionTasks=attentionTasks.slice().sort((a,b)=>Number(!!b.due&&b.due<today())-Number(!!a.due&&a.due<today())||String(a.due||'9999').localeCompare(String(b.due||'9999'))).slice(0,4);
 const circumference=2*Math.PI*36,dashOffset=circumference*(1-pct/100);
 const notices=(state.notifications||[]).filter(n=>n.read!=='YES').slice(0,3);
 const date=new Intl.DateTimeFormat('en',{timeZone:'Asia/Ho_Chi_Minh',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
 $('main').innerHTML=`<div class="dashboard-heading"><div><p class="eyebrow">KODA / EUDR OPERATIONS</p><h1>Evidence control center</h1><p>Operational picture · ${esc(date)} · Vietnam time</p></div>${manage()&&cases.length?button('＋ New order','newOrder'):''}</div>`+
 (state.legal?.reviewDue?'<p class="warn">Legal rule review is due. Evidence completeness does not establish legal compliance.</p>':'')+
 `<div class="hero-grid"><section class="hero-panel"><div><p class="eyebrow">${cases.length?'TODAY’S PRIORITIES':'GET STARTED'}</p><h2>${cases.length?`${attentionTasks.length} required evidence tasks need attention across ${active.length} active orders`:'Every order starts with clear evidence.'}</h2><p>${cases.length?'Review deadlines, missing files and submissions in one place. Open an order to follow its materials and evidence.':'Create a Sales Order, confirm its materials, then assign evidence to the right people and suppliers.'}</p>${cases.length?`<div class="hero-metrics-breakdown" role="list" aria-label="Unit-separated summary"><span class="hero-metric-pill" role="listitem">${overdueOrders.length} ${esc(tt('Overdue orders'))}</span><span class="hero-metric-pill" role="listitem">${overdueTasks.length} ${esc(tt('Overdue evidence tasks'))}</span><span class="hero-metric-pill" role="listitem">${missingRequired.length} ${esc(tt('Missing required evidence'))}</span><span class="hero-metric-pill" role="listitem">${awaitingMyReview.length} ${esc(tt('Awaiting my review'))}</span></div>`:''}</div><div class="hero-bottom">${manage()?button(cases.length?'Create another order →':'Create first order →','newOrder'):button('View my tasks →','openTasks')}<span class="hero-footnote">Human review remains required</span></div></section><section class="readiness-panel"><div class="readiness-ring-wrap"><svg class="readiness-ring" width="88" height="88" viewBox="0 0 88 88" aria-hidden="true"><circle class="readiness-ring-track" cx="44" cy="44" r="36" fill="none" stroke-width="7"></circle><circle class="readiness-ring-progress" cx="44" cy="44" r="36" fill="none" stroke-width="7" stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${dashOffset.toFixed(2)}"></circle></svg><div><p class="eyebrow">EVIDENCE PROGRESS</p><div class="readiness-value">${totalRequired?pct:'—'}${totalRequired?'<small>%</small>':''}</div><p>${totalRequired?`${approvedDocs} approved active files · ${totalRequired} required evidence tasks`:'No evidence tasks registered yet'}</p></div></div><div><div class="readiness-bar"><progress value="${pct}" max="100">${pct}%</progress></div><div class="subline"><span>Approved required tasks</span><span>${approvedRequired.length} / ${totalRequired}</span></div></div></section></div>`+
 `<div class="kpi-grid kpi-grid--p2" role="region" aria-label="Operational KPIs">
  <button type="button" class="kpi kpi-button" data-kpi="ACTIVE_ORDERS" title="${esc(tt('Orders with status other than CLOSED'))}"><span>${esc(tt('Active Orders'))}</span><strong>${active.length}</strong><small class="kpi-unit">${cases.length} ${esc(tt('total orders'))}</small></button>
  <button type="button" class="kpi kpi-button alert" data-kpi="OVERDUE_TASKS" title="${esc(tt('Required evidence tasks past due date on active orders'))}"><span>${esc(tt('Overdue Evidence Tasks'))}</span><strong>${overdueTasks.length}</strong><small class="kpi-unit">${overdueOrders.length} ${esc(tt('overdue orders'))}</small></button>
  <button type="button" class="kpi kpi-button review" data-kpi="AWAITING_REVIEW" title="${esc(tt('Submitted or uploaded evidence awaiting your review decision'))}"><span>${esc(tt('Awaiting My Review'))}</span><strong>${awaitingMyReview.length}</strong><small class="kpi-unit">${reviewingAll.length} ${esc(tt('total in review'))}</small></button>
  <button type="button" class="kpi kpi-button" data-kpi="MISSING_REQUIRED" title="${esc(tt('Active required evidence tasks still missing files (excludes optional)'))}"><span>${esc(tt('Missing Required Evidence'))}</span><strong>${missingRequired.length}</strong><small class="kpi-unit">${esc(tt('Required tasks only'))}</small></button>
  <button type="button" class="kpi kpi-button" data-kpi="WAITING_SUPPLIER" title="${esc(tt('Required supplier-assigned tasks pending upload or revision'))}"><span>${esc(tt('Waiting for Supplier'))}</span><strong>${waitingSupplier.length}</strong><small class="kpi-unit">${esc(tt('Supplier queue'))}</small></button>
  <button type="button" class="kpi kpi-button kpi-approved" data-kpi="APPROVED_REQUIRED" title="${esc(tt('Approved required evidence tasks out of total required tasks'))}"><span>${esc(tt('Approved Required Evidence'))}</span><strong>${approvedRequired.length}/${totalRequired}</strong><small class="kpi-unit">${pct}% · ${approvedDocs} ${esc(tt('active files'))}</small></button>
 </div>`+
 (!cases.length?`<div class="onboarding"><div class="onboarding-step"><span>01 / ORDER</span><strong>Register the Sales Order</strong><p>Add the SO PDF, customer and evidence due date.</p></div><div class="onboarding-step"><span>02 / MATERIALS</span><strong>Confirm materials</strong><p>MP enters materials and adds Material PO when available.</p></div><div class="onboarding-step"><span>03 / EVIDENCE</span><strong>Collect and review</strong><p>Assign owners, receive original files and record human decisions.</p></div></div>`:
 `<div class="dashboard-columns"><section class="card"><div class="section-title"><h2>Needs attention</h2>${button('All tasks →','openTasks')}</div>${actionTasks.length?actionTasks.map((t,i)=>{const c=cases.find(c=>c.id===t.case_id),mat=state.materials.find(m=>m.id===t.material_id);return `<div class="attention-item"><span class="attention-number">${String(i+1).padStart(2,'0')}</span><div class="attention-copy"><strong>${esc(c?.so)} · ${esc(t.evidence)}</strong><small>${esc(mat?.material||'Material pending')} · ${esc(t.due||'No due date')} · ${esc(t.status)}</small></div>${button('Open','open',t.case_id)}</div>`;}).join(''):'<div class="empty-state"><div class="empty-icon">✓</div><h3>No urgent tasks</h3><p>Assigned work and due dates will appear here.</p></div>'}</section><section class="card"><div class="section-title"><h2>Recent orders</h2>${button('View all →','openOrders')}</div>${cases.slice().sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))).slice(0,4).map(c=>`<div class="order-item"><div class="order-mark">SO</div><div class="order-copy"><strong>${esc(c.so)} – ${esc(orderProductNames(c))}</strong><small>${esc(c.customer)} · ${esc(c.status)}</small></div>${button('Open','open',c.id)}</div>`).join('')}${notices.length?`<h3 class="notice-heading">Notifications</h3>${notices.map(n=>`<div class="attention-item"><div class="attention-copy"><small>${esc(n.message)}</small></div>${button('Mark read','readNotification',n.id)}</div>`).join('')}`:''}</section></div>`);
 document.querySelectorAll('[data-kpi]').forEach(b=>b.onclick=()=>EudrNav.openKpiTarget(b.dataset.kpi));
}
function orders(){
 const cases=filtered();
 const kpiBanner=dashboardKpiFilter==='ACTIVE_ORDERS'?`<div class="kpi-filter-banner" role="status"><span>${esc(tt('Filtered from Dashboard KPI'))}: <strong>${esc(tt('Active Orders'))} (${cases.length})</strong></span><div class="row"><button type="button" class="quiet-button" id="clearKpiFilter">${esc(tt('Show all orders'))}</button><button type="button" class="quiet-button" id="kpiBackToDashboard">← ${esc(tt('Back to Dashboard'))}</button></div></div>`:'';
 $('main').innerHTML=`<div class="pagehead"><div><p class="eyebrow">CASE REGISTER</p><h2>Orders</h2><p class="muted">Follow each Sales Order from materials through evidence review.</p></div>${manage()?button('＋ New order','newOrder')+button('Import SO/PO/Excel','smartImport'):''}</div>${kpiBanner}<div class="orders-toolbar"><input id="quickSearch" aria-label="Search orders" value="${esc(filter.q)}" placeholder="Search order, customer, product, supplier…"><span class="muted">${cases.length} of ${state.cases.length} orders</span></div><details class="filter-panel"><summary>Advanced filters</summary>${filters()}</details><div id="orderResults">${state.cases.length?orderTable(cases):`<div class="empty-state order-empty"><div class="empty-icon">◇</div><h3>No orders registered yet</h3><p>Register a Sales Order to begin the evidence workflow.</p>${manage()?button('Create first order →','newOrder'):''}</div>`}</div>`;
 $('quickSearch').oninput=e=>{filter.q=e.target.value;$('f-q').value=filter.q;const list=filtered();$('orderResults').innerHTML=orderTable(list);$('orderResults').querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>go('Workspace',b.dataset.id));};
 if($('clearKpiFilter'))$('clearKpiFilter').onclick=()=>{dashboardKpiFilter='';orders();bind();};
 if($('kpiBackToDashboard'))$('kpiBackToDashboard').onclick=()=>EudrNav.navigate({view:'Dashboard',dashboardKpiFilter:''});
 bindFilters(orders);
}
function taskBadge(t){
 const status=t.required==='NO'&&t.override_state!=='OPTIONAL'?'NOT_REQUIRED':t.status||'MISSING';
 const tones={MISSING:'missing',APPROVED:'approved',UPLOADED:'uploaded',SUBMITTED:'submitted',IN_REVIEW:'submitted',REJECTED:'rejected',MORE_INFO_REQUIRED:'rejected',NOT_REQUIRED:'not-required',OPTIONAL:'not-required'};
 const icons={MISSING:'!',APPROVED:'✓',UPLOADED:'↑',SUBMITTED:'→',IN_REVIEW:'○',REJECTED:'×',MORE_INFO_REQUIRED:'!',NOT_REQUIRED:'—',OPTIONAL:'○'};
 const overdue=isRequiredTask(t)&&!!t.due&&t.due<today()&&!['APPROVED','NOT_REQUIRED'].includes(status);
 return `<span class="evidence-state evidence-state--${tones[status]||'neutral'}"><span aria-hidden="true">${icons[status]||'·'}</span>${esc(tt(status))}</span>${t.override_state==='OPTIONAL'?'<span class="evidence-state evidence-state--not-required">○ '+esc(tt('OPTIONAL'))+'</span>':''}${overdue?'<span class="evidence-state evidence-state--overdue">! '+esc(tt('OVERDUE'))+'</span>':''}`;
}
function taskTable(tasks){return '<div class="scroll"><table><thead><tr><th>Order / Evidence</th><th>Owner / Due</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+tasks.map(t=>{const c=state.cases.find(c=>c.id===t.case_id),m=state.materials.find(m=>m.id===t.material_id);return `<tr><td><b>${esc(c?.so)} · ${esc(m?.material)}</b><br>${esc(t.display_evidence||t.evidence)}</td><td>${esc(t.owner||'Unassigned')}<br><span class="${t.due&&t.due<today()&&t.status!=='APPROVED'&&isRequiredTask(t)?'overdue':''}">${esc(t.due||'No due date')}</span></td><td>${taskBadge(t)}${t.override_reason?`<small title="${esc(t.override_by||'')} · ${esc(t.override_at||'')}">${esc(t.override_reason)}</small>`:''}</td><td><div class="row">${t.document_id?button('View','document',t.document_id):''}${cap('EVIDENCE_UPLOAD')&&t.evidence!=='Sales order'&&(t.required!=='NO'||t.override_state==='OPTIONAL')&&['MISSING','DRAFT','UPLOADED','REJECTED','MORE_INFO_REQUIRED'].includes(t.status)?button('Upload','upload',t.id):''}${review()?button('Assign','assign',t.id):''}${cap('POLICY_EDIT')&&t.evidence!=='Sales order'?button('Requirement','taskRequirement',t.id):''}${cap('POLICY_EDIT')&&t.rule_version==='ORDER_OVERRIDE'?button('Remove Evidence Type','removeScopedRequirement',t.id):''}${cap('EVIDENCE_UPLOAD')&&t.document_id&&['DRAFT','UPLOADED'].includes(t.status)?button('Remove draft','removeDraft',t.document_id):''}${button('Order','open',t.case_id)}</div></td></tr>`;}).join('')+'</tbody></table></div>';}
function taskForUser(t){const u=state.user;if(u.role==='ADMIN')return true;if(u.role==='SUPPLIER_USER')return !!u.supplier_id&&t.supplier_id===u.supplier_id;
 if(t.owner===u.email||t.assigned_reviewer===u.email)return true;
 const department=String(u.department||u.role||'').trim().toUpperCase();return !t.owner&&!!department&&String(t.department||'').trim().toUpperCase()===department;}
function myTasks(){$('main').classList.add('my-tasks-screen');const own=state.tasks.filter(t=>t.active!=='NO'&&taskForUser(t)),end=new Date(today()+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+7);const cutoff=end.toISOString().slice(0,10),pending=t=>t.status!=='APPROVED'&&isRequiredTask(t);
 const follow=[['Overdue',t=>pending(t)&&t.due&&t.due<today()],['Due Today',t=>pending(t)&&t.due===today()],['Due This Week',t=>pending(t)&&t.due>today()&&t.due<=cutoff]];
 const reviewGroups=[['Awaiting My Review',t=>['SUBMITTED','IN_REVIEW','UPLOADED'].includes(t.status)&&(t.assigned_reviewer===state.user.email||(!t.assigned_reviewer&&(review()||roles('ADMIN'))))],['Waiting for Supplier',t=>isRequiredTask(t)&&!!t.supplier_id&&['MISSING','REQUESTED','MORE_INFO_REQUIRED','REJECTED'].includes(t.status)],['Completed',t=>t.status==='APPROVED']];
 const panel=items=>items.map(([name,fn])=>{const tasks=own.filter(fn);return `<section class="card task-panel"><h3>${esc(tt(name))} <span class="task-count">${tasks.length}</span></h3>${tasks.length?taskTable(tasks):'<p class="muted">No tasks in this group.</p>'}</section>`;}).join('');
 let kpiBanner='',bottomHeading='All assigned evidence',bottomTasks=own;
 if(myTasksFilter){
  const m=computeDashboardMetrics();
  const kpiMap={
   OVERDUE_TASKS:{label:'Overdue Evidence Tasks',items:m.overdueTasks},
   AWAITING_REVIEW:{label:'Awaiting My Review',items:m.awaitingMyReview},
   MISSING_REQUIRED:{label:'Missing Required Evidence',items:m.missingRequired},
   WAITING_SUPPLIER:{label:'Waiting for Supplier',items:m.waitingSupplier},
   APPROVED_REQUIRED:{label:'Approved Required Evidence',items:m.approvedRequired}
  };
  const chosen=kpiMap[myTasksFilter];
  if(chosen){
   bottomHeading=chosen.label;
   bottomTasks=chosen.items;
   kpiBanner=`<div class="kpi-filter-banner" id="myTasksKpiBanner" role="status"><span>${esc(tt('Filtered from Dashboard KPI'))}: <strong>${esc(tt(chosen.label))} (${chosen.items.length})</strong></span><div class="row"><button type="button" class="quiet-button" id="clearMyTasksFilter">${esc(tt('Show all tasks'))}</button><button type="button" class="quiet-button" id="kpiBackToDashboard">← ${esc(tt('Back to Dashboard'))}</button></div></div>`;
  }
 }
 $('main').innerHTML='<h2>My Tasks</h2>'+kpiBanner+'<div class="task-columns"><div>'+panel(follow)+'</div><div>'+panel(reviewGroups)+'</div></div><section class="card" id="myTasksAllSection"><h3>'+esc(tt(bottomHeading))+'</h3>'+taskTable(bottomTasks)+'</section>';
 if($('clearMyTasksFilter'))$('clearMyTasksFilter').onclick=()=>{myTasksFilter='';myTasks();bind();};
 if($('kpiBackToDashboard'))$('kpiBackToDashboard').onclick=()=>EudrNav.navigate({view:'Dashboard',myTasksFilter:''});
}

let selectedProduct='',productPreviewUrl='',allMaterialsVisible=false;
function requiredProgressMarkup(items,scope){
 const required=items.filter(t=>isRequiredTask(t)&&String(t.evidence||'').toLowerCase()!=='sales order');
 const approved=required.filter(t=>t.status==='APPROVED').length,total=required.length;
 const label=tt('Required items approved');
 return `<span class="scope-progress" title="${esc(tt('Visible to your role'))}"><progress value="${approved}" max="${Math.max(1,total)}" aria-label="${esc(scope)}: ${approved}/${total} ${esc(label)}"></progress><span class="scope-progress-label" aria-hidden="true">${approved}/${total}</span></span>`;
}
function workspace(){
 window.EudrWorkspaceChat?.stop?.(); window.EudrIntelligence?.stop?.();
 const c=state.cases.find(c=>c.id===selected);if(!c)return orders();
 if(supplier()||!cap('AI_USE'))workspaceTab='evidence';
 const allMats=state.materials.filter(m=>m.case_id===selected&&m.active!=='NO'),products=(state.products||[]).filter(p=>p.case_id===selected&&p.active==='YES').sort((a,b)=>Number(a.sequence||0)-Number(b.sequence||0));
 if(!products.some(p=>p.id===selectedProduct))selectedProduct=products[0]?.id||'';
 const mats=supplier()?allMats:window.EudrTrace.materialsForProduct(allMats,selectedProduct,state.trace?.usage||[]);
 if(!mats.some(m=>m.id===material)){material=mats[0]?.id||'';selectedChainNode='';selectedSource='';}
 const sourceChoices=(state.trace?.sources||[]).filter(s=>s.material_id===material&&(state.trace?.usage||[]).some(a=>a.product_id===selectedProduct&&a.source_id===s.id));
 if(!sourceChoices.some(s=>s.id===selectedSource))selectedSource=sourceChoices[0]?.id||'';
 const sourceEdges=(state.trace?.edges||[]).filter(e=>e.source_id===selectedSource),sourceNodeIds=new Set(sourceEdges.flatMap(e=>[e.from_node_id,e.to_node_id]));
 const nodes=state.chain.filter(n=>n.material_id===material&&(!selectedSource||sourceNodeIds.has(n.id))),node=nodes.find(n=>n.id===selectedChainNode);
 if(selectedChainNode&&!node)selectedChainNode='';
 const product=products.find(p=>p.id===selectedProduct),tasks=state.tasks.filter(t=>t.case_id===selected&&(!t.material_id||t.material_id===material&&(!selectedSource||window.EudrTrace.matchesSource(t,'TASK',selectedSource,state.trace?.recordLinks)))&&String(t.chain_node_id||'')===selectedChainNode&&(!selectedChainNode||String(t.evidence).toLowerCase()!=='sales order'));
 const displayTasks=tasks.map(t=>!selectedChainNode&&t.evidence==='Sales order'?{...t,display_evidence:'Sales Order (Customer → KODA)'}:t);
 const names=orderProductNames(c);
 const productRows=products.map(p=>`<div class="product-row"><button data-product="${esc(p.id)}" aria-pressed="${p.id===selectedProduct}">${esc(p.product_name)} · ${esc(p.quantity||'—')} ${esc(p.quantity_uom||'')}</button></div>`).join('');
 let customerPos=[];try{customerPos=JSON.parse(product?.customer_po_allocations_json||'[]');if(!Array.isArray(customerPos))customerPos=[];}catch(e){customerPos=[];}
 const customerPoRows=customerPos.map(a=>`<li>${esc(a.po_no)}${a.destination?' · '+esc(a.destination):''} · ${esc(a.quantity)} ${esc(a.quantity_uom)}</li>`).join('');
 const productActions=manage()&&product?`<div class="action-menu-group"><strong>${esc(tt('Products'))} · ${esc(product.product_name)}</strong>${button('Edit','productEdit',product.id)}${button('Product Image','productImage',product.id)}${button('Remove','removeProduct',product.id)}</div>`:'';
 const materialActions=material?`<div class="action-menu-group"><strong>${esc(tt('Materials'))} · ${esc(mats.find(m=>m.id===material)?.material||'')}</strong>${cap('MATERIAL_EDIT')?button('Edit Material / PO','materialEdit',material)+button('Remove','removeMaterial',material):''}${button('Material Information','materialInfo',material)}${button('GEO Review','geo',material)}</div>`:'';
 const usage=state.trace?.usage||[],sources=state.trace?.sources||[],groupedIds=new Set();let allMaterialEntryCount=0;
 const allMaterialGroups=products.map(p=>{const linked=window.EudrTrace.materialsForProduct(allMats,p.id,usage);linked.forEach(m=>groupedIds.add(m.id));const entries=linked.flatMap(m=>{const allocations=usage.filter(a=>a.active!=='NO'&&a.product_id===p.id&&a.material_id===m.id),matched=allocations.map(a=>sources.find(s=>s.id===a.source_id)).filter(Boolean);return (matched.length?matched:[null]).map(s=>({m,s}));});allMaterialEntryCount+=entries.length;return entries.length?`<div class="all-material-product"><strong>${esc(p.product_name)} · ${esc(p.quantity||'—')} ${esc(p.quantity_uom||'')}</strong><div class="all-material-items">${entries.map(({m,s})=>`<button type="button" data-material-scope="${esc(m.id)}" data-product-scope="${esc(p.id)}" data-source-scope="${esc(s?.id||'')}" aria-pressed="${p.id===selectedProduct&&m.id===material&&(!s||s.id===selectedSource)}"><span>${esc(m.material)}</span><small>${esc(s?.supplier_po||m.supplier_po||tt('PO pending'))}${s?.po_line?' · '+esc(tt('PO line'))+' '+esc(s.po_line):''}${s?.lot_no?' · '+esc(tt('Lot / batch'))+' '+esc(s.lot_no):''}</small></button>`).join('')}</div></div>`:'';}).filter(Boolean);
 const unassigned=allMats.filter(m=>!groupedIds.has(m.id));allMaterialEntryCount+=unassigned.length;if(unassigned.length)allMaterialGroups.push(`<div class="all-material-product"><strong>${esc(tt('Unassigned materials'))}</strong><div class="all-material-items">${unassigned.map(m=>`<button type="button" data-material-scope="${esc(m.id)}" data-product-scope="" data-source-scope=""><span>${esc(m.material)}</span><small>${esc(m.supplier_po||tt('PO pending'))}</small></button>`).join('')}</div></div>`);
 const materialTasks=state.tasks.filter(t=>t.case_id===selected&&t.material_id===material&&(!selectedSource||window.EudrTrace.matchesSource(t,'TASK',selectedSource,state.trace?.recordLinks)));
 const chainChoices=`<button type="button" data-chain-node="" aria-pressed="${!selectedChainNode}"><span class="scope-choice-name">KODA</span>${requiredProgressMarkup(materialTasks.filter(t=>!t.chain_node_id),'KODA')}</button>`+nodes.map(n=>{const parent=nodes.find(p=>p.id===n.parent_id),name=selectedSource?`${n.display_name||n.id} · lot graph`:`${parent?.display_name||'KODA'} → ${n.display_name||n.id} · ${n.terminal==='YES'?'Terminal origin':'Tier '+n.tier}`;return `<button type="button" data-chain-node="${esc(n.id)}" aria-pressed="${n.id===selectedChainNode}" title="From ${esc(parent?.display_name||'KODA')}"><span class="scope-choice-name">${esc(name)}</span>${requiredProgressMarkup(materialTasks.filter(t=>t.chain_node_id===n.id),name)}</button>`;}).join('');
 const orphaned=state.tasks.filter(t=>t.case_id===selected&&t.material_id===material&&String(t.chain_node_id||'')===selectedChainNode&&!EVIDENCE_BLOCKS.includes(t.evidence_block||''));
 $('main').innerHTML=`<section class="workspace-summary"><div class="workspace-summary-copy"><p class="eyebrow">ORDER WORKSPACE</p><h2>${esc(c.so)} – ${esc(names)}</h2><p>${esc(c.customer)} · Owner ${esc(c.owner||'—')} · ${esc(tt('Shipment Date'))} ${esc(c.shipment_date||'—')} · Due ${esc(c.due||'—')} · Last update ${esc(c.updated_at||'—')}</p><progress value="${Math.max(0,Math.min(100,Number(c.readiness)||0))}" max="100"></progress> ${esc(c.accepted||0)}/${esc(c.total||0)} required items approved<p class="muted">Evidence readiness is a workflow measure. Regulatory decisions remain with the authorized operator.</p><div class="row">${manage()?button('Edit Order','editOrder',c.id):''}${!supplier()&&(cap('ORDER_EDIT')||cap('MATERIAL_EDIT'))?button('Import SO/PO/Excel','smartImport',c.id):''}${!selectedChainNode&&c.so_document_id&&cap('SO_VIEW')?button('View Sales Order','document',c.so_document_id):''}${!selectedChainNode&&review()&&cap('SO_VIEW')?button('Repair Sales Order review','repairSO',c.id):''}${cap('POLICY_EDIT')?button('Evidence policy','policy'):''}</div></div><div id="productPreview" class="product-preview"><p>Optional product image</p></div></section>
 <nav class="order-tabs" role="tablist" aria-label="${esc(tt('Order sections'))}"><button type="button" role="tab" id="orderEvidenceTab" aria-controls="orderEvidencePanel" aria-selected="${workspaceTab==='evidence'}" tabindex="${workspaceTab==='evidence'?0:-1}" data-order-tab="evidence">${esc(tt('Evidence workspace'))}</button>${!supplier()&&cap('AI_USE')?`<button type="button" role="tab" id="orderChatTab" aria-controls="orderChatPanel" aria-selected="${workspaceTab==='chat'}" tabindex="${workspaceTab==='chat'?0:-1}" data-order-tab="chat">${esc(tt('Ask KODA AI'))}</button>`:''}${!supplier()&&cap('AI_USE')?['review','classify','issues','customer'].map(tab=>`<button type="button" role="tab" id="orderIntelligence-${tab}" aria-controls="orderIntelligencePanel" aria-selected="${workspaceTab===tab}" tabindex="${workspaceTab===tab?0:-1}" data-order-tab="${tab}">${esc(tt({review:'AI Review',classify:'Documents',issues:'Issues',customer:'Customer Submission'}[tab]))}</button>`).join(''):''}</nav>
 <div id="orderEvidencePanel" role="tabpanel" aria-labelledby="orderEvidenceTab" ${workspaceTab!=='evidence'?'hidden':''}><section class="card workspace-data"><div class="workspace-data-main"><section class="workspace-data-section"><h3>Products</h3><div class="workspace-products">${productRows||'<p class="muted">No products recorded.</p>'}</div>${customerPoRows?`<p><strong>${esc(tt('Customer PO allocations'))}</strong></p><ul>${customerPoRows}</ul>`:''}<div class="workspace-actions">${productActions?`<details class="action-menu"><summary aria-label="More product actions" title="More product actions">▾</summary><div class="action-menu-items">${productActions}</div></details>`:''}${manage()?button('+ Add Product','productEdit',''):''}${!supplier()&&write()?button('Product · Material · PO / lot','traceWorkspace',c.id):''}</div></section>
 <section class="workspace-data-section"><div class="materials-heading"><h3>Materials</h3><button id="allMaterialsToggle" type="button" aria-pressed="${allMaterialsVisible}">${esc(tt('All materials'))} (${allMaterialEntryCount})</button></div>${allMaterialsVisible?`<div class="all-material-groups">${allMaterialGroups.join('')||`<p class="muted">${esc(tt('No materials recorded.'))}</p>`}</div>`:`<div class="row materialnav">${mats.map(m=>`<button data-material="${esc(m.id)}" aria-pressed="${m.id===material}"><span class="scope-choice-name">${esc(m.material)} · PO ${esc(m.supplier_po||'Pending')}</span>${requiredProgressMarkup(state.tasks.filter(t=>t.case_id===selected&&t.material_id===m.id),m.material)}</button>`).join('')||`<p class="muted">${product?.wood_content_state==='NON_WOOD_ONLY'?esc(tt('This imported product contains only NON_WOOD materials.')):esc(tt('No material is linked to this product. Confirm its source in Product · Material · PO / lot.'))}</p>`}</div>`}<div class="workspace-actions">${materialActions?`<details class="action-menu"><summary aria-label="More material actions" title="More material actions">▾</summary><div class="action-menu-items">${materialActions}</div></details>`:''}${cap('MATERIAL_EDIT')?button('+ Add Materials','materials',selected):''}</div></section>
 <section class="workspace-data-section"><h3>PO / lot source</h3><div class="row">${sourceChoices.map(s=>`<button data-source="${esc(s.id)}" aria-pressed="${s.id===selectedSource}">${esc(s.supplier_po||'PO pending')} · ${esc(s.po_line||'—')} · ${esc(s.lot_no||'lot pending')}</button>`).join('')||`<p class="muted">${esc(tt('No source has been allocated to this product.'))}</p>`}</div></section><section class="workspace-data-section"><h3>Supply Chain</h3>${material?`<div class="chain-path" aria-label="Supply Chain">${chainChoices}</div>${nodes.length?'':'<p class="muted">No upstream relationship yet for this material.</p>'}<div class="workspace-actions">${selectedChainNode&&cap('CHAIN_EDIT')?`<details class="action-menu"><summary aria-label="More relationship actions" title="More relationship actions">▾</summary><div class="action-menu-items">${button('Edit Relationship','chainEdit',selectedChainNode)}${button('Remove','removeChainNode',selectedChainNode)}</div></details>`:''}${cap('CHAIN_EDIT')?button('+ Add Relationship','addRelationship',material):''}</div>`:'<p class="muted">Select or add a material to begin the Supply Chain.</p>'}</section></div></section>
 ${(material&&nodes.length)||tasks.length?nodeEvidenceTables(displayTasks):''}
 ${orphaned.length?`<section class="card legacy-evidence" role="alert"><h3>Evidence needs block mapping</h3><p>${orphaned.length} existing task(s) remain outside the four folders. Keep their history and map them to a block before another upload.</p>${taskTable(orphaned)}</section>`:''}
 <section class="card dossier-step"><h3>EUDR Dossier Check</h3><p>${esc(tt('Review multiple PDFs by material and PO/lot source. Refresh results from Drive for findings, references and next actions.'))}</p><div class="row">${!supplier()&&(cap('AI_USE')||cap('EVIDENCE_UPLOAD'))?button('Open material dossier · upload, OCR/AI and results','dossierHub',c.id)+`<details class="legacy-dossier-access"><summary>${esc(tt('Previous whole-SO reviews'))}</summary><p>${esc(tt('Earlier whole-order results are kept here. This is a separate historical workflow.'))}</p>${button('Open previous SO review','legacyDossier',c.id)}</details>`:''}</div></section><section class="card dossier-step"><h3>Review & Complete Dossier</h3><p class="muted">Open the final check when document collection and review are ready.</p><div class="row">${cap('AI_USE')?button('View AI Results','aiOutputs',c.id):''}${cap('WORKFLOW_CLOSE')?button(c.status==='CLOSED'?'Reopen workflow':'Review & Complete Dossier',c.status==='CLOSED'?'reopen':'finalReview',c.id):''}</div></section></div>${!supplier()&&cap('AI_USE')?`<section id="orderChatPanel" role="tabpanel" aria-labelledby="orderChatTab" ${workspaceTab==='chat'?'':'hidden'}></section>`:''}`;
 if(!supplier()&&cap('AI_USE')){const host=document.createElement('section');host.id='orderIntelligencePanel';host.setAttribute('role','tabpanel');host.hidden=!['review','classify','issues','customer'].includes(workspaceTab);$('main').append(host);if(!host.hidden){host.setAttribute('aria-labelledby','orderIntelligence-'+workspaceTab);window.EudrIntelligence.open({mode:workspaceTab,call,state,caseId:selected,materialId:material||'',sourceId:selectedSource||'',mount:host,openDocument:documentView,openMaterialDossier:()=>document.querySelector('[data-action="dossierHub"]')?.click()}).catch(e=>host.textContent=errorLabel(e));}}
 document.querySelectorAll('[data-product]').forEach(b=>b.onclick=()=>{EudrNav.pushWorkspaceStep('product',()=>{selectedProduct=b.dataset.product;selectedSource='';selectedChainNode='';});workspace();bind();EudrNav.updateNavChrome();});
 document.querySelectorAll('[data-material]').forEach(b=>b.onclick=()=>{EudrNav.pushWorkspaceStep('material',()=>{material=b.dataset.material;selectedChainNode='';selectedSource='';});workspace();bind();EudrNav.updateNavChrome();});
 document.querySelectorAll('[data-order-tab]').forEach(b=>{b.onclick=()=>{EudrNav.pushWorkspaceStep(workspaceStep,()=>{workspaceTab=b.dataset.orderTab;});workspace();bind();EudrNav.updateNavChrome();};b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const tabs=[...document.querySelectorAll('[data-order-tab]')],next=e.key==='Home'?tabs[0]:e.key==='End'?tabs.at(-1):tabs[(tabs.indexOf(b)+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length];e.preventDefault();next.click();document.querySelector(`[data-order-tab="${next.dataset.orderTab}"]`)?.focus();};});
 if(workspaceTab==='chat'&&$('orderChatPanel'))window.EudrWorkspaceChat.open({call,state,caseId:selected,materialId:material||'',sourceId:selectedSource||'',mount:$('orderChatPanel')}).catch(e=>{$('orderChatPanel').textContent=errorLabel(e);});
 $('allMaterialsToggle').onclick=()=>{allMaterialsVisible=!allMaterialsVisible;workspace();bind();};
 document.querySelectorAll('[data-material-scope]').forEach(b=>b.onclick=async()=>{if(!b.dataset.productScope){if(!supplier()&&write())await window.EudrTrace.open({call,state,caseId:selected,productId:selectedProduct,materialId:b.dataset.materialScope,sourceId:'',drawer,refresh:async()=>{await load();return state;}});return;}EudrNav.pushWorkspaceStep(b.dataset.sourceScope?'source':'material',()=>{selectedProduct=b.dataset.productScope;material=b.dataset.materialScope;selectedSource=b.dataset.sourceScope||'';selectedChainNode='';});workspace();bind();EudrNav.updateNavChrome();});
 document.querySelectorAll('[data-source]').forEach(b=>b.onclick=()=>{EudrNav.pushWorkspaceStep('source',()=>{selectedSource=b.dataset.source;selectedChainNode='';});workspace();bind();EudrNav.updateNavChrome();});
 document.querySelectorAll('[data-chain-node]').forEach(b=>b.onclick=()=>{EudrNav.pushWorkspaceStep('chain',()=>{selectedChainNode=b.dataset.chainNode;});workspace();bind();EudrNav.updateNavChrome();});
 if(productPreviewUrl){URL.revokeObjectURL(productPreviewUrl);productPreviewUrl='';}
 if(product?.image_document_id){const pid=product.id;call('getDocument',product.image_document_id).then(async f=>{const bytes=await fileBytes(f,product.image_document_id);if(selectedProduct!==pid||!$('productPreview'))return;productPreviewUrl=URL.createObjectURL(new Blob([bytes],{type:f.type}));const img=document.createElement('img');img.src=productPreviewUrl;img.alt=product.product_name;$('productPreview').replaceChildren(img);}).catch(e=>{$('msg').textContent=errorLabel(e);});}
 i18n.translateUI($('main'));
}

async function finalDossier(id){
 const result=await call('getDossierReview',id),items=result.blockers||[];
 drawer('<h2>'+esc(tt('Review & Complete Dossier'))+'</h2><p>'+esc(tt('Final dossier check'))+'</p>'+(items.length?'<div class="warn" role="alert"><strong>'+esc(tt('Items to resolve'))+'</strong><ul>'+items.map(x=>'<li>'+esc(tt(x.code).replace(/_/g,' '))+(x.details?' · '+esc(x.details):'')+'</li>').join('')+'</ul></div>':'<p class="ready-confirm">'+esc(tt('All internal checks are ready for human review.'))+'</p>')+(result.ready?'<form id="closeOrderForm"><label>'+esc(tt('Human review notes'))+'<textarea name="comment" required rows="4"></textarea></label><button>'+esc(tt('Confirm Internal Closure'))+'</button></form>':''));
 if(result.ready)$('closeOrderForm').onsubmit=e=>{e.preventDefault();act('completeCase',id,{confirmed:true,comment:new FormData(e.target).get('comment')});};
}

async function fileData(file){if(!file||!file.size)throw Error('INVALID_FILE');if(file.size>=3000000)throw Error('FILE_TOO_LARGE');return new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(Error('Cannot read file'));r.onload=()=>resolve({name:file.name,type:file.type||(/\.geojson$/i.test(file.name)?'application/geo+json':'application/json'),data:String(r.result).split(',')[1]});r.readAsDataURL(file);});}

function newOrder(){drawer('<h2>New Order</h2><form id="orderForm">'+field('so','Order No.','text','',true)+field('customer','Customer')+field('customer_code','Customer code')+field('po','Customer PO')+field('shipment_date','Shipment Date','date')+field('due','Evidence due date','date')+'<div id="newProducts"></div><button type="button" id="addProduct">+ Add Product</button><label>Sales Order PDF<input name="soFile" type="file" accept="application/pdf" required></label><p>Maximum file size: less than 3 MB</p><div id="folderChoice"></div><button type="submit">Create Order</button><p id="creationStatus" role="status"></p></form>');const form=$('orderForm');let created=null,input=null;const add=()=>{const row=document.createElement('fieldset');row.className='new-product';row.innerHTML=field('product_name','Product','text','',true)+field('sku','SKU')+field('quantity','Quantity','number','',true)+field('quantity_uom','UOM','text','pcs')+'<label>Product Image<input name="product_image" type="file" accept="image/png,image/jpeg,image/webp"></label><img class="image-preview" hidden alt="Product image preview"><p>Maximum file size: less than 3 MB</p><button type="button">Remove</button>';row.querySelector('[name="quantity"]').min='0.000001';row.querySelector('[name="quantity"]').step='any';row.querySelector('button').onclick=()=>{if($('newProducts').children.length>1)row.remove();};row.querySelector('[type="file"]').onchange=async e=>{try{const f=await fileData(e.target.files[0]),img=row.querySelector('img');img.src='data:'+f.type+';base64,'+f.data;img.hidden=false;}catch(e){$('creationStatus').textContent=errorLabel(e);}};$('newProducts').append(row);i18n.translateUI(row);};$('addProduct').onclick=add;add();
 form.oninput=()=>{if(!created)input=null;};form.onsubmit=async e=>{e.preventDefault();if(busy)return;const opId=EudrOps.start({action:'createOrder',label:'Creating order',level:3,step:'Validating information'});const controls=[...form.querySelectorAll('button')];controls.forEach(b=>b.disabled=true);try{if(!created&&!input){const fd=new FormData(form),products=[...form.querySelectorAll('.new-product')].map(row=>Object.fromEntries(['product_name','sku','quantity','quantity_uom'].map(k=>[k,row.querySelector('[name="'+k+'"]').value])));input={so:fd.get('so'),customer:fd.get('customer'),customer_code:fd.get('customer_code'),po:fd.get('po'),shipment_date:fd.get('shipment_date'),due:fd.get('due'),products,file:await fileData(form.elements.soFile.files[0])};for(const row of form.querySelectorAll('.new-product'))if(row.querySelector('[type="file"]').files[0])await fileData(row.querySelector('[type="file"]').files[0]);const candidates=await call('findOrderFolders',input.so);if(candidates.length&&!fd.get('existing_folder_id')){$('folderChoice').innerHTML=select('existing_folder_id','Review existing folder',[['','Select'],...candidates.map(c=>[c.id,c.name])]);input=null;EudrOps.cancel(opId,'Existing folder selection required');return;}if(fd.get('existing_folder_id'))input.existing_folder_id=fd.get('existing_folder_id');}if(!created){$('creationStatus').textContent=tt('Creating order');EudrOps.update(opId,{step:'Registering order'});created=await call('createOrder',input);form.querySelectorAll('input,select').forEach(x=>x.disabled=true);}
 const rows=[...form.querySelectorAll('.new-product')];for(let i=0;i<rows.length;i++){const image=rows[i].querySelector('[type="file"]').files[0];if(image&&!rows[i].dataset.uploaded){EudrOps.update(opId,{step:'Uploading product images',progress:Math.round((i+1)/rows.length*100),unitLabel:`${i+1}/${rows.length} images`});const file=await fileData(image);file.expected_document_id='';await call('uploadProductImage',created.products.find(p=>Number(p.sequence)===i+1).id,file);rows[i].dataset.uploaded='YES';}}EudrNav.markDirty(false);EudrOps.succeed(opId,'Order created successfully');closeDrawer();selected=created.id;view='Workspace';await load();$('msg').textContent=tt('Order created successfully');}catch(e){EudrOps.fail(opId,e,{uncertain:Boolean(created)||e.status>=500});$('creationStatus').textContent=errorLabel(e)+(created?' · Order saved; retry pending image uploads.':'');}finally{busy=false;controls.forEach(b=>b.disabled=false);}};
}


function materialsDialog(id){drawer('<h2>MP · Materials</h2><form id="materialForm">'+field('material','Material','text','',true)+select('category','Category',['SOLID_WOOD','VENEER','MDF','PLYWOOD','LVL','OTHER_WOOD'])+field('supplier_po','Material PO (optional)')+field('source_reference','Source reference')+'<fieldset><legend>Products</legend>'+state.products.filter(p=>p.case_id===id&&p.active==='YES').map(p=>`<label><input type="checkbox" name="product" value="${esc(p.id)}">${esc(p.product_name)}</label>`).join('')+'</fieldset><button>Add Material</button></form><details><summary>Import Material JSON</summary><p>MP source data only. Do not infer scientific species.</p><textarea id="materialsJson" rows="8"></textarea><button id="previewMaterials">Validate & Preview</button><pre id="materialsPreview"></pre><button id="confirmMaterials" hidden>Confirm Import</button></details>');$('materialForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target),value=Object.fromEntries(fd);value.product_ids=fd.getAll('product');delete value.product;act('createMaterial',id,value);};$('previewMaterials').onclick=async()=>{try{const json=$('materialsJson').value,p=await call('previewMaterials',id,json);$('materialsPreview').textContent=JSON.stringify(p,null,2);$('confirmMaterials').hidden=false;$('confirmMaterials').onclick=()=>act('confirmMaterials',id,json,{confirmed:true,preview_hash:p.preview_hash});}catch(e){$('msg').textContent=errorLabel(e);}};}

function assignDialog(id){const t=state.tasks.find(t=>t.id===id);drawer('<h2>Assignment</h2><form id="assignForm">'+select('owner','Assigned user',[['','Unassigned'],...state.owners.map(u=>[u.email,u.name||u.email])],t.owner)+select('supplier_id','Supplier',[['','Internal'],...state.suppliers.filter(s=>s.active==='YES'&&!s.merged_into_id&&s.identity_status!=='MERGED').map(s=>[s.id,s.name])],t.supplier_id)+select('assigned_reviewer','Reviewer',[['','Unassigned'],...state.owners.filter(u=>['ADMIN','MARKETING','EUDR_REVIEWER'].includes(u.role)).map(u=>[u.email,u.name||u.email])],t.assigned_reviewer)+field('due','Due date','date',t.due)+select('priority','Priority',['LOW','NORMAL','HIGH','URGENT'],t.priority||'NORMAL')+'<button>Save assignment</button></form>');$('assignForm').onsubmit=e=>{e.preventDefault();act('updateTask',id,Object.fromEntries(new FormData(e.target)));};}
const DOCUMENT_BYTE_CACHE=new Map();
async function fileBytes(f,id){const cacheKey=id&&(f.sha256||f.version)?`${id}:${f.sha256||f.version}`:'';if(cacheKey&&DOCUMENT_BYTE_CACHE.has(cacheKey))return DOCUMENT_BYTE_CACHE.get(cacheKey);let out;if(!f.download_chunked)out=Uint8Array.from(atob(f.data),c=>c.charCodeAt(0));else{const totalChunks=Math.ceil(f.size/1048576),opId=EudrOps.start({action:'getDocumentChunk',label:`Downloading ${f.name||id}`,level:4,progress:0,unitLabel:`0/${totalChunks} chunks`});out=new Uint8Array(f.size);try{for(let i=0;i<totalChunks;i++){const pct=Math.round(i*1048576/f.size*100);$('msg').textContent='Loading document '+pct+'%';EudrOps.update(opId,{progress:pct,unitLabel:`${i}/${totalChunks} chunks`});const part=await call('getDocumentChunk',id,i),bytes=Uint8Array.from(atob(part.data),c=>c.charCodeAt(0));if(part.index!==i||part.size!==f.size||bytes.length!==Math.min(1048576,f.size-i*1048576))throw Error('Download integrity error');out.set(bytes,i*1048576);}EudrOps.succeed(opId,'Document loaded.');$('msg').textContent='Document loaded.';}catch(e){EudrOps.fail(opId,e);throw e;}}if(cacheKey){if(DOCUMENT_BYTE_CACHE.size>=25)DOCUMENT_BYTE_CACHE.delete(DOCUMENT_BYTE_CACHE.keys().next().value);DOCUMENT_BYTE_CACHE.set(cacheKey,out);}return out;}
async function download(id){try{const f=await call('getDocument',id),url=URL.createObjectURL(new Blob([await fileBytes(f,id)],{type:f.type})),a=document.createElement('a');a.href=url;a.download=f.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}catch(e){$('msg').textContent=errorLabel(e);}}
function documentStatus(status){const tones={APPROVED:'approved',REJECTED:'rejected',MORE_INFO_REQUIRED:'rejected',SUBMITTED:'submitted',IN_REVIEW:'submitted',UPLOADED:'uploaded',MISSING:'missing',NOT_REQUIRED:'not-required'},icons={APPROVED:'✓',REJECTED:'×',MORE_INFO_REQUIRED:'!',SUBMITTED:'→',IN_REVIEW:'○',UPLOADED:'↑',MISSING:'!',NOT_REQUIRED:'—'};return `<span class="document-status document-status--${tones[status]||'neutral'}"><span aria-hidden="true">${icons[status]||'·'}</span><span data-i18n="${esc(status)}">${esc(tt(status))}</span></span>`;}
function documentButton(label,action,id,tone='neutral',icon=''){return `<button type="button" class="document-button document-button--${tone}" data-action="${esc(action)}" data-id="${esc(id)}">${icon?'<span aria-hidden="true">'+icon+'</span>':''}<span data-i18n="${esc(label)}">${esc(tt(label))}</span></button>`;}
function documentReviewAllowed(f,metadata){return review()&&['EVIDENCE','SO'].includes(metadata?.kind)&&f.active==='YES'&&['SUBMITTED','IN_REVIEW','APPROVED'].includes(f.status);}
const documentDecisions={
 APPROVED:{label:'Approve evidence',confirm:'Confirm approval',tone:'approve',icon:'✓'},
 REJECTED:{label:'Reject evidence',confirm:'Confirm rejection',tone:'reject',icon:'×'},
 MORE_INFO_REQUIRED:{label:'Request more information',confirm:'Confirm information request',tone:'request',icon:'?'},
 IN_REVIEW:{label:'Mark as in review',confirm:'Confirm review started',tone:'neutral',icon:'○'}
};
function documentReviewPanel(f,metadata){
 if(!['EVIDENCE','SO'].includes(metadata?.kind))return '';
 const allowed=documentReviewAllowed(f,metadata),approved=f.status==='APPROVED',decisions=['APPROVED','MORE_INFO_REQUIRED','REJECTED'].filter(d=>d!==f.status);
 const choices=allowed?`<div id="reviewChoices" class="review-choices" ${approved?'hidden':''}>${f.status!=='IN_REVIEW'?'<button type="button" class="document-button document-button--neutral review-start" data-review-decision="IN_REVIEW"><span aria-hidden="true">○</span><span data-i18n="Mark as in review">'+esc(tt('Mark as in review'))+'</span></button>':''}${decisions.map(d=>{const option=documentDecisions[d];return `<button type="button" class="document-button document-button--${option.tone}" data-review-decision="${d}"><span aria-hidden="true">${option.icon}</span><span data-i18n="${option.label}">${esc(tt(option.label))}</span></button>`;}).join('')}</div>`:'';
 const message=f.active!=='YES'?'This is a previous version. Review the active version to make a decision.':!review()?'Review decisions are available to authorized reviewers.':f.status==='UPLOADED'?'Submit this version for review before making a decision.':['REJECTED','MORE_INFO_REQUIRED'].includes(f.status)?'Upload a revised version and submit it for review.':'';
 return `<section class="document-review-card" aria-labelledby="documentReviewHeading"><p class="eyebrow" data-i18n="Human review">${esc(tt('Human review'))}</p><h3 id="documentReviewHeading">Review decision</h3><p class="review-scope">Evidence approval records an internal review. It does not confirm EUDR compliance.</p>${metadata.reviewed_by?`<div class="review-record"><small data-i18n="Last reviewed by">${esc(tt('Last reviewed by'))}</small><p>${esc(metadata.reviewed_by)}${metadata.reviewed_at?'<br><small>'+esc(new Date(metadata.reviewed_at).toLocaleString(i18n.language==='vi'?'vi-VN':'en-GB',{timeZone:'Asia/Ho_Chi_Minh'}))+'</small>':''}</p>${metadata.review_comment?'<blockquote>'+esc(metadata.review_comment)+'</blockquote>':''}</div>`:''}${message?'<p class="review-hint">'+esc(tt(message))+'</p>':''}${allowed&&approved?'<button type="button" id="changeReviewDecision" class="document-button document-button--neutral"><span data-i18n="Change review decision">'+esc(tt('Change review decision'))+'</span></button>':''}${choices}${allowed?'<form id="documentReviewForm" class="review-confirmation" hidden><h3 id="reviewConfirmationTitle"></h3><p class="review-target">'+esc(f.name)+' · v'+esc(f.version)+'</p><div id="reviewTransition" class="review-transition"></div><label id="reviewNoteLabel" for="reviewNote"></label><textarea id="reviewNote" rows="4" maxlength="2000" aria-describedby="reviewNoteHelp"></textarea><small id="reviewNoteHelp">Decision notes are shared with the supplier and saved in the audit trail.</small><p id="reviewFeedback" class="review-feedback" role="alert" aria-live="assertive"></p><div class="review-confirmation-actions"><button type="button" id="cancelDocumentReview" class="document-button document-button--neutral"><span data-i18n="Back">'+esc(tt('Back'))+'</span></button><button type="submit" id="confirmDocumentReview" class="document-button"></button></div></form>':''}</section>`;
}
function bindDocumentReview(f,metadata){
 const form=$('documentReviewForm');if(!form)return;let decision='';
 const choose=status=>{if(!documentReviewAllowed(f,metadata)||!documentDecisions[status]||status===f.status)return;decision=status;const option=documentDecisions[status];$('reviewChoices').hidden=true;if($('changeReviewDecision'))$('changeReviewDecision').hidden=true;form.hidden=false;
  $('reviewConfirmationTitle').dataset.i18n=option.confirm;$('reviewConfirmationTitle').textContent=tt(option.confirm);$('reviewTransition').innerHTML=documentStatus(f.status)+'<span aria-hidden="true">→</span>'+documentStatus(status);
  const required=['REJECTED','MORE_INFO_REQUIRED'].includes(status),noteLabel=required?'Reason / required changes (required)':'Review note (optional)',placeholder=status==='MORE_INFO_REQUIRED'?'Specify the missing information and what the supplier should provide.':status==='REJECTED'?'Explain why this version cannot be accepted.':'Record the checks completed or any relevant observations.';$('reviewNote').required=required;$('reviewNoteLabel').dataset.i18n=noteLabel;$('reviewNoteLabel').textContent=tt(noteLabel);$('reviewNote').placeholder=tt(placeholder);$('reviewFeedback').textContent='';$('confirmDocumentReview').className='document-button document-button--'+option.tone;$('confirmDocumentReview').innerHTML='<span aria-hidden="true">'+option.icon+'</span><span data-i18n="'+option.confirm+'">'+esc(tt(option.confirm))+'</span>';$('reviewNote').focus();
 };
 document.querySelectorAll('[data-review-decision]').forEach(b=>b.onclick=()=>choose(b.dataset.reviewDecision));
 if($('changeReviewDecision'))$('changeReviewDecision').onclick=()=>{$('changeReviewDecision').hidden=true;$('reviewChoices').hidden=false;$('reviewChoices').querySelector('button')?.focus();};
 $('cancelDocumentReview').onclick=()=>{decision='';form.hidden=true;$('reviewChoices').hidden=false;$('reviewFeedback').textContent='';$('reviewChoices').querySelector('button')?.focus();};
 form.onsubmit=async e=>{e.preventDefault();if(busy||!decision||!documentReviewAllowed(f,metadata))return;const note=$('reviewNote').value.trim();if(['REJECTED','MORE_INFO_REQUIRED'].includes(decision)&&!note){$('reviewFeedback').textContent=tt('Enter a reason before confirming this decision.');$('reviewNote').focus();return;}if(!form.reportValidity())return;
  busy=true;const controls=[...$('drawer').querySelectorAll('button')].map(b=>[b,b.disabled]);controls.forEach(([b])=>b.disabled=true);$('reviewFeedback').textContent=tt('Saving…');
  try{await call('reviewDocument',f.id,decision,note);closeDrawer();await load();$('msg').textContent=tt('Review decision saved.');}
  catch(error){$('reviewFeedback').textContent=errorLabel(error);}
  finally{busy=false;controls.forEach(([b,disabled])=>{if(b.isConnected)b.disabled=disabled;});}
 };
}
async function documentView(id,initialPage=1){try{
 const f=await call('getDocument',id),metadata=state.docs.find(d=>d.id===id),processed=['REDACTED','EN_SUBTITLE','AI_OUTPUT'].includes(metadata?.kind),original=['EVIDENCE','SO'].includes(metadata?.kind);
 EudrNav.openViewer('document',id,{page:initialPage||1,title:f.name||id});
 const discussion=`<details class="document-details"><summary>${esc(tt('Comments'))} (${f.comments.length})</summary>${write()?'<form id="documentCommentForm"><label for="documentComment">'+esc(tt('Add a comment'))+'</label><textarea id="documentComment" rows="3" maxlength="3000" required></textarea>'+select('visibility','Comment visibility',supplier()?['SHARED_WITH_SUPPLIER']:['SHARED_WITH_SUPPLIER','INTERNAL_ONLY'])+'<button type="submit" class="document-button document-button--neutral">'+esc(tt('Add Comment'))+'</button></form>':''}${f.comments.length?f.comments.map(c=>`<article class="document-comment"><strong>${esc(c.author)}</strong><small>${esc(tt(c.visibility))} · ${esc(c.created_at)}</small><p>${esc(c.comment)}</p></article>`).join(''):'<p class="muted">'+esc(tt('No comments yet.'))+'</p>'}</details>`;
 const versions=`<details class="document-details"><summary>${esc(tt('Version history'))} (${f.versions.length})</summary>${f.versions.map(v=>`<div class="document-version">${documentButton('v'+v.version,'document',v.id)}${documentStatus(v.status)}<small>${esc(tt(v.active_version==='YES'?'Active version':'Previous version'))}</small></div>`).join('')}</details>`;
 const canRedact=cap('AI_USE')&&original&&f.status==='APPROVED'&&f.active==='YES',canTranslate=cap('AI_USE')&&(original||metadata?.kind==='REDACTED'&&metadata.redaction_verified==='YES')&&f.status==='APPROVED'&&f.active==='YES';
 const copies=canRedact||canTranslate?'<details class="document-details"><summary>'+esc(tt('Processed copies'))+'</summary><div class="document-tools">'+(canRedact?documentButton('Price Redaction Prompt','prompt:PRICE_REDACTION',id):'')+(canTranslate?documentButton('English Subtitle Prompt','prompt:ENGLISH_SUBTITLE',id):'')+'</div></details>':'';
 const sha=metadata?.sha256||f.sha256||'',shaBadge=sha?`<span class="sha-badge" title="SHA-256: ${esc(sha)}">${esc(tt('SHA-256 verified'))} · ${esc(String(sha).slice(0,12))}…</span>`:'';
 const sizeBytes=Number(metadata?.size_bytes||f.size||0),sizeBadge=sizeBytes>0?`<span>${Math.max(1,Math.round(sizeBytes/1024))} KB</span>`:'';
 drawer(`<header class="document-heading"><h2>${esc(f.name)} <span>· v${esc(f.version)}</span></h2><div class="document-meta">${documentStatus(f.status)}<span>${esc(tt(f.active==='YES'?'Active version':'Previous version'))}</span>${metadata?.document_type?'<span>'+esc(metadata.document_type)+'</span>':''}${shaBadge}${sizeBadge}</div></header><div class="document-file-toolbar" aria-label="${esc(tt('File actions'))}">${documentButton('Download','download',id,'file','↓')}${cap('EVIDENCE_UPLOAD')&&f.status==='UPLOADED'&&f.active==='YES'&&original?documentButton('Submit for review','submit',id):''}${review()&&original&&/FSC/i.test(metadata?.document_type||'')?documentButton('Certificate Metadata','certificate',id):''}</div><div class="viewer-layout document-viewer"><div id="preview" class="document-preview"></div><aside class="document-sidebar">${documentReviewPanel(f,metadata)}${review()&&processed&&f.status!=='APPROVED'?'<section class="document-review-card"><h3>Processed copy verification</h3><label for="verificationNote">Verification checks</label><textarea id="verificationNote" rows="4" maxlength="2000"></textarea>'+documentButton('Verify processed copy','verifyProcessed',id)+'</section>':''}${discussion}${versions}${copies}</aside></div>`);
 bind();bindDocumentReview(f,metadata);if($('documentCommentForm'))$('documentCommentForm').onsubmit=e=>{e.preventDefault();const comment=$('documentComment').value.trim();if(comment)act('addComment',id,{visibility:document.querySelector('[name="visibility"]').value,comment});};
 const controller=new AbortController();pdfPreviewAbort=controller;
 const documentBytes=await fileBytes(f,id);if(controller.signal.aborted)return;
 if(f.type==='application/pdf'){
  $('preview').innerHTML=EudrOps.skeleton('Loading PDF preview…',4);
  try{const {renderPdfPreview}=await import('/pdf-preview.mjs'),cleanup=await renderPdfPreview($('preview'),documentBytes,{signal:controller.signal,initialPage:initialPage||1,onPageChange:page=>EudrNav.updateViewerPage(id,page)});if(pdfPreviewAbort===controller)pdfPreviewCleanup=cleanup;else cleanup();}
  catch(error){if(!controller.signal.aborted){$('preview').textContent=tt('PDF preview unavailable. Use Download to inspect the original.');$('msg').textContent=tt('PDF_PREVIEW_UNAVAILABLE');}}
 }else if(['image/png','image/jpeg','image/webp'].includes(f.type)){documentUrl=URL.createObjectURL(new Blob([documentBytes],{type:f.type}));const img=document.createElement('img');img.alt=f.name;img.src=documentUrl;$('preview').append(img);}else{const pre=document.createElement('pre');pre.textContent=new TextDecoder().decode(documentBytes);$('preview').append(pre);}
 }catch(e){$('msg').textContent=errorLabel(e);}}
function upload(id){const input=document.createElement('input');input.type='file';input.accept='.pdf,.png,.jpg,.jpeg,.json,.geojson';input.onchange=async()=>{try{const selectedFile=input.files[0];if(selectedFile?.size>=2000000){if(selectedFile.size>=3000000)throw Error('FILE_TOO_LARGE');const result=await largeUpload(id,null,selectedFile);if(result){closeDrawer();await load();$('msg').textContent='File uploaded.';}return;}const file=await fileData(selectedFile);file.expected_document_id=state.tasks.find(t=>t.id===id)?.document_id||'';await act('uploadEvidence',id,file);}catch(e){$('msg').textContent=errorLabel(e);}};input.click();}
async function largeUpload(id,kind,file){if(!file.size||file.size>=3000000)throw Error('FILE_TOO_LARGE');const task=kind?state.tasks.find(t=>t.id===state.docs.find(d=>d.id===id)?.task_id):state.tasks.find(t=>t.id===id);if(!task)throw Error('Upload task not found');const totalChunks=Math.ceil(file.size/1048576),opId=EudrOps.start({action:'uploadChunk',label:`Uploading ${file.name||'evidence'}`,level:4,progress:0,unitLabel:`0/${totalChunks} chunks`});try{const buffer=await file.arrayBuffer(),sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',buffer))].map(v=>v.toString(16).padStart(2,'0')).join(''),storageKey='eudr_upload_'+state.user.email+'_'+task.id+'_'+sha256+'_'+(kind||'EVIDENCE');let sessionId=sessionStorage.getItem(storageKey);if(!sessionId){const metadata={name:file.name,type:file.type||'application/geo+json',size:file.size,sha256,expected_document_id:task.document_id||''};if(kind){metadata.kind=kind;metadata.source_document_id=id;}const session=await call('beginUpload',task.id,metadata);sessionId=session.id;sessionStorage.setItem(storageKey,sessionId);}for(let index=0;index<totalChunks;index++){const bytes=new Uint8Array(buffer,index*1048576,Math.min(1048576,file.size-index*1048576));let text='';for(let j=0;j<bytes.length;j+=8192)text+=String.fromCharCode(...bytes.subarray(j,j+8192));const pct=Math.round((index+1)/totalChunks*100);$('msg').textContent='Uploading '+pct+'%';EudrOps.update(opId,{progress:pct,unitLabel:`${index+1}/${totalChunks} chunks`});await call('uploadChunk',sessionId,index,btoa(text));}const result=await call('finishUpload',sessionId);sessionStorage.removeItem(storageKey);EudrOps.succeed(opId,'File uploaded.');return result;}catch(e){EudrOps.fail(opId,e,{uncertain:e.status>=500});throw e;}}
function promptStudio(){$('main').innerHTML='<div class="card"><p class="eyebrow">PROMPT STUDIO</p><h2>AI Assistant</h2><p>Choose a source document. AI saves its PDF and manifest to the connected Drive folder; View AI Results lists the output.</p>'+select('promptOrder','Order',state.cases.map(c=>[c.id,c.so]),selected)+select('promptFunction','Function',['DOCUMENT_REVIEW','PRICE_REDACTION','ENGLISH_SUBTITLE'])+'<div id="promptSource"></div><button id="generatePrompt">Generate Prompt</button><div id="promptResult"></div></div>';const update=()=>{const caseId=document.querySelector('[name="promptOrder"]').value,fn=document.querySelector('[name="promptFunction"]').value,docs=state.docs.filter(d=>d.case_id===caseId&&d.active_version==='YES'&&(fn==='ENGLISH_SUBTITLE'?['SO','EVIDENCE'].includes(d.kind)||d.kind==='REDACTED'&&d.redaction_verified==='YES':['SO','EVIDENCE'].includes(d.kind))&&(fn==='DOCUMENT_REVIEW'||d.status==='APPROVED'));$('promptSource').innerHTML=select('promptDocument','Source document',fn==='DOCUMENT_REVIEW'?[['','All active original documents'],...docs.map(d=>[d.id,d.name+' · '+d.status])]:docs.map(d=>[d.id,d.name+' · '+d.status]));$('generatePrompt').disabled=fn!=='DOCUMENT_REVIEW'&&!docs.length;};document.querySelector('[name="promptOrder"]').onchange=update;document.querySelector('[name="promptFunction"]').onchange=update;update();$('generatePrompt').onclick=()=>showPrompt(document.querySelector('[name="promptOrder"]').value,document.querySelector('[name="promptFunction"]').value,document.querySelector('[name="promptDocument"]')?.value||'');}
async function showPrompt(caseId,fn,id=''){try{
 const r=await call('getAiPrompt',caseId,fn,id),derived=['PRICE_REDACTION','ENGLISH_SUBTITLE'].includes(fn);
 drawer('<h2>'+esc(fn.replace(/_/g,' '))+'</h2><label>Generated prompt<textarea id="promptText" rows="15"></textarea></label><div class="row"><button id="copyPrompt">Copy Prompt</button><a class="link" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Open ChatGPT</a></div><p>Attach the exact PDF; a Drive link alone is not file access.</p><label>Structured result JSON<textarea id="aiJson" rows="6"></textarea></label><button id="importAi">Import AI Result</button><div id="importResult"></div>');
 $('promptText').value=r.prompt;renderPromptContext(r.context);if(derived){$('aiJson').closest('label').hidden=true;$('importAi').hidden=true;$('importResult').textContent='AI saves the PDF and matching manifest into the authorized Drive folder. Open View AI Results to see the registered output; no file upload here.';}
 $('copyPrompt').onclick=async()=>{try{await navigator.clipboard.writeText(r.prompt);$('msg').textContent='Copied.';}catch{$('promptText').select();$('msg').textContent='Select and copy the prompt.'}};
 $('importAi').onclick=async()=>{try{const data=await call('importAiResult',r.id,$('aiJson').value);$('importResult').textContent=JSON.stringify(data,null,2);}catch(e){$('msg').textContent=errorLabel(e);}};
 }catch(e){$('msg').textContent=errorLabel(e);}}
function renderPromptContext(context){if(!context)return;const panel=document.createElement('section');panel.className='card context-panel';panel.innerHTML='<h3>Workspace context</h3><p><strong>'+esc(tt('Order'))+':</strong> '+esc(context.order||'—')+'</p><p>Open the exact source in Drive or download it through this Workspace, then attach the PDF to ChatGPT. A link alone does not supply the file.</p>';for(const doc of context.selected_documents||[]){const row=document.createElement('div');row.className='row prompt-source';const name=document.createElement('span');name.textContent=(doc.name||'Missing filename')+' · ID '+(doc.document_id||'—')+' · v'+(doc.version||'—');row.append(name);if(/^https:\/\/drive\.google\.com\/file\/d\/[^/]+\/view$/.test(doc.file_url||'')){const a=document.createElement('a');a.className='link';a.target='_blank';a.rel='noopener noreferrer';a.href=doc.file_url;a.textContent=tt('Open Source File');row.append(a);}if(doc.document_id){const button=document.createElement('button');button.type='button';button.textContent=tt('Download');button.onclick=()=>download(doc.document_id);row.append(button);}panel.append(row);}for(const [key,url] of Object.entries(context.ai_output_folders||{})){if(!/^https:\/\/drive\.google\.com\/drive\/folders\/[^/]+$/.test(url))continue;const a=document.createElement('a');a.className='link';a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=key==='root'?'AI Output folder':key+' output folder';const row=document.createElement('div');row.className='row';row.append(a);panel.append(row);}const promptLabel=$('promptText').closest('label');promptLabel.before(panel);i18n.translateUI(panel);}

function chainDialog(id){const m=state.materials.find(m=>m.id===id);if(!m)return;const nodes=state.chain.filter(n=>n.material_id===id);drawer('<h2>Add Relationship · '+esc(m.material)+'</h2><form id="chainForm"><input id="supplierSearch" placeholder="Search supplier name / code">'+select('supplier_id','Select Existing Supplier',[['','Producer / forest owner'],...state.suppliers.filter(s=>s.active==='YES'&&!s.merged_into_id&&s.identity_status!=='MERGED').map(s=>[s.id,s.name+' '+(s.supplier_code||'')])])+button('Create New Supplier','supplierForm','')+field('display_name','Producer / forest owner name')+select('parent_id','Parent relationship',[['','KODA'],...nodes.map(n=>[n.id,n.display_name||n.id])],selectedChainNode)+select('node_type','Node Type',['SUPPLIER','PROCESSOR','TRADER','PRODUCER','FOREST_OWNER','PLOT'])+field('plot_id','Plot ID')+select('terminal','Final producer in this branch',['NO','YES'])+select('source_document_id','Source evidence',[['','MISSING'],...state.docs.filter(d=>d.material_id===id).map(d=>[d.id,d.name])])+'<button type="submit">Add Relationship</button></form>');$('chainForm').querySelector('[data-action]').type='button';$('chainForm').onsubmit=e=>{e.preventDefault();act('addChainNode',m.case_id,{...Object.fromEntries(new FormData(e.target)),material_id:id});};$('supplierSearch').oninput=e=>{const q=e.target.value.toLowerCase();$('chainForm').elements.supplier_id.querySelectorAll('option').forEach(o=>o.hidden=!!o.value&&!o.textContent.toLowerCase().includes(q));};bind();}

function reviewGeoDialog(id){const g=(state?.geo||[]).find(x=>x.id===id);if(g?.material_id&&window.EudrGeo?.open)return geoDialog(g.material_id,{initialTab:'review',initialPlotId:id});EudrNav.openViewer('reviewGeo',id,{title:'GEO review'});drawer('<h2>GEO review</h2><form id="geoReviewForm">'+select('status','Decision',['VERIFIED','REJECTED','MORE_INFO_REQUIRED'])+'<label>Review notes<textarea name="notes" required rows="4"></textarea></label><p>Verification does not certify deforestation-free status or legal compliance.</p><button>Record review</button></form>');$('geoReviewForm').onsubmit=e=>{e.preventDefault();act('reviewGeo',id,Object.fromEntries(new FormData(e.target)));};}
function geoDialog(id,opts={}){const m=state.materials.find(x=>x.id===id);if(m){if(m.case_id)selected=m.case_id;material=id;}EudrNav.openViewer('geo',id,{title:m?.material||tt('GeoJSON Map')});return window.EudrGeo.open({state,materialId:id,productId:selectedProduct,sourceId:selectedSource,chainNodeId:selectedChainNode,initialTab:opts.initialTab||'',initialPlotId:opts.initialPlotId||'',call,drawer,refresh:async()=>{await load();return state;},onDocument:documentView,onReview:reviewGeoDialog,ops:EudrOps,nav:EudrNav});}
function calendarDay(day){const tasks=state.tasks.filter(t=>taskForUser(t)&&t.due===day);drawer('<h2>Tasks due · '+esc(day)+'</h2><p>'+tasks.length+' task(s) for your role.</p>'+taskTable(tasks));bind();}
function calendar(){const y=month.getFullYear(),m=month.getMonth(),date=d=>`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,visible=state.tasks.filter(t=>taskForUser(t)&&t.due);
 const syncedCount=visible.filter(t=>t.calendar_sync_status==='SYNCED').length,failedCount=visible.filter(t=>['CALENDAR_SYNC_FAILED','CALENDAR_ACCESS_REQUIRED'].includes(t.calendar_sync_status)).length;
 let html='<div class="card"><div class="pagehead"><h2>Calendar · '+month.toLocaleDateString('en',{month:'long',year:'numeric'})+'</h2><div class="row"><button id="prevMonth">Previous</button><button id="nextMonth">Next</button></div></div><div class="row">'+['Month','Week','List','My Tasks'].map(mode=>`<button data-calendar-mode="${mode}" aria-pressed="${calendarMode===mode}">${mode}</button>`).join('')+(roles('ADMIN','MARKETING','EUDR_REVIEWER','MP','PURCHASING','SOURCING')?button('Sync task invitations','syncCalendar'):'')+`<span class="status-pill">${esc(tt('Synced events'))}: ${syncedCount}/${visible.length}</span>${failedCount?`<span class="status-pill warning">${failedCount} sync attention</span>`:''}`+'</div><p>Evidence deadlines for your role. Assigned owners and reviewers receive Google Calendar invitations; they may need to accept an invitation email. Click a date to see its tasks.</p>';
 if(calendarMode==='Month'){html+='<div class="scroll"><div class="calendar">'+['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>'<b>'+d+'</b>').join('')+'<div></div>'.repeat((new Date(y,m,1).getDay()+6)%7);for(let day=1;day<=new Date(y,m+1,0).getDate();day++){const due=visible.filter(t=>t.due===date(day)),pending=due.filter(t=>t.status!=='APPROVED');html+=`<div class="day"><span>${day}</span>${due.length?`<button type="button" class="event calendar-day-link" data-calendar-day="${date(day)}">${due.length} task${due.length===1?'':'s'} · ${pending.length} pending</button>`:''}</div>`;}html+='</div></div>';}
 else{let ts=visible;if(calendarMode==='Week'){const start=new Date(month.getFullYear(),month.getMonth(),month.getDate(),12);start.setDate(start.getDate()-(start.getDay()+6)%7);const end=new Date(start);end.setDate(end.getDate()+6);const fmt=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;ts=ts.filter(t=>t.due>=fmt(start)&&t.due<=fmt(end));}html+=taskTable(ts.sort((a,b)=>a.due.localeCompare(b.due)));}
 $('main').innerHTML=html+'</div>';$('prevMonth').onclick=()=>{month=new Date(y,m-1,1);calendar();bind();};$('nextMonth').onclick=()=>{month=new Date(y,m+1,1);calendar();bind();};document.querySelectorAll('[data-calendar-mode]').forEach(b=>b.onclick=()=>{calendarMode=b.dataset.calendarMode;calendar();bind();});document.querySelectorAll('[data-calendar-day]').forEach(b=>b.onclick=()=>calendarDay(b.dataset.calendarDay));i18n.translateUI($('main'));}

function users(){$('main').innerHTML='<div class="pagehead"><h2>Users</h2>'+button('Add User','userForm')+'</div><div class="card scroll"><table><tr><th>Name / Email</th><th>Function</th><th>Role</th><th>Supplier</th><th>Active</th><th></th></tr>'+state.owners.map(u=>`<tr><td>${esc(u.name)}<br>${esc(u.email)}</td><td>${esc(u.department)}</td><td>${esc(u.role)}</td><td>${esc(state.suppliers.find(s=>s.id===u.supplier_id)?.name)}</td><td>${esc(u.active)}</td><td>${button('Edit','userForm',u.email)}${u.role==='ADMIN'?'':button('Capabilities','grantCaps',u.email)+button('Remove','removeUser',u.email)}${u.active==='YES'&&!u.auth_uid?button('Provision Login','provision',u.email):''}</td></tr>`).join('')+'</table></div><p>Individual credentials are provisioned by the administrator. Removing a login disables it and retains the audit record.</p>';}
function userForm(email){const u=state.owners.find(u=>u.email===email)||{},orders=JSON.parse(u.assigned_orders||'[]');drawer('<h2>User access</h2><form id="userForm">'+field('name','Full Name','text',u.name||'',true)+field('email','Email','email',u.email||'',true)+field('department','Function / Department','text',u.department||'')+select('role','Security Role',['ADMIN','MARKETING','MP','PURCHASING','SOURCING','EUDR_REVIEWER','INTERNAL_USER','SUPPLIER_USER','VIEWER'],u.role||'INTERNAL_USER')+select('supplier_id','Supplier / Company',[['','Internal'],...state.suppliers.filter(s=>s.active==='YES'&&!s.merged_into_id&&s.identity_status!=='MERGED').map(s=>[s.id,s.name])],u.supplier_id||'')+select('active','Active',['YES','NO'],u.active||'YES')+'<fieldset><legend>Assigned Orders</legend>'+state.cases.map(c=>`<label class="check"><input type="checkbox" name="order" value="${esc(c.id)}" ${orders.includes(c.id)?'checked':''}>${esc(c.so)}</label>`).join('')+'</fieldset><button>Save User</button></form>');$('userForm').elements.email.readOnly=!!u.email;$('userForm').onsubmit=async e=>{e.preventDefault();const form=new FormData(e.target),input=Object.fromEntries(form);input.assigned_orders=form.getAll('order');delete input.order;const saved=await act('manageUser',input);if(saved&&u.auth_uid&&input.active!==u.active){try{await authAction({action:'setEnabled',email:input.email,enabled:input.active==='YES'});}catch(error){$('msg').textContent=errorLabel(error);}}};}
async function provisionUser(email){if(!roles('ADMIN'))return;try{const result=await authAction({action:'provision',email});await load();drawer('<h2>Temporary password</h2><p>Copy this password now and deliver it through an approved secure channel. It will not be displayed again.</p><label>Username / Email<input readonly value="'+esc(result.email)+'"></label><label>Temporary password<input readonly type="text" value="'+esc(result.temporaryPassword)+'"></label><p>First login requires a password change.</p>');}catch(error){$('msg').textContent=errorLabel(error);}}
function suppliers(){if(window.EudrSupplierIdentity){window.EudrSupplierIdentity.directory({call,state,main:$('main'),drawer,edit:supplierForm,refresh:async()=>{state=await call('bootstrap');return state;}});return;}$('main').innerHTML='<div class="pagehead"><h2>Suppliers</h2>'+button('Add Supplier','supplierForm')+'</div>'+state.suppliers.map(s=>`<div class="card"><h3>${esc(s.name)}</h3>${esc(s.email)} · ${s.active==='YES'?'Active':'Disabled'}<p>${button('Edit','supplierForm',s.id)} ${button('Remove','removeSupplier',s.id)}</p></div>`).join('');}

function supplierForm(id){const s=state.suppliers.find(s=>s.id===id)||{};drawer('<h2>Supplier Master</h2><form id="supplierForm">'+['name','supplier_code','address','country','contact_person','email','phone','registration'].map(k=>field(k,k,'text',s[k]||'',k==='name')).join('')+select('active','Active',['YES','NO'],s.active||'YES')+'<button>Save Supplier</button></form>');$('supplierForm').onsubmit=e=>{e.preventDefault();const value=Object.fromEntries(new FormData(e.target));if(id){value.id=id;value.expected_updated_at=s.updated_at||'';act('manageSupplier',value);}else if(window.EudrSupplierIdentity){window.EudrSupplierIdentity.register({input:value,call,drawer,done:async()=>{state=await call('bootstrap');closeDrawer();render();}}).catch(error=>$('msg').textContent=error.message);}else act('manageSupplier',value);};}
function removeDialog(action,id){const node=state.chain.find(n=>n.id===id),label=action==='removeMaterial'?state.materials.find(m=>m.id===id)?.material:action==='removeChainNode'?node?.relationship||node?.display_name:action==='removeSupplier'?state.suppliers.find(s=>s.id===id)?.name:action==='removeScopedRequirement'?state.tasks.find(t=>t.id===id)?.evidence:state.owners.find(u=>u.email===id)?.name||id;if(!label)return;
 drawer('<h2>Remove '+esc(action==='removeMaterial'?'Material':action==='removeChainNode'?'Relationship':action==='removeSupplier'?'Supplier':action==='removeScopedRequirement'?'Evidence Type':'User')+'</h2><p><strong>'+esc(label)+'</strong></p><p>Linked evidence, GEO and active assignments are protected. Drive folders and audit history are retained.</p><form id="removeForm"><label>Reason for removal<textarea name="reason" required maxlength="1000" rows="3"></textarea></label><label class="check"><input type="checkbox" name="confirmed" required> I have checked the selected record.</label><button type="submit">Confirm Remove</button></form>');
 $('removeForm').onsubmit=async e=>{e.preventDefault();if(busy)return;const btn=e.target.querySelector('button'),reason=new FormData(e.target).get('reason');busy=true;btn.disabled=true;try{if(action==='removeUser'){const prepared=await call('prepareRemoveUser',id,reason);if(prepared.auth_uid)await authAction({action:'setEnabled',email:id,enabled:false});await call('removeUser',id,reason);}else await call(action,id,reason);if(action==='removeMaterial'&&material===id){material='';selectedChainNode='';}if(action==='removeChainNode'&&selectedChainNode===id)selectedChainNode='';closeDrawer();await load();$('msg').textContent=tt('Removed.');}catch(error){$('msg').textContent=errorLabel(error);}finally{busy=false;if(btn.isConnected)btn.disabled=false;}};}

function settings(){
 const keys=['RULES_CONFIRMED','LEGAL_RULE_VERSION','LEGAL_RULE_SOURCE_URL','ANNEX_I_VERSION','ANNEX_I_SOURCE_URL','COUNTRY_RISK_VERSION','COUNTRY_RISK_SOURCE_URL','LAST_LEGAL_REVIEW_DATE','LEGAL_REVIEWED_BY','LEGAL_REVIEW_MAX_DAYS'];
 const rules=state.regulationRules||[],risks=state.countryRisk||[];
 const tierTone=t=>t==='LEGAL_REQUIREMENT'?'tier-legal':t==='CUSTOMER_REQUIREMENT'?'tier-customer':'tier-internal';
 const tierOrder={LEGAL_REQUIREMENT:1,CUSTOMER_REQUIREMENT:2,KODA_INTERNAL_POLICY:3};
 const sortedRules=rules.slice().sort((a,b)=>(tierOrder[a.category]||9)-(tierOrder[b.category]||9)||String(b.effective_date||'').localeCompare(String(a.effective_date||'')));
 const safeUrl=u=>/^https:\/\//.test(String(u||''))?String(u):'';
 const rulesTable=sortedRules.length?`<div class="scroll"><table class="regulation-table"><thead><tr><th>${esc(tt('Rule ID'))}</th><th>${esc(tt('Tier / Type'))}</th><th>${esc(tt('Scope'))}</th><th>${esc(tt('Required data'))}</th><th>${esc(tt('Effective Date'))}</th><th>${esc(tt('Reviewed by'))}</th><th>${esc(tt('Status'))}</th></tr></thead><tbody>${sortedRules.map(r=>`<tr><td><strong>${esc(r.id)}</strong><br><small>${esc(r.rule_version||'')}</small></td><td><span class="reg-tier-badge ${tierTone(r.category)}">${esc(tt(r.category||'—'))}</span></td><td>${esc(r.scope)}${safeUrl(r.source_url)?`<br><a class="link" href="${esc(safeUrl(r.source_url))}" target="_blank" rel="noopener noreferrer">${esc(tt('Source'))}</a>`:''}</td><td>${esc(r.required_data)}<br><small>${esc(r.validation_method)}</small></td><td>${esc(String(r.effective_date||'—').slice(0,10))}</td><td>${esc(r.reviewed_by||'—')}<br><small>${esc(String(r.reviewed_at||'').slice(0,10))}</small></td><td>${esc(r.status||'—')}</td></tr>`).join('')}</tbody></table></div>`:`<p class="muted">${esc(tt('No regulation or policy rules are registered yet.'))}</p>`;
 const risksTable=risks.length?`<div class="scroll"><table class="regulation-table"><thead><tr><th>${esc(tt('ISO Country'))}</th><th>${esc(tt('Risk Tier'))}</th><th>${esc(tt('Rule Version'))}</th><th>${esc(tt('Checked date'))}</th></tr></thead><tbody>${risks.map(r=>`<tr><td><strong>${esc(r.country_code)}</strong></td><td><span class="status-pill ${r.risk_level==='HIGH'?'warning':''}">${esc(r.risk_level)}</span></td><td>${esc(r.rule_version)}</td><td>${esc(String(r.checked_at||'—').slice(0,10))}</td></tr>`).join('')}</tbody></table></div>`:'';
 const registryForm=!state.regulationRegistryReady?`<p class="warn">${esc(tt('The regulation registry sheet (43_REGULATION_RULES) is not available. Apply the reviewed v2.9 migration on staging before registering rules.'))}</p>`:'<form id="regulationRuleForm"><h4>'+esc(tt('Register Regulation or Policy Rule'))+'</h4><p class="muted">'+esc(tt('Rules are immutable versioned records. To change a rule, register a new ID and version.'))+'</p>'+field('id','Rule ID (unique, e.g. EUDR-ART9-GEO-V1)','text','',true)+select('category','Tier / Type',[['LEGAL_REQUIREMENT',tt('LEGAL_REQUIREMENT (Tier 1 — EU Law)')],['CUSTOMER_REQUIREMENT',tt('CUSTOMER_REQUIREMENT (Tier 2 — Customer SOP)')],['KODA_INTERNAL_POLICY',tt('KODA_INTERNAL_POLICY (Tier 3 — Internal Policy)')]],'LEGAL_REQUIREMENT')+field('rule_version','Rule Version','text','',true)+field('effective_date','Effective Date','date',today(),true)+field('source_url','Official source URL (https)','url','',true)+'<label>'+esc(tt('Scope'))+'<textarea name="scope" rows="2" maxlength="2000" required></textarea></label><label>'+esc(tt('Required data'))+'<textarea name="required_data" rows="2" maxlength="2000" required></textarea></label><label>'+esc(tt('Validation method'))+'<textarea name="validation_method" rows="2" maxlength="2000" required></textarea></label><label class="check"><input type="checkbox" name="confirmed" required> '+esc(tt('I reviewed this rule against the cited source. Registering a rule does not certify EUDR compliance.'))+'</label><button type="submit">'+esc(tt('Save Rule'))+'</button></form>';
 $('main').innerHTML='<div class="card"><h2>Settings · Legal freshness</h2><p>Record the exact official versions checked and the responsible human reviewer. A version label alone does not validate evidence.</p><form id="settingsForm">'+keys.map(k=>k==='RULES_CONFIRMED'?select(k,k,['NO','YES'],state.settings.find(s=>s.key===k)?.value):field(k,k,k==='LAST_LEGAL_REVIEW_DATE'?'date':k.endsWith('_SOURCE_URL')?'url':'text',state.settings.find(s=>s.key===k)?.value||'')).join('')+'<button>Save Settings</button></form><h3>Production country risk</h3><p>Country risk applies to commodity production origin. Register only classifications checked against official EU sources.</p>'+risksTable+'<form id="riskForm">'+field('country_code','ISO country code','text','',true)+select('risk_level','Risk',['LOW','STANDARD','HIGH'])+field('rule_version','Official version','text','',true)+field('checked_at','Checked date','date','',true)+field('source_url','Official EU source URL','url','',true)+'<button>Record Human Review</button></form><hr class="section-divider"><h3>'+esc(tt('Regulatory Rule Registry (3-Tier Hierarchy)'))+'</h3><p>'+esc(tt('Tier 1: Official EU legislation · Tier 2: Customer requirements · Tier 3: KODA internal policies. Each tier is recorded separately; customer and internal rules never override EU law.'))+'</p>'+rulesTable+registryForm+'</div>';
 $('settingsForm').onsubmit=e=>{e.preventDefault();act('saveSettings',Object.fromEntries(new FormData(e.target)));};
 $('riskForm').onsubmit=e=>{e.preventDefault();act('saveCountryRisk',Object.fromEntries(new FormData(e.target)));};
 if($('regulationRuleForm'))$('regulationRuleForm').onsubmit=e=>{e.preventDefault();const input=Object.fromEntries(new FormData(e.target));input.confirmed=input.confirmed==='on';input.rule_json={};act('saveKodaRegulationRule',input);};
}
function audit(){$('main').innerHTML='<div class="card scroll"><h2>Audit Trail</h2><p>Append-only history. Latest 250 entries in assigned scope.</p><table><tr><th>Time</th><th>Actor</th><th>Action</th><th>Order / Object</th><th>Change</th></tr>'+state.audit.slice().reverse().map(a=>`<tr><td>${esc(a.timestamp)}</td><td>${esc(a.actor)}</td><td>${esc(a.action)}</td><td>${esc(state.cases.find(c=>c.id===a.case_id)?.so)}<br>${esc(a.entity_id)}</td><td>${esc(a.next)}</td></tr>`).join('')+'</table></div>';}
function exports(){
 const selectedOrders=new Set(selected?[selected]:state.cases.slice(0,1).map(c=>c.id)),documentSelections=new Map();
 $('main').innerHTML='<div class="card"><h2>Export Center</h2><p>Choose one or more orders. Each order gets its own ZIP in its Drive export folder, with a separate download button. Approved originals and human-verified AI copies are shown separately.</p><fieldset class="export-order-picker"><legend>Orders to export</legend>'+state.cases.map(c=>`<label class="check"><input name="exportOrder" type="checkbox" value="${esc(c.id)}" ${selectedOrders.has(c.id)?'checked':''}><span>${esc(c.so)}</span></label>`).join('')+'</fieldset><div id="exportList"></div></div>';
 const available=d=>d.status==='APPROVED'&&d.active_version==='YES'&&(d.kind==='REDACTED'?d.redaction_verified==='YES':d.kind==='EN_SUBTITLE'?d.translation_verified==='YES':true);
 const draw=()=>{const chosen=state.cases.filter(c=>selectedOrders.has(c.id));selected=chosen[0]?.id||selected;const column=(caseId,title,items)=>`<fieldset class="export-column"><legend>${esc(title)}</legend>${items.length?items.map(d=>`<label class="check"><input name="exportDoc" type="checkbox" value="${esc(d.id)}" data-case-id="${esc(caseId)}" ${!available(d)?'disabled':(documentSelections.has(caseId)?documentSelections.get(caseId).has(d.id):true)?'checked':''}><span>${esc(d.name)} · v${esc(d.version)} · ${esc(d.status)}${available(d)?'':' · Not exportable yet'}</span></label>`).join(''):'<p class="muted">No documents in this group.</p>'}</fieldset>`;
 $('exportList').innerHTML=chosen.length?chosen.map(c=>{const docs=state.docs.filter(d=>d.case_id===c.id);return `<section class="export-order-section" data-export-order="${esc(c.id)}"><h3>${esc(c.so)}</h3><div class="export-columns">${column(c.id,'Original approved documents',docs.filter(d=>['SO','EVIDENCE'].includes(d.kind)))}${column(c.id,'AI processed copies',docs.filter(d=>['REDACTED','EN_SUBTITLE'].includes(d.kind)))}</div></section>`;}).join('')+'<div class="workspace-actions"><button id="exportFull">Full Package</button><button id="exportSelected">Selected Package</button></div>':'<p class="muted">Select at least one order.</p>';
 document.querySelectorAll('[name="exportDoc"]').forEach(input=>input.onchange=()=>{const caseId=input.dataset.caseId;if(!documentSelections.has(caseId))documentSelections.set(caseId,new Set([...document.querySelectorAll('[name="exportDoc"]:checked')].filter(i=>i.dataset.caseId===caseId).map(i=>i.value)));else if(input.checked)documentSelections.get(caseId).add(input.value);else documentSelections.get(caseId).delete(input.value);});
 const run=async full=>{const orders=chosen.map(c=>({case_id:c.id,...(full?{}:{document_ids:[...document.querySelectorAll('[name="exportDoc"]:checked')].filter(i=>i.dataset.caseId===c.id).map(i=>i.value)})}));if(!full&&orders.some(o=>!o.document_ids.length)){$('msg').textContent=tt('Select at least one approved document for each order.');return;}
 const opId=EudrOps.start({action:'exportPackages',label:'Exporting ZIP…',level:4,unitLabel:`${orders.length} order(s)`});
 drawer('<h2>Export packages</h2><p id="exportProgress" role="status">'+esc(tt('Exporting ZIP…'))+'</p><div id="exportResult"></div>');try{const result=await call('exportPackages',{orders}),packages=result.packages||[],errors=result.errors||[];if(packages.length)EudrOps.succeed(opId,tt('ZIP is ready.'));else EudrOps.fail(opId,Error('Export failed'));$('exportProgress').textContent=packages.length?tt('ZIP is ready.'):tt('Export failed.');$('exportResult').innerHTML=packages.map((p,i)=>`<p>${esc(state.cases.find(c=>c.id===p.case_id)?.so||p.case_id)} · ${esc(p.name)} · ${Math.ceil((p.size_bytes||0)/1048576*10)/10} MB <button type="button" data-download-export="${i}">${esc(tt('Download ZIP'))}</button></p>${p.excluded_document_ids?.length?`<p role="alert">${esc(tt('Excluded evidence with missing links:'))} ${esc(p.excluded_document_ids.map(id=>state.docs.find(d=>d.id===id)?.name||id).join(', '))}</p>`:''}`).join('')+(errors.length?'<p role="alert">'+esc(errors.map(e=>(state.cases.find(c=>c.id===e.case_id)?.so||e.case_id)+': '+tt(e.code)).join('; '))+'</p>':'')+(packages.length?'<p class="muted">Packages above 3 MB download in checked chunks without leaving this page.</p>':'');document.querySelectorAll('[data-download-export]').forEach(b=>b.onclick=()=>download(packages[Number(b.dataset.downloadExport)].download_id));}
 catch(error){EudrOps.fail(opId,error,{uncertain:error.status>=500});$('exportProgress').textContent=tt('Export failed.');$('exportResult').textContent=errorLabel(error);}};
 if($('exportFull'))$('exportFull').onclick=()=>run(true);if($('exportSelected'))$('exportSelected').onclick=()=>run(false);i18n.translateUI($('exportList'));};
 document.querySelectorAll('[name="exportOrder"]').forEach(input=>input.onchange=()=>{if(input.checked)selectedOrders.add(input.value);else selectedOrders.delete(input.value);draw();});draw();i18n.translateUI($('main'));}

function materialInfo(id){const m=state.materials.find(m=>m.id===id);if(!m)return;let countries=[];try{countries=JSON.parse(m.production_countries||'[]');}catch{}const risk=countries.map(code=>code+': '+(state.countryRisk.find(r=>r.country_code===code)?.risk_level||'NOT REVIEWED')).join('; ');drawer('<h2>Material Information · '+esc(m.material)+'</h2><p>Production country risk: '+esc(risk||'Production origin not provided')+'</p>'+ (cap('MATERIAL_EDIT')?'<form id="materialInfoForm">'+['commodity','common_species','scientific_name','hs_cn_code','quantity','quantity_uom','production_range'].map(k=>field(k,k.replace(/_/g,' '),'text',m[k]||'')).join('')+field('countries','Production countries (ISO codes, comma separated)','text',countries.join(','))+select('scope_status','Human scope assessment',['NOT_PROVIDED','REVIEW_REQUIRED','IN_SCOPE','OUT_OF_SCOPE'],m.scope_status||'NOT_PROVIDED')+field('scope_rule_version','Checked Annex I version','text',m.scope_rule_version||'')+select('metadata_source_document_id','Source for metadata',state.docs.filter(d=>d.case_id===m.case_id).map(d=>[d.id,d.name]),m.metadata_source_document_id||'')+field('metadata_reference','Source page and fields','text',m.metadata_reference||'',true)+field('legality','Legality evidence IDs (comma separated)','text',JSON.parse(m.legality_evidence_ids||'[]').join(','))+field('deforestation','Deforestation evidence IDs (comma separated)','text',JSON.parse(m.deforestation_evidence_ids||'[]').join(','))+'<button>Save source-backed information</button></form>':'<p>'+esc(m.scientific_name||'NOT PROVIDED')+'</p>'));if($('materialInfoForm'))$('materialInfoForm').onsubmit=e=>{e.preventDefault();const input=Object.fromEntries(new FormData(e.target)),list=s=>s.split(',').map(s=>s.trim()).filter(Boolean);input.production_countries=list(input.countries);input.legality_evidence_ids=list(input.legality);input.deforestation_evidence_ids=list(input.deforestation);delete input.countries;delete input.legality;delete input.deforestation;act('updateMaterialInfo',id,input);};}
function certificateForm(id){drawer('<h2>Certificate metadata</h2><form id="certificateForm">'+field('holder','Certificate holder','text','',true)+field('number','Certificate number','text','',true)+field('scope','Scope','text','',true)+field('issue_date','Issue date','date','',true)+field('expiry_date','Expiry date','date','',true)+'<button>Record verified fields</button></form>');$('certificateForm').onsubmit=e=>{e.preventDefault();act('saveCertificate',id,Object.fromEntries(new FormData(e.target)));};}
function bind(){document.querySelectorAll('[data-action]').forEach(b=>b.onclick=async()=>{const action=b.dataset.action,id=b.dataset.id;try{
 if(action==='open')go('Workspace',id);else if(action==='newOrder')newOrder();else if(action==='reopen'){drawer('<form id="reopenForm"><h2>Reopen workflow</h2><label>Reason<textarea name="comment" required></textarea></label><button>Confirm</button></form>');$('reopenForm').onsubmit=e=>{e.preventDefault();act('reopenCase',id,{confirmed:true,comment:new FormData(e.target).get('comment')});};}else if(action==='editOrder')editOrder(id);else if(action==='productEdit')productDialog(id);else if(action==='productImage')productImageUpload(id);else if(action==='removeProduct')await act('removeOrderProduct',id);else if(action==='removeMaterial')await window.EudrTrace.removal({call,id,drawer,refresh:async()=>{await load();return state;}});else if(['removeChainNode','removeSupplier','removeUser','removeScopedRequirement'].includes(action))removeDialog(action,id);else if(action==='materialEdit')materialEdit(id);else if(action==='smartImport')await window.EudrSmartImport.open({id,call,esc,drawer,cap,state,load,getState:()=>state});else if(action==='traceWorkspace')await window.EudrTrace.open({call,state,caseId:id,productId:selectedProduct,materialId:material,sourceId:selectedSource,drawer,refresh:async()=>{await load();return state;}});else if(action==='dossierHub')await window.EudrMaterialReview.open({call,state,caseId:id,materialId:material,sourceId:'',drawer,openGeo:geoDialog,refresh:async()=>{await load();return state;}});else if(action==='legacyDossier')await window.EudrDossier.open({id,call,esc,drawer,cap,state,load,getState:()=>state});else if(action==='aiOutputs')await aiOutputs(id);else if(action==='policy')policyDialog();else if(action==='taskRequirement')taskRequirementDialog(id);else if(action==='addRequirement')scopedRequirementDialog(id,b.dataset.block,selectedChainNode);else if(action==='repairSO')await act('repairExistingSOReviewTask',id);else if(action==='removeDraft')await act('removeDraftEvidence',id);else if(action==='chainEdit')chainEdit(id);else if(action==='grantCaps')grantCaps(id);else if(action==='openTasks')go('My Tasks');else if(action==='openOrders')go('Orders');else if(action==='document')await documentView(id);else if(action==='download')await download(id);else if(action==='upload')upload(id);else if(action==='assign')assignDialog(id);else if(action==='materials')materialsDialog(id);else if(action==='addRelationship')chainDialog(id);else if(action==='geo')geoDialog(id);else if(action==='submit')await act('submitDocument',id);else if(action==='syncCalendar'){const r=await act('syncCalendar');$('msg').textContent=r?.some(x=>x.status==='CALENDAR_ACCESS_REQUIRED')?'Calendar access required; tasks remain saved.':r?.some(x=>x.status==='CALENDAR_SYNC_FAILED')?'Some Calendar events could not sync; tasks remain saved.':'Task invitations checked. Recipients may need to accept their Google Calendar email invitations.';}
 else if(action.startsWith('prompt:'))await showPrompt(state.docs.find(d=>d.id===id).case_id,action.slice(7),id);
 else if(action==='verifyProcessed'){const note=$('verificationNote').value.trim();if(!note)throw Error('Record verification checks in the review note first');await act('verifyProcessed',id,{verified:true,notes:note});}
 else if(action==='reviewGeo')reviewGeoDialog(id);
 else if(action==='closeOrder'||action==='finalReview')await finalDossier(id);else if(action==='materialInfo')materialInfo(id);else if(action==='certificate')certificateForm(id);else if(action==='readNotification')await act('markNotification',id);else if(action==='provision')await provisionUser(id);else if(action==='userForm')userForm(id);else if(action==='supplierForm')supplierForm(id);
 }catch(e){$('msg').textContent=errorLabel(e);}});}
load();
function editOrder(id){const c=state.cases.find(c=>c.id===id);drawer('<h2>Edit Order</h2><form id="editOrderForm">'+['so','customer','customer_code','po','shipment_date','due'].map(k=>field(k,k,['due','shipment_date'].includes(k)?'date':'text',c[k]||'',k==='so')).join('')+'<p>Folder names are retained. Relationships use the immutable order ID.</p><button>Save</button></form>');$('editOrderForm').onsubmit=e=>{e.preventDefault();act('updateOrder',id,{...Object.fromEntries(new FormData(e.target)),expected_updated_at:c.updated_at});};}
function productDialog(id){const p=state.products.find(p=>p.id===id)||{};drawer('<h2>Product</h2><form id="productForm">'+field('product_name','Product','text',p.product_name||'',true)+field('sku','SKU','text',p.sku||'')+field('quantity','Quantity','number',p.quantity||'')+field('quantity_uom','UOM','text',p.quantity_uom||'pcs')+'<button>Save</button></form>');$('productForm').elements.quantity.step='any';$('productForm').elements.quantity.min='0.000001';$('productForm').onsubmit=e=>{e.preventDefault();act('saveOrderProduct',selected,{...Object.fromEntries(new FormData(e.target)),...(id?{id,expected_updated_at:p.updated_at}:{})});};}
function productImageUpload(id){const p=state.products.find(p=>p.id===id),input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';$('msg').textContent=tt('Maximum file size: less than 3 MB');input.onchange=async()=>{try{const f=await fileData(input.files[0]);f.expected_document_id=p.image_document_id||'';await act('uploadProductImage',id,f);}catch(e){$('msg').textContent=errorLabel(e);}};input.click();}
function materialEdit(id){const m=state.materials.find(m=>m.id===id);drawer('<h2>Edit Material / PO</h2><form id="materialEditForm">'+field('material','Material','text',m.material,true)+field('supplier_po','Material PO (optional)','text',m.supplier_po||'')+field('source_reference','Source reference','text',m.source_reference||'')+'<button>Save</button></form>');$('materialEditForm').onsubmit=e=>{e.preventDefault();act('updateMaterial',id,Object.fromEntries(new FormData(e.target)));};}
function chainEdit(id){const n=state.chain.find(n=>n.id===id);if(!n)return;const others=state.chain.filter(x=>x.material_id===n.material_id&&x.id!==id),suppliers=state.suppliers.filter(s=>s.active==='YES'||s.id===n.supplier_id);drawer('<h2>Edit relationship</h2><form id="chainEditForm">'+select('supplier_id','Supplier',[['','Producer / forest owner (no supplier account)'],...suppliers.map(s=>[s.id,s.name+' '+(s.supplier_code||'')])],n.supplier_id||'')+field('display_name','Producer / forest owner name','text',n.display_name||'')+select('parent_id','Parent',[['','KODA'],...others.map(x=>[x.id,x.display_name||x.id])],n.parent_id)+select('terminal','Final producer in this branch',['NO','YES'],n.terminal||'NO')+select('source_document_id','Source evidence',[['','MISSING'],...state.docs.filter(d=>d.material_id===n.material_id).map(d=>[d.id,d.name])],n.source_document_id||'')+'<button>Save</button></form>');$('chainEditForm').onsubmit=e=>{e.preventDefault();act('updateChainNode',id,Object.fromEntries(new FormData(e.target)));};}
function policyDialog(){const rules=state.requirements||[];drawer('<h2>Evidence policy</h2><p>New versions affect new tasks. Existing approvals retain their policy version.</p><form id="policyForm">'+select('id','Existing policy',[['','Add new type'],...rules.filter(r=>r.enabled==='YES').map(r=>[r.id,r.evidence+' · '+(r.rule_version||'LEGACY')])])+field('evidence','Evidence','text','',true)+field('material','Material / category / *','text','*')+field('department','Department','text','Purchasing')+field('tier','Tier / *','text','*')+select('node_type','Node Type',['*','SUPPLIER','PROCESSOR','TRADER','PRODUCER','FOREST_OWNER','PLOT'])+select('enabled','Enabled',['YES','NO'])+select('required','Required',['YES','NO'])+field('rule_version','Rule version','text','',true)+field('effective_date','Effective date','date',today(),true)+'<button>Create policy version</button></form>');$('policyForm').elements.id.onchange=e=>{const r=rules.find(r=>r.id===e.target.value);if(r)for(const k of ['evidence','material','department','tier','node_type','enabled','required'])$('policyForm').elements[k].value=r[k]||({node_type:'*',required:'YES'}[k]||'');};$('policyForm').onsubmit=e=>{e.preventDefault();act('updateEvidenceRequirement',Object.fromEntries(new FormData(e.target)));};}
function taskRequirementDialog(id){const t=state.tasks.find(t=>t.id===id);if(!t)return;drawer('<h2>Order / Tier Requirement</h2><p>'+esc(t.evidence)+' · '+esc(state.materials.find(m=>m.id===t.material_id)?.material||'Order')+'</p><form id="taskRequirementForm">'+select('state','Requirement',['REQUIRED','OPTIONAL','NOT_REQUIRED'],t.override_state|| (t.required==='NO'?'NOT_REQUIRED':'REQUIRED'))+'<label>Reason<textarea name="reason" required maxlength="1000" rows="4"></textarea></label><button>Save scoped decision</button></form>');$('taskRequirementForm').onsubmit=e=>{e.preventDefault();act('setTaskRequirement',id,{...Object.fromEntries(new FormData(e.target)),expected_updated_at:t.updated_at||''});};}
function scopedRequirementDialog(materialId,block,nodeId=selectedChainNode){const m=state.materials.find(m=>m.id===materialId);if(!m)return;const nodes=state.chain.filter(n=>n.material_id===materialId);drawer('<h2>Add Order / Tier Evidence</h2><p>'+esc(m.material)+' · '+esc(block.replace(/^\d+_/,''))+'</p><form id="scopedRequirementForm">'+select('chain_node_id','Tier / relationship',[['','KODA / material level'],...nodes.map(n=>[n.id,(n.display_name||n.id)+' · Tier '+n.tier])],nodeId)+field('evidence','Evidence Type','text','',true)+select('state','Requirement',['REQUIRED','OPTIONAL','NOT_REQUIRED'],'REQUIRED')+'<label>Reason<textarea name="reason" required maxlength="1000" rows="4"></textarea></label><button>Add scoped evidence</button></form>');$('scopedRequirementForm').onsubmit=e=>{e.preventDefault();act('addScopedRequirement',m.case_id,{...Object.fromEntries(new FormData(e.target)),material_id:materialId,evidence_block:block});};}
async function aiOutputs(id){const opId=EudrOps.start({action:'syncAIOutputs',label:'Syncing AI outputs…',level:4});let sync={errors:[]};try{sync=await call('syncAIOutputs',id);EudrOps.succeed(opId,'AI outputs synced.');}catch(e){EudrOps.fail(opId,e);sync={errors:[{code:errorLabel(e)}]};}const data=await call('getAIOutputs',id),documents=data.documents||[];for(const d of documents){const i=state.docs.findIndex(x=>x.id===d.id);if(i<0)state.docs.push(d);else state.docs[i]={...state.docs[i],...d};}
 const runRows=data.runs.filter(r=>r.result_status!=='CONDITIONAL_AWAITING_PRICE_DECISION'||documents.some(d=>d.prompt_run_id===r.id)).map(r=>{const linked=documents.filter(d=>d.prompt_run_id===r.id&&d.source_document_id===r.document_id),received=linked.length&&['AWAITING_RESULT','CONDITIONAL_AWAITING_PRICE_DECISION'].includes(r.result_status),status=received?'PDF REGISTERED · '+linked.map(d=>d.status).join(', '):r.result_status;
  return `<details><summary>${esc(r.function)} · v${esc(r.prompt_version)} · ${esc(status)}</summary><p>${esc(r.generated_by)} · ${esc(r.generated_at)}</p>${linked.length?`<p>${esc(linked.length)} PDF output${linked.length===1?'':'s'} recorded for this prompt. ${esc(r.result_status)} is the separate prompt-run status; check each PDF's human verification below.</p>`:''}<pre>${esc(r.imported_result||'No structured review result imported for this prompt run.')}</pre>${cap('AI_REVIEW')&&r.imported_result?`<button data-ai-review="${esc(r.id)}">Review findings</button>`:''}</details>`;}).join('');
 const documentRows=documents.map(d=>`<p>${button(d.name,'document',d.id)} · ${esc(d.kind==='AI_OUTPUT'?(d.ai_output_type||'AI_OUTPUT')+' · Drive output':d.kind)} · ${esc(d.status)} · ${esc(d.redaction_verified||d.translation_verified||'UNVERIFIED')}${d.kind==='AI_OUTPUT'?' · Human review required before Export.':''}</p>`).join('');
 drawer('<h2>AI Review Outputs</h2>'+(sync.errors?.length?'<p role="alert">'+esc(sync.errors.map(x=>(x.manifest||'Folder sync')+' · '+x.code).join('; '))+'</p>':'')+runRows+documentRows);document.querySelectorAll('[data-ai-review]').forEach(b=>b.onclick=()=>{const findings=data.findings.filter(f=>f.prompt_run_id===b.dataset.aiReview);drawer('<h2>Human review of AI findings</h2><form id="aiReviewForm">'+findings.map(f=>'<p>'+esc(f.field)+' · '+esc(f.check_status)+' · '+esc(f.reason)+'</p>'+select(f.id,'Decision',['FOLLOW_UP','RESOLVED','ACCEPTED_WARNING'])).join('')+'<label>Review notes<textarea name="comment" required></textarea></label><button>Confirm review</button></form>');$('aiReviewForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target);act('reviewAIResult',b.dataset.aiReview,{confirmed:true,comment:fd.get('comment'),decisions:findings.map(f=>({id:f.id,decision:fd.get(f.id)}))});};});bind();}
function grantCaps(email){const all=['ORDER_EDIT','MATERIAL_EDIT','SUPPLIER_EDIT','CHAIN_EDIT','EVIDENCE_UPLOAD','EVIDENCE_REVIEW','POLICY_EDIT','AI_USE','AI_REVIEW','GEO_EDIT','GEO_REVIEW','EXPORT','WORKFLOW_CLOSE'];const u=state.owners.find(u=>u.email===email);let assigned=[];try{assigned=JSON.parse(u.capabilities||'[]');}catch{}drawer('<h2>Explicit business capabilities</h2><p>'+esc(email)+'</p><form id="capsForm">'+all.map(c=>`<label class="check"><input type="checkbox" name="cap" value="${c}" ${assigned.includes(c)?'checked':''}>${c}</label>`).join('')+'<p>Admin has all application permissions. Additional grants are only for non-Admin internal roles.</p><button>Confirm capability assignment</button></form>');$('capsForm').onsubmit=e=>{e.preventDefault();act('grantCapabilities',{email,confirmed:true,capabilities:new FormData(e.target).getAll('cap')});};}
const EVIDENCE_BLOCKS=['01_Commercial_Shipping','02_FSC_Certification','03_Transport','04_Geolocation'];
function nodeEvidenceTables(tasks){
 return EVIDENCE_BLOCKS.map(block=>{
  const blockTasks=tasks.filter(t=>(t.evidence_block||'Other evidence')===block),groups=new Map();
  blockTasks.forEach(t=>{const key=t.chain_node_id||'';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(t);});
  const content=groups.size?[...groups].map(([id,items])=>{const node=state.chain.find(n=>n.id===id),heading=node?`<h4>${esc(node.display_name||node.id)} · Tier ${esc(node.tier)}</h4>`:groups.size>1?'<h4>Order / material evidence</h4>':'';return '<div class="tier-evidence">'+heading+taskTable(items)+'</div>';}).join(''):'<p class="muted">No evidence assigned in this block.</p>';
  return `<section class="card evidence-block" data-evidence-block="${esc(block)}"><h3>${esc(block.replace(/^\d+_/,'').replace(/_/g,' '))}</h3>${content}${material&&cap('POLICY_EDIT')?`<div class="workspace-actions"><button data-action="addRequirement" data-id="${esc(material)}" data-block="${esc(block)}">${esc(tt('Add Evidence Type'))}</button></div>`:''}</section>`;
 }).join('');
}
