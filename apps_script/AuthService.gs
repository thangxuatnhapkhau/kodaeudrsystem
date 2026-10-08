const ROLES_=['ADMIN','MARKETING','EUDR_REVIEWER','INTERNAL_USER','SUPPLIER_USER','VIEWER','MP','PURCHASING','SOURCING'];
function fail_(code,message){const e=Error(message);e.code=code;throw e;}
function requireRole_(roles){const u=user_();if(!roles.includes(u.role))fail_('PERMISSION_DENIED','Role does not allow this action');return u;}
function assigned_(u,id){try{return JSON.parse(u.assigned_orders||'[]').includes(id);}catch(e){return false;}}
function canTask_(u,t){if(u.role==='ADMIN')return true;if(u.role==='SUPPLIER_USER')return !!u.supplier_id&&t.supplier_id===u.supplier_id;return t.owner===u.email||t.assigned_reviewer===u.email||assigned_(u,t.case_id)||rows_('01_SO_MASTER').some(c=>c.id===t.case_id&&c.owner===u.email);}
function canOrder_(u,c){if(u.role==='ADMIN')return true;if(u.role==='SUPPLIER_USER')return rows_('04_EVIDENCE_TRACKER').some(t=>t.case_id===c.id&&canTask_(u,t));return c.owner===u.email||assigned_(u,c.id)||rows_('04_EVIDENCE_TRACKER').some(t=>t.case_id===c.id&&canTask_(u,t));}
function order_(id,u){const c=rows_('01_SO_MASTER').find(x=>x.id===id);if(!c)fail_('ORDER_NOT_FOUND','Order not found');if(!canOrder_(u,c))fail_('PERMISSION_DENIED','Order outside assigned scope');return c;}
function task_(id,u){const t=rows_('04_EVIDENCE_TRACKER').find(x=>x.id===id);if(!t||!canTask_(u,t))fail_('PERMISSION_DENIED','Task outside assigned scope');return t;}
function document_(id,u){const d=rows_('06_DOCUMENT_REGISTER').find(x=>x.id===id);if(!d)fail_('FILE_NOT_FOUND','Document not found');
 if(u.role==='SUPPLIER_USER'){const t=rows_('04_EVIDENCE_TRACKER').find(x=>x.id===d.task_id);if(!t||!canTask_(u,t)||d.supplier_id!==u.supplier_id)fail_('PERMISSION_DENIED','Document outside supplier scope');}
 else order_(d.case_id,u);if(!documentVisible_(d,u))fail_('PERMISSION_DENIED','Marketing Sales Order view capability required');return d;
}
function requireWrite_(u){if(u.role==='VIEWER')fail_('PERMISSION_DENIED','Read-only user');}
function manageUser(input){const actor=requireRole_(['ADMIN']);return lock_(()=>{
 const email=String(input.email||'').trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!ROLES_.includes(input.role))fail_('INVALID_INPUT','Invalid email or role');
 if(!['YES','NO'].includes(input.active))fail_('INVALID_INPUT','Invalid active state');
 if(input.role==='SUPPLIER_USER'&&!rows_('14_SUPPLIERS').some(s=>s.id===input.supplier_id&&s.active==='YES'))fail_('INVALID_INPUT','Active supplier required');
 const ids=Array.isArray(input.assigned_orders)?input.assigned_orders:[];if(ids.some(id=>!rows_('01_SO_MASTER').some(c=>c.id===id)))fail_('ORDER_NOT_FOUND','Assignment order missing');
 if(email===actor.email&&(input.active!=='YES'||input.role!=='ADMIN'))fail_('PERMISSION_DENIED','Admin cannot remove own access');
 const old=rows_('05_OWNER_MASTER').find(x=>x.email===email),value={email,name:text_(input.name,200),department:text_(input.department,200),role:input.role,active:input.active,supplier_id:input.role==='SUPPLIER_USER'?input.supplier_id:'',assigned_orders:JSON.stringify(ids)};
 if(old)patch_('05_OWNER_MASTER',email,value);else add_('05_OWNER_MASTER',{...value,created_at:now_(),created_by:actor.email});
 audit_('USER_SAVED','','',old?JSON.stringify(old):'',JSON.stringify(value),actor.email);return {email};
 });}

