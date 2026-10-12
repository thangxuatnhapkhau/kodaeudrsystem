import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import vm from 'node:vm';
import {runtime} from './runtime.mjs';

function run(r,action,...args){r.actor(undefined,action,randomUUID(),args);return r.ctx[action](...args);}
const blocked=code=>e=>e.code===code;

test('unused Material, relationship and Supplier can be removed in dependency order without touching the order or Drive folder',()=>{
 const r=runtime();r.seed();const m=run(r,'createMaterial','ca',{material:'Extra veneer',category:'VENEER'}),s=run(r,'manageSupplier',{name:'Mistaken supplier'}),parent=run(r,'addChainNode','ca',{material_id:m.id,supplier_id:s.id,node_type:'SUPPLIER'}),child=run(r,'addChainNode','ca',{material_id:m.id,supplier_id:s.id,parent_id:parent.id,node_type:'SUPPLIER'});
 assert.throws(()=>run(r,'removeMaterial',m.id,'Wrong material'),blocked('REMOVE_MATERIAL_LINKED'));
 assert.throws(()=>run(r,'removeSupplier',s.id,'Wrong supplier'),blocked('REMOVE_SUPPLIER_LINKED'));
 assert.throws(()=>run(r,'removeChainNode',parent.id,'Wrong relationship'),blocked('REMOVE_CHILDREN_FIRST'));
 const childFolder=r.tables['15_SUPPLY_CHAIN'].find(n=>n.id===child.id).folder;
 assert.equal(run(r,'removeChainNode',child.id,'Wrong upstream supplier').removed_tasks,11);
 assert.equal(r.tables['04_EVIDENCE_TRACKER'].some(t=>t.chain_node_id===child.id),false);
 assert.ok(r.folders.has(childFolder));
 run(r,'removeChainNode',parent.id,'Wrong direct supplier');run(r,'removeMaterial',m.id,'Wrong material');run(r,'removeSupplier',s.id,'Wrong supplier');
 assert.equal(r.tables['02_SO_ITEM_MATERIAL'].some(x=>x.id===m.id),false);
 assert.equal(r.tables['14_SUPPLIERS'].some(x=>x.id===s.id),false);
 assert.equal(r.tables['01_SO_MASTER'].length,2);
 assert.ok(r.tables['08_ACTIVITY_LOG'].some(a=>a.action==='MATERIAL_REMOVED'&&a.entity_id===m.id));
});

test('removal refuses evidence history, assigned tasks and users still owning work',()=>{
 const r=runtime();r.seed();const m=run(r,'createMaterial','ca',{material:'Extra wood',category:'SOLID_WOOD'}),n=run(r,'addChainNode','ca',{material_id:m.id,supplier_id:'sa',node_type:'SUPPLIER'});
 const t=r.tables['04_EVIDENCE_TRACKER'].find(t=>t.chain_node_id===n.id);t.owner='a@supplier.example';
 assert.throws(()=>run(r,'removeChainNode',n.id,'Mistake'),blocked('REMOVE_ASSIGNED_TASKS'));
 t.owner='';r.tables['06_DOCUMENT_REGISTER'].push({id:'linked-evidence',case_id:'ca',material_id:m.id,chain_node_id:n.id,supplier_id:'sa'});
 assert.throws(()=>run(r,'removeChainNode',n.id,'Mistake'),blocked('REMOVE_HAS_HISTORY'));
 assert.ok(r.tables['15_SUPPLY_CHAIN'].some(x=>x.id===n.id));
 r.tables['05_OWNER_MASTER'].push({email:'owner@test.example',name:'Owner',role:'MARKETING',active:'YES',removed_at:'',auth_uid:''});r.tables['01_SO_MASTER'][0].owner='owner@test.example';
 assert.throws(()=>run(r,'prepareRemoveUser','owner@test.example','Mistake'),blocked('REMOVE_USER_ASSIGNED'));
 assert.equal(r.tables['05_OWNER_MASTER'].find(x=>x.email==='owner@test.example').active,'YES');
});

