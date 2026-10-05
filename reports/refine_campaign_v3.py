from pathlib import Path
import json
P=Path.cwd()/'design-pack'
def read(p):return json.loads((P/p).read_text(encoding='utf-8'))
def write(p,o):(P/p).write_text(json.dumps(o,ensure_ascii=False,indent=2),encoding='utf-8')
story=read('14-campaign/marcel-campaign.json')
types={1:['story','battle','battle','battle','story','survival'],2:['survival','exploration','rest','story','survival','survival'],3:['story','exploration','special','story','special','survival'],4:['survival','story','special','story','special','story'],5:['survival','stealth','stealth','story','battle','special'],6:['special','survival','survival','rest','special','story'],7:['story','stealth','story','story','story','story']}
for n in story['nodes']:
 j=int(n['id'][-2:])-1;n['type']=types[n['chapter']][j]
 if n['type']!='battle':n['enemy_candidates']=[]
 if n['type'] in ['survival','exploration','rest','stealth']:n['objective']={'survival':'Rota ve erzak kartlarıyla sahne hedefini tamamla; savaş kazanmak zorunlu değil.','exploration':'Konum/nesne incelemesini tamamla; çevre sakinleri otomatik düşman değildir.','rest':'Dinlenme ve aile bağı sahnesini tamamla; dostlara saldırılmaz.','stealth':'Görünür alarm sayacıyla geçişi tamamla; fark edilirse kaçış/savunma karşılaşması açılır.'}[n['type']]
 if n['id']=='marcel-03-03':n['objective']='Borin ve Valerus ile gerginlik: senaryolu yenilgi ve hücreye geçiş; öldürme hedefi yok.'
 if n['id']=='marcel-04-05':n['objective']='Yankı sonrası avluya dön; Primus’un hamlesinden kurtul. Akhenten yeni zaman çizgisinde hayattadır.'
 if n['id']=='marcel-05-05':n['enemy_candidates']=['valerus-loyal-reis','council-buyucu'];n['objective']='Ziyafeti boz, müttefiklerini koru; sahne Gölge Yolu kaçırılmasıyla devam eder.'
write('14-campaign/marcel-campaign.json',story)
enemies=read('13-enemies/enemy-decks.json')
checkpoints={'Korvengrad':1,'Kül Tarlaları':7,'Koru':13,'Kızıl Kale':37,'Ölüler Bataklığı':42,'Kırık Diş Geçidi':11,'Shi Qra':6,'Teomli':6,'Serath':6,'Aldemir':6,'Val Teresh':6,'Zağra Khur':6,'Ebedi Buzullar':6}
placements=[]
for e in enemies:
 place=e['regions'][0];placements.append({'id':'optional-'+e['id'],'enemy_id':e['id'],'region':place,'unlock_checkpoint':checkpoints[place],'world_xy':None,'placement_type':'bölgesel havuz / yerel rota yan kolu','is_main_story':False,'provenance':'Oyun eklemesi; roman olaylarını değiştirmez.','reward':'keşif ustalığı / kozmetik; ana hikâye sıralamasını artırmaz','script_constraint':e['story_role'] if e.get('provenance','').startswith('Ad/kimlik') else None})
write('12-campaign-map/data/enemy-encounter-placement.json',{'encounters':placements,'note':'112 keşif düğümü için bu havuzdan tema ve rol filtresiyle karşılaşma seçilir. Bunlar ayrıca 288 yeni ana hikâye düğümü değildir. Ana hikâyedeki Borin/Torg/Valerus/Elçi senaryo kısıtları tekrar karşılaşmalarında korunur; hayatta/dead canon değişmez.'})
# Timing and audio design references existing assets only; waveform mastering is separate.
familybind=read('13-enemies/asset-bindings-v3.json')
for f in familybind['families']:
 fid=f['family_id']
 if fid.startswith('karah'):sound='09-audio/cue-void.wav';vfx='06-vfx/animated-v2/karah-ink.glb'
 elif fid in ['council','living-fortress','marsh-visions']:sound='09-audio/cue-memory.wav';vfx='06-vfx/animated-v2/white-echo.glb'
 elif fid in ['forest-predators','desert-hunters','frost-predators']:sound='09-audio/hit-heavy.ogg';vfx='06-vfx/animated-v2/impact-silver.glb'
 else:sound='09-audio/cue-steel-impact.wav';vfx='06-vfx/animated-v2/impact-silver.glb'
 f['combat_asset_design']={'impact_sound':sound,'impact_clip':vfx,'anticipation_ms':220,'impact_ms':460,'recover_ms':900,'status':'Veri bağlantısı; motor entegrasyonu yapılmadı. Aileye özel final VFX/ses henüz ayrı üretilmedi.'}
write('13-enemies/asset-bindings-v3.json',familybind)
print('Narrative encounter types, 288 placements and existing media bindings updated')
