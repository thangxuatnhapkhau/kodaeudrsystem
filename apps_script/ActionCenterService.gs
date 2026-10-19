// Evidence Action Center and Supplier Follow-up Service (EAW-1.0.0)

function actionCenterIsoDate_(dateStr){
 if(!dateStr)return '';
 const d=new Date(dateStr);
 return isNaN(d.getTime())?'':d.toISOString().slice(0,10);
}

function getEvidenceActionCenter(filters){
 const u=v290Internal_('AI_USE');v290Ready_();
 if(typeof evidenceActionSchema_==='function')evidenceActionSchema_();
 filters=filters||{};
 const allCases=rows_('01_SO_MASTER').filter(c=>canOrder_(u,c)),caseMap=new Map(allCases.map(c=>[c.id,c]));
 const caseIds=new Set(allCases.map(c=>c.id));
 const allMaterials=rows_('02_SO_ITEM_MATERIAL'),matMap=new Map(allMaterials.map(m=>[m.id,m]));
 const allSuppliers=rows_('14_SUPPLIERS'),supMap=new Map(allSuppliers.map(s=>[s.id,s]));
 const allRequests=rows_('47_SUPPLIER_EVIDENCE_REQUESTS');
 const today=now_().slice(0,10);

 const issues=rows_('37_REVIEW_ISSUES').filter(i=>{
  if(!caseIds.has(i.case_id))return false;
  if(filters.case_id&&i.case_id!==filters.case_id)return false;
  if(filters.material_id&&i.material_id!==filters.material_id)return false;
  if(filters.supplier_id&&i.supplier_id!==filters.supplier_id)return false;
  if(filters.department&&i.department!==filters.department)return false;
  if(filters.owner&&i.owner!==filters.owner)return false;
  if(filters.priority&&i.priority!==filters.priority)return false;
  if(filters.status&&i.status!==filters.status)return false;
  if(filters.due_date&&actionCenterIsoDate_(i.due_date)!==actionCenterIsoDate_(filters.due_date))return false;
  return true;
 });

 const enriched=issues.map(i=>{
  const c=caseMap.get(i.case_id)||{},m=matMap.get(i.material_id)||{};
  const supId=i.supplier_id||m.supplier_id||'';
  const sup=supMap.get(supId)||{};
  const requests=allRequests.filter(r=>r.issue_id===i.id).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
  const latestReq=requests[0]||null;
  const isOverdue=Boolean(i.due_date&&actionCenterIsoDate_(i.due_date)<today&&!['RESOLVED','REJECTED'].includes(i.status));
  const isAwaitingSupplier=Boolean(latestReq&&latestReq.status==='SENT');
  return {
   ...i,
   order_no:c.so||'',
   customer:c.customer||'',
   material_name:m.material||'',
   supplier_id:supId,
   supplier_name:sup.name||m.supplier||'—',
   requests,
   latest_request:latestReq,
   is_overdue:isOverdue,
   is_awaiting_supplier:isAwaitingSupplier
  };
 });

 const counts={
  my_actions:enriched.filter(i=>i.owner===u.email&&!['RESOLVED','REJECTED'].includes(i.status)).length,
  awaiting_supplier:enriched.filter(i=>i.is_awaiting_supplier).length,
  pending_verification:enriched.filter(i=>['EVIDENCE_SUBMITTED','RECHECK_REQUIRED'].includes(i.status)).length,
  overdue:enriched.filter(i=>i.is_overdue).length,
  completed:enriched.filter(i=>['RESOLVED','REJECTED'].includes(i.status)).length,
  all:enriched.length
 };

 const tab=filters.tab||'all';
 let filtered=enriched;
 if(tab==='my_actions')filtered=enriched.filter(i=>i.owner===u.email&&!['RESOLVED','REJECTED'].includes(i.status));
 else if(tab==='awaiting_supplier')filtered=enriched.filter(i=>i.is_awaiting_supplier);
 else if(tab==='pending_verification')filtered=enriched.filter(i=>['EVIDENCE_SUBMITTED','RECHECK_REQUIRED'].includes(i.status));
 else if(tab==='overdue')filtered=enriched.filter(i=>i.is_overdue);
 else if(tab==='completed')filtered=enriched.filter(i=>['RESOLVED','REJECTED'].includes(i.status));

 return {issues:filtered,counts,tab,current_user:u.email};
}

