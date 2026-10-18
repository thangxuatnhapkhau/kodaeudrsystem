// Supplier identity is master data, never a compliance decision or an authorization key.
const SI_VERSION_='1.0.0';
const SI_SUPPLIER_COLUMNS_=['legal_name','display_name','registration_country','registration_namespace','registration_verified','identity_status','merged_into_id','verified_at','verified_by','identity_evidence','identity_revision'];
const SI_TABLES_={
 '44_SUPPLIER_ALIASES':['id','supplier_id','alias_name','normalized_alias','alias_type','country','verification_status','evidence_reference','created_at','created_by','verified_at','verified_by','active','updated_at'],
 '45_SUPPLIER_MATCH_QUEUE':['id','context_id','case_id','node_key','detected_name','document_id','page','excerpt','candidate_ids','reasons_json','rule_version','indicators_json','decision','reviewer','decided_at','resolution_json','request_key','status','master_hash','source_hash','updated_at','created_by'],
 '46_SUPPLIER_MERGE_LOG':['id','source_supplier_id','target_supplier_id','snapshot_json','snapshot_hash','reference_counts_json','reason','evidence_reference','approved_by','approved_at','status','executed_at','reconciliation_json','rollback_reference','error','updated_at']
};
// File evaluation order in Apps Script is not specified. Schema extension is lazy.
function supplierSchema_(){
 for(const k of SI_SUPPLIER_COLUMNS_)if(!SCHEMA['14_SUPPLIERS'].includes(k))SCHEMA['14_SUPPLIERS'].push(k);
 Object.assign(SCHEMA,SI_TABLES_);
}
function supplierReady_(){supplierSchema_();if(config_('SUPPLIER_IDENTITY_VERSION')!==SI_VERSION_)fail_('MIGRATION_REQUIRED','Run supplier identity staging migration first');}
function supplierInternal_(cap){const u=requireCapability_(cap||'SUPPLIER_EDIT');if(['SUPPLIER_USER','VIEWER'].includes(u.role))fail_('PERMISSION_DENIED','Internal supplier management required');supplierReady_();return u;}
function supplierApprover_(){const u=supplierInternal_('SUPPLIER_EDIT');if(!['ADMIN','EUDR_REVIEWER'].includes(u.role))fail_('PERMISSION_DENIED','Identity verification requires Admin or explicitly capable EUDR reviewer');return u;}
function supplierNorm_(value){return String(value||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en');}
function supplierSearch_(value){return supplierNorm_(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');}
function supplierTokens_(value){const suffix=new Set(['cong','ty','tnhh','co','phan','ltd','limited','inc','incorporated','jsc','corporation','company','associates','supplier']);return new Set(supplierSearch_(value).split(' ').filter(t=>t.length>1&&!suffix.has(t)));}
function supplierSimilarity_(a,b){const x=supplierTokens_(a),y=supplierTokens_(b);if(!x.size||!y.size)return 0;const hit=[...x].filter(t=>y.has(t)).length;return hit/Math.min(x.size,y.size);}
function supplierOcrCandidate_(name){return supplierSearch_(name).split(' ').map(token=>/[a-z]/.test(token)&&/[0158]/.test(token)?token.replace(/0/g,'o').replace(/1/g,'i').replace(/5/g,'s').replace(/8/g,'b'):token).join(' ');}
function supplierActive_(s){return !!s&&s.active==='YES'&&s.identity_status!=='MERGED'&&!s.merged_into_id;}
function supplierCanonical_(id,all){all=all||rows_('14_SUPPLIERS');const seen=new Set();let s=all.find(s=>s.id===id);while(s?.merged_into_id){if(seen.has(s.id))fail_('IDENTITY_CONFLICT','Circular supplier redirect');seen.add(s.id);s=all.find(x=>x.id===s.merged_into_id);}
 if(!supplierActive_(s))fail_('IDENTITY_CONFLICT','Supplier identity is missing, inactive or in recovery');return s;
}
function supplierMasterHash_(){return stable_(JSON.stringify({suppliers:rows_('14_SUPPLIERS').sort((a,b)=>a.id.localeCompare(b.id)),aliases:rows_('44_SUPPLIER_ALIASES').sort((a,b)=>a.id.localeCompare(b.id))}));}
function supplierRegistrationKey_(s){return s.registration_verified==='YES'&&s.registration&&s.registration_namespace&&/^[A-Z]{2}$/.test(s.registration_country||'')?[s.registration_country,s.registration_namespace,supplierNorm_(s.registration)].join('|'):'';}
function supplierConflicts_(input,s){const conflicts=[];
 if(input.registration&&s.registration&&input.registration_namespace&&input.registration_namespace===s.registration_namespace&&input.registration_country===s.registration_country&&supplierNorm_(input.registration)!==supplierNorm_(s.registration))conflicts.push('REGISTRATION_CONFLICT');
 if(input.country&&s.country&&supplierSearch_(input.country)!==supplierSearch_(s.country))conflicts.push('COUNTRY_REVIEW');
 return conflicts;
}
function resolveSupplierIdentity_(input,excludeId){
 const all=rows_('14_SUPPLIERS'),aliases=rows_('44_SUPPLIER_ALIASES').filter(a=>a.active==='YES'),name=supplierNorm_(input.name),rank=[];
 const eligible=all.filter(s=>s.id!==excludeId);
 if(input.supplier_id){const s=supplierCanonical_(input.supplier_id,all),conflicts=supplierConflicts_(input,s);return {classification:conflicts.length?'IDENTITY_CONFLICT':'EXACT_VERIFIED',supplier_id:conflicts.length?'':s.id,candidates:[{supplier:s,reasons:['EXPLICIT_CANONICAL_ID'],conflicts,score:1}],rule_version:SI_VERSION_};}
 for(const s of eligible){let reasons=[],score=0;const names=[s.name,s.legal_name,s.display_name].filter(Boolean),own=aliases.filter(a=>a.supplier_id===s.id&&supplierNorm_(a.alias_name)===name);
  if(names.some(n=>supplierNorm_(n)===name)){reasons.push('EXACT_NAME');score=1;}
  if(own.length){reasons.push(own.some(a=>a.verification_status==='VERIFIED')?'VERIFIED_ALIAS':'UNVERIFIED_ALIAS');score=1;}
  const reg=supplierRegistrationKey_(s),inputReg=input.registration&&input.registration_namespace&&/^[A-Z]{2}$/.test(input.registration_country||'')?[input.registration_country,input.registration_namespace,supplierNorm_(input.registration)].join('|'):'';
  if(reg&&reg===inputReg){reasons.push('VERIFIED_REGISTRATION');score=1;}
  const sim=Math.max(0,...names.map(n=>supplierSimilarity_(n,input.name)));
  // Deliberately broad candidate retrieval: at least one common substantive token.
  if(sim>0){reasons.push('TOKEN_SIMILARITY');score=Math.max(score,sim);}
  else if(names.some(n=>supplierSimilarity_(supplierOcrCandidate_(n),supplierOcrCandidate_(input.name))>0)){reasons.push('POSSIBLE_OCR_VARIANT');score=Math.max(score,0.25);}
  if(reasons.length)rank.push({supplier:s,reasons,conflicts:supplierConflicts_(input,s),score});
 }
 for(const c of rank){if(c.supplier.merged_into_id){try{c.supplier=supplierCanonical_(c.supplier.id,all);c.reasons.push('HISTORICAL_REDIRECT');}catch(e){c.conflicts.push('INVALID_REDIRECT');}}}
 const grouped=new Map();for(const c of rank){const prior=grouped.get(c.supplier.id);if(prior){prior.reasons=[...new Set(prior.reasons.concat(c.reasons))];prior.conflicts=[...new Set(prior.conflicts.concat(c.conflicts))];prior.score=Math.max(prior.score,c.score);}else grouped.set(c.supplier.id,c);}rank.splice(0,rank.length,...grouped.values());
 rank.sort((a,b)=>b.score-a.score||a.supplier.id.localeCompare(b.supplier.id));
 const strong=rank.filter(c=>supplierActive_(c.supplier)&&(c.reasons.includes('VERIFIED_REGISTRATION')||c.reasons.includes('VERIFIED_ALIAS')||c.reasons.includes('EXACT_NAME')&&c.supplier.identity_status==='VERIFIED'));
 const strongIds=new Set(strong.map(c=>c.supplier.id)),exact=rank.filter(c=>c.reasons.some(r=>['EXACT_NAME','VERIFIED_ALIAS','UNVERIFIED_ALIAS','VERIFIED_REGISTRATION'].includes(r)));
 const ambiguity=strongIds.size>1||exact.some(c=>c.conflicts.length)||exact.length>1&&new Set(exact.map(c=>{try{return supplierCanonical_(c.supplier.id,all).id;}catch(e){return c.supplier.id;}})).size>1;
 let classification='NEW_CANDIDATE',id='';
 if(ambiguity)classification='IDENTITY_CONFLICT';
 else if(strong.length===1&&!strong[0].conflicts.length){classification=strong[0].reasons.includes('VERIFIED_ALIAS')?'ALIAS_VERIFIED':'EXACT_VERIFIED';id=strong[0].supplier.id;}
 else if(rank.length)classification=exact.some(c=>c.conflicts.length)?'IDENTITY_CONFLICT':'CANDIDATE_REVIEW';
 return {classification,supplier_id:id,candidates:rank.slice(0,20),rule_version:SI_VERSION_};
}
function supplierUsage_(id,u){const out={},orderIds=new Set(),materialIds=new Set();for(const n of Object.keys(SCHEMA)){if(!SCHEMA[n].includes('supplier_id')||n==='44_SUPPLIER_ALIASES')continue;const found=rows_(n).filter(r=>r.supplier_id===id);if(n==='05_OWNER_MASTER'){if(u.role==='ADMIN')out[n]=found.length;continue;}const visible=found.filter(r=>!r.case_id||canOrder_(u,rows_('01_SO_MASTER').find(c=>c.id===r.case_id)||{}));out[n]=visible.length;for(const r of visible){if(r.case_id)orderIds.add(r.case_id);if(r.material_id)materialIds.add(r.material_id);if(n==='02_SO_ITEM_MATERIAL')materialIds.add(r.id);}}out.related_orders=orderIds.size;out.related_materials=materialIds.size;return out;}
function supplierCandidateView_(c,u){const s=c.supplier;return {id:s.id,name:s.name,legal_name:s.legal_name||'',display_name:s.display_name||s.name,country:s.country,address:s.address,registration:s.registration,registration_country:s.registration_country,registration_namespace:s.registration_namespace,registration_verified:s.registration_verified==='YES',identity_status:s.identity_status||'UNVERIFIED',active:s.active,merged_into_id:s.merged_into_id||'',score:c.score,reasons:c.reasons,conflicts:c.conflicts,usage:supplierUsage_(s.id,u)};}
function supplierQueue_(context,node,u,sourceHash,caseId){
 const result=resolveSupplierIdentity_({name:node.name}),master=supplierMasterHash_(),id=stable_('supplier-match:'+context+':'+node.key),old=rows_('45_SUPPLIER_MATCH_QUEUE').find(q=>q.id===id);
 const value={context_id:context,case_id:caseId||'',node_key:node.key,detected_name:node.name,document_id:node.document_id||'',page:node.page||'',excerpt:node.excerpt||'',candidate_ids:JSON.stringify(result.candidates.map(c=>c.supplier.id)),reasons_json:JSON.stringify(result.candidates.map(c=>({id:c.supplier.id,reasons:c.reasons}))),rule_version:SI_VERSION_,indicators_json:JSON.stringify({classification:result.classification,ranking_only:true}),master_hash:master,source_hash:sourceHash,updated_at:now_()};
 if(!old)add_('45_SUPPLIER_MATCH_QUEUE',{...value,id,created_by:u.email,status:result.classification==='IDENTITY_CONFLICT'?'CONFLICT':'PENDING_REVIEW',request_key:BRIDGE_REQUEST_KEY});
 else if((old.master_hash!==master||old.source_hash!==sourceHash)&&!supplierQueueRecoverable_(context,sourceHash))patch_('45_SUPPLIER_MATCH_QUEUE',id,{...value,status:result.classification==='IDENTITY_CONFLICT'?'CONFLICT':'PENDING_REVIEW',decision:'',resolution_json:'',reviewer:'',decided_at:''});
 const q=rows_('45_SUPPLIER_MATCH_QUEUE').find(q=>q.id===id);
 return {queue_id:id,node_key:node.key,detected_name:node.name,document_id:node.document_id||'',page:node.page||'',excerpt:node.excerpt||'',classification:result.classification,automatic_supplier_id:result.supplier_id,status:q.status,resolution:q.resolution_json?JSON.parse(q.resolution_json):null,candidates:result.candidates.map(c=>supplierCandidateView_(c,u))};
}
function previewSupplierIdentity(input){const u=supplierInternal_();const name=text_(input.name||'',200);if(!name)fail_('INVALID_INPUT','Supplier name required');return withOperation_(()=>supplierQueue_('MASTER:'+u.email+':'+stable_(name),{name,key:'MASTER'},u,stable_(name),''));}
function supplierProposalProjection_(b,proposal,fn){
 const intent=rows_('08_ACTIVITY_LOG').find(a=>a.action==='SUPPLIER_CHAIN_INTENT'&&a.entity_id===b.id);if(!intent)return fn();
 const data=JSON.parse(intent.next||'{}');if(data.snapshot_hash!==b.snapshot_hash||data.result_sha256!==b.result_sha256)fail_('MERGE_RECOVERY_REQUIRED','Chain intent integrity mismatch');
 const nodeIds=new Set(proposal.nodes.map(n=>stable_('chain-proposal-node:'+b.id+':'+n.key))),edgeIds=new Set(proposal.edges.map((e,i)=>stable_('chain-proposal-edge:'+b.id+':'+i))),originalRows=rows_;
 for(const n of originalRows('15_SUPPLY_CHAIN').filter(n=>nodeIds.has(n.id))){const proposed=proposal.nodes.find(p=>stable_('chain-proposal-node:'+b.id+':'+p.key)===n.id);if(n.case_id!==b.case_id||n.material_id!==b.material_id||n.display_name!==proposed.name||n.node_type!==proposed.node_type||n.source_document_id!==proposed.document_id||n.supplier_id!==data.plans?.find(p=>p.node_key===proposed.key)?.supplier_id||n.status!=='UPSTREAM_INCOMPLETE'||n.terminal!=='NO'||n.plot_id||n.updated_at!==n.created_at)fail_('MANUAL_RECOVERY_REQUIRED','Draft node changed after interrupted proposal');}
 for(const edge of originalRows('31_SOURCE_EDGES').filter(e=>edgeIds.has(e.id)))if(edge.input_lot||edge.output_lot||edge.transaction_no||edge.quantity!==''||edge.active!=='YES'||edge.updated_at!==edge.created_at)fail_('MANUAL_RECOVERY_REQUIRED','Draft edge changed after interrupted proposal');
 for(const task of originalRows('04_EVIDENCE_TRACKER').filter(t=>nodeIds.has(t.chain_node_id)))if(task.owner||task.document_id||task.status!=='MISSING'||task.updated_at!==task.created_at)fail_('MANUAL_RECOVERY_REQUIRED','Draft task changed after interrupted proposal');
 try{rows_=n=>originalRows(n).filter(r=>n==='15_SUPPLY_CHAIN'?!nodeIds.has(r.id):n==='31_SOURCE_EDGES'?!edgeIds.has(r.id):n==='04_EVIDENCE_TRACKER'?!nodeIds.has(r.chain_node_id):true);return fn();}finally{rows_=originalRows;}
}
function supplierProposal_(reviewId,u,allowApplied){
 const b=rows_('32_MATERIAL_REVIEWS').find(r=>r.id===reviewId&&r.status==='DONE');if(!b)fail_('INVALID_INPUT','Completed review required');const scope=materialBatchScope_(b,u);traceWritable_(scope.c);
 const applied=rows_('08_ACTIVITY_LOG').some(a=>a.action==='MATERIAL_CHAIN_APPLIED'&&a.entity_id===b.id);
 if(applied&&allowApplied)return {b,scope,applied:true};
 scope.docs.forEach(verifyAIStoredSource_);const file=DriveApp.getFileById(b.result_file_id),raw=file.getBlob().getDataAsString();if(file.getSize()>48000||bridgeHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,raw))!==b.result_sha256)fail_('RESULT_INTEGRITY_ERROR','Review result changed');
 const result=JSON.parse(raw),proposal=result.chain_proposals;if(!proposal?.nodes?.length||!proposal?.edges?.length)fail_('INVALID_INPUT','Cited proposal required');
 // Existing result metadata is application-owned; validate the original schema again.
 const clean={...result};delete clean.system;supplierProposalProjection_(b,proposal,()=>validateMaterialReview_(clean,b,scope,null));
 return {b,scope,proposal};
}
function previewMaterialSupplierMatches(reviewId){const u=supplierInternal_('CHAIN_EDIT');traceInternal_(u);return withOperation_(()=>{const {b,proposal,scope}=supplierProposal_(reviewId,u);return {review_id:b.id,edge_count:proposal.edges.length,source_hash:b.snapshot_hash,master_hash:supplierMasterHash_(),matches:proposal.nodes.map(n=>({...supplierQueue_(b.id,n,u,b.snapshot_hash,b.case_id),source_document_name:scope.docs.find(d=>d.id===n.document_id)?.name||n.document_id,source_url:'https://drive.google.com/file/d/'+scope.docs.find(d=>d.id===n.document_id)?.file_id+'/view',proposal_candidates:proposal.nodes.filter(x=>x.key!==n.key&&(supplierNorm_(x.name)===supplierNorm_(n.name)||supplierSimilarity_(x.name,n.name)>0)).map(x=>({key:x.key,name:x.name}))}))};});}
function decideSupplierMatch(queueId,input){const u=supplierInternal_();return withOperation_(()=>{
 const q=rows_('45_SUPPLIER_MATCH_QUEUE').find(q=>q.id===queueId);if(!q)fail_('INVALID_INPUT','Match missing');
 if(rows_('08_ACTIVITY_LOG').some(a=>a.action==='SUPPLIER_CHAIN_INTENT'&&a.entity_id===q.context_id))fail_('CHAIN_RECOVERY_REQUIRED','Chain execution already started; use recovery before changing identity decisions');
 if(q.case_id){order_(q.case_id,u);const p=supplierProposal_(q.context_id,u);if(p.b.snapshot_hash!==q.source_hash)fail_('VERSION_CONFLICT','Source changed');}else if(q.created_by!==u.email&&u.role!=='ADMIN')fail_('PERMISSION_DENIED','Match outside actor scope');
 if(input.confirmed!==true||!text_(input.reason||'',1500))fail_('HUMAN_CONFIRMATION_REQUIRED','Separate supplier identity decision and reason required');
 if(q.master_hash!==supplierMasterHash_())fail_('VERSION_CONFLICT','Supplier master changed; refresh matching');
 const result=resolveSupplierIdentity_({name:q.detected_name});let status,resolution={};
 if(input.decision==='USE_EXISTING'){
  const target=supplierCanonical_(text_(input.supplier_id||'',100));
  if(!result.candidates.some(c=>c.supplier.id===target.id)||result.candidates.find(c=>c.supplier.id===target.id)?.conflicts.length)fail_('IDENTITY_CONFLICT','Candidate invalid or conflicting');
  if(result.classification==='IDENTITY_CONFLICT'&&(!['ADMIN','EUDR_REVIEWER'].includes(u.role)||!text_(input.evidence_reference||'',1500)))fail_('IDENTITY_CONFLICT','Conflict needs authorized identity review with evidence');
  resolution={supplier_id:target.id};status='MATCH_CONFIRMED';
 }else if(input.decision==='CREATE_NEW'){
  if(result.supplier_id)fail_('IDENTITY_CONFLICT','Verified unique match exists; reuse it');
  if(result.classification==='IDENTITY_CONFLICT')fail_('IDENTITY_CONFLICT','Resolve identity conflict before creating');
  // A human may explicitly group different spellings within one proposal; key is persisted.
  const group=text_(input.new_group||q.node_key,100);if(!group)fail_('INVALID_INPUT','New entity group required');
  const grouped=rows_('45_SUPPLIER_MATCH_QUEUE').filter(x=>x.id!==q.id&&x.context_id===q.context_id&&x.status==='NEW_CONFIRMED').map(x=>JSON.parse(x.resolution_json||'{}')).find(x=>x.new_group===group);
  if(grouped&&input.new_name&&input.new_name!==grouped.name)fail_('IDENTITY_CONFLICT','Grouped nodes must use one approved master name');
  resolution={supplier_id:stable_('approved-new-supplier:'+q.context_id+':'+group),new_group:group,name:grouped?.name||text_(input.new_name||q.detected_name,200),distinct_entity_confirmed:input.distinct_entity_confirmed===true};status='NEW_CONFIRMED';
 }else if(input.decision==='DEFER')status='DEFERRED';else if(input.decision==='REJECT')status='REJECTED';else fail_('INVALID_INPUT','Unknown decision');
 Object.assign(resolution,{reason:input.reason,evidence_reference:text_(input.evidence_reference||'',1500),approved_by:u.email,approved_at:now_()});
 patch_('45_SUPPLIER_MATCH_QUEUE',q.id,{decision:input.decision,status,resolution_json:JSON.stringify(resolution),reviewer:u.email,decided_at:now_(),request_key:BRIDGE_REQUEST_KEY,updated_at:now_()});
 auditOnce_('SUPPLIER_MATCH_DECIDED',q.case_id,q.id,JSON.stringify({status:q.status}),JSON.stringify({status,resolution}),u);return {id:q.id,status,resolution};
 });}
function supplierCreationBaseHash_(plans){const ids=new Set(plans.filter(p=>p.is_new).map(p=>p.supplier_id));return stable_(JSON.stringify({suppliers:rows_('14_SUPPLIERS').filter(s=>!ids.has(s.id)).sort((a,b)=>a.id.localeCompare(b.id)),aliases:rows_('44_SUPPLIER_ALIASES').sort((a,b)=>a.id.localeCompare(b.id))}));}
function supplierChainIntent_(b,proposal,u){
 const old=rows_('08_ACTIVITY_LOG').find(a=>a.action==='SUPPLIER_CHAIN_INTENT'&&a.entity_id===b.id);if(old)return JSON.parse(old.next);
 const master=supplierMasterHash_(),plans=[];for(const node of proposal.nodes){const match=resolveSupplierIdentity_({name:node.name});if(match.supplier_id){plans.push({node_key:node.key,supplier_id:match.supplier_id,is_new:false});continue;}
  const q=rows_('45_SUPPLIER_MATCH_QUEUE').find(q=>q.context_id===b.id&&q.node_key===node.key);if(!q||q.master_hash!==master||q.source_hash!==b.snapshot_hash||!q.reviewer||!['MATCH_CONFIRMED','NEW_CONFIRMED'].includes(q.status))fail_('SUPPLIER_REVIEW_REQUIRED','Resolve every supplier identity separately before applying chain');const decision=JSON.parse(q.resolution_json||'{}');if(q.status==='NEW_CONFIRMED'&&!hasCapability_(u,'SUPPLIER_EDIT'))fail_('PERMISSION_DENIED','Supplier edit capability required');if(q.status==='MATCH_CONFIRMED')supplierCanonical_(decision.supplier_id);plans.push({node_key:node.key,supplier_id:decision.supplier_id,is_new:q.status==='NEW_CONFIRMED',name:decision.name||node.name,distinct_entity_confirmed:decision.distinct_entity_confirmed===true,evidence_reference:decision.evidence_reference||''});
 }
 for(let i=0;i<plans.length;i++)for(let j=i+1;j<plans.length;j++){const a=plans[i],c=plans[j];if(a.is_new&&c.is_new&&a.supplier_id!==c.supplier_id&&(supplierNorm_(a.name)===supplierNorm_(c.name)||supplierSimilarity_(a.name,c.name)>0)&&!(a.distinct_entity_confirmed&&c.distinct_entity_confirmed&&a.evidence_reference&&c.evidence_reference))fail_('SUPPLIER_REVIEW_REQUIRED','Related proposed names need one approved group or explicit evidence that they are distinct entities');}
 const intent={snapshot_hash:b.snapshot_hash,result_sha256:b.result_sha256,plans,master_base_hash:supplierCreationBaseHash_(plans)};auditOnce_('SUPPLIER_CHAIN_INTENT',b.case_id,b.id,'',JSON.stringify(intent),u);return intent;
}
function supplierProposalMapping_(b,proposal,u){
 const intent=supplierChainIntent_(b,proposal,u),plans=intent.plans;if(intent.master_base_hash!==supplierCreationBaseHash_(plans))fail_('VERSION_CONFLICT','Master changed since chain intent; manual re-review required');
 const result=new Map();for(const p of plans){if(!proposal.nodes.some(n=>n.key===p.node_key)||!p.supplier_id)fail_('RESULT_INTEGRITY_ERROR','Invalid identity intent');const old=rows_('14_SUPPLIERS').find(s=>s.id===p.supplier_id);if(p.is_new){if(!hasCapability_(u,'SUPPLIER_EDIT'))fail_('PERMISSION_DENIED','Supplier creation permission required');if(old&&(!supplierActive_(old)||old.name!==p.name||old.registration||old.identity_status!=='UNVERIFIED'))fail_('MANUAL_RECOVERY_REQUIRED','New identity was edited after interrupted creation');}else supplierCanonical_(p.supplier_id);result.set(p.node_key,p.supplier_id);}
 for(const p of plans.filter(p=>p.is_new)){if(!rows_('14_SUPPLIERS').some(s=>s.id===p.supplier_id))add_('14_SUPPLIERS',{id:p.supplier_id,name:p.name,active:'YES',identity_status:'UNVERIFIED',identity_revision:uid_(),created_at:now_(),created_by:u.email,updated_at:now_(),updated_by:u.email});auditOnce_('SUPPLIER_CREATED',b.case_id,p.supplier_id,'',JSON.stringify({name:p.name,identity_approved_in:b.id}),u);}
 const master=supplierMasterHash_();for(const q of rows_('45_SUPPLIER_MATCH_QUEUE').filter(q=>q.context_id===b.id&&['MATCH_CONFIRMED','NEW_CONFIRMED'].includes(q.status)))patch_('45_SUPPLIER_MATCH_QUEUE',q.id,{master_hash:master});return result;
}
function supplierVerifyChainWrite_(b,proposal,supplierIds,nodeIds){for(const n of proposal.nodes){const saved=rows_('15_SUPPLY_CHAIN').find(x=>x.id===nodeIds.get(n.key));if(!saved||saved.supplier_id!==supplierIds.get(n.key)||saved.display_name!==n.name||saved.source_document_id!==n.document_id)fail_('CHAIN_RECOVERY_REQUIRED','Node reconciliation failed');}for(let i=0;i<proposal.edges.length;i++){const e=proposal.edges[i],saved=rows_('31_SOURCE_EDGES').find(x=>x.id===stable_('chain-proposal-edge:'+b.id+':'+i));if(!saved||saved.source_id!==b.source_id||saved.from_node_id!==nodeIds.get(e.from_key)||saved.to_node_id!==(e.to_key==='KODA'?'':nodeIds.get(e.to_key)))fail_('CHAIN_RECOVERY_REQUIRED','Edge reconciliation failed');}}

function supplierQueueRecoverable_(context,sourceHash){const record=rows_('08_ACTIVITY_LOG').find(a=>a.action==='SUPPLIER_CHAIN_INTENT'&&a.entity_id===context);if(!record)return false;const intent=JSON.parse(record.next||'{}');return intent.snapshot_hash===sourceHash&&intent.master_base_hash===supplierCreationBaseHash_(intent.plans||[]);}
