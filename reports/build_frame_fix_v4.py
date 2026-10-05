from pathlib import Path
from PIL import Image
import numpy as np,json,shutil
from scipy.ndimage import label,find_objects
P=Path.cwd()/'design-pack';F=P/'04-card-frames';S=P/'sources/frame-v4';S.mkdir(parents=True,exist_ok=True)
GEN=Path('C:/Users/PC/.codex/generated_images/01a10d91-fb3d-7d33-85b4-6991fc017a43')
def largest_rect(mask):
 heights=np.zeros(mask.shape[1],dtype=int);best=(0,None)
 for y,row in enumerate(mask):
  heights=np.where(row,heights+1,0);stack=[]
  for x in range(len(heights)+1):
   height=int(heights[x]) if x<len(heights) else 0;start=x
   while stack and stack[-1][1]>height:
    left,hh=stack.pop();area=hh*(x-left)
    if area>best[0]:best=(area,(left,y-hh+1,x,y+1))
    start=left
   if not stack or stack[-1][1]<height:stack.append((start,height))
 return best[1]
def measure(im):
 a=np.asarray(im.getchannel('A'));labs,n=label(a<8);areas=np.bincount(labs.ravel());objs=find_objects(labs);candidates=[]
 for i,b in enumerate(objs):
  if b is None:continue
  if b[0].start==0 or b[1].start==0 or b[0].stop==a.shape[0] or b[1].stop==a.shape[1]:continue
  if areas[i+1]>a.size*.03:candidates.append((areas[i+1],i+1,b))
 assert candidates,'No closed transparent artwork window';_,lab,b=max(candidates);region=labs==lab;box=largest_rect(region)
 l,t,r,bt=box;box=(l+3,t+3,r-3,bt-3);assert np.max(a[box[1]:box[3],box[0]:box[2]])<8
 return {'native_size':list(im.size),'transparent_window_bounds':[b[1].start,b[0].start,b[1].stop,b[0].stop],'safe_art_rectangle_px':box,'safe_art_rectangle_normalized':[box[0]/im.width,box[1]/im.height,box[2]/im.width,box[3]/im.height],'art_fit':'contain / centered; no stretch, no zoom-to-fill','art_max_overlay_alpha':int(a[box[1]:box[3],box[0]:box[2]].max())}
def crop_sheet(src,names,tag):
 im=Image.open(src).convert('RGBA');shutil.copy2(src,S/(tag+'.png'));rec={}
 for i,name in enumerate(names):
  cell=im.crop((round(i*im.width/len(names)),0,round((i+1)*im.width/len(names)),im.height));bbox=cell.getchannel('A').getbbox();assert bbox;cell=cell.crop(bbox);dst=F/name;cell.save(dst);rec[name]=measure(cell)
 return rec
def main(fullpath):
 spec=crop_sheet(Path(fullpath),['champion-frame-v4.png','unit-frame-v4.png','spell-frame-v4.png'],'full-frames-approved')
 spec.update(crop_sheet(GEN/'exec-6470876a-577f-45a8-placeholder.png',[],'unused')) if False else None
 board=next(p for p in GEN.glob('exec-6470876a-577f-45*.png'))
 spec.update(crop_sheet(board,['board-unit-frame-v4.png','board-champion-frame-v4.png'],'board-frames-approved'))
 (F/'frame-layout-v4.json').write_text(json.dumps({'scope':'Raster asset correction; not application code','frames':spec},ensure_ascii=False,indent=2),encoding='utf-8')
 base=json.loads((P/'11-bindings/card-bindings-v2.json').read_text(encoding='utf-8'));base['scope']='V4 çerçeve ve tam kaynak görsel yerleşimi; uygulama entegrasyonu değildir'
 for c in base['cards']:
  kind='champion' if c['type']=='champion' else 'spell' if c['type']=='spell' else 'unit';c['full_frame']=f'04-card-frames/{kind}-frame-v4.png';c['board_frame']='04-card-frames/board-champion-frame-v4.png' if kind=='champion' else '04-card-frames/board-unit-frame-v4.png';c['portrait_layout']=spec[f'{kind}-frame-v4.png'];c['board_portrait_layout']=spec[Path(c['board_frame']).name]
 (P/'11-bindings/card-bindings-v4.json').write_text(json.dumps(base,ensure_ascii=False,indent=2),encoding='utf-8')
 enemy=json.loads((P/'13-enemies/asset-bindings-v3.json').read_text(encoding='utf-8'));enemy['defaults']['card_unit_frame']='04-card-frames/unit-frame-v4.png';enemy['defaults']['portrait_layout']='04-card-frames/frame-layout-v4.json';enemy['scope']='V4 asset veri eşlemesi; uygulama entegrasyonu değildir'
 (P/'13-enemies/asset-bindings-v4.json').write_text(json.dumps(enemy,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps(spec,ensure_ascii=False))
if __name__=='__main__':
 import sys;main(sys.argv[1])
