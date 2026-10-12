import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {runtime} from './runtime.mjs';

const code=value=>error=>error.code===value;
const run=(r,action,...args)=>{r.actor(undefined,action,randomUUID(),args);return r.ctx[action](...args);};
function evidence(r,id,{material_id='ma',task_id='ta',chain_node_id='',source_document_id='',kind='EVIDENCE'}={}){
 const file=r.folders.get('root').createFile(r.ctx.Utilities.newBlob([...Buffer.from('%PDF-1.7\n'+id)],'application/pdf',id+'.pdf'));
 const d={id,case_id:'ca',kind,name:id+'.pdf',file_id:file.getId(),status:'APPROVED',active_version:'YES',material_id,task_id,chain_node_id,source_document_id,supplier_id:'sa'};
 r.tables['06_DOCUMENT_REGISTER'].push(d);return d;
}

test('Full Package excludes orphaned evidence, names exclusions and keeps original Drive files',()=>{
 const r=runtime();r.seed();const valid=evidence(r,'valid'),orphan=evidence(r,'orphan',{material_id:'missing',task_id:'missing'});
 const result=run(r,'exportPackage','ca',{});
 assert.deepEqual(Array.from(result.excluded_document_ids),['orphan']);
 assert.deepEqual(JSON.parse(r.tables['19_EXPORT_LOG'][0].document_ids),['valid']);
 const zip=Buffer.from(r.ctx.getDocument(result.download_id).data,'base64').toString();
 assert.match(zip,/valid\.pdf/);assert.doesNotMatch(zip,/orphan\.pdf/);
 assert.equal(r.files.get(orphan.file_id).isTrashed(),false);
 assert.ok(r.files.get(valid.file_id));
 assert.throws(()=>run(r,'exportPackage','ca',{document_ids:['orphan']}),code('EXPORT_ORPHANED_EVIDENCE'));
});

test('old ZIP and chunk downloads are refused after an evidence link disappears',()=>{
 const r=runtime();r.seed();evidence(r,'doc');const result=run(r,'exportPackage','ca',{}),zip=r.files.get(r.tables['19_EXPORT_LOG'][0].file_id);
 r.tables['04_EVIDENCE_TRACKER'].splice(r.tables['04_EVIDENCE_TRACKER'].findIndex(t=>t.id==='ta'),1);
 assert.throws(()=>r.ctx.getDocument(result.download_id),code('EXPORT_ORPHANED_EVIDENCE'));
 assert.throws(()=>r.ctx.getDocumentChunk(result.download_id,0),code('EXPORT_ORPHANED_EVIDENCE'));
 assert.equal(zip.isTrashed(),false);
 assert.throws(()=>run(r,'exportPackage','ca',{}),code('EXPORT_ORPHANED_EVIDENCE'));
});

test('derived PDF is excluded when its original evidence loses its relationship',()=>{
 const r=runtime();r.seed();const node={id:'n',case_id:'ca',material_id:'ma',supplier_id:'sa'};r.tables['15_SUPPLY_CHAIN'].push(node);
 r.tables['04_EVIDENCE_TRACKER'][0].chain_node_id='n';
 evidence(r,'source',{chain_node_id:'n'});
 const derived=evidence(r,'translated',{kind:'EN_SUBTITLE',source_document_id:'source',chain_node_id:'n'});derived.translation_verified='YES';
 assert.equal(r.ctx.exportLineageValid_(derived,r.tables['06_DOCUMENT_REGISTER'],'ca',new Set()),true);
 r.tables['15_SUPPLY_CHAIN'].splice(0,1);
 assert.equal(r.ctx.exportLineageValid_(derived,r.tables['06_DOCUMENT_REGISTER'],'ca',new Set()),false);
 assert.throws(()=>run(r,'exportPackage','ca',{document_ids:['translated']}),code('EXPORT_ORPHANED_EVIDENCE'));
});
