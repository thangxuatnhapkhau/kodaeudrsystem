function v290Issue_(id,u){const issue=rows_('37_REVIEW_ISSUES').find(i=>i.id===id);if(!issue)fail_('INVALID_INPUT','Issue not found');v290Scope_(issue.case_id,issue,u);return issue;}

function createKodaReviewIssue(reviewId,input){
 const u=v290Internal_('AI_USE');v290Ready_();
 if(typeof evidenceActionSchema_==='function')evidenceActionSchema_();
 if(input?.confirmed!==true)fail_('HUMAN_CONFIRMATION_REQUIRED','Confirm the finding before creating an Issue');
 const {row,scope}=v290ReviewRow_(reviewId,u);traceWritable_(scope.c);
 const review=v290ReadReview_(row,u);
 if(review.status!=='IMPORTED'||!review.result)fail_('STALE_REVIEW','Use a current imported review');
 const finding=review.result.findings.find(f=>f.finding_id===input.finding_id);
 if(!finding)fail_('INVALID_INPUT','Finding not found');

 return withOperation_(()=>{
  const id=stable_('review-issue:'+reviewId+':'+finding.finding_id),old=rows_('37_REVIEW_ISSUES').find(i=>i.id===id);
  if(old)return {id,status:old.status};

  let nextOwner='';
  if(input.owner){
   nextOwner=text_(input.owner,200);
   if(['PURCHASING','SOURCING'].includes(u.role)){
    const o=rows_('05_OWNER_MASTER').find(x=>x.email===nextOwner&&x.active==='YES'&&['PURCHASING','SOURCING'].includes(x.role)&&canOrder_(x,order_(row.case_id,u)));
    if(!o)fail_('INVALID_INPUT','Purchasing/Sourcing can only assign to active Purchasing/Sourcing users with Order access');
   }else{
    const o=rows_('05_OWNER_MASTER').find(x=>x.email===nextOwner&&x.active==='YES'&&!['VIEWER','SUPPLIER_USER'].includes(x.role)&&canOrder_(x,order_(row.case_id,u)));
    if(!o)fail_('INVALID_INPUT','Select an active internal owner with Order access');
   }
  }

  const now=now_(),initialStatus=nextOwner?'ASSIGNED':'PROPOSED';
  const history=[{at:now,actor:u.email,from:'',to:initialStatus,reason:'Finding confirmed by authorized user',evidence:finding.document_ids}];
  const due=input.due_date?actionCenterIsoDate_(input.due_date):'';
  const priority=text_(input.priority||finding.severity||'MEDIUM',20);
  const department=text_(input.department||finding.suggested_department||'Purchasing',100);
  const requiredAction=text_(input.required_action||finding.recommended_action||'',2000);
  const reqDocs=JSON.stringify(input.requested_documents||finding.document_ids||[]);
  const blocking=input.blocking==='NO'?'NO':'YES';
  const supplierId=text_(input.supplier_id||finding.supplier_id||'',100);

  const taskId=stable_('issue-task:'+id);
  let calendar={status:'NOT_SCHEDULED'};
  if(nextOwner){
   const taskValue={id:taskId,case_id:row.case_id,material_id:finding.material_id||row.material_id,source_id:finding.source_id||row.source_id,evidence:'Review Issue: '+finding.finding_id,department,owner:nextOwner,due,status:'MISSING',note:requiredAction,updated_at:now,evidence_block:'01_Commercial_Shipping',required:'NO',override_state:'OPTIONAL',rule_version:'V290_ISSUE',active:'YES',assigned_reviewer:u.email,created_at:now};
   add_('04_EVIDENCE_TRACKER',taskValue);
   calendar=syncTaskCalendar_(taskValue);
  }

  add_('37_REVIEW_ISSUES',{
   id,
   finding_id:finding.finding_id,
   review_id:reviewId,
   case_id:row.case_id,
   material_id:finding.material_id||row.material_id,
   source_id:finding.source_id||row.source_id,
   priority,
   department,
   required_action:requiredAction,
   document_requirements:JSON.stringify(finding.document_ids),
   status:initialStatus,
   owner:nextOwner,
   due_date:due,
   task_id:nextOwner?taskId:'',
   calendar_event_id:calendar.eventId||'',
   calendar_sync_status:calendar.status,
   created_by:u.email,
   created_at:now,
   updated_at:now,
   audit_history:JSON.stringify(history),
   finding_json:JSON.stringify(finding),
   finding_type:finding.finding_type||finding.dimension||'MISSING',
   severity:finding.severity||'MEDIUM',
   blocking,
   triage_decision:'CREATE_ACTION',
   triage_reason:text_(input.triage_reason||'',2000),
   dismiss_requested_by:'',
   confirmed_at:now,
   evidence_submitted_by:'',
   evidence_submitted_at:'',
   verified_by:'',
   verified_at:'',
   supplier_id:supplierId,
   requested_documents:reqDocs
  });

  auditOnce_('REVIEW_ISSUE_CREATED',row.case_id,id,'',JSON.stringify({review_id:reviewId,finding_id:finding.finding_id,status:initialStatus}),u);
  return {id,status:initialStatus,calendar};
 });
}

