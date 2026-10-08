// Additive schema only. Run migrateV2() on a BACKED-UP STAGING copy first.
const V2_COLUMNS_={
 '01_SO_MASTER':['product','product_image_id','so_document_id','request_key'],
 '02_SO_ITEM_MATERIAL':['supplier_id','category','scientific_name','source_reference','confirmed_by','confirmed_at','request_key','material_original','commodity','common_species','hs_cn_code','quantity','quantity_uom','production_countries','production_range','legality_evidence_ids','deforestation_evidence_ids','scope_status','scope_rule_version','metadata_source_document_id','metadata_reference'],
 '04_EVIDENCE_TRACKER':['supplier_id','evidence_block','required','assigned_reviewer','priority','created_at','calendar_sync_status'],
 '05_OWNER_MASTER':['supplier_id','assigned_orders','last_login','created_at','created_by','auth_provider','auth_uid','must_change_password','password_changed_at'],
 '08_ACTIVITY_LOG':['role','object_type','order_no','comment'],
 '06_DOCUMENT_REGISTER':['material_id','supplier_id','evidence_block','document_type','mime_type','active_version','reviewed_by','reviewed_at','review_comment','superseded_by','source_document_id','redaction_verified','translation_verified','updated_at','request_key','certificate_holder','certificate_no','certificate_scope','issue_date','expiry_date']
};
const V2_TABLES_={
 '14_SUPPLIERS':['id','name','email','active','created_at','created_by'],
 '15_SUPPLY_CHAIN':['id','case_id','material_id','supplier_id','parent_id','node_type','plot_id','source_document_id','created_by','created_at'],
 '16_COMMENTS':['id','case_id','document_id','version','visibility','comment','author','created_at'],
 '17_GEO_LOCATIONS':['id','case_id','material_id','supplier_id','chain_node_id','plot_id','country_of_production','production_range','area_ha','geometry_json','source_document_id','verification_status','reviewed_by','reviewed_at','notes','rule_version','coordinate_precision_digits'],
 '18_AI_PROMPT_RUNS':['id','case_id','function','document_id','prompt_version','generated_by','generated_at','prompt','imported_result','result_status'],
 '19_EXPORT_LOG':['id','case_id','actor','created_at','file_id','manifest_json','include_history','request_key'],
 '20_NOTIFICATIONS':['id','email','case_id','object_id','message','read','created_at'],
 '23_UPLOAD_SESSIONS':['id','actor','case_id','task_id','name','mime_type','size','sha256','chunk_count','folder_id','expected_document_id','status','created_at','request_key','document_id','kind','source_document_id'],
 '22_COUNTRY_RISK':['id','country_code','risk_level','rule_version','checked_at','reviewed_by','source_url'],
 '21_OPERATIONS':['id','actor','action','fingerprint','status','result_json','updated_at']
};
Object.keys(V2_COLUMNS_).forEach(n=>SCHEMA[n]=SCHEMA[n].concat(V2_COLUMNS_[n]));
Object.assign(SCHEMA,V2_TABLES_);
const STATUS_MAP_={Missing:'MISSING',Received:'UPLOADED',Accepted:'APPROVED',Rework:'MORE_INFO_REQUIRED',Superseded:'SUPERSEDED',Draft:'UPLOADED',Approved:'APPROVED',Collecting:'COLLECTING_EVIDENCE',Completed:'CLOSED'};
function migrateV2(){
 const email=Session.getEffectiveUser().getEmail().toLowerCase(),db=db_();
 const admin=db.getSheetByName('05_OWNER_MASTER').getDataRange().getValues().slice(1).some(r=>String(r[0]).toLowerCase()===email&&r[3]==='ADMIN'&&r[4]==='YES');
 if(!admin)throw Error('PERMISSION_DENIED: deploying account must already be Admin');
 return lock_(()=>{
  // Validate EVERY header before ANY mutation. Never repair by destructive rewrite.
  const plans=Object.keys(V22_BASE_).map(n=>{const sheet=db.getSheetByName(n),expected=V22_BASE_[n];
   if(!sheet){if(!V2_TABLES_[n])throw Error('SCHEMA_MISMATCH: '+n);return {n,expected,create:true};}
   const actual=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
   if(actual.some((h,i)=>h!==expected[i])||actual.length>expected.length)throw Error('SCHEMA_MISMATCH: '+n);
   return {n,expected,start:actual.length,sheet};
  });
  plans.forEach(p=>{const s=p.sheet||db.insertSheet(p.n);if(s.getMaxColumns()<p.expected.length)s.insertColumnsAfter(s.getMaxColumns(),p.expected.length-s.getMaxColumns());
   if(p.create)s.getRange(1,1,1,p.expected.length).setValues([p.expected]);
   else if(p.start<p.expected.length)s.getRange(1,p.start+1,1,p.expected.length-p.start).setValues([p.expected.slice(p.start)]);
   s.setFrozenRows(1);
  });
  ['01_SO_MASTER','04_EVIDENCE_TRACKER','06_DOCUMENT_REGISTER'].forEach(n=>rows_(n).forEach(r=>{if(STATUS_MAP_[r.status])patch_(n,r.id,{status:STATUS_MAP_[r.status]});}));
  rows_('06_DOCUMENT_REGISTER').forEach(d=>{if(d.active_version==='')patch_('06_DOCUMENT_REGISTER',d.id,{active_version:d.status==='SUPERSEDED'?'NO':'YES'});});
  const defaults={SCHEMA_VERSION:'2.0.0-staging',LEGAL_RULE_VERSION:'NOT_REVIEWED',ANNEX_I_VERSION:'NOT_REVIEWED',COUNTRY_RISK_VERSION:'NOT_REVIEWED',LAST_LEGAL_REVIEW_DATE:'',LEGAL_REVIEWED_BY:'',LEGAL_REVIEW_MAX_DAYS:'90',GEO_MIN_DECIMALS:'6',GEO_POLYGON_THRESHOLD_HA:'4',FRONTEND_URL:'https://koda-eudr-system.netlify.app'};
  Object.keys(defaults).forEach(k=>{if(!rows_('09_CONFIG').some(x=>x.key===k))add_('09_CONFIG',{key:k,value:defaults[k]});});
  audit_('SCHEMA_MIGRATED','','','','2.0.0 additive migration',email);
  return {version:'2.0.0-staging',tabs:plans.length};
 });
}
// Run on a backed-up staging copy, then inspect the header and user rows before production.
function migrateV21(){
 const db=db_(),email=Session.getEffectiveUser().getEmail().toLowerCase();
 const sheet=db.getSheetByName('05_OWNER_MASTER');if(!sheet)throw Error('SCHEMA_MISMATCH: 05_OWNER_MASTER missing');
 const ownerSheet=db.getSheetByName('05_OWNER_MASTER'),values=ownerSheet.getDataRange().getValues();
 if(!values.slice(1).some(r=>String(r[0]).toLowerCase()===email&&r[3]==='ADMIN'&&r[4]==='YES'))throw Error('PERMISSION_DENIED: deploying account must already be Admin');
 const expected=V22_BASE_['05_OWNER_MASTER'],actual=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
 if(actual.some((h,i)=>h!==expected[i])||actual.length<expected.length-4||actual.length>expected.length)throw Error('SCHEMA_MISMATCH: 05_OWNER_MASTER');
 // No row is rewritten; the existing authorization fields and last_login stay intact.
 return lock_(()=>{const current=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  if(current.some((h,i)=>h!==expected[i])||current.length>expected.length)throw Error('SCHEMA_MISMATCH: concurrent change');
  if(current.length===expected.length)return {version:'2.1.0',added:0};
  if(sheet.getMaxColumns()<expected.length)sheet.insertColumnsAfter(sheet.getMaxColumns(),expected.length-sheet.getMaxColumns());
  sheet.getRange(1,current.length+1,1,expected.length-current.length).setValues([expected.slice(current.length)]);
  audit_('SCHEMA_MIGRATED','','','','2.1.0 additive owner authentication metadata',email);
  return {version:'2.1.0',added:expected.length-current.length};
 });
}


