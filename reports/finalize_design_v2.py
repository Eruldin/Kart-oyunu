from pathlib import Path
from PIL import Image
import json, struct, hashlib, subprocess, zipfile, shutil
R=Path(r'C:\Users\PC\Desktop\Marcel Kart Oyunu');P=R/'design-pack'
def save(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
atlas=Image.open(P/'sources/compact-ui-atlas-v2.png')
crops={'04-card-frames/board-unit-frame-v2.png':(19,45,606,488),'04-card-frames/board-champion-frame-v2.png':(644,5,1233,489),'05-interface/action-button-v2.png':(63,549,603,1089),'04-card-frames/card-back-v2.png':(699,513,1183,1192)}
for name,box in crops.items():atlas.crop(box).save(P/name)
save(P/'sources/compact-ui-crops-v2.json',{'source':'sources/compact-ui-atlas-v2.png','boxes':crops,'mode':'RGBA; lossless crop; component bounding boxes with 8px padding'})
path=P/'11-bindings/card-bindings-v2.json';data=json.loads(path.read_text(encoding='utf-8'))
for card in data['cards']:
    if card['type']=='champion':card['board_frame']='04-card-frames/board-champion-frame-v2.png'
save(path,data)
old=P/'10-screen-designs/battle-concept-v2.png'
if old.exists():shutil.move(str(old),str(P/'sources/battle-first-pass-v2.png'))
shutil.copy2(R/'docs/research/LOR_ART_PIPELINE.md',P/'07-production/LOR_ART_PIPELINE.md')
frames=sorted((R/'reports/vfx-preview-frames').glob('*.png'))
concat=R/'reports/vfx-preview-concat.txt'
concat.write_text(''.join("file '"+f.as_posix()+"'\nduration 0.0833333333\n" for f in frames),encoding='utf-8')
subprocess.run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',str(concat),'-filter_complex','[0:v]split[a][b];[a]palettegen=reserve_transparent=1[p];[b][p]paletteuse','-loop','0',str(P/'06-vfx/animated-v2/white-echo-preview.gif')],check=True)
glbs=[]
for path in sorted((P/'06-vfx/animated-v2').glob('*.glb')):
    raw=path.read_bytes();magic,version,length=struct.unpack_from('<III',raw,0)
    assert magic==0x46546c67 and version==2 and length==len(raw)
    size,ctype=struct.unpack_from('<II',raw,12);g=json.loads(raw[20:20+size].decode())
    assert ctype==0x4e4f534a
    assert len(g.get('animations',[]))>0 and len(g.get('images',[]))>0
    assert all('uri' not in im for im in g['images'])
    assert all('uri' not in buf for buf in g['buffers'])
    assert any(m.get('alphaMode')=='BLEND' for m in g.get('materials',[])),g.get('materials')
    anim=g['animations'][0];bin_start=20+size+8;buf=raw[bin_start:]
    times=[]
    for sampler in anim['samplers']:
        acc=g['accessors'][sampler['input']];view=g['bufferViews'][acc['bufferView']]
        start=view.get('byteOffset',0)+acc.get('byteOffset',0)
        values=struct.unpack_from('<'+'f'*acc['count'],buf,start);times.extend(values)
    glbs.append({'file':path.name,'meshes':len(g['meshes']),'channels':len(anim['channels']),'images_embedded':len(g['images']),'duration_s':max(times)-min(times),'alpha_modes':sorted(set(m.get('alphaMode','OPAQUE') for m in g['materials'])),'external_uris':0})
missing=[]
for path in [P/'11-bindings/card-bindings-v2.json',P/'11-bindings/event-timelines-v2.json']:
    obj=json.loads(path.read_text(encoding='utf-8'))
    def visit(v):
        if isinstance(v,dict):
            for x in v.values():visit(x)
        elif isinstance(v,list):
            for x in v:visit(x)
        elif isinstance(v,str) and len(v)>3 and v[:2].isdigit() and v[2]=='-' and '/' in v and not (P/v).is_file():missing.append(v)
    visit(obj)
assert not missing,missing
alpha={}
for name in list(crops)[:2]:
    im=Image.open(P/name);a=im.getchannel('A')
    alpha[name]={'mode':im.mode,'size':im.size,'window_alpha':a.getpixel((im.width//2,im.height//2)),'corner_alpha':a.getpixel((0,0))}
    assert alpha[name]['window_alpha']==0 and alpha[name]['corner_alpha']==0
save(P/'11-bindings/validation-v2.json',{'date':'2026-10-06','card_count':len(data['cards']),'missing_asset_references':missing,'frame_alpha':alpha,'vfx_glb':glbs,'audio_assets':24,'audio_probe_decode':'Passed in audio-sources.json','pdf_pages':8,'visual_review':'All eight PDF pages rendered; medium font and missing heading arrows repaired','game_integration_tested':False,'limitations':['No game playback QA','No listening/mastering sign-off','VFX transform clips on RGBA quads, not flipbooks','3D board remains detailed blockout, not final sculpt/PBR']})
manifest={'title':'Eruldin: Yankılar — design and asset pack v2','date':'2026-10-06','scope':'Design and assets only; association data is not executable game integration','methods':{'images':'Built-in image_gen + lossless atlas crops','3d':'Blender 4.5.14 LTS scene and GLB transform animations','audio':'Licensed downloaded recordings, authored FFmpeg layer arrangements','document':'ReportLab PDF using original raster art/frame assets and real Turkish typesetting'},'entry_document':'07-production/Eruldin-Sanat-ve-Akis-v2.pdf','bindings':['11-bindings/card-bindings-v2.json','11-bindings/event-timelines-v2.json','11-bindings/screen-flow-v2.json'],'source_prompts':['sources/prompts-v1.json','sources/prompts-v2.json','sources/initial-manifest.json'],'licenses':'09-audio/CREDITS.txt + Kenney license files + fonts/OFL files','riot_assets_used':False,'meshy_used':False,'code_prototype_included':False,'validation':'11-bindings/validation-v2.json','files':[]}
for f in sorted(P.rglob('*')):
    if f.is_file() and f.name not in ['manifest.json','manifest-v2.json'] and f.suffix not in ['.blend1','.blend2']:
        manifest['files'].append({'path':f.relative_to(P).as_posix(),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
save(P/'manifest-v2.json',manifest)
zip_path=R/'Eruldin-Tasarim-ve-Asset-Paketi-v2.zip'
with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for item in manifest['files']:z.write(P/item['path'],'design-pack/'+item['path'])
    z.write(P/'manifest-v2.json','design-pack/manifest-v2.json')
    z.write(P/'manifest.json','design-pack/manifest-v1.json')
with zipfile.ZipFile(zip_path) as z:
    assert z.testzip() is None
    assert not any(Path(n).suffix in ['.js','.mjs','.py','.html','.css','.exe'] for n in z.namelist())
print(json.dumps({'zip':str(zip_path),'size_mb':round(zip_path.stat().st_size/1024**2,1),'files':len(manifest['files']),'bindings_missing':0,'glb_clips':glbs},ensure_ascii=False))