function getActionDashboard(filters){
 const u=v290Internal_('AI_USE');v290Ready_();
 if(typeof evidenceActionSchema_==='function')evidenceActionSchema_();
 filters=filters||{};
 const allCases=rows_('01_SO_MASTER').filter(c=>canOrder_(u,c)),caseIds=new Set(allCases.map(c=>c.id));
 const matMap=new Map(rows_('02_SO_ITEM_MATERIAL').map(m=>[m.id,m]));
 const supMap=new Map(rows_('14_SUPPLIERS').map(s=>[s.id,s]));
 const allRequests=rows_('47_SUPPLIER_EVIDENCE_REQUESTS');
 const today=now_().slice(0,10);

 const issues=rows_('37_REVIEW_ISSUES').filter(i=>{
  if(!caseIds.has(i.case_id))return false;
  if(filters.case_id&&i.case_id!==filters.case_id)return false;
  if(filters.material_id&&i.material_id!==filters.material_id)return false;
  if(filters.supplier_id&&i.supplier_id!==filters.supplier_id)return false;
  if(filters.owner&&i.owner!==filters.owner)return false;
  return true;
 });

 const open_findings=issues.filter(i=>!['RESOLVED','REJECTED'].includes(i.status)).length;
 const active_actions=issues.filter(i=>['ASSIGNED','IN_PROGRESS','EVIDENCE_SUBMITTED','RECHECK_REQUIRED'].includes(i.status)).length;
 const overdue_actions=issues.filter(i=>i.due_date&&actionCenterIsoDate_(i.due_date)<today&&!['RESOLVED','REJECTED'].includes(i.status)).length;
 const awaiting_supplier=issues.filter(i=>{
  const reqs=allRequests.filter(r=>r.issue_id===i.id).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
  return reqs.length&&reqs[0].status==='SENT';
 }).length;
 const pending_verification=issues.filter(i=>['EVIDENCE_SUBMITTED','RECHECK_REQUIRED'].includes(i.status)).length;
 const reopened_actions=issues.filter(i=>i.status==='REOPENED'||(jsonList_(i.audit_history||'[]').some(h=>h.to==='REOPENED'))).length;

 const resolvedIssues=issues.filter(i=>i.status==='RESOLVED'&&i.closed_at&&i.created_at);
 const totalResolutionDays=resolvedIssues.reduce((acc,i)=>{
  const diff=Math.max(0,(Date.parse(i.closed_at)-Date.parse(i.created_at))/86400000);
  return acc+diff;
 },0);
 const avg_resolution_time_days=resolvedIssues.length?Number((totalResolutionDays/resolvedIssues.length).toFixed(1)):0;

 const respondedReqs=allRequests.filter(r=>r.status==='RESPONDED'&&r.sent_at&&r.responded_at);
 const totalResponseDays=respondedReqs.reduce((acc,r)=>{
  const diff=Math.max(0,(Date.parse(r.responded_at)-Date.parse(r.sent_at))/86400000);
  return acc+diff;
 },0);
 const supplier_response_time_days=respondedReqs.length?Number((totalResponseDays/respondedReqs.length).toFixed(1)):0;

 const closure_blocking_actions=issues.filter(i=>i.blocking!=='NO'&&!['RESOLVED','REJECTED'].includes(i.status)).length;
 const closure_gate_status=(closure_blocking_actions>0||open_findings>0)?'BLOCKED':'READY';

 const by_supplier={},by_owner={},by_order={},by_material={},by_department={},by_priority={},by_root_cause={};
 issues.forEach(i=>{
  const m=matMap.get(i.material_id)||{},supName=supMap.get(i.supplier_id||m.supplier_id)?.name||m.supplier||'Unassigned';
  const owner=i.owner||'Unassigned',order=i.case_id||'Unassigned',mat=m.material||i.material_id||'Unassigned';
  const dept=i.department||'Unassigned',prio=i.priority||'MEDIUM',cause=i.finding_type||'MISSING';
  by_supplier[supName]=(by_supplier[supName]||0)+1;
  by_owner[owner]=(by_owner[owner]||0)+1;
  by_order[order]=(by_order[order]||0)+1;
  by_material[mat]=(by_material[mat]||0)+1;
  by_department[dept]=(by_department[dept]||0)+1;
  by_priority[prio]=(by_priority[prio]||0)+1;
  by_root_cause[cause]=(by_root_cause[cause]||0)+1;
 });

 const toList=(o)=>Object.entries(o).map(([key,count])=>({key,name:key,count,value:count}));

 return {
  kpis:{
   total_open_actions:open_findings,
   open_findings,
   active_actions,
   overdue_actions,
   awaiting_supplier,
   pending_verification,
   reopened_actions,
   closure_blocking_actions,
   closure_gate_status,
   avg_resolution_time_days,
   supplier_response_time_days
  },
  breakdowns:{
   by_supplier:toList(by_supplier),
   by_department:toList(by_department),
   by_priority:toList(by_priority),
   by_root_cause:toList(by_root_cause),
   by_owner:toList(by_owner),
   by_order:toList(by_order),
   by_material:toList(by_material),
   map_by_supplier:by_supplier,
   map_by_department:by_department,
   map_by_priority:by_priority,
   map_by_root_cause:by_root_cause
  }
 };
}