// V2.2: immutable relationships; expected V2.1 headers are frozen before extension.
const V22_BASE_=JSON.parse(JSON.stringify(SCHEMA));
const V22_COLUMNS_={
 '01_SO_MASTER':['creation_state'],
 '02_SO_ITEM_MATERIAL':['product_ids','updated_at','updated_by'],
 '03_EVIDENCE_REQUIREMENT':['required','node_type','rule_version','effective_date','updated_by','updated_at','policy_id'],
 '04_EVIDENCE_TRACKER':['chain_node_id','requirement_id','rule_version','submitted_at'],
 '05_OWNER_MASTER':['capabilities'],
 '06_DOCUMENT_REGISTER':['chain_node_id','product_id','ai_output_type','file_size_bytes','sha256','submitted_at','prompt_run_id','validation_report'],
 '07_AI_REVIEW_QUEUE':['material_id','chain_node_id','comparison_document_id','ai_function','field','observed_value','expected_or_comparison_value','source_page','evidence_excerpt','reason','check_status','severity','reviewer_decision','reviewer_comment','created_at','reviewed_at','prompt_run_id'],
 '14_SUPPLIERS':['supplier_code','address','country','contact_person','phone','registration','updated_at','updated_by'],
 '15_SUPPLY_CHAIN':['tier','relationship','terminal','folder','status','display_name','updated_at','updated_by'],
 '18_AI_PROMPT_RUNS':['source_document_ids','result_sha256'],
 '19_EXPORT_LOG':['document_ids']
};
Object.keys(V22_COLUMNS_).forEach(n=>SCHEMA[n]=SCHEMA[n].concat(V22_COLUMNS_[n]));
SCHEMA['24_SO_PRODUCTS']=['id','case_id','sku','product_name','quantity','quantity_uom','image_document_id','sequence','active','created_at','created_by','updated_at','updated_by'];
const V22_SCHEMA_=JSON.parse(JSON.stringify(SCHEMA));
function migrationV22Plan_(){
 const db=db_();return Object.keys(V22_SCHEMA_).map(n=>{
  const s=db.getSheetByName(n),expected=V22_SCHEMA_[n],base=V22_BASE_[n];
  if(!s){if(n!=='24_SO_PRODUCTS')fail_('SCHEMA_MISMATCH','Missing '+n);return {name:n,create:true,add:expected};}
  const actual=s.getRange(1,1,1,s.getLastColumn()).getValues()[0];
  if(actual.length<(base?base.length:expected.length)||actual.length>expected.length||actual.some((h,i)=>h!==expected[i]))fail_('SCHEMA_MISMATCH','Unexpected header '+n);
  return {name:n,create:false,start:actual.length,add:expected.slice(actual.length)};
 });
}
function migrateV22(dryRun){
 const email=Session.getEffectiveUser().getEmail().toLowerCase();
 if(!rows_('05_OWNER_MASTER').some(u=>u.email===email&&u.role==='ADMIN'&&u.active==='YES'))fail_('PERMISSION_DENIED','Existing deploying Admin required');
 // Editor-only action. Production execution requires the release approval process.
 return lock_(()=>{const plan=migrationV22Plan_();if(dryRun!==false)return {version:'2.2.0',dry_run:true,plan};
  let products=0;plan.forEach(p=>{const s=db_().getSheetByName(p.name)||db_().insertSheet(p.name),expected=V22_SCHEMA_[p.name];if(s.getMaxColumns()<expected.length)s.insertColumnsAfter(s.getMaxColumns(),expected.length-s.getMaxColumns());if(p.add.length)s.getRange(1,(p.start||0)+1,1,p.add.length).setValues([p.add]);s.setFrozenRows(1);});
  rows_('01_SO_MASTER').forEach(c=>{const existing=rows_('24_SO_PRODUCTS').filter(p=>p.case_id===c.id);if(existing.length)return;const id=stable_('legacy-product:'+c.id);add_('24_SO_PRODUCTS',{id,case_id:c.id,product_name:c.product||'',image_document_id:c.product_image_id||'',sequence:1,active:'YES',created_at:c.created_at||now_(),created_by:email,updated_at:now_(),updated_by:email});products++;});
  // No implicit capability grants, approvals, folder moves, legal confirmations or status conversions.
  const columns=plan.reduce((n,p)=>n+p.add.length,0);if(columns||products)audit_('SCHEMA_MIGRATED','','','',JSON.stringify({version:'2.2.0',columns,products}),email);
  return {version:'2.2.0',dry_run:false,columns,products,plan};
 });
}

