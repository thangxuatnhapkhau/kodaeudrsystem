// The configured Calendar is owned by the deployer. Task assignees are guests
// of their own events; they must never be granted access to the whole Calendar.
function calendarInvitees_(t){
 const active=rows_('05_OWNER_MASTER').filter(u=>u.active==='YES'&&!u.removed_at),byEmail=new Map(active.map(u=>[String(u.email).toLowerCase(),u]));
 const order=rows_('01_SO_MASTER').find(c=>c.id===t.case_id),creator=String(order?.owner||'').toLowerCase();
 const admins=active.filter(u=>u.role==='ADMIN').map(u=>u.email),marketing=byEmail.get(creator)?.role==='MARKETING'?[creator]:[];
 const recipients=[t.owner,t.assigned_reviewer,...admins,...marketing].filter(Boolean).map(x=>String(x).trim().toLowerCase());
 // The deploying account already owns this Calendar and can view every event.
 const organizer=String(Session.getEffectiveUser().getEmail()||'').trim().toLowerCase();
 return [...new Set(recipients)].filter(email=>email!==organizer&&byEmail.has(email)&&(t.evidence!=='Sales order'||['ADMIN','MARKETING'].includes(byEmail.get(email).role))&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}
function calendarPatch_(event,body){
 const patch={};for(const key of ['summary','description','start','end','reminders','transparency','visibility','guestsCanInviteOthers','guestsCanModify','guestsCanSeeOtherGuests'])if(JSON.stringify(event[key])!==JSON.stringify(body[key]))patch[key]=body[key];
 const before=(event.attendees||[]).map(a=>String(a.email||'').toLowerCase()).sort(),after=(body.attendees||[]).map(a=>a.email).sort();
 if(JSON.stringify(before)!==JSON.stringify(after))patch.attendees=body.attendees.map(a=>{const old=(event.attendees||[]).find(x=>String(x.email).toLowerCase()===a.email);return old?.responseStatus?{email:a.email,responseStatus:old.responseStatus}:a;});
 return patch;
}
// Advanced Calendar API; deterministic event IDs survive retries after partial failure.
function syncTaskCalendar_(t){
 if(!t.due&&!t.calendar_event_id)return {status:'NOT_SCHEDULED'};
 const calendarId=PropertiesService.getScriptProperties().getProperty('CALENDAR_ID')||config_('GOOGLE_CALENDAR_ID');if(!calendarId)return {status:'CALENDAR_ACCESS_REQUIRED'};
 const c=rows_('01_SO_MASTER').find(c=>c.id===t.case_id),m=rows_('02_SO_ITEM_MATERIAL').find(m=>m.id===t.material_id);if(!c||t.material_id&&!m)return {status:'INVALID_TASK'};
 if(!t.due){try{let ev;try{ev=Calendar.Events.get(calendarId,t.calendar_event_id);}catch(e){const list=Calendar.Events.list(calendarId,{iCalUID:t.calendar_event_id,maxResults:2}).items||[];if(list.length!==1)throw e;ev=list[0];}if(ev.extendedProperties?.private?.eudrTaskId!==t.id&&!String(ev.description||'').includes('Task ID: '+t.id))throw Error('Calendar event ownership mismatch');const patch=calendarPatch_(ev,{summary:'[UNSCHEDULED][EUDR]['+c.so+'] '+t.evidence,description:ev.description,start:ev.start,end:ev.end,attendees:[],transparency:'transparent',visibility:'private',guestsCanInviteOthers:false,guestsCanModify:false,guestsCanSeeOtherGuests:false,reminders:{useDefault:false,overrides:[]}});if(Object.keys(patch).length)Calendar.Events.patch(patch,calendarId,ev.id,{sendUpdates:'all'});patch_('04_EVIDENCE_TRACKER',t.id,{calendar_sync_status:'UNSCHEDULED'});return {status:'UNSCHEDULED'};}catch(e){patch_('04_EVIDENCE_TRACKER',t.id,{calendar_sync_status:'CALENDAR_SYNC_FAILED'});return {status:'CALENDAR_SYNC_FAILED'};}}
 const eventId=t.calendar_event_id&&/^[0-9a-v]+$/.test(t.calendar_event_id)?t.calendar_event_id:stable_('eudr-task:'+t.id),end=new Date(isoDate_(t.due)+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+1);
 const body={id:eventId,summary:(t.status==='APPROVED'?'[DONE]':'')+'[EUDR]['+c.so+']['+(m?.material||'Order')+'] '+t.evidence,description:'Assigned To: '+(t.owner||t.department||'Unassigned')+'\nTask ID: '+t.id+'\nStatus: '+t.status+'\n'+(config_('FRONTEND_URL')||'')+'/#task='+encodeURIComponent(t.id),start:{date:t.due},end:{date:end.toISOString().slice(0,10)},extendedProperties:{private:{eudrTaskId:t.id}},attendees:calendarInvitees_(t).map(email=>({email})),visibility:'private',guestsCanInviteOthers:false,guestsCanModify:false,guestsCanSeeOtherGuests:false,reminders:{useDefault:false,overrides:t.status==='APPROVED'?[]:[{method:'popup',minutes:10080},{method:'popup',minutes:4320},{method:'popup',minutes:1440}]}};
 try{
  // Lookup first. Only an actual 404 is an absent event; permission failures never create elsewhere.
  let event=null;try{event=Calendar.Events.get(calendarId,eventId);}catch(e){if(!/404|not found/i.test(String(e)))throw e;}
  if(t.calendar_event_id&&t.calendar_event_id!==eventId&&!event){
   const found=Calendar.Events.list(calendarId,{iCalUID:t.calendar_event_id,maxResults:2}).items||[];
   if(found.length>1)throw Error('Ambiguous legacy Calendar ID');if(found.length===1){event=found[0];body.id=event.id;}
  }
  if(event&&event.extendedProperties?.private?.eudrTaskId!==t.id&&!String(event.description||'').includes('Task ID: '+t.id))throw Error('Calendar event ownership mismatch');
  body.transparency='opaque';if(event){const patch=calendarPatch_(event,body);if(Object.keys(patch).length)Calendar.Events.patch(patch,calendarId,event.id,{sendUpdates:'all'});}else Calendar.Events.insert(body,calendarId,{sendUpdates:'all'});
  patch_('04_EVIDENCE_TRACKER',t.id,{calendar_event_id:body.id,calendar_sync_status:'SYNCED'});return {status:'SYNCED',eventId:body.id};
 }catch(e){const status=/403|forbidden|permission|unauthorized|access|Calendar is not defined|not found/i.test(String(e))?'CALENDAR_ACCESS_REQUIRED':'CALENDAR_SYNC_FAILED';patch_('04_EVIDENCE_TRACKER',t.id,{calendar_sync_status:status});return {status};}
}
function syncCalendar(){const u=requireRole_(['ADMIN','MARKETING','EUDR_REVIEWER','MP','PURCHASING','SOURCING']);return lock_(()=>{const ownedOrders=new Set(u.role==='MARKETING'?rows_('01_SO_MASTER').filter(c=>c.owner===u.email).map(c=>c.id):[]);const result=rows_('04_EVIDENCE_TRACKER').filter(t=>canTask_(u,t)&&(t.evidence!=='Sales order'||hasCapability_(u,'SO_VIEW'))&&(u.role==='ADMIN'||ownedOrders.has(t.case_id)||t.owner===u.email||t.assigned_reviewer===u.email||!t.owner&&u.department&&String(t.department).toUpperCase()===String(u.department).toUpperCase())).map(t=>({taskId:t.id,...syncTaskCalendar_(t)}));audit_('CALENDAR_SYNC','','','',JSON.stringify(result.map(r=>({taskId:r.taskId,status:r.status}))),u.email);return result;});}