function triageReviewFinding(reviewId,input){
 const u=v290Internal_('AI_USE');v290Ready_();
 if(typeof evidenceActionSchema_==='function')evidenceActionSchema_();
 input=input||{};
 const decision=text_(input.decision||'',40);
 const allowed=['CREATE_ACTION','NEEDS_CLARIFICATION','DISMISS_REQUESTED','CONFIRM_DISMISS'];
 if(!allowed.includes(decision))fail_('INVALID_INPUT','Invalid triage decision: '+decision);

 if(decision==='CREATE_ACTION'){
  return createKodaReviewIssue(reviewId,{...input,confirmed:true});
 }

 const {row,scope}=v290ReviewRow_(reviewId,u);traceWritable_(scope.c);
 const id=stable_('review-issue:'+reviewId+':'+input.finding_id);
 const existing=rows_('37_REVIEW_ISSUES').find(i=>i.id===id);
 const now=now_();

 if(decision==='NEEDS_CLARIFICATION'){
  const reason=text_(input.reason||'',2000);
  if(!reason)fail_('INVALID_INPUT','Clarification notes required');
  const base=existing?existing:createKodaReviewIssue(reviewId,{finding_id:input.finding_id,confirmed:true,triage_reason:reason});
  const history=jsonList_(base.audit_history||'[]');
  history.push({at:now,actor:u.email,decision,reason});
  patch_('37_REVIEW_ISSUES',base.id,{triage_decision:'NEEDS_CLARIFICATION',triage_reason:reason,updated_at:now,audit_history:JSON.stringify(history)});
  return {id:base.id,status:base.status,triage_decision:'NEEDS_CLARIFICATION'};
 }

 if(decision==='DISMISS_REQUESTED'){
  const reason=text_(input.reason||'',2000);
  if(!reason)fail_('INVALID_INPUT','Reason required to request dismissal');
  const base=existing?existing:createKodaReviewIssue(reviewId,{finding_id:input.finding_id,confirmed:true,triage_reason:reason});
  const history=jsonList_(base.audit_history||'[]');
  history.push({at:now,actor:u.email,decision,reason});
  patch_('37_REVIEW_ISSUES',base.id,{triage_decision:'DISMISS_REQUESTED',triage_reason:reason,dismiss_requested_by:u.email,updated_at:now,audit_history:JSON.stringify(history)});
  return {id:base.id,status:base.status,triage_decision:'DISMISS_REQUESTED'};
 }

 if(decision==='CONFIRM_DISMISS'){
  const reviewer=hasCapability_(u,'AI_REVIEW')||hasCapability_(u,'EVIDENCE_REVIEW')||u.role==='ADMIN';
  if(!reviewer)fail_('PERMISSION_DENIED','Reviewer or Admin authority required to confirm dismissal');
  if(!existing)fail_('INVALID_INPUT','Issue record required for dismissal');
  const reason=text_(input.reason||existing.triage_reason||'',2000);
  if(!reason)fail_('INVALID_INPUT','Reason required to confirm dismissal');
  const history=jsonList_(existing.audit_history||'[]');
  history.push({at:now,actor:u.email,from:existing.status,to:'REJECTED',reason:'Dismissal confirmed: '+reason});
  patch_('37_REVIEW_ISSUES',existing.id,{status:'REJECTED',triage_decision:'DISMISSED',triage_reason:reason,reviewed_by:u.email,closed_at:now,updated_at:now,audit_history:JSON.stringify(history)});
  return {id:existing.id,status:'REJECTED',triage_decision:'DISMISSED'};
 }
}

