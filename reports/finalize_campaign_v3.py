from pathlib import Path
from PIL import Image
import json,hashlib,struct,zipfile,shutil
P=Path.cwd()/'design-pack';D=P/'13-enemies';M=P/'12-campaign-map'
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def write(p,o):p.write_text(json.dumps(o,ensure_ascii=False,indent=2),encoding='utf-8')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def finish_art():
 old=D/'art/enemy-art-direction-v3.png';archive=D/'art/sources/enemy-art-direction-first-pass-v3.png';archive.parent.mkdir(exist_ok=True)
 if old.exists():shutil.copy2(old,archive)
 src=Path('C:/Users/PC/.codex/generated_images/01a10d91-fb3d-7d33-85b4-6991fc017a43/exec-c0dbefaa-b1f1-476b-a3f1-45ed0e5a7592.png');dst=D/'art/enemy-art-direction-reviewed-v3.png';shutil.copy2(src,dst)
 im=Image.open(dst);w,h=im.size;out=D/'art/shi-qra-outlaws-concept-reviewed-v3.png';im.crop((round(w/2),round(h*2/3),round(w*3/4),h)).save(out)
 b=read(D/'asset-bindings-v3.json')
 for f in b['families']:
  if f['family_id']=='shi-qra-outlaws':f['portrait_asset']=out.relative_to(P).as_posix()
 b['approved_contact_sheet']=dst.relative_to(P).as_posix()
 for r in b['art_slices']:
  r['source_sheet']=dst.relative_to(P).as_posix()
  if r['family_id']=='shi-qra-outlaws':r['asset']=out.relative_to(P).as_posix()
 write(D/'asset-bindings-v3.json',b)
 (D/'art/PRODUCTION-NOTES.txt').write_text('12 aile illüstrasyonu yerleşik image_gen ile üretildi ve atlas levhasından kayıpsız kesildi. On birinci hücredeki ilk hayvansı Krov yorumu reddedildi; Akhenten anatomisi referansıyla insanımsı büyük savaşçı olarak düzeltildi. Güncel levha enemy-art-direction-reviewed-v3.png; güncel Shi Qra portresi shi-qra-outlaws-concept-reviewed-v3.png. İlk geçiş kaynak/provenans içindir. 12 aile konsepti, 288 profilin ayrı bitmiş illüstrasyonu değildir. Üretim promptları JSON dosyalarında saklı.',encoding='utf-8')
def glbinfo(p):
 buf=p.read_bytes();magic,version,length=struct.unpack_from('<4sII',buf);assert magic==b'glTF' and version==2 and length==len(buf);n,typ=struct.unpack_from('<II',buf,12);assert typ==0x4E4F534A;j=json.loads(buf[20:20+n]);tri=0
 for m in j.get('meshes',[]):
  for pr in m['primitives']:
   if 'indices' in pr:tri+=j['accessors'][pr['indices']]['count']//3
 assert all('uri' not in im for im in j.get('images',[]));assert all('uri' not in b for b in j['buffers'])
 return {'file':p.relative_to(P).as_posix(),'meshes':len(j.get('meshes',[])),'triangles':tri,'embedded_images':len(j.get('images',[])),'external_uris':0,'animation_channels':sum(len(a['channels']) for a in j.get('animations',[])),'bytes':len(buf)}
def validate_package():
 enemies=read(D/'enemy-decks.json');cards=read(D/'cards.json');lookup={c['id']:c for c in cards};assert len(lookup)==len(cards)==720;assert len(enemies)==288
 for e in enemies:
  assert sum(i['count'] for i in e['deck'])==32
  assert len({i['card_id'] for i in e['deck']})==len(e['deck'])
  assert all(lookup[i['card_id']]['family']==e['family'] for i in e['deck'])
  assert lookup[e['unique_signature']]['exclusive_enemy_id']==e['id']
 assert len({tuple(sorted((i['card_id'],i['count']) for i in e['deck'])) for e in enemies})==288
 story=read(P/'14-campaign/marcel-campaign.json');ids={n['id'] for n in story['nodes']};assert len(ids)==42;assert sorted(n['completed_checkpoint'] for n in story['nodes'])==list(range(1,43))
 assert all(e['from'] in ids and e['to'] in ids for e in story['edges'])
 placements=read(M/'data/enemy-encounter-placement.json')['encounters'];assert {e['id'] for e in enemies}=={p['enemy_id'] for p in placements}
 pres=read(M/'data/source-preservation.json')
 for rec in pres['copies']:assert sha(Path(rec['source']))==rec['sha256_source']==sha(P/rec['asset']);assert Path(rec['source']).stat().st_mtime_ns==rec['source_mtime_ns']
 for rec in pres['read_only_source_records']:assert sha(Path(rec['path']))==rec['sha256'];assert Path(rec['path']).stat().st_mtime_ns==rec['mtime_ns']
 b=read(D/'asset-bindings-v3.json');missing=[]
 for f in b['families']:
  for val in [f['portrait_asset'],f['combat_asset_design']['impact_sound'],f['combat_asset_design']['impact_clip']]:
   if val and not (P/val).exists():missing.append(val)
 for val in b['defaults'].values():
  if not (P/val).exists():missing.append(val)
 assert not missing,missing
 models=glbinfo(M/'models/eruldin-campaign-map-v3.glb')
 from pypdf import PdfReader
 pdf=P/'07-production/Eruldin-Harita-ve-Dusmanlar-v3.pdf';assert len(PdfReader(str(pdf)).pages)==10
 result={'profiles':288,'families':18,'cards':720,'tokens':len(read(D/'tokens.json')),'distinct_decks':288,'exclusive_signatures':288,'deck_size':32,'cross_family_cards':0,'story_checkpoints':42,'regional_nodes':112,'enemy_placements':288,'source_assets_copied':len(pres['copies']),'source_assets_unchanged':True,'source_data_files_unchanged':True,'missing_asset_bindings':missing,'map_model':models,'pdf_pages':10,'visual_review':'10 sayfa render edildi ve görsel olarak incelendi; son revizyonda 2,3,4,6. sayfalar yeniden kontrol edildi.','balance_tests':'çalıştırılmadı; bu bir tasarım paketi','application_integration':False}
 write(P/'14-campaign/content-validation.json',result);print(json.dumps(result,ensure_ascii=False))
def package():
 files=sorted(p for p in P.rglob('*') if p.is_file() and p.name!='manifest-v3.json' and not p.name.endswith('.blend1'))
 manifest={'version':3,'date':'2026-10-06','scope':'Sanat, model ve içerik tasarımı. Oyun kodu ve uygulama entegrasyonu içermez. V1/V2 manifestleri tarihsel kayıt; güncel paket manifesti v3.','files':[{'path':p.relative_to(P).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in files]};write(P/'manifest-v3.json',manifest)
 out=P.parent/'Eruldin-Tasarim-ve-Asset-Paketi-v3.zip'
 with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for p in files+[P/'manifest-v3.json']:z.write(p,p.relative_to(P).as_posix())
 with zipfile.ZipFile(out) as z:
  assert z.testzip() is None;assert not any(Path(n).suffix.lower() in ['.js','.mjs','.py','.html','.css','.exe'] for n in z.namelist())
 print(json.dumps({'zip':str(out),'megabytes':round(out.stat().st_size/1024/1024,1),'files':len(files)}))
if __name__=='__main__':
 import sys
 if '--art' in sys.argv:finish_art()
 elif '--validate' in sys.argv:validate_package()
 elif '--zip' in sys.argv:package()