// V2.3: Order/Tier-scoped requirement decisions; no existing task row is rewritten.
const V23_BASE_=JSON.parse(JSON.stringify(SCHEMA));
const V23_TASK_COLUMNS_=['override_state','override_reason','override_by','override_at'];
SCHEMA['04_EVIDENCE_TRACKER']=SCHEMA['04_EVIDENCE_TRACKER'].concat(V23_TASK_COLUMNS_);
function migrateV23(dryRun){
 const email=Session.getEffectiveUser().getEmail().toLowerCase();
 if(!rows_('05_OWNER_MASTER').some(u=>u.email===email&&u.role==='ADMIN'&&u.active==='YES'))fail_('PERMISSION_DENIED','Existing deploying Admin required');
 return lock_(()=>{
  const s=db_().getSheetByName('04_EVIDENCE_TRACKER'),expected=SCHEMA['04_EVIDENCE_TRACKER'],base=V23_BASE_['04_EVIDENCE_TRACKER'];
  if(!s)fail_('SCHEMA_MISMATCH','Evidence tracker missing');
  const actual=s.getRange(1,1,1,s.getLastColumn()).getValues()[0];
  if(actual.length<base.length||actual.length>expected.length||actual.some((h,i)=>h!==expected[i]))fail_('SCHEMA_MISMATCH','Evidence tracker headers changed');
  const add=expected.slice(actual.length);
  if(dryRun!==false)return {version:'2.3.0',dry_run:true,tab:'04_EVIDENCE_TRACKER',add,records_changed:0};
  if(add.length){if(s.getMaxColumns()<expected.length)s.insertColumnsAfter(s.getMaxColumns(),expected.length-s.getMaxColumns());s.getRange(1,actual.length+1,1,add.length).setValues([add]);s.setFrozenRows(1);audit_('SCHEMA_MIGRATED','','','',JSON.stringify({version:'2.3.0',columns:add.length,records_changed:0}),email);}
  return {version:'2.3.0',dry_run:false,columns:add.length,records_changed:0};
 });
}

