import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {runtime} from './runtime.mjs';
const pdf={name:'order.pdf',type:'application/pdf',data:Buffer.from('%PDF-1.7\nV24 fixture').toString('base64')};
function run(r,action,...args){r.actor(undefined,action,randomUUID(),args);return r.ctx[action](...args);}
function order(r){return run(r,'createOrder',{so:'SO-V24',customer:'TEST',file:pdf,products:[{product_name:'Chair',quantity:1,quantity_uom:'pcs'}]});}
const folders=['Commercial Shipping','FSC Certification','Transport','Geolocation'];
const evidence=['Purchase Order','Sales Contract','COO','INV','PL','BL','Supplier FSC license','FSC Cert','Transport invoice','Delivery Note','GEO location'];
test('each relationship creates four folders and 11 default tasks for Tier 1 and Tier 2; upload lands in its block',()=>{
 const r=runtime(),o=order(r),m=run(r,'createMaterial',o.id,{material:'Walnut',category:'SOLID_WOOD'});
 assert.equal(r.tables['04_EVIDENCE_TRACKER'].filter(t=>t.material_id===m.id).length,0);
 const a=run(r,'addChainNode',o.id,{material_id:m.id,supplier_id:'sa',node_type:'SUPPLIER'});
 const b=run(r,'addChainNode',o.id,{material_id:m.id,supplier_id:'sb',parent_id:a.id,node_type:'SUPPLIER'});
 for(const [id,tier,name] of [[a.id,1,'KODA - Supplier A'],[b.id,2,'Supplier A - Supplier B']]){
  const n=r.tables['15_SUPPLY_CHAIN'].find(n=>n.id===id),f=r.folders.get(n.folder),tasks=r.tables['04_EVIDENCE_TRACKER'].filter(t=>t.chain_node_id===id);
  assert.equal(n.tier,tier);assert.equal(n.relationship,name);assert.ok(f.getName().startsWith(name+' ['));
  assert.deepEqual(folders.map(x=>f.getFoldersByName(x).hasNext()),[true,true,true,true]);
  assert.deepEqual(tasks.map(t=>t.evidence),evidence);assert.deepEqual([...new Set(tasks.map(t=>t.evidence_block))].sort(),['01_Commercial_Shipping','02_FSC_Certification','03_Transport','04_Geolocation']);
  assert.ok(tasks.every(t=>t.supplier_id===(tier===1?'sa':'sb')));
 }
 const task=r.tables['04_EVIDENCE_TRACKER'].find(t=>t.chain_node_id===b.id&&t.evidence==='INV');
 const uploaded=run(r,'uploadEvidence',task.id,{...pdf,name:'invoice.pdf',expected_document_id:''});
 const block=r.folders.get(r.tables['15_SUPPLY_CHAIN'].find(n=>n.id===b.id).folder).getFoldersByName('Commercial Shipping').next();
 assert.equal(block.getFilesByName('Supplier B_INV_v01.pdf').next().getId(),r.tables['06_DOCUMENT_REGISTER'].find(d=>d.id===uploaded.id).file_id);
 assert.equal(r.tables['04_EVIDENCE_TRACKER'].find(t=>t.id===task.id).status,'UPLOADED');
});
test('Sales Order metadata and bytes are available only to Admin and Marketing',()=>{
 const r=runtime(),o=order(r),so=r.tables['06_DOCUMENT_REGISTER'].find(d=>d.kind==='SO');
 for(const role of ['EUDR_REVIEWER','PURCHASING']){const email=role.toLowerCase()+'@test.example';r.tables['05_OWNER_MASTER'].push({email,role,active:'YES',capabilities:'["SO_VIEW"]',assigned_orders:JSON.stringify([o.id])});r.actor(email,'bootstrap');const data=r.ctx.bootstrap();assert.equal(data.docs.some(d=>d.id===so.id),false);assert.equal(data.tasks.some(t=>t.evidence==='Sales order'),false);assert.equal(data.cases[0].so_document_id,'');assert.throws(()=>r.ctx.getDocument(so.id),e=>e.code==='PERMISSION_DENIED');}
 r.tables['05_OWNER_MASTER'].push({email:'marketing@test.example',role:'MARKETING',active:'YES',assigned_orders:JSON.stringify([o.id])});r.actor('marketing@test.example','bootstrap');assert.equal(r.ctx.bootstrap().docs.some(d=>d.id===so.id),true);
});
test('V24 dry-run is read-only; apply repairs known legacy block and backfills existing relationship once',()=>{
 const r=runtime(),o=order(r),m=run(r,'createMaterial',o.id,{material:'Walnut',category:'SOLID_WOOD'}),f=r.folders.get(m.id)||r.folders.get(r.tables['02_SO_ITEM_MATERIAL'][0].folder),nodeFolder=f.createFolder('KODA - Supplier A [legacy]');
 r.tables['15_SUPPLY_CHAIN'].push({id:'legacy',case_id:o.id,material_id:m.id,supplier_id:'sa',node_type:'SUPPLIER',tier:1,folder:nodeFolder.getId()});
 r.tables['04_EVIDENCE_TRACKER'].push({id:'old',case_id:o.id,material_id:m.id,chain_node_id:'legacy',supplier_id:'sa',evidence:'INV',evidence_block:'05_Upstream_Traceability',status:'APPROVED'});
 const before=r.folders.size,preview=r.ctx.migrateV24(true);assert.equal(preview.missing_folders,4);assert.equal(preview.known_tasks_to_map,1);assert.equal(r.folders.size,before);assert.equal(r.tables['04_EVIDENCE_TRACKER'].find(t=>t.id==='old').evidence_block,'05_Upstream_Traceability');
 const applied=r.ctx.migrateV24(false);assert.equal(applied.folders_created,4);assert.equal(applied.tasks_remapped,1);assert.equal(applied.tasks_created,10);assert.equal(r.tables['04_EVIDENCE_TRACKER'].find(t=>t.id==='old').status,'APPROVED');
 const again=r.ctx.migrateV24(false);assert.equal(again.folders_created,0);assert.equal(again.tasks_created,0);
});
test('department tasks inherit due date and sync to each role Calendar',()=>{
 const r=runtime(),o=run(r,'createOrder',{so:'SO-DUE',customer:'TEST',due:'2026-10-20',file:pdf,products:[{product_name:'Chair',quantity:1,quantity_uom:'pcs'}]}),m=run(r,'createMaterial',o.id,{material:'Walnut',category:'SOLID_WOOD'});
 r.tables['05_OWNER_MASTER'].push({email:'p@test.example',role:'PURCHASING',department:'Purchasing',active:'YES',assigned_orders:JSON.stringify([o.id])});
 r.actor('p@test.example','addChainNode',randomUUID(),[]);const node=r.ctx.addChainNode(o.id,{material_id:m.id,supplier_id:'sa',node_type:'SUPPLIER'});
 const tasks=r.tables['04_EVIDENCE_TRACKER'].filter(t=>t.chain_node_id===node.id);assert.equal(tasks.length,11);assert.ok(tasks.every(t=>t.owner===''&&t.due==='2026-10-20'));assert.equal(tasks.filter(t=>t.department==='Sourcing').length,1);
 r.actor('p@test.example','syncCalendar');const result=r.ctx.syncCalendar();assert.equal(result.length,10);assert.ok(result.every(x=>x.status==='SYNCED'));assert.equal(r.insertions,10);
 r.tables['05_OWNER_MASTER'].push({email:'s@test.example',role:'SOURCING',department:'Sourcing',active:'YES',assigned_orders:JSON.stringify([o.id])});
 r.actor('s@test.example','syncCalendar');const sourcing=r.ctx.syncCalendar();assert.equal(sourcing.length,1);assert.equal(sourcing[0].status,'SYNCED');assert.equal(r.insertions,11);
 r.actor('p@test.example','bootstrap');assert.equal(r.ctx.bootstrap().tasks.filter(t=>t.chain_node_id===node.id).length,11);
});
test('new user with temporary password remains gated until first change',()=>{
 const r=runtime();r.tables['05_OWNER_MASTER'].push({email:'new@test.example',role:'PURCHASING',active:'YES',auth_provider:'FIREBASE',auth_uid:'firebase-user-12345',must_change_password:'YES'});
 r.actor('new@test.example','bootstrap');r.ctx.BRIDGE_AUTH_UID='firebase-user-12345';assert.equal(r.ctx.bootstrap().authRequiredPasswordChange,true);
 r.actor('new@test.example','createMaterial');r.ctx.BRIDGE_AUTH_UID='firebase-user-12345';assert.throws(()=>r.ctx.createMaterial('missing',{}),e=>e.code==='PASSWORD_CHANGE_REQUIRED');
 r.actor('new@test.example','authPasswordChanged');r.ctx.BRIDGE_AUTH_UID='firebase-user-12345';r.ctx.authPasswordChanged('firebase-user-12345');assert.equal(r.tables['05_OWNER_MASTER'].at(-1).must_change_password,'NO');
});
