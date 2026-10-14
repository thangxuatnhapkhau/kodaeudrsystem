window.EudrWorkspaceChat=(()=>{
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const tr=x=>window.EudrI18n?.t(x)||x;
 let session=null;
 function stop(){if(session){session.controller.abort();session=null;}}
 async function bytes(call,d,signal){
  const f=await call('getDocument',d.id);if(signal.aborted)throw new DOMException('Cancelled','AbortError');
  if(f.download_chunked){const out=new Uint8Array(f.size);for(let n=0;n<Math.ceil(f.size/1048576);n++){if(signal.aborted)throw new DOMException('Cancelled','AbortError');const p=await call('getDocumentChunk',d.id,n),part=Uint8Array.from(atob(p.data),x=>x.charCodeAt(0));if(p.index!==n||p.size!==f.size||part.length!==Math.min(1048576,f.size-n*1048576))throw Error('PDF download integrity failed');out.set(part,n*1048576);}return out;}
  return Uint8Array.from(atob(f.data),x=>x.charCodeAt(0));
 }
 async function open({call,caseId,materialId='',sourceId='',mount}){
  stop();const current={controller:new AbortController()},$=id=>mount.querySelector('#'+id);session=current;
  let scope={materialId,sourceId},index,jobs,active='',running=false;
  const alive=()=>session===current&&mount.isConnected&&!current.controller.signal.aborted;
  const message=x=>{if(alive()&&$('chatMessage'))$('chatMessage').textContent=tr(x)};
  const load=async()=>{const [nextIndex,nextJobs]=await Promise.all([call('getWorkspaceChatIndex',caseId,scope.materialId,scope.sourceId),call('listWorkspaceChatJobs',caseId)]);if(!alive())return;index=nextIndex;jobs=nextJobs;render();};
  function render(){if(!alive())return;const missing=index.documents.filter(d=>!d.indexed);
   mount.innerHTML=`<section class="workspace-chat card"><header class="chat-heading"><div><p class="eyebrow">ORDER / AI</p><h2>${esc(tr('Ask KODA AI'))}</h2><p>${esc(tr('Answers use this Order, its registered PDF documents and the selected material. Each PDF must be indexed before asking.'))}</p></div><label>${esc(tr('Scope'))}<select id="chatScope"><option value="order" ${!scope.materialId?'selected':''}>${esc(tr('Whole Order'))}</option>${materialId?`<option value="material" ${scope.materialId&&!scope.sourceId?'selected':''}>${esc(tr('Selected material'))}</option>`:''}${sourceId?`<option value="source" ${scope.sourceId?'selected':''}>${esc(tr('Selected PO / lot'))}</option>`:''}</select></label></header>
   <div class="chat-index"><span>${index.documents.length} PDF · ${index.documents.length-missing.length} ${esc(tr('indexed'))} · ${missing.length} ${esc(tr('need indexing'))}</span>${missing.length?`<button id="chatIndex" type="button">${esc(tr('Index PDFs from Drive'))}</button><details><summary>${esc(tr('PDFs needing OCR'))}</summary><ul>${missing.map(d=>`<li>${esc(d.name)}</li>`).join('')}</ul></details><progress id="chatProgress" max="100" value="0"></progress>`:''}</div>
   <p id="chatMessage" role="status" aria-live="polite"></p><div class="chat-columns"><aside class="chat-history"><h3>${esc(tr('Recent answers'))}</h3><div id="chatAnswers">${jobs.map(j=>`<button type="button" data-chat-job="${esc(j.id)}" aria-pressed="${j.id===active}"><small>${esc(j.created_at)}</small><span>${esc(tr(j.status))}</span></button>`).join('')||'<p>—</p>'}</div></aside><div class="chat-conversation"><article id="chatResult" aria-live="polite"><p class="muted">${esc(tr('Select a saved answer or ask a question.'))}</p></article><form id="chatForm"><label>${esc(tr('Your question'))}<textarea name="question" rows="3" maxlength="1000" required placeholder="What is missing for this material?"></textarea></label><button ${missing.length||!index.model_enabled||!index.worker_installed?'disabled':''}>${esc(tr('Ask'))}</button></form></div></div></section>`;
   window.EudrI18n?.translateUI(mount);
   $('chatScope').onchange=async e=>{if(running)return;scope=e.target.value==='order'?{materialId:'',sourceId:''}:e.target.value==='material'?{materialId,sourceId:''}:{materialId,sourceId};active='';await load();};
   if($('chatIndex'))$('chatIndex').onclick=()=>run(async()=>{const module=await import('/ocr-import.mjs?v=2.7.0'),config=await call('getAIConfig'),pending=index.documents.filter(d=>!d.indexed);for(let i=0;i<pending.length;i++){if(!alive())return;const d=pending[i];message(tr('Reading from Drive:')+' '+d.name);const blob=new File([await bytes(call,d,current.controller.signal)],d.name,{type:'application/pdf'});if(await window.EudrDossier.hash(blob)!==d.sha256)throw Error('PDF changed: '+d.name);const packet=await module.readPDF(blob,{signal:current.controller.signal,maxChars:config.max_input_chars,progress:p=>{if(alive()&&$('chatProgress'))$('chatProgress').value=(i+p.page/p.total)/pending.length*100;}});if(!alive())return;await call('saveWorkspaceChatIndex',d.id,packet);}await load();message(tr('Index complete. Ask a question.'));});
   $('chatForm').onsubmit=e=>{e.preventDefault();const question=new FormData(e.target).get('question');run(async()=>{const job=await call('askWorkspaceChat',caseId,{question,material_id:scope.materialId,source_id:scope.sourceId});if(!alive())return;active=job.id;await load();message(tr('Question queued. You may return later to view the answer.'));});};
   mount.querySelectorAll('[data-chat-job]').forEach(b=>b.onclick=()=>run(async()=>{active=b.dataset.chatJob;mount.querySelectorAll('[data-chat-job]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.chatJob===active)));await show(active);}));
   if(active)show(active).catch(err=>message(err.message));
  }
  async function show(id){const j=await call('getWorkspaceChatAnswer',id);if(!alive()||!$('chatResult'))return;const box=$('chatResult');if(j.result){const names=new Map(index.documents.map(d=>[d.id,d.name]));box.innerHTML=`<h3>${esc(tr('Answer'))}</h3><p class="chat-answer">${esc(j.result.answer)}</p><ul>${(j.result.citations||[]).map(r=>`<li>${esc(names.get(r.document_id)||r.document_id)} · ${esc(tr('page'))} ${esc(r.page)}: “${esc(r.excerpt)}”</li>`).join('')}</ul><ul>${(j.result.record_refs||[]).map(r=>`<li>${esc(r.table)} · ${esc(r.id)}</li>`).join('')}</ul><p>${esc(tr('Human verification remains required.'))}</p>`;}else box.textContent=(j.status==='UNKNOWN'||j.status==='FAILED'?j.error_code||j.status:j.status+' · '+tr('Refresh this answer after the AI worker completes.'));}
  async function run(fn){if(running||!alive())return;running=true;try{await fn();}catch(e){if(e.name!=='AbortError')message((e.code?e.code+' · ':'')+e.message);}finally{running=false;}}
  await load();
 }
 return {open,stop};
})();
