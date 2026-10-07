import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const reviewSource=app.slice(app.indexOf('function documentStatus('),app.indexOf('async function documentView('));
function screen({role='ADMIN',status='SUBMITTED',active='YES',kind='EVIDENCE',fail=false}={}){
 const calls=[],events=[],elements=new Map(),buttons=[];
 function element(id){if(!elements.has(id))elements.set(id,{id,hidden:false,value:'',textContent:'',innerHTML:'',dataset:{},disabled:false,isConnected:true,required:false,focus(){events.push('focus:'+id);},reportValidity(){return true;},querySelector(){return buttons[0];},querySelectorAll(){return buttons;}});return elements.get(id);}
 for(const decision of ['APPROVED','REJECTED','MORE_INFO_REQUIRED','IN_REVIEW'])buttons.push({...element('choice-'+decision),dataset:{reviewDecision:decision}});
 const confirm=element('confirmDocumentReview');buttons.push(confirm);element('documentReviewForm').hidden=true;
 const file={id:'doc-active',name:'Original <evidence>.pdf',version:3,status,active};
 const metadata={kind,reviewed_by:'reviewer@example.com',review_comment:'<script>unsafe</script>'};
 const context=vm.createContext({$:element,esc:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),review:()=>['ADMIN','EUDR_REVIEWER'].includes(role),tt:s=>s,i18n:{language:'en'},document:{querySelectorAll:()=>buttons.slice(0,4)},busy:false,async call(...args){calls.push(args);if(fail)throw Object.assign(Error('stale version'),{code:'VERSION_CONFLICT'});return true;},async load(){events.push('reload');},closeDrawer(){events.push('close');},errorLabel:e=>e.code||e.message,file,metadata,Date});
 vm.runInContext(reviewSource,context);vm.runInContext('bindDocumentReview(file,metadata)',context);
 return {context,calls,events,element,buttons,file,metadata,choose:status=>buttons.find(b=>b.dataset.reviewDecision===status).onclick(),submit:()=>element('documentReviewForm').onsubmit({preventDefault(){}}),panel:()=>vm.runInContext('documentReviewPanel(file,metadata)',context)};
}
test('only reviewers of active submitted original evidence get decision controls',()=>{
 for(const input of [{role:'SUPPLIER_USER'},{role:'VIEWER'},{role:'MARKETING'},{active:'NO'},{status:'UPLOADED'},{status:'REJECTED'},{status:'MORE_INFO_REQUIRED'},{kind:'REDACTED'},{kind:'EN_SUBTITLE'}]){
  const s=screen(input);assert.equal(vm.runInContext('documentReviewAllowed(file,metadata)',s.context),false);assert.doesNotMatch(s.panel(),/data-review-decision=/);
 }
 for(const status of ['SUBMITTED','IN_REVIEW','APPROVED'])assert.equal(vm.runInContext('documentReviewAllowed(file,metadata)',screen({status,role:'EUDR_REVIEWER'}).context),true);
});
test('approved evidence requires a deliberate change action and source names/notes are escaped',()=>{
 const s=screen({status:'APPROVED'}),html=s.panel();assert.match(html,/id="changeReviewDecision"/);assert.match(html,/id="reviewChoices"[^>]*hidden/);assert.doesNotMatch(html,/data-review-decision="APPROVED"/);assert.match(html,/Original &lt;evidence&gt;\.pdf/);assert.match(html,/&lt;script&gt;unsafe&lt;\/script&gt;/);assert.doesNotMatch(html,/<script>/);
});
test('choosing or cancelling a decision does not call the backend',()=>{
 const s=screen();s.choose('APPROVED');assert.equal(s.calls.length,0);assert.equal(s.element('documentReviewForm').hidden,false);assert.equal(s.element('reviewNote').required,false);assert.match(s.element('confirmDocumentReview').className,/--approve/);
 s.element('cancelDocumentReview').onclick();assert.equal(s.element('documentReviewForm').hidden,true);assert.equal(s.calls.length,0);
});
test('rejection and more-information decisions block empty or whitespace reasons',async()=>{
 for(const status of ['REJECTED','MORE_INFO_REQUIRED']){const s=screen();s.choose(status);assert.equal(s.element('reviewNote').required,true);s.element('reviewNote').value='  \n ';await s.submit();assert.equal(s.calls.length,0);assert.match(s.element('reviewFeedback').textContent,/Enter a reason/);assert.equal(s.element('documentReviewForm').hidden,false);}
});
test('explicit confirmation records the exact document, decision and trimmed reason once',async()=>{
 const s=screen();s.choose('REJECTED');s.element('reviewNote').value='  Missing origin reference.  ';await s.submit();assert.deepEqual(s.calls,[['reviewDocument','doc-active','REJECTED','Missing origin reference.']]);assert.deepEqual(s.events.filter(e=>['close','reload'].includes(e)),['close','reload']);assert.equal(s.context.busy,false);
});
test('server rejection preserves the note and confirmation panel and restores buttons',async()=>{
 const s=screen({fail:true});s.choose('MORE_INFO_REQUIRED');s.element('reviewNote').value='Provide plot reference.';await s.submit();assert.equal(s.element('reviewNote').value,'Provide plot reference.');assert.equal(s.element('documentReviewForm').hidden,false);assert.equal(s.element('reviewFeedback').textContent,'VERSION_CONFLICT');assert.equal(s.element('confirmDocumentReview').disabled,false);assert.equal(s.context.busy,false);assert.ok(!s.events.includes('close'));
});
test('in-flight reviews block repeated confirmation and gate role changes before sending',async()=>{
 const s=screen();s.choose('APPROVED');s.context.busy=true;await s.submit();assert.equal(s.calls.length,0);s.context.busy=false;s.file.active='NO';await s.submit();assert.equal(s.calls.length,0);
});
