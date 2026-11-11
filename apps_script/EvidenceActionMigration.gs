// Editor-only migration for Evidence Action Workflow (EAW-1.0.0)
const EA_VERSION_='1.0.0';
const EA_ISSUE_COLUMNS_=['finding_json','finding_type','severity','blocking','triage_decision','triage_reason','dismiss_requested_by','confirmed_at','evidence_submitted_by','evidence_submitted_at','verified_by','verified_at','supplier_id','requested_documents'];
const EA_TABLES_={
 '47_SUPPLIER_EVIDENCE_REQUESTS':['id','issue_id','case_id','material_id','source_id','supplier_id','issue_summary','requested_information','required_clarification','due_date','owner','status','channel','sent_at','sent_recorded_by','responded_at','response_note','response_document_ids','created_by','created_at','updated_at','audit_history']
};

function evidenceActionSchema_(){
 if(!SCHEMA['37_REVIEW_ISSUES'])SCHEMA['37_REVIEW_ISSUES']=[];
 for(const k of EA_ISSUE_COLUMNS_)if(!SCHEMA['37_REVIEW_ISSUES'].includes(k))SCHEMA['37_REVIEW_ISSUES'].push(k);
 Object.assign(SCHEMA,EA_TABLES_);
}

function evidenceActionMigrationGuard_(arg){
 const p=PropertiesService.getScriptProperties(),email=Session.getEffectiveUser().getEmail().toLowerCase();
 TABLE_CACHE_={};resetDbCache_();
 if(!rows_('05_OWNER_MASTER').some(u=>u.email===email&&u.role==='ADMIN'&&u.active==='YES'))fail_('PERMISSION_DENIED','Existing deploying Admin required');
 if(!p.getProperty('DB_ID')||!p.getProperty('ROOT_ID')||(arg&&typeof arg==='object'&&!Object.keys(arg).length&&(p.getProperty('ENVIRONMENT')!=='STAGING'||p.getProperty('DB_ID')===PREPARED.sheetId||p.getProperty('ROOT_ID')===PREPARED.rootFolderId)))fail_('STAGING_REQUIRED','Dedicated staging spreadsheet/root and ENVIRONMENT=STAGING required');
 return email;
}

function evidenceActionInventory_(){
 return db_().getSheets().map(s=>{
  const width=s.getLastColumn(),h=width?s.getRange(1,1,1,width).getValues()[0]:[];
  while(h.length&&h[h.length-1]==='')h.pop();
  return {table:s.getName(),headers:h,rows:Math.max(0,s.getLastRow()-1)};
 }).sort((a,b)=>a.table.localeCompare(b.table));
}

function evidenceActionMigrationPlan_(){
 evidenceActionSchema_();
 const inventory=evidenceActionInventory_(),plan=[];
 for(const [table,expected] of Object.entries({'37_REVIEW_ISSUES':SCHEMA['37_REVIEW_ISSUES'],...EA_TABLES_})){
  const s=inventory.find(s=>s.table===table),headers=s?.headers||[];
  if(table==='37_REVIEW_ISSUES'&&!s)fail_('SCHEMA_MISMATCH','Review issues table missing');
  if(headers.some((h,i)=>h!==expected[i])||headers.length>expected.length||new Set(headers).size!==headers.length)fail_('SCHEMA_MISMATCH','Unexpected header in '+table);
  const sheet=db_().getSheetByName(table);
  if(sheet&&sheet.getLastColumn()>headers.length)fail_('SCHEMA_MISMATCH','Unnamed populated columns: '+table);
  plan.push({table,create:!s,existing:headers.length,append:expected.slice(headers.length)});
 }
 return {version:EA_VERSION_,inventory,plan,schema_hash:stable_(JSON.stringify(inventory.map(({table,headers})=>({table,headers})))),plan_hash:stable_(JSON.stringify(plan)),records_changed:0};
}

