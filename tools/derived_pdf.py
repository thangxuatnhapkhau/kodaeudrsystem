"""Offline derived-document worker for the existing manual AI workflow.
Never executes document instructions. No network, auto-approval or original writes.
Input manifest maps explicitly selected regions / human-supplied English text.
"""
from __future__ import annotations
import argparse, hashlib, io, json, math, pathlib, subprocess, tempfile
import fitz
from PIL import Image, ImageDraw
LIMIT=3_000_000
class Blocked(ValueError): pass
def sha(data): return hashlib.sha256(data).hexdigest()
def create(source, destination, manifest, mode):
    source=pathlib.Path(source); destination=pathlib.Path(destination)
    if source.resolve()==destination.resolve(): raise Blocked('ORIGINAL_OVERWRITE_BLOCKED')
    original=source.read_bytes(); doc=fitz.open(stream=original,filetype='pdf')
    if doc.needs_pass: raise Blocked('ENCRYPTED_SOURCE_BLOCKED')
    if not manifest.get('source_document_id'): raise Blocked('SOURCE_ID_REQUIRED')
    pages=manifest.get('pages')
    if not isinstance(pages,list) or len(pages)!=len(doc): raise Blocked('PAGE_MAPPING_REQUIRED')
    if len(doc)>100: raise Blocked('DOCUMENT_TOO_LARGE')
    output=fitz.open(); ocr_text=[]; regions=0
    for index,(page,item) in enumerate(zip(doc,pages)):
        if item.get('page')!=index+1: raise Blocked('PAGE_MAPPING_REQUIRED')
        # Raster reconstruction means hidden text, JS, metadata, attachments,
        # forms and old objects cannot be copied into the output PDF.
        pix=page.get_pixmap(matrix=fitz.Matrix(2,2),alpha=False)
        if pix.width*pix.height>40_000_000: raise Blocked('PAGE_TOO_LARGE')
        image=Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
        boxes=item.get('price_boxes',[])
        if mode=='redact':
            if not isinstance(boxes,list): raise Blocked('REGION_MAPPING_REQUIRED')
            draw=ImageDraw.Draw(image)
            for box in boxes:
                if not isinstance(box,list) or len(box)!=4 or any(not isinstance(v,(int,float)) or not math.isfinite(v) for v in box): raise Blocked('INVALID_REDACTION_REGION')
                x0,y0,x1,y1=box
                if not (0<=x0<x1<=page.rect.width and 0<=y0<y1<=page.rect.height): raise Blocked('INVALID_REDACTION_REGION')
                draw.rectangle((math.floor(x0*2),math.floor(y0*2),math.ceil(x1*2),math.ceil(y1*2)),fill='black');regions+=1
        encoded=io.BytesIO();image.save(encoded,format='PNG',optimize=True)
        if mode=='redact':
            with tempfile.TemporaryDirectory() as temp:
                png=pathlib.Path(temp)/'page.png';png.write_bytes(encoded.getvalue())
                try: result=subprocess.run(['tesseract',str(png),'stdout','--psm','11'],capture_output=True,check=True,timeout=60)
                except (FileNotFoundError,subprocess.SubprocessError): raise Blocked('OCR_VALIDATION_UNAVAILABLE')
                ocr_text.append(result.stdout.decode(errors='replace'))
            target=output.new_page(width=page.rect.width,height=page.rect.height)
        else:
            text=item.get('english','')
            if not isinstance(text,str) or not text.strip(): raise Blocked('TRANSLATION_REQUIRED')
            # English is an explicit supplied translation, never fabricated here.
            panel=240
            target=output.new_page(width=page.rect.width,height=page.rect.height+panel)
            target.draw_rect(fitz.Rect(0,page.rect.height,page.rect.width,target.rect.height),fill=(0.94,0.97,0.95),color=None)
            heading='Translation aid - original document remains authoritative. Source page '+str(index+1)
            remaining=target.insert_textbox(fitz.Rect(20,page.rect.height+15,page.rect.width-20,target.rect.height-15),heading+'\n\n'+text,fontsize=10,fontname='helv')
            if remaining<0: raise Blocked('TRANSLATION_LAYOUT_BLOCKED')
        target.insert_image(fitz.Rect(0,0,page.rect.width,page.rect.height),stream=encoded.getvalue())
    if mode=='redact' and not regions: raise Blocked('REDACTION_REGIONS_REQUIRED')
    data=output.tobytes(garbage=4,deflate=True)
    if len(data)>=LIMIT: raise Blocked('OUTPUT_SIZE_BLOCKED')
    check=fitz.open(stream=data,filetype='pdf');extracted='\n'.join(p.get_text() for p in check)
    if len(check)!=len(doc) or check.embfile_count() or any(list(p.annots() or []) or list(p.widgets() or []) for p in check): raise Blocked('OUTPUT_VALIDATION_FAILED')
    if mode=='redact':
        if extracted.strip(): raise Blocked('HIDDEN_TEXT_BLOCKED')
        amounts=manifest.get('original_amounts')
        if not isinstance(amounts,list) or not amounts or any(not isinstance(v,str) or not v.strip() for v in amounts): raise Blocked('ORIGINAL_AMOUNTS_REQUIRED')
        normalized=lambda x: ''.join(x.split()).casefold()
        visible=normalized('\n'.join(ocr_text))
        if any(normalized(value) in visible for value in amounts): raise Blocked('REDACTION_NOT_VERIFIED')
    if sha(source.read_bytes())!=sha(original): raise Blocked('SOURCE_CHANGED')
    report={'source_document_id':manifest['source_document_id'],'source_sha256':sha(original),'sha256':sha(data),'file_size_bytes':len(data),'page_count':len(check),'original_page_count':len(doc),'mode':mode,'readability_checked':manifest.get('human_layout_reviewed') is True,'traceability_preserved':manifest.get('human_traceability_reviewed') is True,'human_verification':'REQUIRED','text_checked':True,'annotations_checked':True,'forms_checked':True,'metadata_checked':True,'pixels_sanitized':mode=='redact','embedded_objects_removed':True,'ocr_checked':mode=='redact','note':'OCR checks listed monetary values only; human review must confirm all monetary regions and non-price content.'}
    destination.parent.mkdir(parents=True,exist_ok=True);destination.write_bytes(data)
    destination.with_suffix('.validation.json').write_text(json.dumps(report,indent=2))
    return report
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('mode',choices=['redact','subtitle']);p.add_argument('source');p.add_argument('destination');p.add_argument('manifest');args=p.parse_args()
    try:
        report=create(args.source,args.destination,json.loads(pathlib.Path(args.manifest).read_text()),args.mode)
        print(json.dumps({'status':'HUMAN_VERIFICATION_REQUIRED','file_size_bytes':report['file_size_bytes']}))
    except Blocked as error: print(json.dumps({'status':str(error)}));raise SystemExit(2)