test('provisioned user is hidden only after login disable is recorded, with audit retained',()=>{
 const r=runtime();r.seed();r.tables['05_OWNER_MASTER'].push({email:'mistake@test.example',name:'Mistake',role:'INTERNAL_USER',active:'YES',removed_at:'',auth_uid:'firebase-uid-12345'});
 const prepared=run(r,'prepareRemoveUser','mistake@test.example','Added by mistake');assert.equal(prepared.auth_uid,'firebase-uid-12345');
 assert.equal(r.tables['05_OWNER_MASTER'].find(u=>u.email==='mistake@test.example').active,'NO');
 assert.throws(()=>run(r,'removeUser','mistake@test.example','Added by mistake'),blocked('REMOVE_USER_LOGIN'));
 r.actor(undefined,'authAccountStateRecorded');r.ctx.authAccountStateRecorded('mistake@test.example',false);
 run(r,'removeUser','mistake@test.example','Added by mistake');
 assert.equal(r.ctx.bootstrap().owners.some(u=>u.email==='mistake@test.example'),false);
 assert.ok(r.tables['05_OWNER_MASTER'].find(u=>u.email==='mistake@test.example').removed_at);
 assert.ok(r.tables['08_ACTIVITY_LOG'].some(a=>a.action==='USER_REMOVED'&&a.entity_id==='mistake@test.example'));
 assert.throws(()=>run(r,'prepareRemoveUser','admin@test.example','Mistake'),blocked('PERMISSION_DENIED'));
});

test('added Evidence Type can be removed before upload; default and historically used types stay protected',()=>{
 const r=runtime();r.seed();const input={material_id:'ma',chain_node_id:'',evidence:'Accidental certificate',evidence_block:'02_FSC_Certification',state:'REQUIRED',reason:'Custom requirement'};
 const added=run(r,'addScopedRequirement','ca',input);assert.equal(r.tables['04_EVIDENCE_TRACKER'].find(t=>t.id===added.id).status,'MISSING');
 assert.throws(()=>run(r,'removeScopedRequirement','ta','Mistake'),blocked('INVALID_INPUT'));
 r.tables['08_ACTIVITY_LOG'].push({id:'activity',entity_id:added.id,action:'EVIDENCE_REQUIREMENT_OVERRIDDEN'});
 assert.throws(()=>run(r,'removeScopedRequirement',added.id,'Mistake'),blocked('REMOVE_HAS_HISTORY'));
 r.tables['08_ACTIVITY_LOG'].pop();
 r.tables['06_DOCUMENT_REGISTER'].push({id:'historic',case_id:'ca',task_id:added.id,material_id:'ma'});
 assert.throws(()=>run(r,'removeScopedRequirement',added.id,'Mistake'),blocked('REMOVE_HAS_HISTORY'));
 r.tables['06_DOCUMENT_REGISTER'].pop();run(r,'removeScopedRequirement',added.id,'Added to wrong block');
 assert.equal(r.tables['04_EVIDENCE_TRACKER'].some(t=>t.id===added.id),false);
 assert.ok(r.tables['08_ACTIVITY_LOG'].some(a=>a.action==='SCOPED_EVIDENCE_REMOVED'&&a.entity_id===added.id));
});

test('user removal migration previews only two additive columns and can be rerun',()=>{
 const r=runtime(),headers=[...vm.runInContext('V2414_OWNER_BASE_',r.ctx)];let writes=0;
 const sheet={getLastColumn:()=>headers.length,getMaxColumns:()=>headers.length,insertColumnsAfter(){},setFrozenRows(){},getRange:(_,column,__,width)=>({getValues:()=>[headers.slice(column-1,column-1+width)],setValues:values=>{writes++;headers.splice(column-1,values[0].length,...values[0]);}})};
 r.ctx.db_=()=>({getSheetByName:()=>sheet});
 const preview=r.ctx.migrateV2414(true);assert.deepEqual([...preview.add],['removed_at','removed_by']);assert.equal(writes,0);
 assert.equal(r.ctx.migrateV2414(false).columns,2);assert.equal(writes,1);
 assert.equal(r.ctx.migrateV2414(false).columns,0);assert.equal(writes,1);
});