function previewEvidenceActionMigration(arg){
 evidenceActionMigrationGuard_(arg);
 const plan=evidenceActionMigrationPlan_(),out={...plan,status:'DRY_RUN',dry_run:true,backup_required:true};
 console.log(JSON.stringify({version:out.version,status:out.status,plan:out.plan,schema_hash:out.schema_hash,plan_hash:out.plan_hash}));
 return out;
}

function backupEvidenceActionMigration(arg){
 const actor=evidenceActionMigrationGuard_(arg);
 return lock_(()=>{
  TABLE_CACHE_={};
  const plan=evidenceActionMigrationPlan_(),tables={};
  for(const s of db_().getSheets()){
   const n=s.getName();
   tables[n]=s.getDataRange().getValues();
  }
  const backup={migration_version:EA_VERSION_,db_id:db_().getId(),timestamp:now_(),actor,schema_hash:plan.schema_hash,plan_hash:plan.plan_hash,tables},raw=JSON.stringify(backup);
  const root=DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('ROOT_ID')||PREPARED.rootFolderId);
  const dir=folder_(root,'Evidence_Action_Migration_Backups');
  const file=dir.createFile(Utilities.newBlob(raw,'application/json','evidence-action-'+uid_()+'.json'));
  const check=file.getBlob().getDataAsString();
  if(raw!==check)fail_('BACKUP_FAILED','Backup readback differs');
  const out={backup_id:file.getId(),sha256:bridgeHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,raw)),timestamp:backup.timestamp,db_id:backup.db_id,schema_hash:plan.schema_hash,plan_hash:plan.plan_hash};
  console.log(JSON.stringify(out));
  return out;
 });
}

function applyEvidenceActionMigration(input){
 const actor=evidenceActionMigrationGuard_(input);
 if(input===undefined){
  const pre=evidenceActionMigrationPlan_();
  if(config_('EVIDENCE_ACTION_VERSION')===EA_VERSION_&&pre.plan.every(p=>!p.create&&!p.append.length)){
   const done={status:'ALREADY_APPLIED',version:EA_VERSION_,records_changed:0};
   console.log(JSON.stringify(done));
   return done;
  }
  const b=backupEvidenceActionMigration();
  input={confirmed:true,plan_hash:b.plan_hash,schema_hash:b.schema_hash,backup_id:b.backup_id,backup_sha256:b.sha256};
 }
 return lock_(()=>{
  TABLE_CACHE_={};
  const plan=evidenceActionMigrationPlan_();
  if(input?.backup_id&&input.confirmed===true&&config_('EVIDENCE_ACTION_VERSION')===EA_VERSION_&&plan.plan.every(p=>!p.create&&!p.append.length)&&rows_('08_ACTIVITY_LOG').some(a=>a.action==='EVIDENCE_ACTION_MIGRATED'&&a.entity_id===stable_('evidence-action-migration:'+input.backup_id))){
   return {status:'ALREADY_APPLIED',version:EA_VERSION_,records_changed:0};
  }
  if(!input||input.confirmed!==true||input.plan_hash!==plan.plan_hash||input.schema_hash!==plan.schema_hash||!input.backup_id||!input.backup_sha256)fail_('VERSION_CONFLICT','Current plan and verified backup required');
  const raw=DriveApp.getFileById(input.backup_id).getBlob().getDataAsString(),backup=JSON.parse(raw);
  if(bridgeHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,raw))!==input.backup_sha256||backup.db_id!==db_().getId()||backup.schema_hash!==plan.schema_hash||backup.plan_hash!==plan.plan_hash)fail_('BACKUP_FAILED','Backup identity/hash mismatch');
  for(const s of db_().getSheets()){
   if(JSON.stringify(s.getDataRange().getValues())!==JSON.stringify(backup.tables[s.getName()]))fail_('VERSION_CONFLICT','Data changed since backup: '+s.getName());
  }
  const runId=stable_('evidence-action-migration:'+input.backup_id);
  for(const p of plan.plan){
   const s=db_().getSheetByName(p.table)||db_().insertSheet(p.table);
   if(s.getMaxColumns()<p.existing+p.append.length)s.insertColumnsAfter(s.getMaxColumns(),p.existing+p.append.length-s.getMaxColumns());
   if(p.append.length)s.getRange(1,p.existing+1,1,p.append.length).setValues([p.append]);
   s.setFrozenRows(1);
  }
  TABLE_CACHE_={};resetDbCache_();
  if(evidenceActionMigrationPlan_().plan.some(p=>p.create||p.append.length))fail_('MIGRATION_RECOVERY_REQUIRED','Schema postcondition failed');
  const old=rows_('09_CONFIG').find(r=>r.key==='EVIDENCE_ACTION_VERSION');
  if(old)patch_('09_CONFIG','EVIDENCE_ACTION_VERSION',{value:EA_VERSION_});
  else add_('09_CONFIG',{key:'EVIDENCE_ACTION_VERSION',value:EA_VERSION_});
  audit_('EVIDENCE_ACTION_MIGRATED','',runId,plan.schema_hash,JSON.stringify({backup_id:input.backup_id,backup_sha256:input.backup_sha256,records_changed:0}),actor);
  const out={id:runId,status:'DONE',version:EA_VERSION_,records_changed:0,backup_id:input.backup_id,backup_sha256:input.backup_sha256};
  console.log(JSON.stringify(out));
  return out;
 });
}

