import unittest, tempfile, pathlib, sys, hashlib
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'tools'))
import derived_pdf as worker
import fitz
from PIL import Image
class DerivedPDFTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.root=pathlib.Path(self.temp.name);self.source=self.root/'source.pdf'
  doc=fitz.open();p=doc.new_page(width=595,height=842)
  p.insert_text((40,50),'KODA - SYNTHETIC VALIDATION FIXTURE',fontsize=16)
  p.insert_text((40,95),'Invoice TEST-001 | PO TEST-002 | Quantity: 25 pcs',fontsize=12)
  p.insert_text((40,140),'Unit Price: USD 987.65',fontsize=12)
  self.box=list(p.search_for('987.65')[0]+(-2,-2,2,2))
  doc.set_metadata({'subject':'USD 987.65'});doc.embfile_add('price.txt',b'987.65');doc.save(self.source)
  self.original=self.source.read_bytes()
 def tearDown(self):self.temp.cleanup()
 def manifest(self):return {'source_document_id':'synthetic-doc','original_amounts':['987.65'],'human_layout_reviewed':False,'human_traceability_reviewed':False,'pages':[{'page':1,'price_boxes':[self.box]}]}
 def test_text_redaction_removes_hidden_content_and_preserves_original(self):
  out=self.root/'redacted.pdf';r=worker.create(self.source,out,self.manifest(),'redact');d=fitz.open(out)
  self.assertEqual(d.embfile_count(),0);self.assertEqual(d[0].get_text(),'');self.assertNotIn('987.65',str(d.metadata));self.assertEqual(self.source.read_bytes(),self.original);self.assertLess(out.stat().st_size,3000000);self.assertEqual(r['human_verification'],'REQUIRED');self.assertFalse(r['readability_checked'])
 def test_scanned_price_is_removed_from_pixels(self):
  original=fitz.open(self.source);png=original[0].get_pixmap().tobytes('png');scan=fitz.open();p=scan.new_page(width=595,height=842);p.insert_image(p.rect,stream=png);scan.save(self.root/'scan.pdf');r=worker.create(self.root/'scan.pdf',self.root/'scan-redacted.pdf',self.manifest(),'redact');self.assertTrue(r['pixels_sanitized'])
 def test_uncovered_price_blocks(self):
  m=self.manifest();m['pages'][0]['price_boxes']=[[1,1,10,10]]
  with self.assertRaisesRegex(worker.Blocked,'REDACTION_NOT_VERIFIED'):worker.create(self.source,self.root/'bad.pdf',m,'redact')
 def test_subtitle_preserves_page_count_and_original(self):
  m=self.manifest();m['pages'][0]['english']='Supplier invoice TEST-001. Quantity: 25 pcs. Unit price: USD 987.65. [Translation verification required]';out=self.root/'subtitle.pdf';r=worker.create(self.source,out,m,'subtitle');d=fitz.open(out);self.assertEqual(len(d),1);self.assertIn('original document remains authoritative',d[0].get_text());self.assertIn('987.65',d[0].get_text());self.assertEqual(self.source.read_bytes(),self.original);self.assertEqual(r['human_verification'],'REQUIRED')
 def test_impossible_size_target_blocks_and_no_file_written(self):
  old=worker.LIMIT;worker.LIMIT=20
  try:
   with self.assertRaisesRegex(worker.Blocked,'OUTPUT_SIZE_BLOCKED'):worker.create(self.source,self.root/'tiny.pdf',self.manifest(),'redact')
   self.assertFalse((self.root/'tiny.pdf').exists())
  finally:worker.LIMIT=old
 def test_overwrite_source_blocked(self):
  with self.assertRaisesRegex(worker.Blocked,'ORIGINAL_OVERWRITE_BLOCKED'):worker.create(self.source,self.source,self.manifest(),'redact')
 def test_long_subtitle_blocks_instead_of_clipping(self):
  m=self.manifest();m['pages'][0]['english']='Translation ' * 10000
  with self.assertRaisesRegex(worker.Blocked,'TRANSLATION_LAYOUT_BLOCKED'):worker.create(self.source,self.root/'long.pdf',m,'subtitle')
if __name__=='__main__':unittest.main()
