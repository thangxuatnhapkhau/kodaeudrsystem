// Self-hosted PDF.js canvas preview. No browser PDF plugin, srcdoc, or inline CSS/JS.
export async function renderPdfPreview(host,data,{signal,initialPage=1,onPageChange=null,loadLibrary=()=>import('/vendor/pdfjs/pdf.min.mjs')}={}){
 if(signal?.aborted)return ()=>{};
 const pdfjs=await loadLibrary();
 if(signal?.aborted)return ()=>{};
 pdfjs.GlobalWorkerOptions.workerSrc='/vendor/pdfjs/pdf.worker.min.mjs';
 const loading=pdfjs.getDocument({
  data:new Uint8Array(data),disableFontFace:true,useSystemFonts:false,
  cMapUrl:'/vendor/pdfjs/cmaps/',cMapPacked:true,
  standardFontDataUrl:'/vendor/pdfjs/standard_fonts/',wasmUrl:'/vendor/pdfjs/wasm/'
 });
 let documentProxy=null,renderTask=null,destroyed=false,serial=0,currentPage=1,zoomFactor=1;
 const cleanup=()=>{if(destroyed)return;destroyed=true;serial++;renderTask?.cancel();signal?.removeEventListener('abort',cleanup);Promise.resolve(loading.destroy()).catch(()=>{});};
 signal?.addEventListener('abort',cleanup,{once:true});
 try{
  documentProxy=await loading.promise;
  if(destroyed)return cleanup;
  if(!documentProxy.numPages)throw Error('PDF_PREVIEW_UNAVAILABLE');
  const toolbar=document.createElement('div');toolbar.className='pdf-preview-toolbar';
  const previous=document.createElement('button'),next=document.createElement('button'),pageLabel=document.createElement('span');
  const zoomOut=document.createElement('button'),zoomReset=document.createElement('button'),zoomIn=document.createElement('button');
  previous.type=next.type=zoomOut.type=zoomReset.type=zoomIn.type='button';
  previous.textContent='←';previous.setAttribute('aria-label','Previous PDF page');
  next.textContent='→';next.setAttribute('aria-label','Next PDF page');
  zoomOut.textContent='−';zoomOut.setAttribute('aria-label','Zoom out PDF');
  zoomReset.textContent='100%';zoomReset.setAttribute('aria-label','Reset PDF zoom');
  zoomIn.textContent='+';zoomIn.setAttribute('aria-label','Zoom in PDF');
  pageLabel.setAttribute('role','status');pageLabel.setAttribute('aria-live','polite');
  toolbar.append(previous,pageLabel,next,zoomOut,zoomReset,zoomIn);
  const canvas=document.createElement('canvas');canvas.className='pdf-preview-page';canvas.setAttribute('aria-label','PDF page preview');
  host.replaceChildren(toolbar,canvas);
  const showError=()=>{if(!destroyed)pageLabel.textContent='Preview unavailable. Use Download to inspect the original PDF.';};
  async function show(pageNumber){
   if(destroyed)return;
   const turn=++serial;renderTask?.cancel();renderTask=null;
   currentPage=Math.max(1,Math.min(documentProxy.numPages,pageNumber));
   onPageChange?.(currentPage);
   previous.disabled=currentPage<=1;next.disabled=currentPage>=documentProxy.numPages;
   zoomOut.disabled=zoomFactor<=0.5;zoomIn.disabled=zoomFactor>=2.5;
   zoomReset.textContent=`${Math.round(zoomFactor*100)}%`;
   pageLabel.textContent=`Loading page ${currentPage} / ${documentProxy.numPages}`;
   const page=await documentProxy.getPage(currentPage);if(destroyed||turn!==serial)return;
   const base=page.getViewport({scale:1}),available=Math.max(300,(host.clientWidth||800)-24),fitScale=Math.min(2,available/base.width),scale=Math.max(0.4,Math.min(3.5,fitScale*zoomFactor)),viewport=page.getViewport({scale});
   const pixelRatio=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.ceil(viewport.width*pixelRatio);canvas.height=Math.ceil(viewport.height*pixelRatio);
   const context=canvas.getContext('2d',{alpha:false});if(!context)throw Error('PDF_PREVIEW_UNAVAILABLE');
   renderTask=page.render({canvas,canvasContext:context,viewport,transform:pixelRatio===1?null:[pixelRatio,0,0,pixelRatio,0,0]});
   try{await renderTask.promise;if(!destroyed&&turn===serial)pageLabel.textContent=`Page ${currentPage} / ${documentProxy.numPages}`;}
   catch(error){if(!destroyed&&turn===serial)throw error;}
   finally{if(turn===serial)renderTask=null;page.cleanup?.();}
  }
  previous.onclick=()=>show(currentPage-1).catch(showError);
  next.onclick=()=>show(currentPage+1).catch(showError);
  zoomOut.onclick=()=>{zoomFactor=Math.max(0.5,Math.round((zoomFactor-0.25)*100)/100);show(currentPage).catch(showError);};
  zoomReset.onclick=()=>{zoomFactor=1;show(currentPage).catch(showError);};
  zoomIn.onclick=()=>{zoomFactor=Math.min(2.5,Math.round((zoomFactor+0.25)*100)/100);show(currentPage).catch(showError);};
  await show(initialPage);
  return cleanup;
 }catch(error){cleanup();if(signal?.aborted)return cleanup;throw error;}
}