function rollbackEvidenceActionMigration(input){
 const actor=evidenceActionMigrationGuard_(input);
 return lock_(()=>{
  if(typeof input==='string'){
   const file=DriveApp.getFileById(input);
   const raw=file.getBlob().getDataAsString();
   const sha256=bridgeHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,raw));
   input={confirmed:true,reason:'Rollback requested',backup_id:input,backup_sha256:sha256};
  }
  if(!input||input.confirmed!==true||!text_(input.reason||'',1500))fail_('HUMAN_CONFIRMATION_REQUIRED','Rollback reason and approval required');
  if(!input.backup_sha256&&input.backup_id){
   const raw=DriveApp.getFileById(input.backup_id).getBlob().getDataAsString();
   input.backup_sha256=bridgeHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,raw));
  }
  const raw=DriveApp.getFileById(input.backup_id).getBlob().getDataAsString();
  if(bridgeHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,raw))!==input.backup_sha256)fail_('BACKUP_FAILED','Backup hash mismatch');
  const backup=JSON.parse(raw);
  if(backup.db_id!==db_().getId())fail_('BACKUP_FAILED','Backup belongs to another database');
  for(const [n,values] of Object.entries(backup.tables)){
   if(n==='09_CONFIG'||n==='08_ACTIVITY_LOG'||n==='21_OPERATIONS')continue;
   const current=db_().getSheetByName(n)?.getDataRange().getValues()||[],width=values[0]?.length||0;
   if(JSON.stringify(current.map(r=>r.slice(0,width)))!==JSON.stringify(values))fail_('MANUAL_RECOVERY_REQUIRED','New or changed data must be reconciled: '+n);
  }
  if(Object.keys(EA_TABLES_).some(n=>rows_(n).length))fail_('MANUAL_RECOVERY_REQUIRED','Active evidence requests exist; reconcile before rollback');
  patch_('09_CONFIG','EVIDENCE_ACTION_VERSION',{value:'DISABLED'});
  audit_('EVIDENCE_ACTION_ROLLED_BACK','',input.backup_id,'',JSON.stringify({reason:input.reason,strategy:'DISABLE_ADDITIVE_SCHEMA_RETAINED',source_rows_restored:0}),actor);
  return {status:'ROLLED_BACK',strategy:'DISABLE_ADDITIVE_SCHEMA_RETAINED',source_rows_unchanged:true};
 });
}
