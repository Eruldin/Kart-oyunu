from pathlib import Path
import json,shutil,hashlib
P=Path.cwd()/'design-pack';S=Path('C:/Users/PC/Desktop/Eruldin Destanı haritası sitesi')
def read(p):return json.loads((P/p).read_text(encoding='utf-8'))
def write(p,o):(P/p).write_text(json.dumps(o,ensure_ascii=False,indent=2),encoding='utf-8')
story=read('14-campaign/marcel-campaign.json');remap={};ranges={1:[1,16],2:[17,24],3:[25,38],4:[39,56],5:[57,72],6:[73,85],7:[86,100]}
for n in story['nodes']:
 old=n['id'];ch=n['chapter'];j=int(old[-2:])
 if ch==6 and j<=2:n['chapter']=5;n['chapter_title']='Koru';n['id']=f'marcel-05-{j+6:02}'
 elif ch==6:n['id']=f'marcel-06-{j-2:02}'
 n['source_page_range']=ranges[n['chapter']];remap[old]=n['id']
for e in story['edges']:e['from']=remap[e['from']];e['to']=remap[e['to']]
for ch in range(1,8):
 row=[n for n in story['nodes'] if n['chapter']==ch]
 for j,n in enumerate(row):n['route_layout_xy']=[.08+j*.84/(len(row)-1),.88-(ch-1)*.122]
story['chapter_source_ranges']=ranges;story['relative_spatial_facts']=[{'from':'Korvengrad','to':'Koru / direniş üssü','bearing':'kuzeybatı','distance_km':20,'source_pdf_page':13,'certainty':'Fiona’nın tarifi; dünya atlasındaki koordinatı ayrıca doğrulanmamış'},{'from':'Kuzgunyuvası','via':'Ölüler Bataklığı','to':'Başkent','source_pdf_pages':[82,84],'certainty':'Planlanan yol; bu kesitte Marcel henüz geçmedi.'}]
write('14-campaign/marcel-campaign.json',story)
pres=read('12-campaign-map/data/source-preservation.json');out=P/'12-campaign-map/region-art';out.mkdir(exist_ok=True)
for name in ['teomli','shi-qra','serath','aldemir','val-teresh','zagra-khur','ebedi-buzullar']:
 src=S/f'public/assets/concepts/{name}.webp';dst=out/f'{name}.webp';shutil.copy2(src,dst);h=hashlib.sha256(src.read_bytes()).hexdigest();pres['copies'].append({'source':str(src),'asset':dst.relative_to(P).as_posix(),'bytes':src.stat().st_size,'sha256_source':h,'sha256_copy':hashlib.sha256(dst.read_bytes()).hexdigest(),'source_mtime_ns':src.stat().st_mtime_ns})
write('12-campaign-map/data/source-preservation.json',pres)
exps=read('12-campaign-map/data/regional-expeditions.json')
for e in exps:e['region_art_asset']=f"12-campaign-map/region-art/{e['region_id']}.webp"
write('12-campaign-map/data/regional-expeditions.json',exps)
tokens=[]
families=read('13-enemies/families.json');cards=read('13-enemies/cards.json')
for f in families:
 base=next(c for c in cards if c['family']==f['id'] and c['type']=='birim')
 for suffix,a,h in [('helper11',1,1),('helper12',1,2)]:tokens.append({'id':f['id']+'-'+suffix,'family':f['id'],'name':base['name']+' / geçici yardımcı','type':'token','cost':0,'attack':a,'health':h,'deck_legal':False,'art_status':'ayrı token sanatı üretim kuyruğunda'})
tokens.append({'id':'living-fortress-wall03','family':'living-fortress','name':'Duvar Damarı','type':'token','cost':0,'attack':0,'health':3,'deck_legal':False})
write('13-enemies/tokens.json',tokens)
textfile=P/'14-campaign/KANON-VE-UYARLAMA.txt';t=textfile.read_text(encoding='utf-8');t+='\nROMANIN GERÇEK BÖLÜM SINIRLARI\n1: 1–16; 2: 17–24; 3: 25–38; 4: 39–56; 5: 57–72; 6: 73–85; 7: 86–100. Koru yıkımı 5. bölüm sonundadır; kampanya düğümleri buna göre hizalandı. Koru, Fiona’nın s.13 tarifine göre Korvengrad’ın 20 km kuzeybatısındadır; bu göreli tarif korunur.\n';textfile.write_text(t,encoding='utf-8')
print('Canonical chapter boundaries aligned, 7 regional artworks copied, 37 tokens specified')