function saveSupplierEvidenceRequest(issueId,input){
 const u=v290Internal_('AI_USE');v290Ready_();
 if(typeof evidenceActionSchema_==='function')evidenceActionSchema_();
 if(issueId&&typeof issueId==='object'&&!input){
  input=issueId;
  issueId=input.issue_id;
 }else if(input&&input.issue_id&&!issueId){
  issueId=input.issue_id;
 }
 const issue=v290Issue_(issueId,u);
 traceWritable_(order_(issue.case_id,u));
 input=input||{};
 const id=input.id||stable_('supplier-req:'+issueId+':'+uid_().slice(0,8));
 const now=now_();
 const existing=rows_('47_SUPPLIER_EVIDENCE_REQUESTS').find(r=>r.id===id);
 const mat=rows_('02_SO_ITEM_MATERIAL').find(m=>m.id===issue.material_id)||{};
 const supId=text_(input.supplier_id||issue.supplier_id||mat.supplier_id||'',100);
 const summary=text_(input.issue_summary||issue.required_action||'',2000);
 const reqInfo=text_(input.requested_information||'',2000);
 const reqClar=text_(input.required_clarification||'',2000);
 const due=input.due_date?actionCenterIsoDate_(input.due_date):'';
 const channel=text_(input.channel||'EMAIL',50);

 const draft_message=`KODA EUDR EVIDENCE REQUEST\n`+
  `Order: ${issue.case_id}\n`+
  `Material/Source: ${mat.material||issue.material_id||'—'}\n`+
  `Finding: ${summary}\n`+
  (reqInfo?`Requested Documents/Data: ${reqInfo}\n`:'')+
  (reqClar?`Clarification Needed: ${reqClar}\n`:'')+
  (due?`Deadline: ${due}\n`:'')+
  `Contact: ${u.email}`;

 const rec={
  id,
  issue_id:issueId,
  case_id:issue.case_id,
  material_id:issue.material_id,
  source_id:issue.source_id,
  supplier_id:supId,
  issue_summary:summary,
  requested_information:reqInfo,
  required_clarification:reqClar,
  due_date:due,
  owner:u.email,
  status:existing?.status||'DRAFT',
  channel,
  sent_at:existing?.sent_at||'',
  sent_recorded_by:existing?.sent_recorded_by||'',
  responded_at:existing?.responded_at||'',
  response_note:existing?.response_note||'',
  response_document_ids:existing?.response_document_ids||'[]',
  created_by:existing?.created_by||u.email,
  created_at:existing?.created_at||now,
  updated_at:now,
  audit_history:existing?.audit_history||JSON.stringify([{at:now,actor:u.email,action:'DRAFTED'}])
 };

 if(existing)patch_('47_SUPPLIER_EVIDENCE_REQUESTS',id,rec);
 else add_('47_SUPPLIER_EVIDENCE_REQUESTS',rec);

 auditOnce_('SUPPLIER_REQUEST_SAVED',issue.case_id,id,'',JSON.stringify({issue_id:issueId,supplier_id:supId}),u);
 return {id,status:rec.status,draft_message};
}

