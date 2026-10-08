// Self-hosted PDF.js canvas preview. No browser PDF plugin, srcdoc, or inline CSS/JS.
export async function renderPdfPreview(host,data,{signal,loadLibrary=()=>import('/vendor/pdfjs/pdf.min.mjs')}={}){
 if(signal?.aborted)return ()=>{};
 const pdfjs=await loadLibrary();
 if(signal?.aborted)return ()=>{};
 pdfjs.GlobalWorkerOptions.workerSrc='/vendor/pdfjs/pdf.worker.min.mjs';
 const loading=pdfjs.getDocument({
  data:new Uint8Array(data),disableFontFace:true,useSystemFonts:false,
  cMapUrl:'/vendor/pdfjs/cmaps/',cMapPacked:true,
  standardFontDataUrl:'/vendor/pdfjs/standard_fonts/',wasmUrl:'/vendor/pdfjs/wasm/'
 });
 let documentProxy=null,renderTask=null,destroyed=false,serial=0,currentPage=1;
 const cleanup=()=>{if(destroyed)return;destroyed=true;serial++;renderTask?.cancel();signal?.removeEventListener('abort',cleanup);Promise.resolve(loading.destroy()).catch(()=>{});};
 signal?.addEventListener('abort',cleanup,{once:true});
 try{
  documentProxy=await loading.promise;
  if(destroyed)return cleanup;
  if(!documentProxy.numPages)throw Error('PDF_PREVIEW_UNAVAILABLE');
  const toolbar=document.createElement('div');toolbar.className='pdf-preview-toolbar';
  const previous=document.createElement('button'),next=document.createElement('button'),pageLabel=document.createElement('span');
  previous.type=next.type='button';previous.textContent='←';previous.setAttribute('aria-label','Previous PDF page');
  next.textContent='→';next.setAttribute('aria-label','Next PDF page');
  pageLabel.setAttribute('role','status');pageLabel.setAttribute('aria-live','polite');
  toolbar.append(previous,pageLabel,next);
  const canvas=document.createElement('canvas');canvas.className='pdf-preview-page';canvas.setAttribute('aria-label','PDF page preview');
  host.replaceChildren(toolbar,canvas);
  const showError=()=>{if(!destroyed)pageLabel.textContent='Preview unavailable. Use Download to inspect the original PDF.';};
  async function show(pageNumber){
   if(destroyed)return;
   const turn=++serial;renderTask?.cancel();renderTask=null;
   currentPage=Math.max(1,Math.min(documentProxy.numPages,pageNumber));
   previous.disabled=currentPage<=1;next.disabled=currentPage>=documentProxy.numPages;
   pageLabel.textContent=`Loading page ${currentPage} / ${documentProxy.numPages}`;
   const page=await documentProxy.getPage(currentPage);if(destroyed||turn!==serial)return;
   const base=page.getViewport({scale:1}),available=Math.max(300,(host.clientWidth||800)-24),scale=Math.min(2,available/base.width),viewport=page.getViewport({scale});
   const pixelRatio=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.ceil(viewport.width*pixelRatio);canvas.height=Math.ceil(viewport.height*pixelRatio);
   const context=canvas.getContext('2d',{alpha:false});if(!context)throw Error('PDF_PREVIEW_UNAVAILABLE');
   renderTask=page.render({canvas,canvasContext:context,viewport,transform:pixelRatio===1?null:[pixelRatio,0,0,pixelRatio,0,0]});
   try{await renderTask.promise;if(!destroyed&&turn===serial)pageLabel.textContent=`Page ${currentPage} / ${documentProxy.numPages}`;}
   catch(error){if(!destroyed&&turn===serial)throw error;}
   finally{if(turn===serial)renderTask=null;page.cleanup?.();}
  }
  previous.onclick=()=>show(currentPage-1).catch(showError);
  next.onclick=()=>show(currentPage+1).catch(showError);
  await show(1);
  return cleanup;
 }catch(error){cleanup();if(signal?.aborted)return cleanup;throw error;}
}