// V2.4: additive relationship folders and task repair. Run dry-run on a backed-up staging copy first.
// Existing files keep their IDs and physical locations; this routine never moves or deletes evidence.
function migrateV24(dryRun){
 const email=Session.getEffectiveUser().getEmail().toLowerCase(),u=rows_('05_OWNER_MASTER').find(x=>x.email===email&&x.role==='ADMIN'&&x.active==='YES');
 if(!u)fail_('PERMISSION_DENIED','Existing deploying Admin required');
 return lock_(()=>{
  const nodes=rows_('15_SUPPLY_CHAIN'),tasks=rows_('04_EVIDENCE_TRACKER'),unmapped=[],remap=[];let missingFolders=0;
  nodes.forEach(n=>{if(!n.folder)fail_('HUMAN_MAPPING_REQUIRED','Relationship folder mapping missing: '+n.id);const f=DriveApp.getFolderById(n.folder);EVIDENCE_FOLDERS_.forEach(block=>{const children=f.getFoldersByName(EVIDENCE_FOLDER_NAMES_[block]);if(!children.hasNext())missingFolders++;else{children.next();if(children.hasNext())fail_('VERSION_CONFLICT','Duplicate relationship evidence folder: '+n.id);}});});
  tasks.filter(t=>t.evidence_block==='05_Upstream_Traceability'||t.evidence_block&&!EVIDENCE_FOLDERS_.includes(t.evidence_block)).forEach(t=>{const block=BLOCKS_[t.evidence];if(block)remap.push({task_id:t.id,block});else unmapped.push({task_id:t.id,evidence:t.evidence||''});});
  const unmappedPolicies=currentRequirements_().filter(r=>r.enabled==='YES'&&r.evidence!=='Sales order'&&!BLOCKS_[r.evidence]).map(r=>({policy_id:r.id,evidence:r.evidence||''}));
  const plan={version:'2.4.0',dry_run:dryRun!==false,relationships:nodes.length,missing_folders:missingFolders,known_tasks_to_map:remap.length,unmapped,unmapped_policies:unmappedPolicies};
  if(dryRun!==false)return plan;
  nodes.forEach(n=>relationshipFolders_(DriveApp.getFolderById(n.folder)));
  remap.forEach(x=>patch_('04_EVIDENCE_TRACKER',x.task_id,{evidence_block:x.block,updated_at:now_()}));
  const before=rows_('04_EVIDENCE_TRACKER').length;nodes.forEach(n=>syncNodeRequirements_(n.id,u));
  const created=rows_('04_EVIDENCE_TRACKER').length-before;
  if(missingFolders||remap.length||created)audit_('WORKSPACE_V24_MIGRATED','','','',JSON.stringify({folders:missingFolders,remapped:remap.length,created}),email);
  return {...plan,dry_run:false,folders_created:missingFolders,tasks_remapped:remap.length,tasks_created:created};
 });
}
