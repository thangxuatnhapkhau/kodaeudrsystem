// Editor-only migration entrypoints. Never exposed through the public bridge.
function v290MigrationAdmin_(){const email=String(Session.getEffectiveUser().getEmail()).toLowerCase();if(!rows_('05_OWNER_MASTER').some(u=>u.email===email&&u.role==='ADMIN'&&u.active==='YES'))fail_('PERMISSION_DENIED','Existing deploying Admin required');return email;}
function v290MigrationPlan_(){
 const db=db_();return Object.keys(SCHEMA).map(table=>{
  const sheet=db.getSheetByName(table),expected=SCHEMA[table];if(!sheet)return {table,create:true,existing:0,append:expected};
  const width=sheet.getLastColumn(),headers=width?sheet.getRange(1,1,1,width).getValues()[0]:[];
  while(headers.length&&headers[headers.length-1]==='')headers.pop();
  if(new Set(headers).size!==headers.length||headers.some((h,i)=>h!==expected[i])||headers.length>expected.length)fail_('SCHEMA_MISMATCH','Unexpected headers in '+table+'; no changes applied');
  const append=expected.slice(headers.length);
  // Naming a blank column containing data requires manual mapping, not a guessed migration.
  if(append.length&&width>headers.length)fail_('HUMAN_MAPPING_REQUIRED','Unnamed populated columns in '+table);
  return {table,create:false,existing:headers.length,append};
 });
}
function previewV290Migration(){v290MigrationAdmin_();const plan=v290MigrationPlan_(),result={version:'2.9.0',dry_run:true,plan,plan_hash:v290Hash_(plan),records_changed:0,requires_backup:true};console.log(JSON.stringify(result));return result;}
function applyV290Migration(input){
 const email=v290MigrationAdmin_();if(!input||input.confirmed!==true||!input.plan_hash)fail_('HUMAN_CONFIRMATION_REQUIRED','Approve the exact preview before applying');
 return lock_(()=>{
  TABLE_CACHE_={};const plan=v290MigrationPlan_();if(!plan.some(x=>x.create||x.append.length)&&config_('SCHEMA_VERSION')==='2.9.0'&&PropertiesService.getScriptProperties().getProperty('V290_LAST_PLAN_HASH')===input.plan_hash)return {version:'2.9.0',status:'ALREADY_APPLIED',records_changed:0};if(v290Hash_(plan)!==input.plan_hash)fail_('VERSION_CONFLICT','Schema changed since preview');
  const p=PropertiesService.getScriptProperties();
  if(db_().getId()===PREPARED.sheetId&&p.getProperty('V290_PRODUCTION_MIGRATION_APPROVED')!=='true')fail_('PRODUCTION_APPROVAL_REQUIRED','Production migration needs explicit deployment approval');
  if(!plan.some(x=>x.create||x.append.length)&&config_('SCHEMA_VERSION')==='2.9.0')return {version:'2.9.0',status:'ALREADY_APPLIED',records_changed:0};
  const backup=DriveApp.getFileById(db_().getId()).makeCopy('KODA_EUDR_PRE_V290_'+now_().replace(/[:.]/g,'-'));
  p.setProperties({V290_LAST_BACKUP_ID:backup.getId(),V290_LAST_PLAN_HASH:input.plan_hash});
  for(const item of plan){let sheet=db_().getSheetByName(item.table);if(!sheet){sheet=db_().insertSheet(item.table);sheet.appendRow(SCHEMA[item.table]);sheet.setFrozenRows(1);}else if(item.append.length){if(sheet.getMaxColumns()<SCHEMA[item.table].length)sheet.insertColumnsAfter(sheet.getMaxColumns(),SCHEMA[item.table].length-sheet.getMaxColumns());sheet.getRange(1,item.existing+1,1,item.append.length).setValues([item.append]);}}
  TABLE_CACHE_={};if(rows_('09_CONFIG').some(x=>x.key==='SCHEMA_VERSION'))patch_('09_CONFIG','SCHEMA_VERSION',{value:'2.9.0'});else add_('09_CONFIG',{key:'SCHEMA_VERSION',value:'2.9.0'});
  audit_('SCHEMA_V290_MIGRATED','','','',JSON.stringify({backup_id:backup.getId(),plan_hash:input.plan_hash,records_changed:0}),email);
  return {version:'2.9.0',status:'APPLIED',backup_id:backup.getId(),records_changed:0};
 });
}

// v2.9: new operational records; existing table column positions remain fixed.
Object.assign(SCHEMA,{
 '35_DOCUMENT_CLASSIFICATIONS':['id','case_id','document_id','sha256','version','snapshot_hash','sections_json','status','created_by','created_at','reviewed_by','reviewed_at','corrections_json'],
 '36_AI_REVIEW_IMPORTS':['id','actor','case_id','material_id','source_id','snapshot_hash','snapshot_file_id','snapshot_sha256','document_ids','status','created_at','result_file_id','result_sha256','imported_at','imported_by','review_version','previous_review_id'],
 '37_REVIEW_ISSUES':['id','finding_id','review_id','case_id','material_id','source_id','priority','owner','department','due_date','required_action','document_requirements','status','resolution_evidence','reviewed_by','closed_at','created_by','created_at','updated_at','audit_history','calendar_event_id','calendar_sync_status','task_id'],
 '38_PRODUCT_COMPONENTS':['id','case_id','product_id','component_name','component_type','quantity_per_product','weight_per_unit','weight_uom','total_weight','input_waste_rate','composition','material_ids','source_allocation','manufacturing_operation','factory_id','revision','effective_date','verification_state','active','created_by','created_at','updated_by','updated_at','evidence_ids'],
 '39_CUSTOMER_PO_MAPPING':['id','case_id','customer','customer_po','product_id','customer_product','manufacturing_entity','entity_role','operations_json','bom_complete','plot_scope_complete','required_document_ids','verification_state','reviewed_by','last_verified_at','updated_at','updated_by','customer_quantity','quantity_uom','geo_rule_clarification'],
 '40_CUSTOMER_FIELD_MAPPING':['id','customer','source_field','target_field','source_record_id','transformation_rule','validation_rule','required_flag','verification_state','last_verified_at','reference_version','reviewed_by'],
 '41_CUSTOMER_SUBMISSIONS':['id','case_id','mapping_ids','package_id','package_version','package_hash','package_file_id','snapshot_hash','status','approved_by','approved_at','uploaded_by','uploaded_at','portal_confirmation','customer_response','rejection_reason','previous_submission_id','created_by','created_at','updated_at'],
 '42_AI_CHAT_HISTORY':['id','actor','case_id','material_id','source_id','mode','question','result_json','snapshot_hash','document_ids','review_version','status','created_at'],
 '43_REGULATION_RULES':['id','rule_version','effective_date','source_url','scope','required_data','validation_method','reviewed_by','reviewed_at','category','status','rule_json']
});
SCHEMA['39_CUSTOMER_PO_MAPPING'].push('document_clearance_json');

SCHEMA['36_AI_REVIEW_IMPORTS'].push('product_id');
SCHEMA['42_AI_CHAT_HISTORY'].push('product_id');
