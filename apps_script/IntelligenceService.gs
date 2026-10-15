// KODA v2.9 local-first intelligence. No provider call is made by these functions.
function v290Canonical_(value){if(Array.isArray(value))return value.map(v290Canonical_);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,v290Canonical_(value[k])]));return value;}
function v290Hash_(value){return bridgeHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(v290Canonical_(value))));}
function v290Pick_(record,keys){return Object.fromEntries(keys.filter(k=>record[k]!==undefined).map(k=>[k,record[k]]));}
function v290Internal_(cap){const u=cap?requireCapability_(cap):user_();if(['SUPPLIER_USER','VIEWER'].includes(u.role))fail_('PERMISSION_DENIED','Internal intelligence workspace required');return u;}
function v290Ready_(){for(const table of ['35_DOCUMENT_CLASSIFICATIONS','36_AI_REVIEW_IMPORTS','37_REVIEW_ISSUES','38_PRODUCT_COMPONENTS','39_CUSTOMER_PO_MAPPING','40_CUSTOMER_FIELD_MAPPING','41_CUSTOMER_SUBMISSIONS','42_AI_CHAT_HISTORY','43_REGULATION_RULES'])if(!db_().getSheetByName(table))fail_('MIGRATION_REQUIRED','Preview and apply v2.9 migration on staging first');}
function v290Scope_(caseId,input,u){
 const c=order_(caseId,u),materialId=text_(input?.material_id||'',100),sourceId=text_(input?.source_id||'',100),productId=text_(input?.product_id||'',100);
 if(materialId&&traceMaterial_(materialId,u).c.id!==caseId)fail_('INVALID_INPUT','Material outside Order');
 if(sourceId){if(!materialId)fail_('INVALID_INPUT','Source requires its material');traceSource_(sourceId,materialId,u);}
 const materials=rows_('02_SO_ITEM_MATERIAL').filter(m=>m.case_id===caseId&&m.active!=='NO'&&(!materialId||m.id===materialId));
 const sources=rows_('29_MATERIAL_SOURCES').filter(s=>s.case_id===caseId&&s.active!=='NO'&&materials.some(m=>m.id===s.material_id)&&(!sourceId||s.id===sourceId));
 const edges=rows_('31_SOURCE_EDGES').filter(e=>e.case_id===caseId&&e.active!=='NO'&&sources.some(s=>s.id===e.source_id));
 const usage=rows_('30_PRODUCT_MATERIAL_USAGE').filter(a=>a.case_id===caseId&&a.active!=='NO'&&materials.some(m=>m.id===a.material_id)&&(!sourceId||a.source_id===sourceId)&&(!productId||a.product_id===productId));
 const products=rows_('24_SO_PRODUCTS').filter(p=>p.case_id===caseId&&p.active==='YES'&&(!productId||p.id===productId)&&(!materialId||usage.some(a=>a.product_id===p.id)||jsonList_(materials[0]?.product_ids).includes(p.id)));
 if(productId&&!products.some(p=>p.id===productId))fail_('INVALID_INPUT','Product outside requested scope');
 const inScope=(record,type)=>record.case_id===caseId&&(!materialId||record.material_id===materialId||rows_('34_SOURCE_RECORD_LINKS').some(l=>l.record_type===type&&l.record_id===record.id&&l.case_id===caseId&&l.material_id===materialId&&l.active!=='NO'))&&(!sourceId||recordMatchesSource_(record,type,sourceId));
 const tasks=rows_('04_EVIDENCE_TRACKER').filter(t=>t.active!=='NO'&&canTask_(u,t)&&inScope(t,'TASK'));
 const documents=rows_('06_DOCUMENT_REGISTER').filter(d=>d.active_version==='YES'&&inScope(d,'DOCUMENT')).filter(d=>{try{document_(d.id,u);return true;}catch(e){return false;}});
 const geo=rows_('17_GEO_LOCATIONS').filter(g=>inScope(g,'GEO'));
 const nodes=rows_('15_SUPPLY_CHAIN').filter(n=>n.case_id===caseId&&materials.some(m=>m.id===n.material_id)&&(!sourceId||edges.some(e=>e.from_node_id===n.id||e.to_node_id===n.id)));
 const supplierIds=new Set([...sources,...nodes,...documents].map(x=>x.supplier_id).filter(Boolean));
 const suppliers=rows_('14_SUPPLIERS').filter(s=>supplierIds.has(s.id)).map(s=>v290Pick_(s,['id','name','country','active']));
 return {c,case_id:caseId,material_id:materialId,source_id:sourceId,product_id:productId,materials,sources,usage,products,tasks,documents,geo,nodes,edges,suppliers};
}
function v290Context_(scope){
 const ordered=records=>records.slice().sort((a,b)=>String(a.id).localeCompare(String(b.id)));
 return {case_id:scope.case_id,material_id:scope.material_id,source_id:scope.source_id,product_id:scope.product_id,
 order:v290Pick_(scope.c,['id','so','customer','po','status']),
 materials:ordered(scope.materials).map(m=>v290Pick_(m,['id','material','category','scientific_name','common_species','hs_cn_code','scope_status','scope_rule_version','quantity','quantity_uom','active','updated_at'])),
 sources:ordered(scope.sources).map(s=>v290Pick_(s,['id','material_id','supplier_id','supplier_po','po_line','lot_no','quantity','quantity_uom','production_country','harvest_start','harvest_end','active','updated_at'])),
 products:ordered(scope.products).map(p=>v290Pick_(p,['id','sku','product_name','quantity','quantity_uom','wood_content_state','customer_po_allocations_json'])),
 usage:ordered(scope.usage).map(a=>v290Pick_(a,['id','product_id','material_id','source_id','quantity','quantity_uom'])),
 tasks:ordered(scope.tasks.filter(t=>t.rule_version!=='V290_ISSUE')).map(t=>v290Pick_(t,['id','material_id','source_id','evidence','requirement_id','required','status','document_id','evidence_block','chain_node_id','override_state','rule_version'])),
 documents:ordered(scope.documents).map(d=>v290Pick_(d,['id','sha256','version','status','active_version','material_id','source_id','task_id','document_type','source_document_id','reviewed_at'])),
 suppliers:ordered(scope.suppliers),nodes:ordered(scope.nodes).map(n=>v290Pick_(n,['id','material_id','supplier_id','parent_id','node_type','plot_id','terminal','status'])),
 edges:ordered(scope.edges).map(e=>v290Pick_(e,['id','source_id','from_node_id','to_node_id','input_lot','output_lot','transaction_no','quantity','quantity_uom','document_ids'])),
 geo:ordered(scope.geo).map(g=>v290Pick_(g,['id','source_id','material_id','plot_id','country_of_production','production_range','area_ha','geometry_json','verification_status','rule_version','coordinate_precision_digits'])),
 record_links:ordered(rows_('34_SOURCE_RECORD_LINKS').filter(l=>l.case_id===scope.case_id&&l.active!=='NO'&&scope.sources.some(s=>s.id===l.source_id))).map(l=>v290Pick_(l,['id','material_id','source_id','record_type','record_id'])),legal:legalState_()};
}
function v290Snapshot_(scope){return v290Hash_(v290Context_(scope));}
function v290StoredJSON_(fileId,hash,max){const file=DriveApp.getFileById(fileId);if(file.getSize()>max)fail_('RESULT_INTEGRITY_ERROR','Stored JSON is too large');const raw=file.getBlob().getDataAsString();if(hash&&bridgeHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,raw))!==hash)fail_('RESULT_INTEGRITY_ERROR','Stored JSON changed');try{return JSON.parse(raw);}catch(e){fail_('RESULT_INTEGRITY_ERROR','Invalid stored JSON');}}
function v290Store_(folder,id,name,value,max){const raw=JSON.stringify(value),bytes=Utilities.newBlob(raw).getBytes();if(bytes.length>max)fail_('AI_INPUT_TOO_LARGE','Package too large; select a narrower scope');const file=storeFile_(folder,id,{bytes,type:'application/json'},name);return {file_id:file.getId(),sha256:bridgeHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,raw))};}
function v290OCR_(document,scope){const folder=workspaceChatFolder_(scope.c,false),file=workspaceChatFile_(folder,document);if(!file)return null;const packet=v290StoredJSON_(file.getId(),'',3000000);if(packet.document_id!==document.id||packet.sha256!==document.sha256)fail_('RESULT_INTEGRITY_ERROR','OCR document mismatch');return validateOCRPacket_({...packet,sha256:document.sha256},document,700000);}
function v290History_(scope,u,question,result){const id=stable_('workspace-query:'+u.email+':'+BRIDGE_REQUEST_KEY);if(!rows_('42_AI_CHAT_HISTORY').some(x=>x.id===id))add_('42_AI_CHAT_HISTORY',{id,actor:u.email,case_id:scope.case_id,material_id:scope.material_id,source_id:scope.source_id,product_id:scope.product_id,mode:'WORKSPACE_QUERY',question,result_json:JSON.stringify(result),snapshot_hash:v290Snapshot_(scope),document_ids:JSON.stringify(scope.documents.map(d=>d.id)),status:'CURRENT',created_at:now_()});return id;}
function v290QueryResult_(scope,question){
 const q=question.normalize('NFKC').toLowerCase(),lines=[],refs=[];let intent='SEARCH';
 const add=(line,table,id)=>{lines.push(line);if(id)refs.push({table,id});};
 if(/missing|thiếu|chưa đủ/.test(q)){intent='MISSING_EVIDENCE';scope.tasks.filter(t=>t.required!=='NO'&&t.status!=='APPROVED').forEach(t=>add(t.evidence+' · '+t.status,'04_EVIDENCE_TRACKER',t.id));}
 else if(/pending|approval|duyệt/.test(q)){intent='PENDING_APPROVAL';scope.documents.filter(d=>d.status!=='APPROVED').forEach(d=>add(d.name+' · '+d.status,'06_DOCUMENT_REGISTER',d.id));}
 else if(/reuse|reused|tái sử dụng/.test(q)){intent='REUSABLE_DOCUMENTS';scope.documents.filter(d=>d.status==='APPROVED').forEach(d=>add(d.name+' · v'+d.version+' · source/lot applicability requires human confirmation','06_DOCUMENT_REGISTER',d.id));}
 else if(/issue|vấn đề|unresolved/.test(q)){intent='UNRESOLVED_ISSUES';rows_('37_REVIEW_ISSUES').filter(i=>i.case_id===scope.case_id&&(!scope.material_id||i.material_id===scope.material_id)&&(!scope.source_id||i.source_id===scope.source_id)&&!['RESOLVED','REJECTED'].includes(i.status)).forEach(i=>add(i.required_action+' · '+i.status,'37_REVIEW_ISSUES',i.id));}
 else if(/prevent|ready|readiness|ngăn|sẵn sàng/.test(q)){intent='READINESS_BLOCKERS';scope.tasks.filter(t=>t.required!=='NO'&&t.status!=='APPROVED').forEach(t=>add(t.evidence+' · '+t.status,'04_EVIDENCE_TRACKER',t.id));scope.sources.filter(s=>!s.lot_no||!s.supplier_po||!s.production_country).forEach(s=>add('Missing source identifiers/origin: '+s.id,'29_MATERIAL_SOURCES',s.id));scope.geo.filter(g=>g.verification_status!=='VERIFIED').forEach(g=>add('Geolocation requires verification: '+g.id,'17_GEO_LOCATIONS',g.id));}
 else if(/document|pdf|chứng từ|tài liệu/.test(q)){intent='LINKED_DOCUMENTS';scope.documents.forEach(d=>add(d.name+' · '+d.status+' · v'+d.version,'06_DOCUMENT_REGISTER',d.id));}
 else {const terms=workspaceChatTokens_(q);for(const [table,records] of [['02_SO_ITEM_MATERIAL',scope.materials],['29_MATERIAL_SOURCES',scope.sources],['06_DOCUMENT_REGISTER',scope.documents],['04_EVIDENCE_TRACKER',scope.tasks]])for(const r of records){const label=[r.id,r.material,r.name,r.evidence,r.supplier_po,r.lot_no].filter(Boolean).join(' · ');if(terms.length&&terms.some(t=>label.toLowerCase().includes(t)))add(label,table,r.id);}}
 return {mode:'WORKSPACE_QUERY',intent,answer:lines.length?lines.slice(0,60).join('\n'):'No matching workspace records. Prepare ChatGPT Business Review for a document interpretation or a deeper review.',record_refs:refs.slice(0,60),citations:[],total_results:lines.length,prepare_manual_review:true,verification_status:'HUMAN_VERIFICATION_REQUIRED'};
}
function askKodaWorkspace(caseId,input){const u=v290Internal_('AI_USE');v290Ready_();const scope=v290Scope_(caseId,input,u),question=text_(input?.question||'',1000);if(question.length<3)fail_('INVALID_INPUT','Enter a question');const result=v290QueryResult_(scope,question);return withOperation_(()=>({...result,id:v290History_(scope,u,question,result),status:'DONE'}));}
function getKodaWorkspaceHistory(caseId,input){const u=v290Internal_('AI_USE');v290Ready_();const scope=v290Scope_(caseId,input,u),hash=v290Snapshot_(scope);return rows_('42_AI_CHAT_HISTORY').filter(h=>h.case_id===caseId&&h.actor===u.email&&h.material_id===scope.material_id&&h.source_id===scope.source_id&&String(h.product_id||'')===scope.product_id).slice(-30).reverse().map(h=>({id:h.id,question:h.question,mode:h.mode,status:h.snapshot_hash===hash?'CURRENT':'STALE',created_at:h.created_at,result:JSON.parse(h.result_json)}));}
// Call immediately before every provider request. Default denies all external disclosure.
function v290ExternalGate_(job){
 const p=PropertiesService.getScriptProperties();if(p.getProperty('EXTERNAL_AI_ENABLED')!=='true')fail_('EXTERNAL_AI_DISABLED','External AI is disabled; use workspace queries or ChatGPT Business manual review');
 let rules;try{rules=JSON.parse(p.getProperty('EXTERNAL_AI_AUTHORIZATIONS_JSON')||'[]');}catch(e){fail_('EXTERNAL_AI_NOT_AUTHORIZED','Invalid external AI authorization configuration');}
 if(!Array.isArray(rules))fail_('EXTERNAL_AI_NOT_AUTHORIZED','External AI authorizations must be an array');
 const hash=job.context_hash||job.input_sha256,now=Date.now(),valid=rules.find(r=>r.job_id===job.id&&r.case_id===job.case_id&&r.context_hash===hash&&r.provider==='GEMINI'&&r.data_classification==='NON_SENSITIVE'&&Number.isFinite(Date.parse(r.expires_at))&&Date.parse(r.expires_at)>now&&rows_('05_OWNER_MASTER').some(u=>u.email===r.approved_by&&u.active==='YES'&&u.role==='ADMIN'));
 if(!valid)fail_('EXTERNAL_AI_NOT_AUTHORIZED','A current Admin authorization for this exact job and snapshot is required');
 return true;
}
