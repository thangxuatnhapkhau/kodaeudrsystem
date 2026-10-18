/* KODA GEO Workspace (P2-E): 4-tab Geolocation Workspace (MAP, UPLOAD, REGISTER, REVIEW).
   Original GeoJSON stays unchanged; registration and verification use existing server validation. */
window.EudrGeo=(()=>{
 const MAX_BYTES=2000000,MAX_FEATURES=100,MAX_POSITIONS=10000;
 const tr=s=>window.EudrI18n?.t(s)||s;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let cleanup=null;
 function close(){cleanup?.();cleanup=null;}

 function parseWithStats(text){
  const byteLength=new TextEncoder().encode(text).length;
  if(byteLength>MAX_BYTES)throw Error(tr('GeoJSON must be at most 2 MB.'));
  let data;try{data=JSON.parse(String(text).replace(/^\uFEFF/,''));}catch{throw Error(tr('This file is not valid JSON.'));}
  const rawFeatures=data?.type==='FeatureCollection'?data.features:data?.type==='Feature'?[data]:[{type:'Feature',properties:{},geometry:data}];
  if(!Array.isArray(rawFeatures)||!rawFeatures.length||rawFeatures.length>MAX_FEATURES)throw Error(tr('Choose a GeoJSON with 1–100 features.'));
  let count=0;
  const position=p=>{
   if(!Array.isArray(p)||p.length!==2||p.some(v=>typeof v!=='number'||!Number.isFinite(v))||Math.abs(p[0])>180||Math.abs(p[1])>90)
    throw Error(tr('Coordinates must be [longitude, latitude] within range.'));
   if(++count>MAX_POSITIONS)throw Error(tr('GeoJSON exceeds 10,000 positions.'));
  };
  const line=(ps,min)=>{if(!Array.isArray(ps)||ps.length<min)throw Error(tr('The geometry has too few positions.'));ps.forEach(position);};
  const polygon=rings=>{
   if(!Array.isArray(rings)||!rings.length)throw Error(tr('Polygon rings are missing.'));
   for(const ring of rings){
    line(ring,4);
    if(JSON.stringify(ring[0])!==JSON.stringify(ring.at(-1)))throw Error(tr('Polygon rings must be closed.'));
   }
  };
  const features=rawFeatures.map((f,i)=>{
   if(f?.type!=='Feature'||!f.geometry)throw Error(tr('Each feature needs a geometry.'));
   const g=f.geometry,c=g.coordinates;
   if(g.type==='Point')position(c);
   else if(g.type==='LineString')line(c,2);
   else if(g.type==='Polygon')polygon(c);
   else if(g.type==='MultiPoint')line(c,1);
   else if(g.type==='MultiLineString'){if(!Array.isArray(c)||!c.length)throw Error(tr('Geometry is empty.'));c.forEach(p=>line(p,2));}
   else if(g.type==='MultiPolygon'){if(!Array.isArray(c)||!c.length)throw Error(tr('Geometry is empty.'));c.forEach(polygon);}
   else throw Error(tr('Unsupported geometry type. Use Point, LineString or Polygon.'));
   const p=f.properties&&typeof f.properties==='object'&&!Array.isArray(f.properties)?f.properties:{};
   return {type:'Feature',geometry:JSON.parse(JSON.stringify(g)),properties:{name:String(p.plot_id||p.name||'Plot '+(i+1)).slice(0,150)}};
  });
  return {features,positionCount:count,byteLength};
 }

 function parse(text){
  return parseWithStats(text).features;
 }

 function isClosedLineString(g){
  return Boolean(g?.type==='LineString'&&Array.isArray(g.coordinates)&&g.coordinates.length>=4&&JSON.stringify(g.coordinates[0])===JSON.stringify(g.coordinates.at(-1)));
 }

 function candidate(feature,confirmed=false){
  if(!feature)return null;
  const g=feature.geometry;
  if(g.type==='Point'||g.type==='Polygon'&&g.coordinates.length===1)return JSON.parse(JSON.stringify(g));
  if(isClosedLineString(g)&&confirmed)return {type:'Polygon',coordinates:[JSON.parse(JSON.stringify(g.coordinates))]};
  return null;
 }

 function checkGeometry(g){
  // Same supported scope as GeoService; the server remains authoritative.
  parse(JSON.stringify(g));
  if(g.type==='Point')return g;
  if(g.type!=='Polygon'||g.coordinates.length!==1)throw Error(tr('Registration supports Point or a single-ring Polygon.'));
  const ring=g.coordinates[0],n=ring.length-1;
  if(ring.length>2000)throw Error(tr('A registered polygon must have at most 2,000 positions.'));
  if(new Set(ring.slice(0,-1).map(p=>JSON.stringify(p))).size!==n)throw Error(tr('Polygon has duplicate vertices.'));
  let area=0;
  for(let i=0;i<n;i++){
   area+=ring[i][0]*ring[i+1][1]-ring[i+1][0]*ring[i][1];
   if(Math.abs(ring[i][0]-ring[i+1][0])>180)throw Error(tr('Antimeridian geometry requires specialist review.'));
  }
  if(Math.abs(area)<1e-15)throw Error(tr('Polygon has zero area.'));
  const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const on=(a,b,c)=>Math.abs(cross(a,b,c))<1e-12&&c[0]>=Math.min(a[0],b[0])-1e-12&&c[0]<=Math.max(a[0],b[0])+1e-12&&c[1]>=Math.min(a[1],b[1])-1e-12&&c[1]<=Math.max(a[1],b[1])+1e-12;
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
   if(j===i+1||i===0&&j===n-1)continue;
   const a=ring[i],b=ring[i+1],c=ring[j],d=ring[j+1];
   if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b))
    throw Error(tr('Polygon intersects itself. Check the source file.'));
  }
  return g;
 }

 function validatePlotRegistration(input,{nodes=[],records=[],docs=[],caseId='',materialId=''}={}){
  const node=nodes.find(n=>n.id===input.chain_node_id);
  if(!node||!['PLOT','PRODUCER','FOREST_OWNER'].includes(node.node_type)){
   const err=Error(tr('Select a plot / producer relationship'));err.code='INVALID_GEO';throw err;
  }
  const plotId=String(input.plot_id||'').trim();
  if(!plotId||plotId.length>150){
   const err=Error(tr('Plot ID is required'));err.code='INVALID_GEO';throw err;
  }
  if(node.node_type==='PLOT'&&node.plot_id&&node.plot_id!==plotId){
   const err=Error(tr('Plot ID must match the selected plot node'));err.code='INVALID_GEO';throw err;
  }
  if(records.some(r=>String(r.plot_id||'').trim().toLowerCase()===plotId.toLowerCase())){
   const err=Error(tr('This plot is already registered for the material'));err.code='DUPLICATE_PLOT';throw err;
  }
  const country=String(input.country_of_production||'').trim().toUpperCase();
  if(!/^[A-Z]{2}$/.test(country)){
   const err=Error(tr('Commodity production country (ISO code) is required'));err.code='INVALID_GEO';throw err;
  }
  const prodRange=String(input.production_range||'').trim();
  if(!prodRange||prodRange.length>200){
   const err=Error(tr('Production date or range is required'));err.code='INVALID_GEO';throw err;
  }
  const area=Number(input.area_ha);
  if(!Number.isFinite(area)||area<=0){
   const err=Error(tr('Plot area must be greater than 0 ha'));err.code='INVALID_GEO';throw err;
  }
  const decimals=Number(input.coordinate_precision_digits);
  if(!Number.isInteger(decimals)||decimals<6||decimals>12){
   const err=Error(tr('Coordinate precision must be at least 6 decimal digits (6–12).'));err.code='INVALID_GEO';throw err;
  }
  const doc=docs.find(d=>d.id===input.source_document_id&&(!caseId||d.case_id===caseId)&&(!materialId||d.material_id===materialId));
  if(!doc){
   const err=Error(tr('Select source evidence'));err.code='INVALID_GEO';throw err;
  }
  const geom=typeof input.geometry==='string'?JSON.parse(input.geometry):input.geometry;
  const validatedGeom=checkGeometry(geom);
  if(validatedGeom.type==='Point'&&area>4){
   const err=Error(tr('For wood plots above 4 ha, provide a polygon'));err.code='INVALID_GEO';throw err;
  }
  return {...input,plot_id:plotId,country_of_production:country,production_range:prodRange,area_ha:area,coordinate_precision_digits:decimals,geometry:validatedGeom};
 }

 const lastViewByMaterial=new Map();
 function readFile(file,asData=false){
  return new Promise((resolve,reject)=>{
   const r=new FileReader();
   r.onerror=()=>reject(Error(tr('Cannot read file.')));
   r.onload=()=>resolve(r.result);
   if(asData)r.readAsDataURL(file);else r.readAsText(file);
  });
 }

 function recordGeometryText(g){
  return g?.geometry_json||g?.geojson||'';
 }
 function recordGeometryType(g,parsedFeature){
  if(parsedFeature?.geometry?.type)return parsedFeature.geometry.type;
  if(g?.geometry_type)return g.geometry_type;
  try{const f=parse(recordGeometryText(g))[0];return f?.geometry?.type||tr('Not provided');}catch{return tr('Not provided');}
 }
 function recordCountry(g){return g?.country_of_production||g?.country||'';}
 function recordPrecision(g){const v=g?.coordinate_precision_digits??g?.precision_digits;return v!==undefined&&v!==''&&v!==null?String(v):'';}
 function statusBadgeClass(status){
  if(status==='VERIFIED')return 'geo-badge geo-badge--verified';
  if(status==='REJECTED')return 'geo-badge geo-badge--rejected';
  if(status==='MORE_INFO_REQUIRED')return 'geo-badge geo-badge--more-info';
  if(status==='REVIEW_REQUIRED')return 'geo-badge geo-badge--review';
  return 'geo-badge geo-badge--neutral';
 }

 async function open({state,materialId,productId='',sourceId='',chainNodeId='',initialTab='',initialPlotId='',lastRegisteredPlotId='',call,drawer,refresh,onDocument,onReview,ops=window.EudrOps,nav=window.EudrNav}){
  const m=state.materials.find(m=>m.id===materialId);if(!m)return;
  const order=(state.cases||[]).find(c=>c.id===m.case_id);
  const resolvedProductId=productId||nav?.captureState?.()?.productId||'';
  const product=(state.products||[]).find(p=>p.id===resolvedProductId&&p.case_id===m.case_id);
  const resolvedSourceId=sourceId||nav?.captureState?.()?.sourceId||'';
  const activeSource=(state.trace?.sources||[]).find(s=>s.id===resolvedSourceId&&s.material_id===materialId);
  const resolvedChainNodeId=chainNodeId||nav?.captureState?.()?.chainNodeId||'';
  const activeChainNode=(state.chain||[]).find(n=>n.id===resolvedChainNodeId&&n.material_id===materialId);

  const has=c=>(state.user.capabilities||[]).includes(c),canEdit=has('GEO_EDIT'),canUpload=has('EVIDENCE_UPLOAD'),canReview=has('GEO_REVIEW'),canChainEdit=has('CHAIN_EDIT');
  const $=id=>document.getElementById(id);
  const allChainNodes=(state.chain||[]).filter(n=>n.material_id===materialId&&n.active!=='NO');
  const nodes=allChainNodes.filter(n=>['PLOT','PRODUCER','FOREST_OWNER'].includes(n.node_type));
  const defaultParentNode=allChainNodes.find(n=>n.id===resolvedChainNodeId&&n.terminal!=='YES')||allChainNodes.filter(n=>n.terminal!=='YES').slice().sort((a,b)=>Number(b.tier||0)-Number(a.tier||0))[0]||null;
  const allMaterialRecords=(state.geo||[]).filter(g=>g.material_id===materialId);
  const records=allMaterialRecords;
  const stored=[],parsedByRecordIndex=new Map();
  records.forEach((g,idx)=>{
   try{
    const f=parse(recordGeometryText(g))[0];
    if(f){
     f.properties={...f.properties,name:g.plot_id||f.properties?.name||('Plot '+(idx+1)),plot_id:g.plot_id,recordIndex:idx,geoId:g.id,verification_status:g.verification_status||'REVIEW_REQUIRED',preview:false};
     stored.push(f);
     parsedByRecordIndex.set(idx,f);
    }
   }catch{}
  });

  const savedGeoState=lastViewByMaterial.get(materialId)||{tab:'map',recordIndex:null,selectedPlotId:'',center:null,zoom:null};
  let activeRecordIndex=savedGeoState.recordIndex;
  if(initialPlotId){
   const foundIdx=records.findIndex(r=>r.id===initialPlotId||r.plot_id===initialPlotId);
   if(foundIdx>=0)activeRecordIndex=foundIdx;
  }else if(activeRecordIndex===null&&savedGeoState.selectedPlotId){
   const foundIdx=records.findIndex(r=>r.id===savedGeoState.selectedPlotId);
   if(foundIdx>=0)activeRecordIndex=foundIdx;
  }
  if(activeRecordIndex!==null&&(activeRecordIndex<0||activeRecordIndex>=records.length))activeRecordIndex=records.length?0:null;
  let currentTab=['map','upload','register','review'].includes(initialTab)?initialTab:(['map','upload','register','review'].includes(savedGeoState.tab)?savedGeoState.tab:'map');

  function resolvePlotSources(g){
   const sources=(state.trace?.sources||[]).filter(s=>s.material_id===materialId&&s.active!=='NO');
   const matched=sources.filter(s=>{
    if(g.source_id&&g.source_id===s.id)return true;
    if(window.EudrTrace?.matchesSource)return window.EudrTrace.matchesSource(g,'GEO',s.id,state.trace?.recordLinks);
    return false;
   });
   return matched;
  }
  function formatSourceLabel(s){
   if(!s)return tr('Not linked to specific PO/lot');
   return `${s.supplier_po||tr('PO pending')}${s.po_line?' · '+tr('Line')+' '+s.po_line:''}${s.lot_no?' · '+tr('Lot')+' '+s.lot_no:''}`;
  }
  function renderPlotDetailInspector(idx){
   if(!records.length){
    return `<div class="geo-inspector-empty"><p class="muted">${esc(tr('Select or register a plot to inspect its verified metadata and traceability links.'))}</p></div>`;
   }
   const targetIdx=idx!==null&&records[idx]?idx:0;
   const g=records[targetIdx];
   if(!g)return '';
   const parsedFeat=parsedByRecordIndex.get(targetIdx);
   const geomType=recordGeometryType(g,parsedFeat);
   const country=recordCountry(g)||tr('Not provided');
   const area=g.area_ha!==undefined&&g.area_ha!==''&&g.area_ha!==null?`${g.area_ha} ha`:tr('Not provided');
   const prodRange=g.production_range||tr('Not provided');
   const precision=recordPrecision(g)?`${recordPrecision(g)} ${tr('decimal digits')}`:tr('Not provided');
   const matchedSources=resolvePlotSources(g);
   const sourceText=matchedSources.length?matchedSources.map(formatSourceLabel).join('; '):(g.source_id||tr('Not provided'));
   const relatedNode=(state.chain||[]).find(n=>n.id===g.chain_node_id);
   const nodeText=relatedNode?`${relatedNode.display_name||relatedNode.plot_id||relatedNode.id} (${relatedNode.node_type||'NODE'})`:(g.chain_node_id||tr('Not provided'));
   const doc=(state.docs||[]).find(d=>d.id===g.source_document_id);
   const docText=doc?`${doc.name} · ${tr(doc.status||'UPLOADED')}`:(g.source_document_id||tr('Not provided'));
   const verStatus=g.verification_status||tr('Not verified');
   const canLinkActiveSource=Boolean(activeSource&&canEdit&&!matchedSources.some(s=>s.id===activeSource.id));
   return `<div class="geo-detail-card" data-inspected-plot-id="${esc(g.id||g.plot_id)}">
    <div class="geo-detail-head">
     <div>
      <span class="eyebrow">${esc(tr('Selected plot detail'))}</span>
      <h4>${esc(g.plot_id||tr('Not provided'))}</h4>
     </div>
     <span class="${statusBadgeClass(verStatus)}" data-geo-field="verification_status">${esc(tr(verStatus))}</span>
    </div>
    <dl class="geo-detail-grid">
     <div><dt>${esc(tr('Plot ID'))}</dt><dd data-geo-field="plot_id">${esc(g.plot_id||tr('Not provided'))}</dd></div>
     <div><dt>${esc(tr('Geometry type'))}</dt><dd data-geo-field="geometry_type">${esc(geomType)}</dd></div>
     <div><dt>${esc(tr('Country of production'))}</dt><dd data-geo-field="country_of_production">${esc(country)}</dd></div>
     <div><dt>${esc(tr('Area'))}</dt><dd data-geo-field="area_ha">${esc(area)}</dd></div>
     <div><dt>${esc(tr('Production date / range'))}</dt><dd data-geo-field="production_range">${esc(prodRange)}</dd></div>
     <div><dt>${esc(tr('Coordinate precision'))}</dt><dd data-geo-field="coordinate_precision">${esc(precision)}</dd></div>
     <div><dt>${esc(tr('Material'))}</dt><dd data-geo-field="material">${esc(m.material||tr('Not provided'))}</dd></div>
     <div><dt>${esc(tr('Source PO / lot'))}</dt><dd data-geo-field="source_po_lot">${esc(sourceText)}</dd></div>
     <div><dt>${esc(tr('Related chain node'))}</dt><dd data-geo-field="chain_node">${esc(nodeText)}</dd></div>
     <div><dt>${esc(tr('Evidence document'))}</dt><dd data-geo-field="evidence_document">${esc(docText)}</dd></div>
    </dl>
    <div class="geo-detail-actions">
     ${g.source_document_id?`<button type="button" data-geo-document="${esc(g.source_document_id)}">${esc(tr('Source evidence'))}</button>`:''}
     ${canReview?`<button type="button" data-geo-review="${esc(g.id)}">${esc(tr('Review GEO'))}</button>`:''}
     ${canLinkActiveSource?`<button type="button" class="quiet-button" data-geo-link-source="${esc(g.id)}">${esc(tr('Link to active PO/lot'))}</button>`:''}
    </div>
   </div>`;
  }

  const verifiedCount=records.filter(r=>r.verification_status==='VERIFIED').length;
  const reviewReqCount=records.filter(r=>!r.verification_status||r.verification_status==='REVIEW_REQUIRED').length;
  const lastRegistered=lastRegisteredPlotId?records.find(r=>r.id===lastRegisteredPlotId||r.plot_id===lastRegisteredPlotId):null;

  drawer(`<section class="geo-workspace" data-active-geo-tab="${esc(currentTab)}">
   <header class="geo-header">
    <div class="geo-header-top">
     <div>
      <p class="eyebrow">GEOLOCATION WORKSPACE</p>
      <h2>${esc(tr('Geolocation Workspace'))} · ${esc(m.material)}</h2>
      <p class="muted">${esc(tr('Choose GeoJSON, inspect the plot, then register it with its original evidence.'))}</p>
     </div>
     <div class="geo-header-actions">
      <button type="button" id="geoBackToOrder" class="quiet-button">← ${esc(tr('Back to Order'))}</button>
      <span class="geo-summary-pill">${records.length} ${esc(tr('plot(s)'))}</span>
      <span class="geo-summary-pill geo-summary-pill--verified">${verifiedCount} ${esc(tr('VERIFIED'))}</span>
      <span class="geo-summary-pill geo-summary-pill--review">${reviewReqCount} ${esc(tr('REVIEW_REQUIRED'))}</span>
     </div>
    </div>
    <div id="geoContextBar" class="geo-context-bar" role="region" aria-label="${esc(tr('Traceability context'))}">
     <div class="geo-context-item"><span class="geo-context-label">${esc(tr('Sales Order'))}</span><strong data-geo-context="order">${esc(order?.so||m.case_id||tr('Not provided'))}</strong></div>
     <span class="geo-context-sep" aria-hidden="true">→</span>
     <div class="geo-context-item"><span class="geo-context-label">${esc(tr('Product'))}</span><strong data-geo-context="product">${esc(product?.product_name||tr('All order products'))}</strong></div>
     <span class="geo-context-sep" aria-hidden="true">→</span>
     <div class="geo-context-item"><span class="geo-context-label">${esc(tr('Material'))}</span><strong data-geo-context="material">${esc(m.material)}</strong></div>
     <span class="geo-context-sep" aria-hidden="true">→</span>
     <div class="geo-context-item"><span class="geo-context-label">${esc(tr('Source PO / lot'))}</span><strong data-geo-context="source">${esc(activeSource?formatSourceLabel(activeSource):tr('All material sources'))}</strong></div>
     <span class="geo-context-sep" aria-hidden="true">→</span>
     <div class="geo-context-item"><span class="geo-context-label">${esc(tr('Supply Chain Node'))}</span><strong data-geo-context="node">${esc(activeChainNode?(activeChainNode.display_name||activeChainNode.plot_id||activeChainNode.id):tr('All relationships'))}</strong></div>
    </div>
    <nav class="geo-tabs" role="tablist" aria-label="${esc(tr('Geolocation Workspace sections'))}">
     <button type="button" role="tab" id="geoTabBtn-map" data-geo-tab="map" aria-controls="geoTabPanel-map" aria-selected="${currentTab==='map'}" tabindex="${currentTab==='map'?0:-1}">1. ${esc(tr('MAP'))}</button>
     <button type="button" role="tab" id="geoTabBtn-upload" data-geo-tab="upload" aria-controls="geoTabPanel-upload" aria-selected="${currentTab==='upload'}" tabindex="${currentTab==='upload'?0:-1}">2. ${esc(tr('UPLOAD'))}</button>
     <button type="button" role="tab" id="geoTabBtn-register" data-geo-tab="register" aria-controls="geoTabPanel-register" aria-selected="${currentTab==='register'}" tabindex="${currentTab==='register'?0:-1}">3. ${esc(tr('REGISTER'))}</button>
     <button type="button" role="tab" id="geoTabBtn-review" data-geo-tab="review" aria-controls="geoTabPanel-review" aria-selected="${currentTab==='review'}" tabindex="${currentTab==='review'?0:-1}">4. ${esc(tr('REVIEW'))}</button>
    </nav>
   </header>

   <p id="geoMessage" class="geo-message-banner" role="status" aria-live="polite"></p>

   <div id="geoTabPanel-map" class="geo-tab-panel" role="tabpanel" aria-labelledby="geoTabBtn-map" ${currentTab!=='map'?'hidden':''}>
    <div class="geo-map-split">
     <div class="geo-map-main">
      <div class="geo-actions">
       <button type="button" id="geoFit">${esc(tr('Show all plots'))}</button>
       <button type="button" id="geoFitSelected" ${activeRecordIndex===null?'disabled':''}>${esc(tr('Fit selected plot'))}</button>
       <button type="button" id="geoFitPreview" hidden>${esc(tr('Fit preview feature'))}</button>
       ${state.user.role!=='SUPPLIER_USER'?`<button type="button" id="geoExport">${esc(tr('Export GeoJSON'))}</button>`:''}
      </div>
      <div class="geo-legend" aria-label="${esc(tr('Map legend'))}">
       <span class="geo-legend-item"><span class="geo-legend-swatch geo-legend-swatch--registered" aria-hidden="true"></span>${esc(tr('Registered plot'))}</span>
       <span class="geo-legend-item"><span class="geo-legend-swatch geo-legend-swatch--selected" aria-hidden="true"></span>${esc(tr('Selected plot'))}</span>
       <span class="geo-legend-item"><span class="geo-legend-swatch geo-legend-swatch--preview" aria-hidden="true"></span>${esc(tr('Local preview (not yet registered)'))}</span>
      </div>
      <div id="geoMap" class="geo-map" aria-label="${esc(tr('Interactive plot map'))}"></div>
      <p id="geoMapStatus" class="muted" role="status"></p>
      <p class="geo-note">${esc(tr('The map displays supplied coordinates. It does not verify plot ownership, legality or deforestation.'))}</p>
     </div>
     <aside class="geo-map-side">
      <section class="card geo-inspector-section" aria-label="${esc(tr('Selected plot inspector'))}">
       <div id="geoPlotInspector">${renderPlotDetailInspector(activeRecordIndex)}</div>
      </section>
      <section class="card geo-list-section">
       <div class="geo-section-head">
        <h3>${esc(tr('Registered plots'))} (${records.length})</h3>
        ${canUpload?`<button type="button" class="quiet-button" data-geo-switch-tab="upload">+ ${esc(tr('Upload GeoJSON'))}</button>`:''}
       </div>
       <div id="geoRegisteredList">
        ${records.length?records.map((g,i)=>{
         const isSelected=activeRecordIndex===i;
         const matchedSources=resolvePlotSources(g);
         const relatedNode=(state.chain||[]).find(n=>n.id===g.chain_node_id);
         return `<article class="geo-record${isSelected?' geo-record--selected':''}" data-geo-record-item="${i}" data-plot-id="${esc(g.plot_id)}">
          <div class="geo-record-top">
           <strong>${esc(g.plot_id)}</strong>
           <span class="${statusBadgeClass(g.verification_status)}">${esc(tr(g.verification_status||'REVIEW_REQUIRED'))}</span>
          </div>
          <p class="geo-record-meta">${esc(recordCountry(g)||'—')} · ${esc(g.area_ha??'—')} ha · ${esc(recordGeometryType(g,parsedByRecordIndex.get(i)))}</p>
          <p class="geo-record-sub">${esc(g.production_range||tr('Production date not provided'))}${relatedNode?' · '+esc(relatedNode.display_name||relatedNode.plot_id||relatedNode.id):''}${matchedSources.length?' · '+esc(matchedSources.map(formatSourceLabel).join(', ')):''}</p>
          <div class="geo-record-actions">
           <button type="button" data-geo-record="${i}" aria-pressed="${isSelected}">${esc(tr('Show plot'))}</button>
           <button type="button" data-geo-document="${esc(g.source_document_id)}">${esc(tr('Source evidence'))}</button>
           ${canReview?`<button type="button" data-geo-review="${esc(g.id)}">${esc(tr('Review GEO'))}</button>`:''}
          </div>
         </article>`;
        }).join(''):`<div id="geoEmptyState" class="geo-empty-state">
         <p>${esc(tr('No registered plots for this material/source.'))}</p>
         <p class="muted">${esc(tr('No plots registered yet.'))}</p>
         ${canUpload?`<button type="button" id="geoEmptyUploadCta">${esc(tr('Upload GeoJSON'))}</button>`:''}
        </div>`}
       </div>
      </section>
     </aside>
    </div>
   </div>

   <div id="geoTabPanel-upload" class="geo-tab-panel" role="tabpanel" aria-labelledby="geoTabBtn-upload" ${currentTab!=='upload'?'hidden':''}>
    <section class="card geo-upload-card">
     <div class="geo-section-head">
      <div>
       <span class="eyebrow">${esc(tr('STEP 1 — GEOJSON EVIDENCE'))}</span>
       <h3>${esc(tr('Open GeoJSON'))}</h3>
      </div>
      <button type="button" id="geoPreviewOnMapBtn" class="quiet-button" hidden>${esc(tr('View preview on map'))} →</button>
     </div>
     <p class="muted">${esc(tr('Upload preserves the original file contents. Evidence approval and plot registration are separate steps.'))}</p>
     <label class="geo-file-drop">${esc(tr('Choose .geojson or .json · up to 2 MB'))}<input type="file" id="geoFile" accept=".geojson,.json,application/geo+json,application/json"></label>
     <p id="geoFileName" class="geo-file-name"></p>
     <div id="geoUploadSummary" class="geo-upload-summary" hidden></div>
     <label id="geoFeatureLabel" hidden>${esc(tr('Plot in file'))}<select id="geoFeature"></select></label>
     <label id="geoLineLabel" class="check" hidden><input type="checkbox" id="geoLineConfirm">${esc(tr('I confirm this closed LineString is the boundary of a plot. Use a Polygon for registration; keep the original file unchanged.'))}</label>
     <p id="geoGeometryStatus" class="geo-geometry-status" role="status"></p>
     <pre id="geoCoordinates" class="geo-coordinates"></pre>
     ${canUpload?`<div class="geo-upload-task-box">
      <h4>${esc(tr('Save original to geolocation evidence task (04_Geolocation)'))}</h4>
      <label>${esc(tr('Save original to geolocation evidence task'))}<select id="geoTask"></select></label>
      <label id="geoNewTaskLabel" hidden>${esc(tr('New evidence task name'))}<input id="geoNewTaskName" maxlength="200"></label>
      <div class="geo-actions">
       <button type="button" id="geoUpload" disabled>${esc(tr('Save original GeoJSON'))}</button>
       <button type="button" class="quiet-button" data-geo-switch-tab="register">${esc(tr('Continue to Register Plot'))} →</button>
      </div>
     </div>`:`<p class="muted">${esc(tr('You can preview GeoJSON files locally. Uploading evidence requires EVIDENCE_UPLOAD permission.'))}</p>`}
     <div id="geoUploadSuccessCard" class="geo-success-card" role="status" hidden>
      <strong>${esc(tr('Original GeoJSON saved successfully.'))}</strong>
      <p id="geoUploadSuccessDetail" class="muted"></p>
      <div class="geo-actions">
       <button type="button" id="geoGoToRegisterBtn">${esc(tr('Register Plot'))} →</button>
       <button type="button" class="quiet-button" data-geo-switch-tab="map">${esc(tr('View on Map'))}</button>
      </div>
     </div>
    </section>
   </div>

   <div id="geoTabPanel-register" class="geo-tab-panel" role="tabpanel" aria-labelledby="geoTabBtn-register" ${currentTab!=='register'?'hidden':''}>
    ${lastRegistered?`<div id="geoRegistrationResult" class="geo-success-card" role="status">
     <strong>${esc(tr('Plot registered · REVIEW_REQUIRED.'))}</strong>
     <p>${esc(tr('Plot ID'))}: <strong>${esc(lastRegistered.plot_id)}</strong> · ${esc(recordCountry(lastRegistered))} · ${esc(lastRegistered.area_ha)} ha · ${esc(tr(lastRegistered.verification_status||'REVIEW_REQUIRED'))}</p>
     <div class="geo-actions">
      <button type="button" id="geoGoToReviewBtn" data-geo-open-review="${esc(lastRegistered.id)}">${esc(tr('GEO Review'))} →</button>
      <button type="button" class="quiet-button" data-geo-switch-tab="map">${esc(tr('Show on map'))}</button>
     </div>
    </div>`:'<div id="geoRegistrationResult" class="geo-success-card" role="status" hidden></div>'}
    ${canEdit?`<form id="geoForm" class="card geo-register-form">
     <div class="geo-section-head">
      <div>
       <span class="eyebrow">${esc(tr('STEP 2 — PLOT REGISTRATION'))}</span>
       <h3>${esc(tr('Register plot'))}</h3>
      </div>
      <span id="geoEligibilityBadge" class="geo-badge geo-badge--neutral">${esc(tr('Select or paste geometry'))}</span>
     </div>
     <p id="geoEligibilityBanner" class="geo-eligibility-banner muted">${esc(tr('Registration supports Point (plots up to 4 ha) or a single-ring Polygon (up to 2,000 positions).'))}</p>
     <label>${esc(tr('Plot relationship'))}<select name="chain_node_id" required><option value="">${esc(tr('Select a plot / producer relationship'))}</option>${nodes.map(n=>`<option value="${esc(n.id)}" ${(n.id===resolvedChainNodeId||(!resolvedChainNodeId&&nodes.length===1))?'selected':''}>${esc(n.plot_id||n.display_name||n.id)} (${esc(n.node_type)})</option>`).join('')}${canChainEdit?`<option value="__NEW_PLOT__" ${!nodes.length?'selected':''}>+ ${esc(tr('Auto-create Plot relationship from Plot ID'))}</option>`:''}</select></label>
     ${!nodes.length?`<div id="geoMissingNodeWarn" class="warn geo-missing-node-box" role="alert"><span>${esc(tr(canChainEdit?'No Plot / Producer relationship exists yet for this material. Keep "+ Auto-create Plot relationship from Plot ID" selected to create it automatically on registration, or click below to create it now.':'Add a Plot, Producer or Forest owner relationship in the supply chain before registering. You can still preview the file.'))}</span>${canChainEdit?`<button type="button" id="geoQuickAddNodeBtn" class="quiet-button">+ ${esc(tr('Create Plot relationship now'))}</button>`:''}</div>`:''}
     <label>${esc(tr('Exact Plot ID'))}<input name="plot_id" required maxlength="150"></label>
     <div class="geo-fields">
      <label>${esc(tr('Commodity production country (ISO code)'))}<input name="country_of_production" required pattern="[A-Z]{2}" maxlength="2" placeholder="VN"></label>
      <label>${esc(tr('Production date / range'))}<input name="production_range" required maxlength="200" placeholder="2026-01-01 / 2026-02-01"></label>
      <label>${esc(tr('Plot area (ha)'))}<input name="area_ha" type="number" step="any" min="0.000000001" required></label>
      <label>${esc(tr('Source precision (decimal digits, 6–12)'))}<input name="coordinate_precision_digits" type="number" min="6" max="12" step="1" required></label>
     </div>
     <label>${esc(tr('Source document'))}<select name="source_document_id" required></select></label>
     ${activeSource?`<label class="check"><input type="checkbox" id="geoLinkActiveSource" name="link_active_source" checked>${esc(tr('Also link this registered plot to active PO / lot source'))}: <strong>${esc(formatSourceLabel(activeSource))}</strong></label>`:''}
     <details class="geo-advanced-geometry"><summary>${esc(tr('Advanced: geometry JSON'))}</summary><label>GeoJSON Geometry<textarea name="geometry" rows="6" required></textarea></label><button type="button" id="geoPreviewText">${esc(tr('Preview geometry'))}</button></details>
     <label>${esc(tr('Notes'))}<textarea name="notes" maxlength="2000" rows="2"></textarea></label>
     <div class="geo-actions">
      <button type="submit" id="geoRegister" disabled>${esc(tr('Validate & Register'))}</button>
      <button type="button" class="quiet-button" data-geo-switch-tab="upload">← ${esc(tr('Back to Upload'))}</button>
     </div>
     <p class="muted">${esc(tr('Enter country, area, dates and source precision from evidence; these are not inferred from the map.'))}</p>
    </form>`:`<section class="card"><p class="muted">${esc(tr('Plot registration requires GEO_EDIT permission.'))}</p></section>`}
   </div>

   <div id="geoTabPanel-review" class="geo-tab-panel" role="tabpanel" aria-labelledby="geoTabBtn-review" ${currentTab!=='review'?'hidden':''}>
    <section class="card geo-boundary-card" aria-label="${esc(tr('Verification boundaries'))}">
     <span class="eyebrow">${esc(tr('STEP 3 — GEOLOCATION VERIFICATION'))}</span>
     <h3>${esc(tr('GEO review & verification boundaries'))}</h3>
     <p class="geo-compliance-disclaimer"><strong>${esc(tr('Verification does not certify deforestation-free status or legal compliance.'))}</strong> ${esc(tr('The map displays supplied coordinates. It does not verify plot ownership, legality or deforestation.'))}</p>
     <div class="geo-boundary-grid">
      <div class="geo-boundary-step"><strong>1. ${esc(tr('Geometry validation'))}</strong><small>${esc(tr('Automated check of coordinate bounds, closure, self-intersection, and >4 ha polygon rule.'))}</small></div>
      <div class="geo-boundary-step"><strong>2. ${esc(tr('Source document review'))}</strong><small>${esc(tr('Original evidence in 06_DOCUMENT_REGISTER must be human-reviewed and APPROVED before a plot can be VERIFIED.'))}</small></div>
      <div class="geo-boundary-step"><strong>3. ${esc(tr('Human GEO review'))}</strong><small>${esc(tr('Authorized reviewer checks plot ID, country, area, dates and source precision against the approved evidence.'))}</small></div>
     </div>
    </section>
    <div class="geo-review-split">
     <section class="card geo-review-list-card">
      <h3>${esc(tr('Plots for verification'))} (${records.length})</h3>
      ${records.length?`<div class="geo-review-items">${records.map((g,i)=>{
       const doc=(state.docs||[]).find(d=>d.id===g.source_document_id);
       const matchedSources=resolvePlotSources(g);
       const relatedNode=(state.chain||[]).find(n=>n.id===g.chain_node_id);
       return `<article class="geo-review-item${activeRecordIndex===i?' geo-record--selected':''}" data-geo-review-card="${esc(g.id)}">
        <div class="geo-record-top">
         <strong>${esc(g.plot_id)}</strong>
         <span class="${statusBadgeClass(g.verification_status)}">${esc(tr(g.verification_status||'REVIEW_REQUIRED'))}</span>
        </div>
        <p class="geo-record-meta">${esc(recordCountry(g)||'—')} · ${esc(g.area_ha??'—')} ha · ${esc(recordPrecision(g)||'—')} ${esc(tr('digits'))} · ${esc(g.production_range||'—')}</p>
        <p class="geo-record-sub">${esc(tr('Chain node'))}: ${esc(relatedNode?(relatedNode.display_name||relatedNode.plot_id||relatedNode.id):(g.chain_node_id||'—'))} · ${esc(tr('Source PO / lot'))}: ${esc(matchedSources.length?matchedSources.map(formatSourceLabel).join(', '):tr('Not linked'))}</p>
        <p class="geo-record-sub">${esc(tr('Source evidence'))}: <strong>${esc(doc?doc.name:(g.source_document_id||'—'))}</strong> (${esc(tr(doc?.status||'MISSING'))})</p>
        <p class="geo-record-sub">${esc(tr('Reviewer'))}: ${esc(g.reviewed_by||tr('Not reviewed yet'))}${g.reviewed_at?' · '+esc(g.reviewed_at):''}${g.notes?' · '+esc(g.notes):''}</p>
        <div class="geo-record-actions">
         <button type="button" data-geo-map-focus="${i}">${esc(tr('Show on map'))}</button>
         ${g.source_document_id?`<button type="button" data-geo-document="${esc(g.source_document_id)}">${esc(tr('Source evidence'))}</button>`:''}
         ${canReview?`<button type="button" data-geo-select-review="${esc(g.id)}">${esc(tr('Select for review'))}</button>`:''}
        </div>
       </article>`;
      }).join('')}</div>`:`<p class="muted">${esc(tr('No plots registered yet.'))}</p>`}
     </section>
     <aside class="geo-review-form-side">
      ${canReview?`<form id="geoReviewForm" class="card">
       <h3>${esc(tr('GEO review'))}</h3>
       <label>${esc(tr('Plot to review'))}<select name="geo_id" id="geoReviewTarget" ${!records.length?'disabled':''}>${records.length?records.map((g,i)=>`<option value="${esc(g.id)}" ${(initialPlotId&&g.id===initialPlotId)||(activeRecordIndex===i)?'selected':''}>${esc(g.plot_id)} · ${esc(tr(g.verification_status||'REVIEW_REQUIRED'))}</option>`).join(''):`<option value="">${esc(tr('No plots registered yet.'))}</option>`}</select></label>
       <p id="geoReviewPrecheck" class="geo-review-precheck muted" role="status"></p>
       <label>${esc(tr('Decision'))}<select name="status" id="geoReviewDecision"><option value="VERIFIED">VERIFIED</option><option value="REJECTED">REJECTED</option><option value="MORE_INFO_REQUIRED">MORE_INFO_REQUIRED</option></select></label>
       <label>${esc(tr('Review notes'))}<textarea name="notes" id="geoReviewNotes" required rows="4" maxlength="2000" placeholder="${esc(tr('Record coordinate, boundary and source document verification checks (required)'))}"></textarea></label>
       <p class="muted">${esc(tr('Verification does not certify deforestation-free status or legal compliance.'))}</p>
       <button type="submit" id="geoReviewSubmit" ${!records.length?'disabled':''}>${esc(tr('Record review'))}</button>
      </form>`:`<section class="card"><p class="muted">${esc(tr('GEO review decisions require GEO_REVIEW capability.'))}</p></section>`}
     </aside>
    </div>
   </div>
  </section>`);

  let disposed=false,map=null,layer=null,features=[],selectedFile=null,busy=false,sequence=0;
  const saveMapViewport=()=>{
   const prev=lastViewByMaterial.get(materialId)||{};
   let center=prev.center||null,zoom=prev.zoom||null;
   if(map){
    try{
     const c=map.getCenter?.(),z=map.getZoom?.();
     if(c)center=[c.lat,c.lng];
     if(Number.isFinite(z))zoom=z;
    }catch{}
   }
   lastViewByMaterial.set(materialId,{
    ...prev,
    tab:currentTab,
    recordIndex:activeRecordIndex,
    selectedPlotId:activeRecordIndex!==null&&records[activeRecordIndex]?records[activeRecordIndex].id:(prev.selectedPlotId||''),
    center,
    zoom
   });
  };
  cleanup=()=>{saveMapViewport();disposed=true;sequence++;map?.remove();map=null;};
  const message=s=>{if(!disposed&&$('geoMessage'))$('geoMessage').textContent=tr(s);};
  const form=$('geoForm');

  function setTab(nextTab){
   if(!['map','upload','register','review'].includes(nextTab))return;
   currentTab=nextTab;
   const rootEl=document.querySelector('.geo-workspace');
   if(rootEl)rootEl.dataset.activeGeoTab=nextTab;
   document.querySelectorAll('[data-geo-tab]').forEach(btn=>{
    const active=btn.dataset.geoTab===nextTab;
    btn.setAttribute('aria-selected',String(active));
    btn.tabIndex=active?0:-1;
   });
   ['map','upload','register','review'].forEach(t=>{
    const panel=$('geoTabPanel-'+t);
    if(panel)panel.hidden=t!==nextTab;
   });
   saveMapViewport();
   if(nextTab==='map'&&map){
    try{map.invalidateSize();}catch{}
   }
  }

  document.querySelectorAll('[data-geo-tab]').forEach(btn=>{
   btn.onclick=()=>setTab(btn.dataset.geoTab);
   btn.onkeydown=e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    const tabs=[...document.querySelectorAll('[data-geo-tab]')];
    const idx=tabs.indexOf(btn);
    const target=e.key==='Home'?tabs[0]:e.key==='End'?tabs.at(-1):tabs[(idx+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length];
    e.preventDefault();
    setTab(target.dataset.geoTab);
    target.focus();
   };
  });
  document.querySelectorAll('[data-geo-switch-tab]').forEach(btn=>{
   btn.onclick=()=>setTab(btn.dataset.geoSwitchTab);
  });
  if($('geoBackToOrder')){
   $('geoBackToOrder').onclick=()=>{
    saveMapViewport();
    if(nav?.backToOrder)nav.backToOrder(m.case_id);
    else nav?.closeViewer?.({fromCloseButton:true});
   };
  }
  if($('geoEmptyUploadCta')){
   $('geoEmptyUploadCta').onclick=()=>{
    setTab('upload');
    $('geoFile')?.focus?.();
   };
  }
  if($('geoPreviewOnMapBtn')){
   $('geoPreviewOnMapBtn').onclick=()=>{
    setTab('map');
    const f=features[Number($('geoFeature')?.value)||0],g=candidate(f,$('geoLineConfirm')?.checked);
    if(f)show(g?[{...f,geometry:g,properties:{...f.properties,preview:true}}]:[{...f,properties:{...f.properties,preview:true}}]);
   };
  }
  if($('geoGoToRegisterBtn')){
   $('geoGoToRegisterBtn').onclick=()=>setTab('register');
  }

  function sources(){
   if(!form)return;
   const select=form.elements.source_document_id,previous=select.value;
   const availableDocs=(state.docs||[]).filter(d=>d.case_id===m.case_id&&d.material_id===materialId&&d.active_version==='YES');
   select.innerHTML=`<option value="">${esc(tr('Select source evidence'))}</option>`+availableDocs.map(d=>`<option value="${esc(d.id)}">${esc(d.name)} · ${esc(tr(d.status))}</option>`).join('');
   if(previous&&availableDocs.some(d=>d.id===previous))select.value=previous;
  }
  function tasks(){
   if(!canUpload||!$('geoTask'))return;
   const select=$('geoTask'),previous=select.value;
   const geoTasks=(state.tasks||[]).filter(t=>t.case_id===m.case_id&&t.material_id===materialId&&t.active!=='NO'&&t.evidence_block==='04_Geolocation'&&['MISSING','DRAFT','UPLOADED','REJECTED','MORE_INFO_REQUIRED'].includes(t.status));
   select.innerHTML=`<option value="">${esc(tr('Select evidence task'))}</option>`+geoTasks.map(t=>`<option value="${esc(t.id)}">${esc(t.evidence)}${t.document_id?' · '+esc(tr('Replace draft version')):''}</option>`).join('')+(has('POLICY_EDIT')?`<option value="__NEW__">${esc(tr('Create a new GeoJSON evidence task'))}</option>`:'');
   select.value=previous;
   if(!select.value&&has('POLICY_EDIT'))select.value='__NEW__';
   taskChanged();
  }
  function taskChanged(){
   if(!canUpload||!$('geoTask'))return;
   $('geoNewTaskLabel').hidden=$('geoTask').value!=='__NEW__';
   $('geoUpload').disabled=busy||!selectedFile||!$('geoTask').value;
  }

  const fit=()=>{if(map&&layer?.getBounds?.()?.isValid?.())map.fitBounds(layer.getBounds(),{padding:[24,24],maxZoom:16});};
  function show(list){
   if(!map)return;
   layer?.remove();
   layer=window.L.geoJSON(list,{
    style:f=>{
     const isPreview=Boolean(f?.properties?.preview||f?.geometry?.type==='LineString');
     const isSelected=activeRecordIndex!==null&&f?.properties?.recordIndex===activeRecordIndex;
     return {
      color:isPreview?'#c26c11':isSelected?'#0b5cab':'#087b67',
      weight:isSelected?4:3,
      dashArray:isPreview?'6 4':undefined,
      fillOpacity:isPreview?0.24:isSelected?0.28:0.18
     };
    },
    pointToLayer:(f,p)=>{
     const isPreview=Boolean(f?.properties?.preview);
     const isSelected=activeRecordIndex!==null&&f?.properties?.recordIndex===activeRecordIndex;
     return window.L.circleMarker(p,{
      radius:isSelected?9:7,
      color:isPreview?'#c26c11':isSelected?'#0b5cab':'#087b67',
      fillOpacity:0.85
     });
    },
    onEachFeature:(f,l)=>{
     const el=document.createElement('span');
     el.textContent=f?.properties?.name||'';
     l.bindPopup?.(el);
    }
   }).addTo(map);
   fit();
  }

  try{
   if(!window.L)throw Error('Leaflet unavailable');
   map=window.L.map($('geoMap'),{scrollWheelZoom:false,preferCanvas:false});
   map.setView(savedGeoState.center||[10.77,106.7],savedGeoState.zoom||5);
   const config=window.EudrMapConfig||{},url=config.tileUrl||'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
   if(!/^https:\/\//.test(url))throw Error('HTTPS map provider required');
   const tiles=window.L.tileLayer(url,{maxZoom:config.maxZoom||19,attribution:config.attribution||'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',referrerPolicy:'strict-origin-when-cross-origin'});
   tiles.on?.('tileerror',()=>{if(!disposed&&$('geoMapStatus'))$('geoMapStatus').textContent=tr('Background map unavailable. Plot geometry remains visible.');});
   tiles.addTo(map);
   window.L.control?.scale?.({imperial:false})?.addTo?.(map);
   if(activeRecordIndex!==null&&records[activeRecordIndex]){
    try{
     const feat=parsedByRecordIndex.get(activeRecordIndex)||parse(recordGeometryText(records[activeRecordIndex]))[0];
     show(feat?[feat]:stored);
    }catch{show(stored);}
   }else{
    show(stored);
   }
   if(savedGeoState.center&&savedGeoState.zoom)map.setView(savedGeoState.center,savedGeoState.zoom);
   map.invalidateSize?.();
  }catch{
   if($('geoMap'))$('geoMap').textContent=tr('Interactive map unavailable. Coordinates and registration remain available.');
  }

  function updateEligibilityUI(f,g,valid,statusText){
   const badge=$('geoEligibilityBadge'),banner=$('geoEligibilityBanner');
   if(!badge||!banner)return;
   if(!f){
    badge.className='geo-badge geo-badge--neutral';
    badge.textContent=tr('Select or paste geometry');
    banner.textContent=tr('Registration supports Point (plots up to 4 ha) or a single-ring Polygon (up to 2,000 positions).');
    return;
   }
   if(valid){
    badge.className='geo-badge geo-badge--verified';
    badge.textContent=tr('Eligible for registration');
    banner.textContent=`${statusText} (${g.type}${g.type==='Polygon'?' · '+(g.coordinates[0].length-1)+' '+tr('vertices'):''})`;
   }else if(f.geometry.type==='LineString'){
    badge.className='geo-badge geo-badge--more-info';
    badge.textContent=isClosedLineString(f.geometry)?tr('Boundary confirmation required'):tr('Ineligible LineString');
    banner.textContent=statusText;
   }else{
    badge.className='geo-badge geo-badge--rejected';
    badge.textContent=tr('Specialist review required');
    banner.textContent=statusText;
   }
  }

  function updateGeometry(){
   const f=features[Number($('geoFeature')?.value)||0],g=candidate(f,$('geoLineConfirm')?.checked);
   if($('geoCoordinates'))$('geoCoordinates').textContent=f?JSON.stringify(g||f.geometry,null,2):'';
   if($('geoPreviewOnMapBtn'))$('geoPreviewOnMapBtn').hidden=!f;
   if($('geoFitPreview'))$('geoFitPreview').hidden=!f;
   let valid=false,status='';
   if(f){
    if(!g){
     status=f.geometry.type==='LineString'
      ?tr('LineString is a line. Confirm a closed plot boundary to register it as Polygon.')
      :tr('Preview only. Multi-geometries and polygon holes require specialist review before registration.');
    }else{
     try{
      checkGeometry(g);
      valid=true;
      status=tr('Geometry ready for review.');
     }catch(e){
      status=e.message;
     }
    }
   }
   if($('geoGeometryStatus'))$('geoGeometryStatus').textContent=status;
   updateEligibilityUI(f,g,valid,status);
   if(form){
    form.elements.geometry.value=g?JSON.stringify(g):'';
    const hasChainOption=nodes.length>0||canChainEdit;
    $('geoRegister').disabled=busy||!valid||!hasChainOption;
   }
   const previewFeatures=g?[{...f,geometry:g,properties:{...f.properties,preview:true}}]:f?[{...f,properties:{...f.properties,preview:true}}]:stored;
   show(previewFeatures);
  }

  function renderUploadSummary(file,stats){
   const box=$('geoUploadSummary');
   if(!box)return;
   if(!file||!stats){box.hidden=true;box.innerHTML='';return;}
   const geomTypes=[...new Set(stats.features.map(f=>f.geometry.type))].join(', ');
   const allEligible=stats.features.every(f=>f.geometry.type==='Point'||(f.geometry.type==='Polygon'&&f.geometry.coordinates.length===1));
   const hasClosedLine=stats.features.some(f=>isClosedLineString(f.geometry));
   const validationLabel=allEligible?tr('Valid · Eligible for registration'):hasClosedLine?tr('Valid · Closed LineString requires confirmation'):tr('Preview only · Specialist review required for registration');
   const sizeKb=Math.max(0.1,Math.round(stats.byteLength/102.4)/10);
   box.hidden=false;
   box.innerHTML=`<dl class="geo-summary-grid">
    <div><dt>${esc(tr('File name'))}</dt><dd data-upload-summary="name">${esc(file.name)}</dd></div>
    <div><dt>${esc(tr('File size'))}</dt><dd data-upload-summary="size">${esc(sizeKb+' KB ('+stats.byteLength+' B)')}</dd></div>
    <div><dt>${esc(tr('Geometry type'))}</dt><dd data-upload-summary="geometry_type">${esc(geomTypes)}</dd></div>
    <div><dt>${esc(tr('Feature count'))}</dt><dd data-upload-summary="feature_count">${esc(String(stats.features.length))}</dd></div>
    <div><dt>${esc(tr('Coordinate positions'))}</dt><dd data-upload-summary="positions">${esc(String(stats.positionCount))}</dd></div>
    <div><dt>${esc(tr('Validation result'))}</dt><dd data-upload-summary="validation">${esc(validationLabel)}</dd></div>
   </dl>`;
  }

  function bindInspectorAndRecordActions(){
   document.querySelectorAll('[data-geo-record]').forEach(b=>b.onclick=()=>{
    const idx=Number(b.dataset.geoRecord);
    selectRegisteredPlot(idx);
   });
   document.querySelectorAll('[data-geo-map-focus]').forEach(b=>b.onclick=()=>{
    const idx=Number(b.dataset.geoMapFocus);
    setTab('map');
    selectRegisteredPlot(idx);
   });
   document.querySelectorAll('[data-geo-document]').forEach(b=>b.onclick=()=>{
    if(!b.dataset.geoDocument)return;
    saveMapViewport();
    onDocument?.(b.dataset.geoDocument);
   });
   document.querySelectorAll('[data-geo-review],[data-geo-open-review],[data-geo-select-review]').forEach(b=>b.onclick=()=>{
    const geoId=b.dataset.geoReview||b.dataset.geoOpenReview||b.dataset.geoSelectReview;
    const idx=records.findIndex(r=>r.id===geoId);
    if(idx>=0)activeRecordIndex=idx;
    saveMapViewport();
    setTab('review');
    if($('geoReviewTarget')&&geoId){
     $('geoReviewTarget').value=geoId;
     updateReviewPrecheck();
    }
    $('geoReviewNotes')?.focus?.();
   });
   document.querySelectorAll('[data-geo-link-source]').forEach(b=>b.onclick=async()=>{
    const geoId=b.dataset.geoLinkSource;
    if(!geoId||!activeSource||busy)return;
    busy=true;
    const unlock=ops?.lockButton?ops.lockButton(b,'Linking…'):()=>{};
    const opId=ops?.start?ops.start({action:'linkSourceRecord',label:'Linking plot to PO/lot source',level:3,caseId:m.case_id}):null;
    try{
     await call('linkSourceRecord',activeSource.id,{type:'GEO',id:geoId,confirmed:true});
     ops?.succeed?.(opId,tr('Plot linked to source.'));
     state=await refresh();
     if(disposed)return;
     await open({state,materialId,productId:resolvedProductId,sourceId:resolvedSourceId,chainNodeId:resolvedChainNodeId,initialTab:currentTab,initialPlotId:geoId,call,drawer,refresh,onDocument,onReview,ops,nav});
     message('Plot linked to active PO / lot source.');
    }catch(e){
     ops?.fail?.(opId,e,{uncertain:e.status>=500});
     message((e.code?e.code+' · ':'')+e.message);
    }finally{
     busy=false;
     unlock();
    }
   });
  }

  function selectRegisteredPlot(idx){
   if(!records[idx])return;
   activeRecordIndex=idx;
   lastViewByMaterial.set(materialId,{
    ...(lastViewByMaterial.get(materialId)||{}),
    tab:currentTab,
    recordIndex:idx,
    selectedPlotId:records[idx].id||''
   });
   document.querySelectorAll('[data-geo-record]').forEach(x=>x.setAttribute('aria-pressed',String(Number(x.dataset.geoRecord)===idx)));
   document.querySelectorAll('[data-geo-record-item]').forEach(x=>x.classList.toggle('geo-record--selected',Number(x.dataset.geoRecordItem)===idx));
   document.querySelectorAll('[data-geo-review-card]').forEach(x=>x.classList.toggle('geo-record--selected',x.dataset.geoReviewCard===records[idx].id));
   if($('geoFitSelected'))$('geoFitSelected').disabled=false;
   if($('geoPlotInspector')){
    $('geoPlotInspector').innerHTML=renderPlotDetailInspector(idx);
    bindInspectorAndRecordActions();
   }
   try{
    const feat=parsedByRecordIndex.get(idx)||parse(recordGeometryText(records[idx]))[0];
    if(feat)show([feat]);
    saveMapViewport();
   }catch(e){
    message(e.message);
   }
  }

  $('geoFile').onchange=async()=>{
   const generation=++sequence;
   selectedFile=null;features=[];
   if(form){form.elements.geometry.value='';form.elements.source_document_id.value='';}
   if($('geoUploadSuccessCard'))$('geoUploadSuccessCard').hidden=true;
   $('geoLineConfirm').checked=false;
   $('geoLineLabel').hidden=true;
   $('geoFeatureLabel').hidden=true;
   $('geoCoordinates').textContent='';
   $('geoFileName').textContent='';
   $('geoGeometryStatus').textContent='';
   renderUploadSummary(null,null);
   if(form)$('geoRegister').disabled=true;
   taskChanged();
   show(stored);
   try{
    const file=$('geoFile').files[0];
    if(!file)return;
    message('Validating GeoJSON file…');
    if(!/\.(geojson|json)$/i.test(file.name)||!file.size||file.size>MAX_BYTES)
     throw Error(tr('Choose a .geojson or .json file up to 2 MB.'));
    const text=await readFile(file);
    const stats=parseWithStats(text);
    if(disposed||generation!==sequence)return;
    features=stats.features;
    selectedFile=file;
    nav?.markDirty?.(true);
    $('geoFileName').textContent=file.name+' · '+features.length+' '+tr('plot(s)');
    renderUploadSummary(file,stats);
    $('geoFeature').innerHTML=features.map((f,i)=>`<option value="${i}">${esc(f.properties.name)} · ${esc(f.geometry.type)}</option>`).join('');
    $('geoFeatureLabel').hidden=false;
    if(canUpload&&$('geoNewTaskName'))$('geoNewTaskName').value=('GeoJSON · '+file.name).slice(0,180);
    selectFeature();
    taskChanged();
    message('File previewed locally. It has not been uploaded.');
   }catch(e){
    if(!disposed&&generation===sequence)message(e.message);
   }
  };

  function selectFeature(){
   const f=features[Number($('geoFeature').value)||0];
   $('geoLineConfirm').checked=false;
   $('geoLineLabel').hidden=f?.geometry.type!=='LineString';
   if(form){
    form.elements.plot_id.value=f?.properties.name||'';
    for(const key of ['country_of_production','production_range','area_ha','coordinate_precision_digits','notes']){
     if(form.elements[key])form.elements[key].value='';
    }
    if(resolvedChainNodeId&&nodes.some(n=>n.id===resolvedChainNodeId)){
     form.elements.chain_node_id.value=resolvedChainNodeId;
     const n=nodes.find(x=>x.id===resolvedChainNodeId);
     if(n?.node_type==='PLOT'&&n.plot_id)form.elements.plot_id.value=n.plot_id;
    }else if(nodes.length===1){
     form.elements.chain_node_id.value=nodes[0].id;
     if(nodes[0]?.node_type==='PLOT'&&nodes[0].plot_id)form.elements.plot_id.value=nodes[0].plot_id;
    }else if(!nodes.length&&canChainEdit){
     form.elements.chain_node_id.value='__NEW_PLOT__';
    }else{
     form.elements.chain_node_id.value='';
    }
   }
   updateGeometry();
  }

  $('geoFeature').onchange=selectFeature;
  $('geoLineConfirm').onchange=updateGeometry;
  $('geoFit').onclick=()=>{
   activeRecordIndex=null;
   if($('geoFitSelected'))$('geoFitSelected').disabled=true;
   lastViewByMaterial.set(materialId,{...(lastViewByMaterial.get(materialId)||{}),tab:currentTab,recordIndex:null,selectedPlotId:'',center:null,zoom:null});
   document.querySelectorAll('[data-geo-record]').forEach(x=>x.setAttribute('aria-pressed','false'));
   document.querySelectorAll('[data-geo-record-item]').forEach(x=>x.classList.remove('geo-record--selected'));
   if($('geoPlotInspector')){
    $('geoPlotInspector').innerHTML=renderPlotDetailInspector(null);
    bindInspectorAndRecordActions();
   }
   const previewItems=features.map(f=>({...f,properties:{...f.properties,preview:true}}));
   show([...stored,...previewItems]);
  };
  if($('geoFitSelected')){
   $('geoFitSelected').onclick=()=>{
    if(activeRecordIndex!==null)selectRegisteredPlot(activeRecordIndex);
   };
  }
  if($('geoFitPreview')){
   $('geoFitPreview').onclick=()=>{
    const f=features[Number($('geoFeature')?.value)||0],g=candidate(f,$('geoLineConfirm')?.checked);
    if(f)show(g?[{...f,geometry:g,properties:{...f.properties,preview:true}}]:[{...f,properties:{...f.properties,preview:true}}]);
   };
  }

  if(canUpload){
   $('geoTask').onchange=taskChanged;
   $('geoUpload').onclick=async()=>{
    if(busy||!selectedFile)return;
    busy=true;
    taskChanged();
    if(form)$('geoRegister').disabled=true;
    $('geoFile').disabled=true;
    const unlockBtn=ops?.lockButton?ops.lockButton($('geoUpload'),'Uploading GeoJSON…'):()=>{};
    const opId=ops?.start?ops.start({action:'uploadEvidence',label:`Uploading ${selectedFile.name}`,level:3,step:'Saving original GeoJSON',caseId:m.case_id}):null;
    try{
     const file=selectedFile;
     let id=$('geoTask').value;
     if(id==='__NEW__'){
      const evidence=$('geoNewTaskName').value.trim();
      if(!evidence)throw Error(tr('Enter an evidence task name.'));
      ops?.update?.(opId,{step:'Creating geolocation evidence task'});
      const created=await call('addScopedRequirement',m.case_id,{material_id:materialId,chain_node_id:resolvedChainNodeId||'',evidence,evidence_block:'04_Geolocation',state:'REQUIRED',reason:'Original GeoJSON supplied for material geolocation'});
      id=created.id;
      state=await refresh();
      if(disposed)return;
      tasks();
      $('geoTask').value=id;
     }
     const task=state.tasks.find(t=>t.id===id);
     if(!task)throw Error(tr('Select a geolocation evidence task.'));
     ops?.update?.(opId,{step:'Uploading original GeoJSON bytes'});
     const data=String(await readFile(file,true)).split(',')[1];
     if(disposed)return;
     const saved=await call('uploadEvidence',id,{name:file.name,type:/\.geojson$/i.test(file.name)?'application/geo+json':'application/json',data,expected_document_id:task.document_id||''});
     state=await refresh();
     if(disposed)return;
     sources();
     tasks();
     $('geoTask').value=id;
     if(form)form.elements.source_document_id.value=saved.id;
     selectedFile=null;
     nav?.markDirty?.(false);
     ops?.succeed?.(opId,tr('Original GeoJSON saved.'));
     if($('geoUploadSuccessCard')){
      $('geoUploadSuccessCard').hidden=false;
      if($('geoUploadSuccessDetail'))$('geoUploadSuccessDetail').textContent=`${file.name} → ${task.evidence} (${saved.id})`;
     }
     message('Original GeoJSON saved. Complete the plot details to register; evidence still needs review.');
    }catch(e){
     const uncertain=e.status>=500||['UPSTREAM_TIMEOUT','NETWORK_ERROR'].includes(e.code);
     ops?.fail?.(opId,e,{uncertain});
     message((e.code?e.code+' · ':'')+e.message+(uncertain?' · '+tr('Save status is uncertain. Check the latest record before retrying.'):''));
    }finally{
     busy=false;
     unlockBtn();
     if(!disposed){
      $('geoFile').disabled=false;
      taskChanged();
      if(form)updateGeometry();
     }
    }
   };
  }

  if(form){
   form.elements.chain_node_id.onchange=()=>{
    const n=nodes.find(n=>n.id===form.elements.chain_node_id.value);
    if(n?.node_type==='PLOT'&&n.plot_id)form.elements.plot_id.value=n.plot_id;
   };
   if($('geoQuickAddNodeBtn')){
    $('geoQuickAddNodeBtn').onclick=async()=>{
     if(busy)return;
     const plotId=(form.elements.plot_id.value||features[Number($('geoFeature')?.value)||0]?.properties?.name||'Plot 1').trim().slice(0,150);
     if(!form.elements.plot_id.value)form.elements.plot_id.value=plotId;
     busy=true;
     const btn=$('geoQuickAddNodeBtn');
     const unlockBtn=ops?.lockButton?ops.lockButton(btn,'Creating relationship…'):()=>{};
     const opId=ops?.start?ops.start({action:'addChainNode',label:`Creating Plot relationship (${plotId})`,level:3,caseId:m.case_id}):null;
     try{
      const created=await call('addChainNode',m.case_id,{
       material_id:materialId,
       parent_id:defaultParentNode?.id||'',
       node_type:'PLOT',
       display_name:plotId,
       plot_id:plotId,
       terminal:'YES',
       source_document_id:form.elements.source_document_id.value||''
      });
      const newNode={id:created.id,case_id:m.case_id,material_id:materialId,parent_id:defaultParentNode?.id||'',node_type:'PLOT',display_name:plotId,plot_id:plotId,terminal:'YES',active:'YES'};
      nodes.push(newNode);
      if(state.chain)state.chain.push(newNode);
      const opt=document.createElement('option');
      opt.value=newNode.id;
      opt.textContent=`${newNode.plot_id} (PLOT)`;
      form.elements.chain_node_id.append(opt);
      form.elements.chain_node_id.value=newNode.id;
      if($('geoMissingNodeWarn'))$('geoMissingNodeWarn').hidden=true;
      ops?.succeed?.(opId,tr('Plot relationship created.'));
      message('Plot relationship created and selected.');
      updateGeometry();
     }catch(e){
      ops?.fail?.(opId,e,{uncertain:e.status>=500});
      message((e.code?e.code+' · ':'')+e.message);
     }finally{
      busy=false;
      unlockBtn();
     }
    };
   }
   const applyGeometryTextarea=(showToast=false)=>{
    try{
     const rawText=form.elements.geometry.value.trim();
     if(!rawText)throw Error(tr('Geometry is empty.'));
     const parsedFeat=parse(rawText)[0];
     const g=checkGeometry(candidate(parsedFeat,true)||parsedFeat.geometry);
     features=[{type:'Feature',geometry:g,properties:{name:form.elements.plot_id.value||parsedFeat?.properties?.name||'Plot',preview:true}}];
     $('geoFeature').innerHTML='<option value="0">Geometry</option>';
     $('geoLineConfirm').checked=false;
     $('geoLineLabel').hidden=true;
     updateGeometry();
     if(showToast)message('Geometry ready for review.');
    }catch(e){
     $('geoRegister').disabled=true;
     if(showToast)message(e.message);
    }
   };
   $('geoPreviewText').onclick=()=>applyGeometryTextarea(true);
   form.elements.geometry.oninput=()=>{
    nav?.markDirty?.(true);
    applyGeometryTextarea(false);
   };
   form.onsubmit=async event=>{
    event.preventDefault();
    if(busy)return;
    busy=true;
    $('geoRegister').disabled=true;
    if(canUpload&&$('geoUpload'))$('geoUpload').disabled=true;
    const unlockBtn=ops?.lockButton?ops.lockButton($('geoRegister'),'Registering plot…'):()=>{};
    const opId=ops?.start?ops.start({action:'saveGeo',label:'Registering plot geolocation',level:3,step:'Validating plot geometry & metadata',caseId:m.case_id}):null;
    try{
     const rawInput=Object.fromEntries(new FormData(form));
     const linkActiveSource=Boolean($('geoLinkActiveSource')?.checked&&activeSource);
     delete rawInput.link_active_source;
     const needsAutoNode=canChainEdit&&(rawInput.chain_node_id==='__NEW_PLOT__' || (!rawInput.chain_node_id&&!nodes.length));
     if(needsAutoNode){
      const plotIdForNode=String(rawInput.plot_id||'').trim();
      if(!plotIdForNode||plotIdForNode.length>150){
       const err=Error(tr('Plot ID is required'));err.code='INVALID_GEO';throw err;
      }
      // Validate all other fields before creating the chain node
      const tempNode={id:'__TEMP_PLOT__',node_type:'PLOT',plot_id:plotIdForNode,display_name:plotIdForNode};
      validatePlotRegistration({...rawInput,chain_node_id:'__TEMP_PLOT__'},{nodes:[tempNode],records,docs:state.docs||[],caseId:m.case_id,materialId});
      ops?.update?.(opId,{step:'Creating plot relationship in supply chain'});
      const createdNode=await call('addChainNode',m.case_id,{
       material_id:materialId,
       parent_id:defaultParentNode?.id||'',
       node_type:'PLOT',
       display_name:plotIdForNode,
       plot_id:plotIdForNode,
       terminal:'YES',
       source_document_id:rawInput.source_document_id||''
      });
      if(createdNode?.id){
       const newNode={id:createdNode.id,case_id:m.case_id,material_id:materialId,parent_id:defaultParentNode?.id||'',node_type:'PLOT',display_name:plotIdForNode,plot_id:plotIdForNode,terminal:'YES',active:'YES'};
       nodes.push(newNode);
       if(state.chain)state.chain.push(newNode);
       rawInput.chain_node_id=createdNode.id;
      }
     }
     const validated=validatePlotRegistration(rawInput,{nodes,records,docs:state.docs||[],caseId:m.case_id,materialId});
     validated.material_id=materialId;
     const feature=features[Number($('geoFeature').value)||0];
     if(feature?.geometry.type==='LineString'&&validated.geometry.type==='Polygon'&&$('geoLineConfirm').checked){
      validated.notes=(validated.notes?validated.notes+'\n':'')+'User confirmed closed LineString as plot boundary; Polygon registered. Original GeoJSON unchanged.';
      if(validated.notes.length>2000)throw Error(tr('Shorten notes to leave room for the boundary confirmation.'));
     }
     ops?.update?.(opId,{step:'Saving plot registration'});
     const savedGeo=await call('saveGeo',m.case_id,validated);
     if(linkActiveSource&&savedGeo?.id){
      try{await call('linkSourceRecord',activeSource.id,{type:'GEO',id:savedGeo.id,confirmed:true});}catch{}
     }
     nav?.markDirty?.(false);
     ops?.succeed?.(opId,tr('Plot registered · REVIEW_REQUIRED.'));
     state=await refresh();
     if(disposed)return;
     await open({state,materialId,productId:resolvedProductId,sourceId:resolvedSourceId,chainNodeId:resolvedChainNodeId,initialTab:'register',initialPlotId:savedGeo?.id||validated.plot_id,lastRegisteredPlotId:savedGeo?.id||validated.plot_id,call,drawer,refresh,onDocument,onReview,ops,nav});
     if(document.getElementById('geoMessage'))document.getElementById('geoMessage').textContent=tr('Plot registered · REVIEW_REQUIRED.');
    }catch(e){
     const uncertain=e.status>=500||['UPSTREAM_TIMEOUT','NETWORK_ERROR'].includes(e.code);
     ops?.fail?.(opId,e,{uncertain});
     message((e.code?e.code+' · ':'')+e.message+(uncertain?' · '+tr('Save status is uncertain. Check the latest record before retrying; this form remains open.'):''));
    }finally{
     busy=false;
     unlockBtn();
     if(!disposed){
      updateGeometry();
      taskChanged();
     }
    }
   };
  }

  function updateReviewPrecheck(){
   const pre=$('geoReviewPrecheck'),sel=$('geoReviewTarget');
   if(!pre||!sel)return;
   const target=records.find(r=>r.id===sel.value);
   if(!target){pre.textContent='';return;}
   const doc=(state.docs||[]).find(d=>d.id===target.source_document_id);
   const docApproved=doc&&doc.status==='APPROVED'&&doc.active_version==='YES';
   const legalDue=Boolean(state.legal?.reviewDue);
   const parts=[`${tr('Plot')}: ${target.plot_id}`,`${tr('Current status')}: ${tr(target.verification_status||'REVIEW_REQUIRED')}`,`${tr('Source document')}: ${doc?doc.name+' ('+tr(doc.status)+')':(target.source_document_id||tr('Missing'))}`];
   if(!docApproved)parts.push(tr('Note: Source document must be APPROVED before setting status to VERIFIED.'));
   if(legalDue)parts.push(tr('Note: Legal freshness review is due; VERIFIED requires current legal review.'));
   pre.textContent=parts.join(' · ');
  }

  if($('geoReviewForm')){
   if($('geoReviewTarget'))$('geoReviewTarget').onchange=updateReviewPrecheck;
   updateReviewPrecheck();
   $('geoReviewForm').onsubmit=async e=>{
    e.preventDefault();
    if(busy)return;
    const targetId=$('geoReviewTarget')?.value||records[activeRecordIndex||0]?.id||'';
    const decision=$('geoReviewDecision')?.value||'VERIFIED';
    const notes=($('geoReviewNotes')?.value||'').trim();
    if(!targetId){message('Select a registered plot to review.');return;}
    if(!notes){
     message('Enter review notes before recording a GEO decision.');
     $('geoReviewNotes')?.focus?.();
     return;
    }
    busy=true;
    const submitBtn=$('geoReviewSubmit');
    const unlockBtn=ops?.lockButton?ops.lockButton(submitBtn,'Saving review…'):()=>{};
    const opId=ops?.start?ops.start({action:'reviewGeo',label:`Recording GEO review (${decision})`,level:3,step:'Saving GEO review decision',caseId:m.case_id}):null;
    try{
     await call('reviewGeo',targetId,{status:decision,notes});
     nav?.markDirty?.(false);
     ops?.succeed?.(opId,`${tr('GEO review saved')} · ${decision}`);
     state=await refresh();
     if(disposed)return;
     await open({state,materialId,productId:resolvedProductId,sourceId:resolvedSourceId,chainNodeId:resolvedChainNodeId,initialTab:'review',initialPlotId:targetId,call,drawer,refresh,onDocument,onReview,ops,nav});
     if(document.getElementById('geoMessage'))document.getElementById('geoMessage').textContent=`${tr('GEO review saved')} · ${tr(decision)}`;
    }catch(err){
     const uncertain=err.status>=500||['UPSTREAM_TIMEOUT','NETWORK_ERROR'].includes(err.code);
     ops?.fail?.(opId,err,{uncertain});
     message((err.code?err.code+' · ':'')+err.message+(uncertain?' · '+tr('Save status is uncertain. Check the latest record before retrying; this form remains open.'):''));
    }finally{
     busy=false;
     unlockBtn();
    }
   };
  }

  bindInspectorAndRecordActions();

  if($('geoExport')){
   $('geoExport').onclick=async()=>{
    if(busy)return;
    busy=true;
    const exportBtn=$('geoExport');
    const unlockBtn=ops?.lockButton?ops.lockButton(exportBtn,'Exporting GeoJSON…'):()=>{};
    const opId=ops?.start?ops.start({action:'exportGeoJSON',label:'Exporting GeoJSON plots',level:2,step:'Preparing GeoJSON download',caseId:m.case_id}):null;
    try{
     const data=await call('exportGeoJSON',m.case_id);
     if(disposed)return;
     const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/geo+json'})),a=document.createElement('a');
     a.href=url;
     a.download=(order?.so?order.so.toLowerCase()+'-':'')+'plots.geojson';
     a.click();
     setTimeout(()=>URL.revokeObjectURL(url),1000);
     ops?.succeed?.(opId,tr('GeoJSON exported.'));
     message('GeoJSON exported.');
    }catch(e){
     ops?.fail?.(opId,e);
     message((e.code?e.code+' · ':'')+e.message);
    }finally{
     busy=false;
     unlockBtn();
    }
   };
  }

  sources();
  tasks();
  window.EudrI18n?.translateUI($('drawerContent'));
 }

 return {
  open,
  close,
  parse,
  parseWithStats,
  candidate,
  checkGeometry,
  validatePlotRegistration,
  getSavedView:id=>lastViewByMaterial.get(id)||null,
  clearSavedViews:()=>lastViewByMaterial.clear()
 };
})();