function recordSupplierEvidenceRequestSent(requestId,input){
 const u=v290Internal_('AI_USE');v290Ready_();
 if(typeof evidenceActionSchema_==='function')evidenceActionSchema_();
 input=input||{};
 const req=rows_('47_SUPPLIER_EVIDENCE_REQUESTS').find(r=>r.id===requestId);
 if(!req)fail_('INVALID_INPUT','Supplier request not found');
 const issue=v290Issue_(req.issue_id,u);
 traceWritable_(order_(issue.case_id,u));
 const now=now_(),sentAt=input.sent_at?String(input.sent_at):now;
 const channel=text_(input.channel||req.channel||'EMAIL',50);
 const history=jsonList_(req.audit_history||'[]');
 history.push({at:now,actor:u.email,action:'SENT_EXTERNAL',channel,sent_at:sentAt});

 patch_('47_SUPPLIER_EVIDENCE_REQUESTS',requestId,{
  status:'SENT',
  channel,
  sent_at:sentAt,
  sent_recorded_by:u.email,
  updated_at:now,
  audit_history:JSON.stringify(history)
 });

 if(issue.status==='ASSIGNED'){
  const issueHistory=jsonList_(issue.audit_history||'[]');
  issueHistory.push({at:now,actor:u.email,from:'ASSIGNED',to:'IN_PROGRESS',reason:'Supplier evidence request sent via '+channel});
  patch_('37_REVIEW_ISSUES',issue.id,{status:'IN_PROGRESS',updated_at:now,audit_history:JSON.stringify(issueHistory)});
 }

 auditOnce_('SUPPLIER_REQUEST_SENT',issue.case_id,requestId,'',JSON.stringify({channel,sent_at:sentAt}),u);
 return {id:requestId,status:'SENT'};
}

function recordSupplierEvidenceRequestResponse(requestId,input){
 const u=v290Internal_('AI_USE');v290Ready_();
 if(typeof evidenceActionSchema_==='function')evidenceActionSchema_();
 input=input||{};
 const req=rows_('47_SUPPLIER_EVIDENCE_REQUESTS').find(r=>r.id===requestId);
 if(!req)fail_('INVALID_INPUT','Supplier request not found');
 const issue=v290Issue_(req.issue_id,u);
 traceWritable_(order_(issue.case_id,u));
 const now=now_(),respAt=input.responded_at?String(input.responded_at):now;
 const note=text_(input.response_note||'',2000);
 const docIds=Array.isArray(input.response_document_ids)?input.response_document_ids:[];
 const history=jsonList_(req.audit_history||'[]');
 history.push({at:now,actor:u.email,action:'RESPONSE_RECORDED',responded_at:respAt,note,doc_count:docIds.length});

 patch_('47_SUPPLIER_EVIDENCE_REQUESTS',requestId,{
  status:'RESPONDED',
  responded_at:respAt,
  response_note:note,
  response_document_ids:JSON.stringify(docIds),
  updated_at:now,
  audit_history:JSON.stringify(history)
 });

 auditOnce_('SUPPLIER_RESPONSE_RECORDED',issue.case_id,requestId,'',JSON.stringify({responded_at:respAt,doc_count:docIds.length}),u);
 return {id:requestId,status:'RESPONDED'};
}

function compareReviewFindings(issueId){
 const u=v290Internal_('AI_USE');v290Ready_();
 const issue=v290Issue_(issueId,u);
 const curReviewRow=rows_('36_AI_REVIEW_IMPORTS').find(r=>r.id===issue.review_id);
 const curReview=curReviewRow?v290ReadReview_(curReviewRow,u):null;
 const curFinding=curReview?.result?.findings?.find(f=>f.finding_id===issue.finding_id)||null;

 const allReviews=rows_('36_AI_REVIEW_IMPORTS').filter(r=>r.case_id===issue.case_id&&r.material_id===issue.material_id&&r.source_id===issue.source_id&&r.status==='IMPORTED'&&r.id!==issue.review_id);
 const latestRow=allReviews.sort((a,b)=>String(b.imported_at||'').localeCompare(String(a.imported_at||'')))[0]||null;
 const latestReview=latestRow?v290ReadReview_(latestRow,u):null;

 if(!latestReview||!latestReview.result){
  return {issue_id:issueId,status:'NO_NEW_REVIEW_YET',comparison:'No newer imported review available on this scope'};
 }

 const matchingFinding=latestReview.result.findings?.find(f=>f.finding_id===issue.finding_id||(curFinding&&f.dimension===curFinding.dimension&&f.finding_type===curFinding.finding_type));

 if(!matchingFinding){
  return {issue_id:issueId,status:'RESOLVED_IN_NEW',latest_review_id:latestRow.id,comparison:'Finding no longer present in latest review ('+latestRow.id+')'};
 }

 return {
  issue_id:issueId,
  status:'STILL_OPEN',
  latest_review_id:latestRow.id,
  latest_finding_id:matchingFinding.finding_id,
  latest_severity:matchingFinding.severity,
  comparison:'Finding persists in latest review ('+latestRow.id+')'
 };
}
