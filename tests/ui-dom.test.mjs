import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {JSDOM} from 'jsdom';
function setup(){const dom=new JSDOM(fs.readFileSync('public/index.html','utf8'),{url:'https://staging.example',runScripts:'outside-only'}),w=dom.window;w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.URL.revokeObjectURL=()=>{};w.fetch=async()=>({json:async()=>({ok:true,data:[]})});w.eval(fs.readFileSync('public/i18n.js','utf8'));w.eval(fs.readFileSync('public/app.js','utf8').replace('\nload();','\n')+`\nstate={user:{email:'test',role:'MARKETING',capabilities:['ORDER_EDIT','SO_VIEW','MATERIAL_EDIT','CHAIN_EDIT','SUPPLIER_EDIT','AI_USE','POLICY_EDIT','WORKFLOW_CLOSE','EVIDENCE_REVIEW','GEO_EDIT']},cases:[{id:'c',so:'SO-TEST',customer:'TEST',po:'PO',issues:[],status:'COLLECTING_EVIDENCE'}],products:[{id:'p1',case_id:'c',product_name:'Chair',quantity:2,active:'YES'},{id:'p2',case_id:'c',product_name:'Table',quantity:1,active:'YES'}],materials:[{id:'m',case_id:'c',material:'Walnut'}],tasks:[],docs:[],suppliers:[],chain:[],geo:[],requirements:[],owners:[]};selected='c';window.testState=state;call=async()=>[];`);return w;}
test('workspace keeps products, four evidence blocks and final review in order without an early consolidated warning',()=>{
 const w=setup();
 w.eval("testState.products[0].product_name='<img src=x onerror=alert(1)>';testState.cases[0].issues=['UPSTREAM_CHAIN_MISSING'];testState.tasks=[{id:'t1',case_id:'c',material_id:'m',evidence:'Invoice',evidence_block:'01_Commercial_Shipping',status:'MISSING',required:'YES'},{id:'t2',case_id:'c',material_id:'m',evidence:'FSC',evidence_block:'02_FSC_Certification',status:'APPROVED',required:'YES'}];workspace();bind();");
 assert.equal(w.document.querySelectorAll('[data-product]').length,2);
 assert.equal(w.document.querySelector('[onerror]'),null);
 const blocks=[...w.document.querySelectorAll('[data-evidence-block]')];
 assert.deepEqual(blocks.map(b=>b.dataset.evidenceBlock),['01_Commercial_Shipping','02_FSC_Certification','03_Transport','04_Geolocation']);
 assert.ok(blocks[0].querySelector('.evidence-state--missing'));
 assert.ok(blocks[1].querySelector('.evidence-state--approved'));
 assert.equal(w.document.querySelectorAll('[data-action="addRequirement"]').length,4);
 assert.ok(blocks[0].querySelector('[data-action="taskRequirement"]'));
 assert.equal(w.document.querySelector('.workspace-summary').textContent.includes('UPSTREAM_CHAIN_MISSING'),false);
 const buttons=[...w.document.querySelectorAll('[data-action]')].map(b=>b.dataset.action);
 assert.ok(buttons.indexOf('aiOutputs')<buttons.indexOf('finalReview'));
 assert.ok(blocks[3].compareDocumentPosition(w.document.querySelector('.dossier-step'))&w.Node.DOCUMENT_POSITION_FOLLOWING);
});
test('scoped requirement form offers material and tier decisions without changing global policy',()=>{
 const w=setup();w.eval("testState.tasks=[{id:'t1',case_id:'c',material_id:'m',evidence:'Invoice',required:'YES',status:'MISSING'}];testState.chain=[{id:'n1',material_id:'m',display_name:'Mill',tier:1}];taskRequirementDialog('t1')");
 assert.ok(w.document.querySelector('#taskRequirementForm [value="NOT_REQUIRED"]'));
 assert.ok(w.document.querySelector('#taskRequirementForm textarea[required]'));
 w.eval("scopedRequirementDialog('m','01_Commercial_Shipping')");
 assert.ok(w.document.querySelector('#scopedRequirementForm [value="n1"]'));
});
test('optional evidence remains uploadable and shows its workflow status',()=>{
 const w=setup();w.eval("testState.user.capabilities.push('EVIDENCE_UPLOAD');testState.tasks=[{id:'t1',case_id:'c',material_id:'m',evidence:'Optional invoice',required:'NO',override_state:'OPTIONAL',status:'MISSING'}];workspace()");
 assert.ok(w.document.querySelector('[data-action="upload"][data-id="t1"]'));
 assert.ok(w.document.querySelector('.evidence-state--missing'));
 assert.ok(w.document.querySelector('.evidence-state--not-required'));
});
test('final dossier modal shows backend blockers and gates closure',async()=>{
 const w=setup();
 w.eval("call=async()=>({ready:false,blockers:[{code:'UPSTREAM_CHAIN_MISSING',details:'Walnut'}]})");
 await w.eval("finalDossier('c')");
 assert.ok(w.document.querySelector('[role="alert"]').textContent.includes('UPSTREAM CHAIN MISSING'));
 assert.equal(w.document.querySelector('#closeOrderForm'),null);
 w.eval("call=async()=>({ready:true,blockers:[]})");
 await w.eval("finalDossier('c')");
 assert.ok(w.document.querySelector('#closeOrderForm textarea[required]'));
});
test('Admin without explicit grants can see New Order in the UI',()=>{
 const w=setup();w.eval("testState.user={email:'admin',role:'ADMIN',capabilities:['ORDER_EDIT','SO_VIEW','MATERIAL_EDIT','WORKFLOW_CLOSE']};dashboard();");
 assert.ok(w.document.querySelector('[data-action="newOrder"]'));
});
test('new order supports add/remove products and optional image preview controls',()=>{const w=setup();w.eval('newOrder()');assert.equal(w.document.querySelectorAll('.new-product').length,1);w.document.querySelector('#addProduct').click();assert.equal(w.document.querySelectorAll('.new-product').length,2);w.document.querySelector('.new-product button').click();assert.equal(w.document.querySelectorAll('.new-product').length,1);assert.ok(w.document.querySelector('input[name="product_image"]'));assert.ok(w.document.querySelector('#orderForm').textContent.includes('3 MB'));});
test('MP Material, policy and supplier forms use backend action-compatible fields',()=>{const w=setup();w.eval("materialsDialog('c')");assert.ok(w.document.querySelector('[name="supplier_po"]'));assert.equal(w.document.querySelectorAll('[name="product"]').length,2);w.eval('policyDialog()');assert.ok(w.document.querySelector('[name="rule_version"]'));w.eval("supplierForm('')");assert.ok(w.document.querySelector('[name="supplier_code"]'));});
test('Vietnamese labels work and MATERIAL_EXTRACTION is absent from prompt menu',()=>{const w=setup();w.eval("window.EudrI18n.setLanguage('vi');workspace();promptStudio();");assert.equal(w.EudrI18n.t('AI Review Outputs'),'Kết quả kiểm tra AI');assert.equal(w.document.querySelector('[value="MATERIAL_EXTRACTION"]'),null);});
