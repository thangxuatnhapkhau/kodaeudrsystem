"""Package the full checkout without dependencies, secrets, private raw snapshots or legacy nested ZIPs."""
from pathlib import Path
import argparse,hashlib,json,shutil,zipfile,re,base64
parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);parser.add_argument('--operational-reports');parser.add_argument('--commit',default='NOT_VERIFIED');args=parser.parse_args()
source=Path(__file__).resolve().parents[1];target=Path(args.output).resolve();target.mkdir(parents=True,exist_ok=True)
skip={'node_modules','.git','__pycache__','.pytest_cache'};excluded=[]
for file in source.rglob('*'):
 if not file.is_file():continue
 rel=file.relative_to(source)
 if any(part in skip for part in rel.parts)or file.suffix in ['.zip','.pyc','.log']or file.name.startswith('.env')and file.name!='.env.example':excluded.append(str(rel));continue
 dest=target/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(file,dest)
if args.operational_reports:
 reports=Path(args.operational_reports)
 for file in reports.iterdir():
  if file.is_file():shutil.copyfile(file,target/file.name)
 for a,b in [('release/supplier-identity/MIGRATION_DRY_RUN.json','MIGRATION_DRY_RUN.json'),('release/supplier-identity/MIGRATION_EXECUTION_LOG.json','MIGRATION_EXECUTION_LOG.json')]:shutil.copyfile(target/a,target/b)
patterns={'private_key':re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),'google_api_key':re.compile(rb'AIza[0-9A-Za-z_-]{35}'),'github_token':re.compile(rb'gh[pousr]_[A-Za-z0-9]{30,}'),'openai_key':re.compile(rb'sk-proj-[A-Za-z0-9_-]{35,}'),'oauth_token':re.compile(rb'ya29\.[A-Za-z0-9_-]{30,}')}
findings=[];reviewed_false_positives=[]
for file in target.rglob('*'):
 if not file.is_file():continue
 raw=file.read_bytes()
 for kind,pattern in patterns.items():
  matches=list(pattern.finditer(raw))
  if not matches:continue
  # Reviewed vendor artifact: random base64 bytes inside an embedded WASM module resemble an API-key prefix.
  digest=hashlib.sha256(raw).hexdigest();rel=file.relative_to(target).as_posix();wasm_false_positive=False
  if kind=='google_api_key'and rel=='public/vendor/ocr/core/tesseract-core-lstm.wasm.js'and digest=='2492f0874c750bbff64752aee3ee477c986bc2e405039fcf49c109372884f9e7':
   wasm_false_positive=True
   for match in matches:
    start=raw.rfind(b'"',0,match.start());end=raw.find(b'"',match.end());block=raw[start+1:end]
    if not re.fullmatch(rb'[A-Za-z0-9+/=]+',block)or base64.b64decode(block[:16])[:4]!=b'\x00asm':wasm_false_positive=False
  if wasm_false_positive:reviewed_false_positives.append({'file':rel,'sha256':digest,'reason':'Pattern occurs only inside quoted base64 with decoded WASM header; bytes match reviewed unchanged baseline vendor artifact.'})
  else:findings.append({'file':rel,'pattern':kind})
scan={'status':'PASS'if not findings else'REVIEW_REQUIRED','patterns_checked':list(patterns),'findings':findings,'reviewed_false_positives':reviewed_false_positives,'scope':'Literal credential patterns plus environment/raw-snapshot exclusion; not a guarantee against every possible secret format.'}
(target/'release/supplier-identity/SECRET_SCAN.json').write_text(json.dumps(scan,indent=2),encoding='utf8')
if findings:raise SystemExit('Credential-pattern findings require review; package not zipped. Values are intentionally not printed.')
manifest=[]
for file in sorted(target.rglob('*')):
 if file.is_file()and file.relative_to(target).as_posix() not in ['FILE_MANIFEST.json','SHA256SUMS.txt']:
  manifest.append({'path':file.relative_to(target).as_posix(),'size':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
meta={'release':'SI-1.0.0-RC','status':'NOT_READY_FOR_PRODUCTION','baseline_commit':'04418c465713769cac77d8ab6b9668fa02d4289b','release_commit':args.commit,'files':manifest,'excluded_checkout_paths':excluded,'manifest_hash_policy':'Manifest excludes itself and SHA256SUMS to avoid circular hashes. SHA256SUMS additionally covers FILE_MANIFEST.json.'}
(target/'FILE_MANIFEST.json').write_text(json.dumps(meta,indent=2),encoding='utf8');hashes=manifest+[{'path':'FILE_MANIFEST.json','sha256':hashlib.sha256((target/'FILE_MANIFEST.json').read_bytes()).hexdigest()}]
(target/'SHA256SUMS.txt').write_text('\n'.join(x['sha256']+'  '+x['path']for x in hashes)+'\n',encoding='utf8')
archive=target.with_suffix('.zip')
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 for file in sorted(target.rglob('*')):
  if file.is_file():z.write(file,Path(target.name)/file.relative_to(target))
with zipfile.ZipFile(archive)as z:
 assert z.testzip()is None
 assert all('/node_modules/'not in n and'/.git/'not in n for n in z.namelist())
print(json.dumps({'archive':str(archive),'files':len(manifest)+2,'zip_bytes':archive.stat().st_size,'zip_sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'secret_scan':scan['status']}))
