from pathlib import Path
import json,hashlib,zipfile,shutil,sys
from PIL import Image
P=Path.cwd()/'design-pack';F=P/'04-card-frames';S=P/'sources/frame-v4'
from build_frame_fix_v4 import crop_sheet
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def write(p,o):p.write_text(json.dumps(o,ensure_ascii=False,indent=2),encoding='utf-8')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def update_board(path):
 spec=read(F/'frame-layout-v4.json');spec['frames'].update(crop_sheet(Path(path),['board-unit-frame-v4.png','board-champion-frame-v4.png'],'board-frames-approved'));write(F/'frame-layout-v4.json',spec)
 bind=read(P/'11-bindings/card-bindings-v4.json')
 for d in bind['cards']:d['board_portrait_layout']=spec['frames'][Path(d['board_frame']).name]
 write(P/'11-bindings/card-bindings-v4.json',bind)
 print('Square board frames updated')
def package():
 from pypdf import PdfReader
 layouts=read(F/'frame-layout-v4.json')['frames'];binding=read(P/'11-bindings/card-bindings-v4.json');assert len(layouts)==5
 for name,s in layouts.items():
  im=Image.open(F/name);assert im.mode=='RGBA';l,t,r,b=s['safe_art_rectangle_px'];assert min(l,t)>0 and r<=im.width and b<=im.height
  import numpy as np
  assert np.asarray(im.getchannel('A'))[t:b,l:r].max()<=2
 for d in binding['cards']:
  for key in ['illustration','full_frame','board_frame']:assert (P/d[key]).exists()
  assert d['portrait_layout']['art_fit'].startswith('contain')
 assert len(PdfReader(str(P/'07-production/Eruldin-Kart-Cerceveleri-v4.pdf')).pages)==6
 enemies=read(P/'13-enemies/asset-bindings-v4.json');assert (P/enemies['defaults']['card_unit_frame']).exists();assert all((P/f['portrait_asset']).exists() for f in enemies['families'] if f['portrait_asset'])
 validation={'frames':5,'main_cards_reviewed':12,'enemy_portraits_reviewed':12,'board_portraits_reviewed':7,'cropping_in_new_layout':False,'portrait_stretching':False,'maximum_frame_alpha_in_safe_art_area':max(s['art_max_overlay_alpha'] for s in layouts.values()),'pdf_pages_visually_reviewed':6,'image_tool':'image_gen built-in','application_integration':False,'scope':'Asset düzeltmesi; eski kaynak karakter resimleri değiştirilmedi. Sonradan oyuna eklenirken v4 yerleşim verisi kullanılmalıdır.'}
 write(P/'11-bindings/frame-validation-v4.json',validation)
 # Preview pages are PDF renders, not programmatically painted raster assets.
 shutil.copy2(P.parent/'reports/frame-review-v4-1.png',F/'before-after-v4.png');shutil.copy2(P.parent/'reports/frame-review-v4-2.png',F/'character-cards-preview-v4.png');shutil.copy2(P.parent/'reports/frame-review-v4-6.png',F/'board-cards-preview-v4.png')
 files=sorted(p for p in P.rglob('*') if p.is_file() and p.name!='manifest-v4.json' and not p.name.endswith('.blend1'))
 write(P/'manifest-v4.json',{'version':4,'scope':'V3 harita/düşman paketi + düzeltilmiş karakter çerçeveleri. Güncel çerçeveler ve yerleşim: v4. Önceki sürümler tarihsel.','files':[{'path':p.relative_to(P).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in files]})
 out=P.parent/'Eruldin-Tasarim-ve-Asset-Paketi-v4.zip'
 with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for p in files+[P/'manifest-v4.json']:z.write(p,p.relative_to(P).as_posix())
 with zipfile.ZipFile(out) as z:assert z.testzip() is None;assert not any(Path(n).suffix in ['.js','.py','.mjs','.exe','.html','.css'] for n in z.namelist())
 print(json.dumps({'files':len(files),'zip_mb':round(out.stat().st_size/1024/1024,1),'validation':validation},ensure_ascii=False))
if __name__=='__main__':
 if len(sys.argv)>1:update_board(sys.argv[1])
 else:package()