function updateKodaReviewIssue(id,input){
 const u=v290Internal_('AI_USE');v290Ready_();
 if(typeof evidenceActionSchema_==='function')evidenceActionSchema_();
 const issue=v290Issue_(id,u);traceWritable_(order_(issue.case_id,u));
 const reviewer=hasCapability_(u,'AI_REVIEW')||hasCapability_(u,'EVIDENCE_REVIEW')||u.role==='ADMIN';
 const isOwner=issue.owner===u.email;
 const isCreator=issue.created_by===u.email;
 const isPurchasingSourcing=['PURCHASING','SOURCING'].includes(u.role);
 if(!reviewer&&!isOwner&&!isCreator&&!isPurchasingSourcing)fail_('PERMISSION_DENIED','Assigned owner, purchasing/sourcing in scope, or reviewer required');
 if(input.confirmed!==true)fail_('HUMAN_CONFIRMATION_REQUIRED','Confirm Issue transition');
 const reason=text_(input.reason||'',2000);if(!reason)fail_('INVALID_INPUT','Decision reason required');
 const target=text_(input.status||issue.status,40);
 const transitions={
  PROPOSED:['REVIEWED','ASSIGNED','REJECTED'],
  REVIEWED:['ASSIGNED','IN_PROGRESS','REJECTED'],
  ASSIGNED:['IN_PROGRESS','EVIDENCE_SUBMITTED','REOPENED','REJECTED'],
  IN_PROGRESS:['EVIDENCE_SUBMITTED','REOPENED','REJECTED'],
  EVIDENCE_SUBMITTED:['RECHECK_REQUIRED','RESOLVED','REOPENED','REJECTED'],
  RECHECK_REQUIRED:['RESOLVED','REOPENED','REJECTED'],
  RESOLVED:['REOPENED'],
  REJECTED:['REOPENED'],
  REOPENED:['REVIEWED','ASSIGNED','IN_PROGRESS']
 };
 if(target!==issue.status&&!transitions[issue.status]?.includes(target))fail_('INVALID_INPUT','Invalid Issue transition');

 if(['RESOLVED','REJECTED'].includes(target)&&!reviewer)fail_('PERMISSION_DENIED','Reviewer or Admin authority required');
 if(input.expected_updated_at&&String(input.expected_updated_at)!==String(issue.updated_at))fail_('VERSION_CONFLICT','Issue changed; refresh');

 const nextOwner=input.owner===undefined?issue.owner:text_(input.owner,200);
 const due=input.due_date===undefined?issue.due_date:input.due_date?actionCenterIsoDate_(input.due_date):'';

 if(nextOwner!==issue.owner){
  if(isPurchasingSourcing&&!reviewer){
   const o=rows_('05_OWNER_MASTER').find(x=>x.email===nextOwner&&x.active==='YES'&&['PURCHASING','SOURCING'].includes(x.role)&&canOrder_(x,order_(issue.case_id,u)));
   if(!o)fail_('INVALID_INPUT','Purchasing/Sourcing can only assign to active Purchasing/Sourcing users with Order access');
  }else{
   const o=rows_('05_OWNER_MASTER').find(x=>x.email===nextOwner&&x.active==='YES'&&!['VIEWER','SUPPLIER_USER'].includes(x.role)&&canOrder_(x,order_(issue.case_id,u)));
   if(!o)fail_('INVALID_INPUT','Select an active internal owner with Order access');
  }
 }

 const ids=input.resolution_evidence===undefined?jsonList_(issue.resolution_evidence||'[]'):input.resolution_evidence;
 if(!Array.isArray(ids)||ids.length>20||new Set(ids).size!==ids.length)fail_('INVALID_INPUT','Select at most 20 evidence documents');
 const refs=ids.map(documentId=>{
  const d=document_(documentId,u);
  if(d.case_id!==issue.case_id||d.active_version!=='YES'||issue.material_id&&d.material_id!==issue.material_id||issue.source_id&&!recordMatchesSource_(d,'DOCUMENT',issue.source_id))fail_('INVALID_INPUT','Resolution evidence outside Issue scope');
  return d;
 });

 if(['EVIDENCE_SUBMITTED','RESOLVED'].includes(target)&&!refs.length)fail_('INVALID_INPUT','Resolution evidence is required');

 if(target==='RESOLVED'){
  if(refs.some(d=>d.status!=='APPROVED'))fail_('INVALID_INPUT','Only reviewed active evidence can resolve an Issue');
  if(issue.owner===u.email||issue.evidence_submitted_by===u.email||refs.some(d=>d.uploaded_by===u.email)){
   fail_('SEPARATION_OF_DUTIES_VIOLATION','Separation of duties: Cannot verify or resolve your own action or submitted evidence');
  }
 }

 return withOperation_(()=>{
  TABLE_CACHE_={};
  const current=v290Issue_(id,u);
  if(current.updated_at!==issue.updated_at||current.status!==issue.status)fail_('VERSION_CONFLICT','Issue changed during update');
  const at=now_(),history=jsonList_(issue.audit_history||'[]');
  history.push({at,actor:u.email,from:issue.status,to:target,reason,evidence:ids});

  const taskId=issue.task_id||stable_('issue-task:'+id);
  const task=rows_('04_EVIDENCE_TRACKER').find(t=>t.id===taskId);
  const taskValue={case_id:issue.case_id,material_id:issue.material_id,source_id:issue.source_id,evidence:'Review Issue: '+issue.finding_id,department:input.department||issue.department,owner:nextOwner,due,status:target==='RESOLVED'?'APPROVED':target==='EVIDENCE_SUBMITTED'?'SUBMITTED':'MISSING',note:issue.required_action,updated_at:at,evidence_block:'01_Commercial_Shipping',required:'NO',override_state:'OPTIONAL',rule_version:'V290_ISSUE',active:'YES',assigned_reviewer:reviewer?u.email:issue.reviewed_by};
  if(target==='REJECTED')taskValue.active='NO';
  if(task)patch_('04_EVIDENCE_TRACKER',taskId,taskValue);
  else if(nextOwner)add_('04_EVIDENCE_TRACKER',{id:taskId,...taskValue,created_at:at});

  const value={
   status:target,
   owner:nextOwner,
   due_date:due,
   department:text_(input.department||issue.department||'',100),
   resolution_evidence:JSON.stringify(ids),
   reviewed_by:reviewer?u.email:issue.reviewed_by,
   closed_at:['RESOLVED','REJECTED'].includes(target)?at:'',
   updated_at:at,
   audit_history:JSON.stringify(history),
   task_id:nextOwner?taskId:issue.task_id
  };
  if(target==='EVIDENCE_SUBMITTED'){
   value.evidence_submitted_by=u.email;
   value.evidence_submitted_at=at;
  }
  if(target==='RESOLVED'){
   value.verified_by=u.email;
   value.verified_at=at;
  }

  patch_('37_REVIEW_ISSUES',id,value);
  const savedTask=rows_('04_EVIDENCE_TRACKER').find(t=>t.id===taskId);
  const calendar=savedTask?syncTaskCalendar_(savedTask):{status:'NOT_SCHEDULED'};
  if(savedTask){
   const freshTask=rows_('04_EVIDENCE_TRACKER').find(t=>t.id===taskId);
   patch_('37_REVIEW_ISSUES',id,{calendar_event_id:freshTask.calendar_event_id||'',calendar_sync_status:calendar.status});
  }
  auditOnce_('REVIEW_ISSUE_UPDATED',issue.case_id,id,JSON.stringify({status:issue.status}),JSON.stringify({status:target,reason,resolution_evidence:ids}),u);
  return {id,status:target,calendar};
 });
}

