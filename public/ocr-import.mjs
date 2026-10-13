export const HEADERS=['Order No','S/No','SKU (PO#)','Product','Quantity','UOM','Material','Material Category','Scientific Name','Source Reference'];
export async function script(src,globalName){if(globalThis[globalName])return globalThis[globalName];await new Promise((resolve,reject)=>{const tag=document.createElement('script');tag.src=src;tag.onload=resolve;tag.onerror=()=>reject(Error('Không tải được công cụ xử lý file.'));document.head.append(tag);});return globalThis[globalName];}
const abort=signal=>{if(signal?.aborted)throw new DOMException('Đã dừng xử lý','AbortError');};
export function textLines(items){const rows=[];for(const item of items.filter(i=>i.str)){const y=item.transform[5],row=rows.find(r=>Math.abs(r.y-y)<2);if(row)row.items.push(item);else rows.push({y,items:[item]});}return rows.sort((a,b)=>b.y-a.y).map(r=>r.items.sort((a,b)=>a.transform[4]-b.transform[4]).map(i=>i.str).join(' ')).join('\n');}
export async function readPDF(file,{signal,progress=()=>{},maxPages=300,maxChars=700000,forceOCR=false,loadPDF=()=>import('/vendor/pdfjs/pdf.min.mjs'),createOCR}={}){
 await globalThis.EudrDossier.validatePdf(file);const sha256=await globalThis.EudrDossier.hash(file);abort(signal);
 const pdfjs=await loadPDF();abort(signal);pdfjs.GlobalWorkerOptions.workerSrc='/vendor/pdfjs/pdf.worker.min.mjs';
 const loading=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),disableFontFace:true,useSystemFonts:false,cMapUrl:'/vendor/pdfjs/cmaps/',cMapPacked:true,standardFontDataUrl:'/vendor/pdfjs/standard_fonts/',isEvalSupported:false});
 let worker=null,chars=0,destroyPromise=null,terminatePromise=null;const pages=[];
 // PDF.js 6 exposes destroy() on the loading task, not on PDFDocumentProxy.
 const destroyPDF=()=>destroyPromise??=Promise.resolve().then(()=>loading.destroy()).catch(()=>{});
 const terminateOCR=()=>worker?(terminatePromise??=Promise.resolve().then(()=>worker.terminate()).catch(()=>{})):Promise.resolve();
 const stop=()=>{void terminateOCR();void destroyPDF();};signal?.addEventListener('abort',stop,{once:true});
 try{
  abort(signal);const pdf=await loading.promise;abort(signal);
  if(pdf.numPages>maxPages)throw Error(`PDF có ${pdf.numPages} trang; giới hạn xử lý là ${maxPages}. Tách thành bộ nhỏ hơn.`);
  for(let n=1;n<=pdf.numPages;n++){
   abort(signal);progress({page:n,total:pdf.numPages,stage:'Đọc text'});
   const page=await pdf.getPage(n),content=await page.getTextContent();let text=textLines(content.items),method='TEXT',confidence=100;
   if(forceOCR||text.replace(/\s/g,'').length<30){
    if(!worker){if(createOCR)worker=await createOCR();else{const tess=await script('/vendor/ocr/tesseract.min.js','Tesseract');worker=await tess.createWorker('eng+vie',1,{workerPath:'/vendor/ocr/worker.min.js',corePath:'/vendor/ocr/core',langPath:'/vendor/ocr/lang',workerBlobURL:false,logger:m=>progress({page:n,total:pdf.numPages,stage:'OCR · '+m.status,progress:m.progress})});}}
    abort(signal);const base=page.getViewport({scale:1}),scale=Math.min(2,3000/Math.max(base.width,base.height)),viewport=page.getViewport({scale}),canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
    try{await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;const result=await worker.recognize(canvas);text=result.data.text||'';confidence=Number(result.data.confidence)||0;method=text.trim()?confidence<65?'OCR_LOW':'OCR':'UNREADABLE';}
    finally{canvas.width=canvas.height=0;}
   }
   abort(signal);if(text.length>60000)throw Error('Một trang vượt giới hạn text. Tách PDF để xử lý.');chars+=text.length;if(chars>maxChars)throw Error('Nội dung vượt giới hạn xử lý. Tách bộ PDF thành phần nhỏ hơn.');pages.push({page:n,text,method,confidence});page.cleanup?.();
  }
  return {sha256,page_count:pdf.numPages,pages};
 }finally{signal?.removeEventListener('abort',stop);await Promise.all([terminateOCR(),destroyPDF()]);}
}
export function category(name){
 const value=String(name||'').normalize('NFKC').replace(/\bS0LID\b/gi,'SOLID');
 const species=/\b(?:OAK|WALNUT|ASH|BEECH|ACACIA|RUBBER[\s-]*WOOD)\b|GỖ/i.test(value);
 const laminatedVeneerLumber=/LAMINATED\s+VENEER\s+LUMBER/i.test(value);
 const engineered={MDF:/\bMDF\b/i.test(value),PLYWOOD:/\bPLY[\s-]*WOOD\b/i.test(value),LVL:/\bLVL\b/i.test(value)||laminatedVeneerLumber,VENEER:/\bVENEER\b/i.test(value)&&!laminatedVeneerLumber};
 const solid=/\bSOLID\b|GỖ\s*(?:TỰ NHIÊN|ĐẶC)/i.test(value)&&species;
 const nonwood=/\b(?:METAL|FABRIC|LEATHER|FELT|FOAM|STEEL|ALUMINI?UM|PLASTIC|GLASS)\b|VẢI|KIM LOẠI/i.test(value);
 const wood=species||solid||Object.values(engineered).some(Boolean)||/\b(?:WOOD|TIMBER)\b/i.test(value);
 if(wood&&nonwood)return 'UNKNOWN';
 const types=Object.entries(engineered).filter(([,present])=>present).map(([type])=>type);
 if(solid)types.push('SOLID_WOOD');
 if(types.length>1)return 'UNKNOWN';
 if(types.length)return types[0];
 if(nonwood)return 'NON_WOOD';
 return wood?'OTHER_WOOD':'UNKNOWN';
}
export function parseLocalKoda(packet,orderNo){
 const identified=[...new Set(packet.pages.flatMap(p=>p.text.match(/\bSO\d{2}-\d+\b/gi)||[]).map(x=>x.toUpperCase()))];
 if(identified.length&&(!identified.includes(orderNo.toUpperCase())||identified.length>1))throw Error('Order No. trong PDF không khớp hoặc có nhiều Order. Kiểm tra lại file.');
 const lines=packet.pages.flatMap(p=>p.text.split(/\r?\n/).map(text=>({text:text.trim(),page:p.page}))).filter(x=>x.text);
 const starts=lines.map((x,i)=>/^\d+\.\s+\S/.test(x.text)?i:-1).filter(i=>i>=0),products=[];
 for(let i=0;i<starts.length;i++){
  const block=lines.slice(starts[i],starts[i+1]??lines.length),lineNo=block[0].text.match(/^\d+/)[0];
  const poLines=block.filter(x=>/^PO\s*#\s*[:：]?\s*[A-Za-z0-9]/i.test(x.text));
  if(!poLines.length)throw Error(`S/No ${lineNo}: thiếu PO# trong block. Dùng AI hoặc sửa preview.`);
  const first=block[0].text.replace(/^\d+\.\s*/,'').trim(),explicitSku=first.match(/^([A-Za-z0-9][A-Za-z0-9._/-]*)\b/);
  const allocations=poLines.map(x=>{
   const m=x.text.match(/^PO\s*#\s*[:：]?\s*([A-Za-z0-9][A-Za-z0-9._/-]*)\s*-\s*(.*?)\s*-\s*QTY\s*[:：]?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(Pcs?|Pieces?|Each|EA|Sets?)\b/i);
   if(!m){if(poLines.length>1||/\bQTY\b/i.test(x.text))throw Error(`S/No ${lineNo}: không đọc được PO# và quantity phân bổ. Kiểm tra PDF.`);return null;}
   return {po_no:m[1],destination:m[2].trim(),quantity:Number(m[3].replaceAll(',','')),quantity_uom:m[4],source_reference:`PDF page ${x.page}, S/No ${lineNo}`};
  }).filter(Boolean);
  if(poLines.length>1&&!explicitSku)throw Error(`S/No ${lineNo}: nhiều PO# nhưng thiếu mã product/SKU ở đầu block.`);
  const sku=allocations.length?explicitSku?.[1]:poLines[0].text.match(/^PO\s*#\s*[:：]?\s*([A-Za-z0-9][A-Za-z0-9._/-]*)/i)?.[1];
  const qty=block[0].text.match(/(?:^|\s)(\d+(?:,\d{3})*(?:\.\d+)?)\s+(Each|EA|Pcs?|Pieces?|Sets?)\b/i)||block.slice(1).map(x=>x.text.match(/(?:^|\s)(\d+(?:,\d{3})*(?:\.\d+)?)\s+(Each|EA|Pcs?|Pieces?|Sets?)\b/i)).find(Boolean);
  if(!qty)throw Error(`S/No ${lineNo}: không xác định được quantity theo block.`);
  const name=(block[1]?.text||'').replace(/\s+\d+(?:,\d{3})*(?:\.\d+)?\s+(Each|EA|Pcs?|Pieces?|Sets?)\b.*$/i,'').trim();
  if(!name)throw Error(`S/No ${lineNo}: thiếu tên product.`);
  const materials=block.slice(2).filter(x=>/\b(?:SOLID|S0LID|VENEER|MDF|PLYWOOD|PLY-WOOD|LVL|WOOD|TIMBER|METAL|FABRIC|LEATHER|FELT|FOAM|STEEL)\b/i.test(x.text)&&!/^REMARK|^CUSTOMER|^SHIP|^TOTAL|^CONCEPT|^EAN|^PO\s*#/i.test(x.text)).flatMap(x=>{
   const parts=x.text.split(/,\s*/).map(s=>s.trim()).filter(Boolean),names=parts.length>1&&parts.every(s=>category(s)!=='UNKNOWN')?parts:[x.text];
   return names.map(name=>({name:name.slice(0,150),category:category(name),scientific_name:'',source_reference:`PDF page ${x.page}, S/No ${lineNo}`}));
  });
  products.push({line_no:lineNo,sku,product_name:name,quantity:Number(qty[1].replaceAll(',','')),quantity_uom:qty[2],customer_po_allocations:allocations,source_reference:`PDF page ${block[0].page}, S/No ${lineNo}`,materials:[...new Map(materials.map(m=>[m.name,m])).values()]});
 }
 if(!products.length)throw Error('Chưa nhận dạng được layout S/No của KODA. Chọn trích xuất AI hoặc dùng Excel template.');
 return {order_no:orderNo,products};
}
export function validateXlsxZip(buffer){const v=new DataView(buffer);let end=-1;for(let i=v.byteLength-22;i>=Math.max(0,v.byteLength-65557);i--)if(v.getUint32(i,true)===0x06054b50){end=i;break;}if(end<0)throw Error('Không phải XLSX hợp lệ.');const count=v.getUint16(end+10,true),start=v.getUint32(end+16,true);if(count>2000)throw Error('Workbook quá lớn.');let offset=start,total=0;for(let i=0;i<count;i++){if(offset+46>v.byteLength||v.getUint32(offset,true)!==0x02014b50)throw Error('ZIP workbook không hợp lệ.');if(v.getUint16(offset+8,true)&1)throw Error('Workbook mã hóa không được hỗ trợ.');total+=v.getUint32(offset+24,true);if(total>100000000)throw Error('Workbook vượt giới hạn giải nén.');offset+=46+v.getUint16(offset+28,true)+v.getUint16(offset+30,true)+v.getUint16(offset+32,true);}return true;}
function cellString(cell){if(cell.type===6||cell.value&&typeof cell.value==='object'&&('formula' in cell.value||'sharedFormula' in cell.value))throw Error('Template import chỉ nhận giá trị, không nhận công thức.');if(cell.value===null||cell.value===undefined)return '';if(typeof cell.value==='string')return cell.value.trim();if(typeof cell.value==='number'){const format=String(cell.numFmt||'');return /^0+$/.test(format)?String(cell.value).padStart(format.length,'0'):String(cell.value);}if(cell.value.richText)return cell.value.richText.map(x=>x.text).join('').trim();throw Error('Ô Excel chứa kiểu dữ liệu không được hỗ trợ.');}
export async function readExcel(file,orderNo,{ExcelJS}={}){if(!file||!/\.xlsx$/i.test(file.name)||file.size>10000000)throw Error('Chọn template .xlsx tối đa 10 MB.');const bytes=await file.arrayBuffer();validateXlsxZip(bytes);const lib=ExcelJS||await script('/vendor/exceljs.min.js','ExcelJS'),book=new lib.Workbook();await book.xlsx.load(bytes);const sheet=book.getWorksheet('Order_Import');if(!sheet||sheet.rowCount>1001||sheet.columnCount>HEADERS.length)throw Error('Cần sheet Order_Import, tối đa 1.000 dòng và đúng các cột template.');const headers=HEADERS.map((_,i)=>cellString(sheet.getCell(1,i+1)));if(headers.some((h,i)=>h!==HEADERS[i]))throw Error('Tên/thứ tự cột khác template.');const products=new Map();for(let row=2;row<=sheet.rowCount;row++){const cells=HEADERS.map((_,i)=>cellString(sheet.getCell(row,i+1)));if(cells.every(x=>!x))continue;if(sheet.getRow(row).hidden)throw Error(`Dòng ${row} bị ẩn. Bỏ ẩn trước khi import.`);const [so,line,sku,name,quantity,uom,material,cat,scientific,ref]=cells;if(so!==orderNo)throw Error(`Dòng ${row}: Order No. không khớp.`);if(!line||!sku||!name||!quantity||!uom||!material||!ref)throw Error(`Dòng ${row}: thiếu trường bắt buộc.`);const qty=Number(quantity);if(!Number.isFinite(qty)||qty<=0)throw Error(`Dòng ${row}: quantity phải là số dương.`);const key=line+'|'+sku,existing=products.get(key);if(existing&&(existing.product_name!==name||existing.quantity!==qty||existing.quantity_uom!==uom))throw Error(`Dòng ${row}: thông tin product bị mâu thuẫn.`);const p=existing||{line_no:line,sku,product_name:name,quantity:qty,quantity_uom:uom,source_reference:`${file.name} · Order_Import row ${row}`,materials:[]};if(p.materials.some(m=>m.name.toLowerCase()===material.toLowerCase()))throw Error(`Dòng ${row}: vật liệu bị lặp.`);p.materials.push({name:material,category:cat||'UNKNOWN',scientific_name:scientific,source_reference:ref});products.set(key,p);}if(!products.size||products.size>100)throw Error('Template phải có 1–100 product blocks.');return {order_no:orderNo,products:[...products.values()]};}
