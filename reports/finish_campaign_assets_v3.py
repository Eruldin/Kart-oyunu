from pathlib import Path
from PIL import Image
import json,shutil,hashlib
ROOT=Path.cwd();P=ROOT/'design-pack';D=P/'13-enemies';M=P/'12-campaign-map'
src=Path('C:/Users/PC/.codex/generated_images/01a10d91-fb3d-7d33-85b4-6991fc017a43/exec-8614240d-5b57-4275-93c4-31d3467b5609.png')
shutil.copy2(src,D/'art/enemy-art-direction-v3.png');im=Image.open(src);w,h=im.size
names=['karah-crawler','karah-armored','korvengrad-watch','korvengrad-corrupt','koru-jail','valerus-loyal','butterfly-guard','council','ash-scavenger','marsh-visions','shi-qra-outlaws','frost-predators']
recs=[]
for i,name in enumerate(names):
 x,y=i%4,i//4;box=(round(x*w/4),round(y*h/3),round((x+1)*w/4),round((y+1)*h/3));out=D/f'art/{name}-concept-v3.png';im.crop(box).save(out)
 recs.append({'family_id':name,'asset':out.relative_to(P).as_posix(),'source_rectangle':box,'usage':'İlk aile konsepti; 288 ayrı düşmanın bitmiş portresi değildir.'})
bindings=json.loads((D/'asset-bindings-v3.json').read_text(encoding='utf-8'))
bindings['defaults']={'card_unit_frame':'04-card-frames/unit-frame-v1.png','audio_attack':'09-audio/cue-steel-impact.wav','vfx_hit':'06-vfx/animated-v2/impact-silver.glb'}
for f in bindings['families']:
 found=next((r for r in recs if r['family_id']==f['family_id']),None)
 if found:f['portrait_asset']=found['asset'];f['art_status']='ilk aile konsepti hazır; her profil için ayrı sanat bekliyor'
bindings['art_slices']=recs
(D/'asset-bindings-v3.json').write_text(json.dumps(bindings,ensure_ascii=False,indent=2),encoding='utf-8')
# Narrative enemies keep their source identities and non-lethal/scripting constraints.
enemies=json.loads((D/'enemy-decks.json').read_text(encoding='utf-8'));cards=json.loads((D/'cards.json').read_text(encoding='utf-8'));aliases={'koru-jail-izci':('Torg / sabah nöbeti',[35,36],'Etkisizleştir; öldürme zafer koşulu yok.'),'koru-jail-reis':('Borin / demir eldiven',[26,29,30,31],'İlk karşılaşma senaryolu yenilgidir; Borin’in tüm Krovları temsil ettiği söylenmez.'),'valerus-loyal-reis':('Valerus / sadakat ziyafeti',[25,26,29,64,65],'Düellodan sağ çık; hikâye Tensar’ın gölgesinin gelişiyle devam eder. Valerus’un sonraki durumu s.97–98 belirsiz.'),'council-buyucu':('Konsey Elçisi / Gölge Yolu',[63,64,65,66],'Elçiye baskı kur; Fiona’yı hedef alma. Gölge Yolu geçişi sahne sonudur.')}
for e in enemies:
 if e['id'] in aliases:e['name'],e['source_pages'],e['story_role']=aliases[e['id']];e['provenance']='Ad/kimlik roman kanonu; deste/istatistik oyun önerisi.'
lookup={x['id']:x for x in cards}
for e in enemies:
 if e['id'] in aliases:lookup[e['unique_signature']]['name']=e['name'].split(' / ')[0]+' / '+lookup[e['unique_signature']]['name']
for filename,obj in [('enemy-decks.json',enemies),('cards.json',cards)]:(D/filename).write_text(json.dumps(obj,ensure_ascii=False,indent=2),encoding='utf-8')
# Keep the plain-text catalog in sync with the authoritative JSON.
import csv
with (D/'enemy-catalog.csv').open('w',encoding='utf-8-sig',newline='') as h:
 wr=csv.writer(h);wr.writerow(['ID','Düşman','Aile','Bölgeler','Rol','Seviye','Can','Deste','İmza kartı','Oynanış','Karşı hamle','Kaynak sayfalar','Sanat durumu'])
 for e in enemies:wr.writerow([e['id'],e['name'],e['family'],' / '.join(e['regions']),e['archetype'],e['tier'],e['health'],32,lookup[e['unique_signature']]['name'],e['ai_priority'],e['counterplay'],','.join(map(str,e['source_pages'])),e['art_status']])
with (D/'all-deck-lists.txt').open('w',encoding='utf-8') as h:
 for e in enemies:
  h.write(f"\n{e['name']} [{e['id']}]\n32 kart / {e['archetype']} / yalnız {e['family']}\n")
  for item in e['deck']:h.write(f"{item['count']}x {lookup[item['card_id']]['name']}\n")
  h.write('İmza: '+lookup[e['unique_signature']]['rules']+'\nKarşı hamle: '+e['counterplay']+'\n')
(D/'art/PRODUCTION-NOTES.txt').write_text('12 bölgesel/aile illüstrasyonu, yerleşik image_gen ile tek sanat yönü levhası olarak üretildi; dosyalar levhadan kayıpsız kesildi. Karah zırhlısı ve muhafız görselleri özgün konsepttir. Krov kaçak tasarımı daha hayvansı yüzlü yorum içerir ve kesin roman görünüşü sayılmaz; karakter modellemesinden önce anatomi/ırk kontrolü gerekir. 12 aile konsepti tüm 18 ailenin veya 288 profilin ayrı bitmiş illüstrasyonu değildir.',encoding='utf-8')
# UI/map state specification belongs to the asset pack, not the application.
states={'world_asset':'12-campaign-map/source-world/terrain/world.webp','native_model':'12-campaign-map/models/eruldin-campaign-map-v3.blend','runtime_model':'12-campaign-map/models/eruldin-campaign-map-v3.glb','world_pois':'12-campaign-map/data/atlas-original.json','local_campaign':'14-campaign/marcel-campaign.json','states':['undiscovered','available','selected','completed','locked','corrupted','rest','boss'],'state_rules':{'undiscovered':'Düşman portresi/gelecek olay metni gizli.','available':'Pirinç halka ve sakin amber ışık; renk yanında şekil işareti.','selected':'Portre + 32 kartlık desteden açığa çıkan aile ve mekanik ipucu; gizli el gösterilmez.','completed':'Oyulmuş damga; rota çizgisi sabit, yeniden oynama ilerleme artırmaz.','locked':'Kilidin nedeni ve gereken kontrol noktası yazılır.','corrupted':'Koru yıkımı sonrasında aynı yerel konumda farklı sahne durumu; dünya kıyısı yeniden çizilmez.','boss':'Çift halka; faz eşiği önceden görünür.'},'motion_design':{'camera_region_focus_ms':650,'node_selection_ms':220,'route_reveal_ms':480,'region_crystal_loop_ms':2500,'reduce_motion':'kamera sıçraması ve ışık salınımı kapanır'},'audio_bindings':{'select':'09-audio/ui-select.ogg','open_region':'09-audio/story-open.ogg','complete':'09-audio/cue-victory.wav'},'ranking_note':'Bölgesel keşifler ayrı keşif kaydıdır; kitabın ana ilerlemesini geçmez.','integration_status':'tasarım/veri bağlantısı; uygulamaya bağlanmadı'}
(M/'data/map-art-bindings-v3.json').write_text(json.dumps(states,ensure_ascii=False,indent=2),encoding='utf-8')
print('12 art slices, bindings and narrative identities saved')
