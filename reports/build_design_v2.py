from pathlib import Path
from PIL import Image
import json, shutil, subprocess, hashlib

ROOT=Path(r'C:\Users\PC\Desktop\Marcel Kart Oyunu')
PACK=ROOT/'design-pack'
def save(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
def run(args):
    return subprocess.run(args,check=True,capture_output=True,text=True)
atlas=Image.open(PACK/'sources/card-actions-atlas-v2.png')
names=['marcel','akhenten','onbion','white','teom','karah-heavy']
for i,name in enumerate(names):
    x=i%3*atlas.width//3;y=i//3*atlas.height//2
    atlas.crop((x,y,(i%3+1)*atlas.width//3,(i//3+1)*atlas.height//2)).save(PACK/f'02-characters/action-v2/{name}.png')
audio=PACK/'09-audio';audio.mkdir(exist_ok=True)
base=[('ui-select','interface','select_001.ogg'),('ui-confirm','interface','confirmation_001.ogg'),('ui-hover','interface','tick_001.ogg'),('card-draw','rpg','bookFlip1.ogg'),('card-place','rpg','bookPlace1.ogg'),('story-open','rpg','bookOpen.ogg'),('story-close','rpg','bookClose.ogg'),('attack-slash','rpg','knifeSlice.ogg'),('steel-unsheathe','rpg','drawKnife1.ogg'),('cloth-motion','rpg','cloth1.ogg'),('void-creak','rpg','creak1.ogg'),('hit-metal','impact','impactMetal_heavy_000.ogg'),('hit-heavy','impact','impactPunch_heavy_000.ogg'),('magic-glass','impact','impactGlass_light_000.ogg'),('magic-bell','impact','impactBell_heavy_000.ogg')]
sources=[]
for name,group,filename in base:
    source=ROOT/f'reports/audio-sources/{group}/Audio/{filename}'
    if not source.exists():
        found=list((ROOT/f'reports/audio-sources/{group}').rglob(filename))
        if not found:raise FileNotFoundError(source)
        source=found[0]
    shutil.copy2(source,audio/f'{name}.ogg')
    sources.append({'file':f'09-audio/{name}.ogg','creator':'Kenney','license':'CC0-1.0','source':f'https://kenney.nl/assets/{"interface-sounds" if group=="interface" else "rpg-audio" if group=="rpg" else "impact-sounds"}','original':filename,'modified':False})
for group in ['interface','rpg','impact']:
    shutil.copy2(ROOT/f'reports/audio-sources/{group}/License.txt',audio/f'LICENSE-Kenney-{group}.txt')
shutil.copy2(ROOT/'public/assets/audio/the-illusionist.mp3',audio/'the-illusionist.mp3')
sources.append({'file':'09-audio/the-illusionist.mp3','creator':'Scott Buckley','license':'CC-BY-4.0','source':'https://www.scottbuckley.com.au/library/the-illusionist/','modified':False,'required_credit':"'The Illusionist' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au"})
run(['ffmpeg','-y','-v','error','-i',str(ROOT/'reports/audio-sources/fire-pagdev.wav'),'-ar','48000','-c:a','libvorbis','-q:a','5',str(audio/'fireplace-loop.ogg')])
sources.append({'file':'09-audio/fireplace-loop.ogg','creator':'PagDev','license':'CC0-1.0','source':'https://opengameart.org/content/fireplace-sound-loop','original':'fire.wav','modified':'WAV to OGG, resampled 48kHz; source author labels this a loop; boundary has not been listening-tested'})
layers={
 'summon': [('card-place',0,0.65,1),('magic-bell',0.1,0.16,1.25)],
 'steel-impact': [('attack-slash',0,0.65,1),('hit-metal',0.10,0.35,1)],
 'memory': [('card-draw',0,0.55,1),('magic-glass',0.07,0.30,0.8)],
 'heal': [('magic-bell',0,0.20,1.5),('magic-glass',0.16,0.15,1.2)],
 'void': [('void-creak',0,0.35,0.65),('cloth-motion',0.10,0.5,0.75),('hit-heavy',0.20,0.25,0.8)],
 'ultimate': [('magic-glass',0,0.22,0.6),('magic-bell',0.20,0.3,0.8),('hit-metal',0.36,0.3,0.7)],
 'victory': [('magic-bell',0,0.25,1),('magic-bell',0.22,0.18,1.25),('magic-bell',0.44,0.15,1.5)]
}
for name,items in layers.items():
    args=['ffmpeg','-y','-v','error']
    for source,_,_,_ in items:args+=['-i',str(audio/f'{source}.ogg')]
    filters=[]
    for i,(_,delay,gain,pitch) in enumerate(items):
        filters.append(f'[{i}:a]aresample=48000,asetrate={int(48000*pitch)},aresample=48000,volume={gain},adelay={int(delay*1000)}:all=1[a{i}]')
    filters.append(''.join(f'[a{i}]' for i in range(len(items)))+f'amix=inputs={len(items)}:normalize=0,alimiter=limit=0.89:level=0[out]')
    args+=['-filter_complex',';'.join(filters),'-map','[out]','-ar','48000','-c:a','pcm_s16le',str(audio/f'cue-{name}.wav')]
    run(args)
    sources.append({'file':f'09-audio/cue-{name}.wav','creator':'Eruldin sound design from Kenney CC0 recordings','license':'CC0-1.0','modified':True,'layers':[{'source':f'09-audio/{s}.ogg','delay_s':d,'gain':g,'pitch_ratio':p} for s,d,g,p in items]})
for item in sources:
    path=PACK/item['file']
    info=json.loads(run(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_name,sample_rate,channels','-of','json',str(path)]).stdout)
    item['duration_s']=round(float(info['format']['duration']),4)
    item['streams']=info['streams']
    item['sha256']=hashlib.sha256(path.read_bytes()).hexdigest()
    run(['ffmpeg','-v','error','-i',str(path),'-f','null','-'])
save(audio/'audio-sources.json',{'date':'2026-10-06','files':sources,'validation':'All files probed and decoded by FFmpeg. No listening/mastering or platform loudness sign-off claimed.'})
(audio/'CREDITS.txt').write_text("MÜZİK — ZORUNLU ATIF\n'The Illusionist' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au\nhttps://www.scottbuckley.com.au/library/the-illusionist/\nhttps://creativecommons.org/licenses/by/4.0/\nMP3 değiştirilmedi. Oyun kredilerinde ve dağıtılan asset paketinde atıf korunmalı.\n\nEFEKTLER\nInterface Sounds, RPG Audio, Impact Sounds — Kenney, CC0.\nhttps://kenney.nl/assets/interface-sounds\nhttps://kenney.nl/assets/rpg-audio\nhttps://kenney.nl/assets/impact-sounds\n\nFireplace Sound loop — PagDev, CC0. WAV kaydı 48 kHz OGG olarak dönüştürüldü.\nhttps://opengameart.org/content/fireplace-sound-loop\n\ncue-*.wav: bu CC0 kayıtların gecikme, hız/perde ve kazanç değişimleriyle yapılan özgün katmanlı ses tasarımları.\nSeslendirme, karakter replikleri veya Riot sesleri içermez.\n",encoding='utf-8')
content=json.loads((ROOT/'reports/card-content-v2.json').read_text(encoding='utf-8'))
art={'marcel':'02-characters/action-v2/marcel.png','akhenten':'02-characters/action-v2/akhenten.png','onbion':'02-characters/action-v2/onbion.png','karah':'02-characters/karah.png','karah-heavy':'02-characters/action-v2/karah-heavy.png','white':'02-characters/action-v2/white.png','teom':'02-characters/action-v2/teom.png','blade':'03-spells/teom-blade.png','memory':'03-spells/memory.png','fire':'03-spells/hearth.png','ash':'03-spells/ash.png','family':'03-spells/chosen-family.png'}
fx={'marcel':'summon-amber','akhenten':'summon-amber','onbion':'impact-silver','karah':'karah-ink','karah-heavy':'karah-ink','white':'white-echo','teom':'heal-gold-green','blade':'impact-silver','memory':'white-echo','fire':'heal-gold-green','ash':'karah-ink','family':'heal-gold-green'}
cue={'summon-amber':'summon','impact-silver':'steel-impact','karah-ink':'void','white-echo':'memory','heal-gold-green':'heal','victory-shards':'victory'}
bindings=[]
for card in content['cards']:
    effect=fx[card['id']]
    bindings.append({**card,'illustration':art[card['id']],'full_frame':f'04-card-frames/{card["type"]}-frame-v1.png','board_frame':'04-card-frames/board-unit-frame-v2.png' if card['type']!='spell' else None,'vfx_texture':f'06-vfx/{effect}-texture-v1.png','vfx_clip':f'06-vfx/animated-v2/{effect}.glb','sound':f'09-audio/cue-{cue[effect]}.wav','state_design':['hand','hover-inspect','affordable','unaffordable','targeting','board','attacking','blocking','damaged','death'] if card['type']!='spell' else ['hand','hover-inspect','affordable','unaffordable','targeting','resolving'],'rules_are_design_proposals':True})
save(PACK/'11-bindings/card-bindings-v2.json',{'scope':'Asset associations and design data only; not integrated into the earlier runnable prototype','cards':bindings,'echoes':content['echoes'],'chapters':content['chapters']})
events=[('card.draw',0,120,300,'card-draw',None),('unit.summon',80,220,600,'cue-summon','summon-amber'),('unit.attack',120,260,600,'cue-steel-impact','impact-silver'),('spell.damage',100,200,450,'cue-steel-impact','impact-silver'),('spell.heal',80,200,650,'cue-heal','heal-gold-green'),('spell.memory',100,260,750,'cue-memory','white-echo'),('spell.void',100,280,700,'cue-void','karah-ink'),('echo.ultimate',260,650,1500,'cue-ultimate','white-echo'),('match.victory',200,400,1400,'cue-victory','victory-shards')]
save(PACK/'11-bindings/event-timelines-v2.json',{'units':'milliseconds','status':'Authored timing proposals; full game synchronization has not been tested','events':[{'event':e,'anticipation_ms':a,'impact_ms':i,'end_ms':end,'audio':f'09-audio/{s}.wav' if s.startswith('cue-') else f'09-audio/{s}.ogg','effect_texture':f'06-vfx/{f}-texture-v1.png' if f else None,'clip':f'06-vfx/animated-v2/{f}.glb' if f else None,'priority':'hero' if e=='echo.ultimate' else 'foreground','reduced_motion':'Fixed small effect + persistent target/value change, no camera shake','gain_db':-8 if e=='echo.ultimate' else -12} for e,a,i,end,s,f in events], 'mix':{'music_gain_db':-22,'ambience_gain_db':-28,'ui_gain_db':-18,'ultimate_music_duck_db':-6,'attack_camera_shake_max_px':2,'environment_never_masks_rules':True,'mute_music_and_sfx_separately':True}})
save(PACK/'11-bindings/screen-flow-v2.json',{'scope':'Screen and state design; no application code','flow':['title','first-run-story-or-continue','echo-select','chapter-map','chapter-brief','deck-review','match-intro','mulligan-proposal','battle','reward','chapter-map'],'competitive':['chapter-map','competitive-lobby','matching-same-frontier','match-intro','battle','result','frontier-leaderboard'],'first_run':{'tutorials':['play-a-unit','attack-and-block','spell-response-and-preview'],'skippable_for_returning_players':True},'frontier_ranking':{'primary':'Furthest COMPLETED story encounter','within_frontier':'Competitive rating','matching':'Same completed frontier; show chapter badge before queue','spoilers':'Future chapter titles/art hidden until reached','scope':'User requirement; proposed detailed policy, not claimed to be LoR behavior'},'battle':{'board_portrait_state':'Compact portrait + attack/health + keyword badges','hand_state':'Full illustration, frame, cost, name and inspectable rules','main_action_states':['Hamleyi bitir','Saldır','Savunmayı onayla','Yanıt ver','Rakip oynuyor'],'target_confirmation':'Source, target, effect and resource cost all visible','combat_preview':'Projected damage and death indicators before commitment; design only, not earlier engine feature'},'opening':{'main_action':'Başla / Devam et','motion':'Modelled candle flames, cloth motion and restrained fog; separate 3D scene','main_menu_priority':'Hikâyeye devam et','audio':'User starts interaction before music playback','credits':'Music attribution visible in Credits'},'missing_final_states':['Disconnect/reconnect','Timeout','Empty collection','Network failure','Long name / translated copy','Touch targeting','Screen reader and contrast acceptance']})
save(PACK/'sources/card-action-crops-v2.json',{'source':'sources/card-actions-atlas-v2.png','grid':[3,2],'width':atlas.width,'height':atlas.height,'order':names,'operation':'Lossless uniform crop; no generated-image repainting'})
print(json.dumps({'card_illustrations':6,'audio_assets':len(sources),'card_bindings':len(bindings),'audio_decode_errors':0},ensure_ascii=False))