function listSuppliers(query){const u=requireCapability_('SUPPLIER_EDIT'),q=text_(query||'',200).toLowerCase();return rows_('14_SUPPLIERS').filter(s=>[s.name,s.supplier_code].some(v=>String(v||'').toLowerCase().includes(q))).slice(0,100);}
function manageSupplier(input){const u=requireCapability_('SUPPLIER_EDIT');return withOperation_(()=>{const name=text_(input.name||'',200),code=text_(input.supplier_code||'',100),all=rows_('14_SUPPLIERS'),id=input.id||stable_('supplier:'+u.email+':'+BRIDGE_REQUEST_KEY),old=all.find(s=>s.id===id);if(!name)fail_('INVALID_INPUT','Supplier name required');if(input.id&&!old)fail_('INVALID_INPUT','Supplier missing');const norm=s=>String(s||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();const duplicates=all.filter(s=>s.id!==id&&(norm(s.name)===norm(name)||code&&norm(s.supplier_code)===norm(code)));if(duplicates.length)fail_('HUMAN_MAPPING_REQUIRED','Review existing suppliers: '+duplicates.map(s=>s.id).join(', '));const value={name,supplier_code:code,active:input.active||'YES',updated_at:now_(),updated_by:u.email};if(!['YES','NO'].includes(value.active))fail_('INVALID_INPUT','Invalid active state');for(const k of ['address','country','contact_person','email','phone','registration'])value[k]=text_(input[k]||'',500);if(old)patch_('14_SUPPLIERS',id,value);else add_('14_SUPPLIERS',{...value,id,created_at:now_(),created_by:u.email});auditOnce_('SUPPLIER_SAVED','',id,JSON.stringify(old||{}),JSON.stringify(value),u);return {id};});}
function saveSettings(input){const u=requireRole_(['ADMIN']);const allowed=['RULES_CONFIRMED','LEGAL_RULE_VERSION','ANNEX_I_VERSION','COUNTRY_RISK_VERSION','LAST_LEGAL_REVIEW_DATE','LEGAL_REVIEWED_BY','LEGAL_REVIEW_MAX_DAYS','LEGAL_RULE_SOURCE_URL','ANNEX_I_SOURCE_URL','COUNTRY_RISK_SOURCE_URL','GEO_MIN_DECIMALS','GEO_POLYGON_THRESHOLD_HA'];return lock_(()=>{
 Object.keys(input).forEach(k=>{if(!allowed.includes(k))fail_('PERMISSION_DENIED','Setting not writable');});
 if(input.LAST_LEGAL_REVIEW_DATE)isoDate_(input.LAST_LEGAL_REVIEW_DATE);if(input.LEGAL_REVIEW_MAX_DAYS&&(!Number.isFinite(Number(input.LEGAL_REVIEW_MAX_DAYS))||Number(input.LEGAL_REVIEW_MAX_DAYS)<=0))fail_('INVALID_INPUT','Review interval must be positive');
 if(input.RULES_CONFIRMED&&!['YES','NO'].includes(input.RULES_CONFIRMED))fail_('INVALID_INPUT','Invalid rules confirmation');
 if(input.RULES_CONFIRMED==='YES'){
  const value=k=>String(input[k]||config_(k)||'').trim();
  if(!value('LAST_LEGAL_REVIEW_DATE'))fail_('INVALID_INPUT','Review date required');isoDate_(value('LAST_LEGAL_REVIEW_DATE'));
  if(value('LEGAL_REVIEWED_BY').toLowerCase()!==u.email||Date.parse(value('LAST_LEGAL_REVIEW_DATE'))>Date.now()||['LEGAL_RULE_VERSION','ANNEX_I_VERSION','COUNTRY_RISK_VERSION'].some(k=>!value(k)||value(k)==='NOT_REVIEWED')||['LEGAL_RULE_SOURCE_URL','ANNEX_I_SOURCE_URL','COUNTRY_RISK_SOURCE_URL'].some(k=>!/^https:\/\/eur-lex\.europa\.eu\//.test(value(k))))fail_('INVALID_INPUT','Named admin review, current versions and official EU sources required');
 }
 if(input.GEO_MIN_DECIMALS&&(!Number.isInteger(Number(input.GEO_MIN_DECIMALS))||Number(input.GEO_MIN_DECIMALS)<6||Number(input.GEO_MIN_DECIMALS)>12))fail_('INVALID_INPUT','Precision must be 6–12 decimals');
 if(input.GEO_POLYGON_THRESHOLD_HA&&Number(input.GEO_POLYGON_THRESHOLD_HA)!==4)fail_('INVALID_INPUT','Change threshold through reviewed legal migration');
 Object.keys(input).forEach(k=>{const value=text_(input[k],500);if(rows_('09_CONFIG').some(r=>r.key===k))patch_('09_CONFIG',k,{value});else add_('09_CONFIG',{key:k,value});});audit_('SETTINGS_UPDATED','','','',JSON.stringify(input),u.email);return true;
 });}
function legalState_(){const date=config_('LAST_LEGAL_REVIEW_DATE'),days=Number(config_('LEGAL_REVIEW_MAX_DAYS')||90),validDate=typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date));return {regulation:config_('LEGAL_RULE_VERSION'),annex:config_('ANNEX_I_VERSION'),countryRisk:config_('COUNTRY_RISK_VERSION'),checkedDate:date,reviewedBy:config_('LEGAL_REVIEWED_BY'),reviewDue:!validDate||!config_('LEGAL_REVIEWED_BY')||!Number.isFinite(days)||days<=0||Date.now()-Date.parse(date)>days*86400000||[config_('LEGAL_RULE_VERSION'),config_('ANNEX_I_VERSION'),config_('COUNTRY_RISK_VERSION')].some(v=>!v||v==='NOT_REVIEWED')};}

function recordLogin(){const u=user_();return lock_(()=>{patch_('05_OWNER_MASTER',u.email,{last_login:now_()});audit_('USER_SIGNED_IN','','','','',u.email);return true;});}
function authState(){const u=user_();if(u.auth_provider!=='FIREBASE'||u.auth_uid!==BRIDGE_AUTH_UID)fail_('AUTH_REQUIRED','Account identity mismatch');return {auth_uid:u.auth_uid,must_change_password:u.must_change_password};}
function authPasswordChanged(uid){const u=user_();if(u.auth_provider!=='FIREBASE'||u.auth_uid!==BRIDGE_AUTH_UID||u.auth_uid!==uid||u.must_change_password!=='YES')fail_('AUTH_STATE_INVALID','Password change state mismatch');
 return lock_(()=>{patch_('05_OWNER_MASTER',u.email,{must_change_password:'NO',password_changed_at:now_()});audit_('PASSWORD_CHANGED','','','','Firebase credential updated',u.email);return true;});}
function authProvisionCheck(email){const admin=requireRole_(['ADMIN']),target=rows_('05_OWNER_MASTER').find(x=>x.email===email&&x.active==='YES');if(!target)fail_('INVALID_INPUT','Active owner record required');return {email:target.email,name:target.name,auth_uid:target.auth_uid||''};}
function authProvisioned(email,uid){const admin=requireRole_(['ADMIN']),target=rows_('05_OWNER_MASTER').find(x=>x.email===email&&x.active==='YES');if(!target||target.auth_uid||!/^.{10,128}$/.test(uid))fail_('INVALID_INPUT','Provisioning state mismatch');
 return lock_(()=>{patch_('05_OWNER_MASTER',email,{auth_provider:'FIREBASE',auth_uid:uid,must_change_password:'YES',password_changed_at:''});audit_('AUTH_ACCOUNT_PROVISIONED','','','','Firebase account provisioned for '+email,admin.email);return true;});}
function authAccountStateCheck(email,enabled){requireRole_(['ADMIN']);const target=rows_('05_OWNER_MASTER').find(x=>x.email===email&&x.auth_uid);if(!target||target.active!==(enabled?'YES':'NO'))fail_('INVALID_INPUT','Owner active state mismatch');return {uid:target.auth_uid};}
function authAccountStateRecorded(email,enabled){const admin=requireRole_(['ADMIN']);audit_(enabled?'AUTH_ACCOUNT_ENABLED':'AUTH_ACCOUNT_DISABLED','','','','Firebase account '+email,admin.email);return true;}
// One-time staging/production bootstrap from the Apps Script editor, not exposed by the bridge.
function bootstrapFirebaseAdmin(uid){const email=Session.getEffectiveUser().getEmail().trim().toLowerCase(),row=rows_('05_OWNER_MASTER').find(x=>x.email===email&&x.role==='ADMIN'&&x.active==='YES');
 if(!row||row.auth_uid||!/^.{10,128}$/.test(String(uid||'')))throw Error('Bootstrap requires an existing active ADMIN without Firebase UID');
 return lock_(()=>{patch_('05_OWNER_MASTER',email,{auth_provider:'FIREBASE',auth_uid:uid,must_change_password:'NO',password_changed_at:now_()});audit_('AUTH_ACCOUNT_PROVISIONED','','','','Initial Firebase admin bound',email);return {email,uid};});}


// Capabilities are evaluated server-side. Admin has every application capability.
const CAPABILITIES_=['ORDER_EDIT','SO_VIEW','MATERIAL_EDIT','SUPPLIER_EDIT','CHAIN_EDIT','EVIDENCE_UPLOAD','EVIDENCE_REVIEW','POLICY_EDIT','AI_USE','AI_REVIEW','GEO_EDIT','GEO_REVIEW','EXPORT','WORKFLOW_CLOSE'];
function capabilities_(u){
 if(u.role==='ADMIN')return [...CAPABILITIES_];
 const grants={MARKETING:['ORDER_EDIT','SO_VIEW','EVIDENCE_REVIEW','POLICY_EDIT','AI_USE','AI_REVIEW','GEO_REVIEW','EXPORT','WORKFLOW_CLOSE'],MP:['MATERIAL_EDIT','AI_USE'],PURCHASING:['SUPPLIER_EDIT','CHAIN_EDIT','EVIDENCE_UPLOAD','GEO_EDIT','AI_USE'],SOURCING:['SUPPLIER_EDIT','CHAIN_EDIT','EVIDENCE_UPLOAD','GEO_EDIT','AI_USE'],SUPPLIER_USER:['EVIDENCE_UPLOAD','GEO_EDIT'],EUDR_REVIEWER:['EVIDENCE_REVIEW','POLICY_EDIT','GEO_REVIEW','AI_USE','AI_REVIEW','EXPORT'],INTERNAL_USER:[],VIEWER:[]};
 let extra=[];try{extra=JSON.parse(u.capabilities||'[]');}catch(e){}if(!Array.isArray(extra))extra=[];
 // External users cannot elevate their supplier-isolated access with a capability cell.
 if(u.role==='SUPPLIER_USER')extra=[];
 return [...new Set((grants[u.role]||[]).concat(extra.filter(x=>CAPABILITIES_.includes(x)&&x!=='SO_VIEW')))];
}
function hasCapability_(u,cap){return capabilities_(u).includes(cap);}
function requireCapability_(cap){const u=user_();if(!hasCapability_(u,cap))fail_('PERMISSION_DENIED','Required capability: '+cap);return u;}
function salesOrderDerived_(d){const seen=new Set();while(d){if(d.kind==='SO'||d.document_type==='Sales order')return true;if(seen.has(d.id))return true;seen.add(d.id);if(!d.source_document_id)return false;d=rows_('06_DOCUMENT_REGISTER').find(x=>x.id===d.source_document_id);if(!d)return true;}return false;}
function documentVisible_(d,u){return !salesOrderDerived_(d)||hasCapability_(u,'SO_VIEW');}
function grantCapabilities(input){const actor=requireRole_(['ADMIN']);if(input.confirmed!==true)fail_('HUMAN_CONFIRMATION_REQUIRED','Explicit capability assignment required');return withOperation_(()=>{const target=rows_('05_OWNER_MASTER').find(x=>x.email===input.email);if(!target||['ADMIN','SUPPLIER_USER'].includes(target.role)||!Array.isArray(input.capabilities)||input.capabilities.some(x=>!CAPABILITIES_.includes(x)||x==='SO_VIEW'))fail_('INVALID_INPUT','Invalid capability assignment');const value=JSON.stringify([...new Set(input.capabilities)]);patch_('05_OWNER_MASTER',target.email,{capabilities:value});audit_('CAPABILITIES_GRANTED','',target.email,target.capabilities||'[]',value,actor.email);return {email:target.email};});}