function refreshKodaReviewScope(caseId,input){
 const u=v290Internal_('AI_USE');v290Ready_();
 const scope=v290Scope_(caseId,input,u);
 return withOperation_(()=>{
  const stale=[];
  for(const row of rows_('36_AI_REVIEW_IMPORTS').filter(r=>r.case_id===caseId&&(!scope.material_id||r.material_id===scope.material_id)&&(!scope.source_id||r.source_id===scope.source_id)&&r.status!=='STALE')){
   const own=v290Scope_(caseId,row,u);
   if(v290Snapshot_(own)!==row.snapshot_hash){
    patch_('36_AI_REVIEW_IMPORTS',row.id,{status:'STALE'});
    stale.push(row.id);
   }
  }
  for(const h of rows_('42_AI_CHAT_HISTORY').filter(h=>h.case_id===caseId&&h.actor===u.email&&h.material_id===scope.material_id&&h.source_id===scope.source_id&&h.status!=='STALE')){
   if(h.snapshot_hash!==v290Snapshot_(scope))patch_('42_AI_CHAT_HISTORY',h.id,{status:'STALE'});
  }
  return {stale_review_ids:stale,deterministic_checks:v290QueryResult_(scope,'What is preventing this source from being ready?'),issues_auto_closed:0};
 });
}
