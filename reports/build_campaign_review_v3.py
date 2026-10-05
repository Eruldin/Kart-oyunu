from pathlib import Path
import json,textwrap
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
P=Path.cwd()/'design-pack';O=P/'07-production/Eruldin-Harita-ve-Dusmanlar-v3.pdf'
pdfmetrics.registerFont(TTFont('Body',str(P.parent/'reports/manrope-medium-pdf.ttf')));pdfmetrics.registerFont(TTFont('Title',str(P/'fonts/cinzel.ttf')))
c=canvas.Canvas(str(O),pagesize=(1200,800));c.setTitle('Eruldin: Harita, kampanya ve düşman setleri v3');c.setAuthor('Eruldin sanat ve içerik tasarımı')
G=HexColor('#cfb27c');I=HexColor('#e9e4d8');M=HexColor('#a6b7b9');B=HexColor('#0b171c');L=HexColor('#29434a');page=0
def text(x,y,s,size=14,col=I,font='Body'):
 c.setFont(font,size);c.setFillColor(col);c.drawString(x,y,str(s))
def para(x,y,s,width=65,size=13,lead=20):
 for line in textwrap.wrap(s,width):text(x,y,line,size);y-=lead
 return y
def start(title,sub):
 global page;page+=1;c.setFillColor(B);c.rect(0,0,1200,800,fill=1,stroke=0);text(46,750,title,27,G,'Title');text(46,716,sub,13,M);c.setStrokeColor(L);c.line(46,694,1154,694);text(46,25,'ERULDIN / YANKILAR   ·   HARİTA VE ASSET PAKETİ v3   ·   TASARIM ÖNERİSİ',10,M);text(1130,25,page,12,G)
def end():c.showPage()
def image(path,x,y,w,h):c.drawImage(str(P/path),x,y,w,h,preserveAspectRatio=True,anchor='c',mask='auto')
atlas=json.loads((P/'12-campaign-map/data/atlas-original.json').read_text(encoding='utf-8'));fams=json.loads((P/'13-enemies/families.json').read_text(encoding='utf-8'));enemies=json.loads((P/'13-enemies/enemy-decks.json').read_text(encoding='utf-8'));cards=json.loads((P/'13-enemies/cards.json').read_text(encoding='utf-8'));lookup={x['id']:x for x in cards};story=json.loads((P/'14-campaign/marcel-campaign.json').read_text(encoding='utf-8'));bind=json.loads((P/'13-enemies/asset-bindings-v3.json').read_text(encoding='utf-8'))
start('Dünya, hikâye ve düşman kimliği','288 ayrı deste · 18 tematik aile · 720 kart tasarımı · gerçek arazi geometrisi')
image('12-campaign-map/models/teolam-campaign-map-preview.png',46,144,1108,535)
para(46,113,'Harita sitesinin kaynak klasörü korunarak sanat ve koordinatlar ayrı pakete kopyalandı. Bu harita PNG arka planı yerine yükseklik geometrisi, özgün doku, fiziksel masa ve bölge işaretleri içerir.',145,13,20)
end()
start('Özgün coğrafya korunuyor','Ana dünya: m2026 koordinat uzayı · 62 kaynak POI · 7 bölgesel tasarım alanı')
image('12-campaign-map/source-world/terrain/world.webp',46,139,1108,554)
for rid in ['teomli','shi-qra','serath','aldemir','val-teresh','ebedi-buzullar']:
 p=next(x for x in atlas['points'] if x['id']==rid);x=46+p['x']*1108;y=139+(1-p['y'])*554
 c.setFillColor(G);c.circle(x,y,4,fill=1,stroke=0);label=p.get('ad',p.get('name',rid));lw=pdfmetrics.stringWidth(label,'Body',12);c.setFillColor(B);c.roundRect(x+4,y-1,lw+12,22,4,fill=1,stroke=0);text(x+10,y+5,label,12,G)
para(46,105,'Zağra Khur ayrı çöl krokisinin col uzayındadır. Marcel’in yerleri bu atlasın POI listesinde yok: Korvengrad ve Koru için kesin dünya koordinatı uydurulmadı. Yerel rota sonraki sayfadadır.',144,13,20)
end()
start('Marcel kampanyası / yerel rota','Kitaptaki sıra korunur · bu çizim Teolam üzerindeki kesin coğrafi konum değildir')
for ch in range(1,8):
 row=[n for n in story['nodes'] if n['chapter']==ch];y=648-(ch-1)*79
 text(48,y,f"{ch:02}  {row[0]['chapter_title']}",12,G);text(896,y,f"PDF s. {row[0]['source_page_range'][0]}–{row[0]['source_page_range'][1]}",10,M)
 for j,n in enumerate(row):
  step=1104/len(row);bw=step-10;x=48+j*step;c.setFillColor(HexColor('#13272e'));c.setStrokeColor(L);c.roundRect(x,y-53,bw,40,6,fill=1,stroke=1)
  fs=10.3
  while pdfmetrics.stringWidth(n['title'],'Body',fs)>bw-18:fs-=.2
  typelabel={'battle':'savaş','story':'hikâye','special':'senaryo','survival':'hayatta kalma','rest':'dinlenme','exploration':'keşif','stealth':'sızma'}[n['type']]
  text(x+9,y-29,n['title'],fs,I);text(x+9,y-44,f"{n['completed_checkpoint']:02} / {typelabel}",8,M)
  if j<len(row)-1:c.setStrokeColor(G);c.line(x+bw+1,y-33,x+step-3,y-33)
para(48,80,'Ölüler Bataklığı s.82–84’te planlanan sonraki yoldur; eldeki kesitte varış sahnesi yoktur. Bölgesel keşifler ayrı oyun genişlemesi olarak tutulur.',141,12,18)
end()
start('Düşmanların görsel dili','12 özgün aile konsepti · yüzlerce bitmiş portre iddiası değildir')
image('13-enemies/art/enemy-art-direction-reviewed-v3.png',46,78,840,598)
labels=['Karah / sürü','Karah / zırhlı','Korvengrad / muhafız','Korvengrad / yozlaşmış','Koru / zindan','Valerus / sadık birlik','Kızıl Kale / kelebek','Konsey / Gölge Yolu','Kül Tarlaları / yağmacı','Bataklık / sanrı','Shi Qra / kaçak','Buzullar / yırtıcı']
for i,s in enumerate(labels):text(916,650-i*40,f'{i+1:02}  {s}',11,G if i%4==0 else I)
end()
def card(data,art,x,y,w=174,h=263):
 c.saveState();p=c.beginPath();p.roundRect(x+w*.14,y+h*.405,w*.72,h*.48,24);c.clipPath(p,stroke=0,fill=0);c.drawImage(str(P/art),x+w*.10,y+h*.40,w*.8,h*.52,mask='auto');c.restoreState()
 image('04-card-frames/unit-frame-v1.png',x,y,w,h)
 c.setFillColor(I);c.setFont('Body',16);c.drawCentredString(x+w*.18,y+h*.86,str(data['cost']))
 fs=9
 while pdfmetrics.stringWidth(data['name'],'Body',fs)>w*.77:fs-=.2
 c.setFont('Body',fs);c.drawCentredString(x+w*.5,y+h*.355,data['name'])
 for i,line in enumerate(textwrap.wrap(data['rules'],28)[:6]):c.setFont('Body',7.7);c.drawCentredString(x+w*.5,y+h*.298-i*9.5,line)
 c.setFont('Body',16);c.drawCentredString(x+w*.18,y+h*.105,str(data['attack']));c.drawCentredString(x+w*.84,y+h*.105,str(data['health']))
start('Kart tasarım provası','Aile resimleri ve gerçek metin dizgisi · istatistikler denge testi bekliyor')
sampleids=['karah-crawler','karah-armored','korvengrad-watch','koru-jail','butterfly-guard','council']
for i,fid in enumerate(sampleids):
 x=40+(i%3)*395;y=371-(i//3)*298;data=lookup[fid+'-c00'];art=next(f for f in bind['families'] if f['family_id']==fid)['portrait_asset'];card(data,art,x,y)
 f=next(f for f in fams if f['id']==fid);text(x+185,y+239,f['name'],11,G);para(x+185,y+205,f['passive_design'],25,11,16);para(x+185,y+83,'Deste kuralı: yalnız kendi ailesinden kartlar. Yabancı şampiyon ve nötr kart yok.',25,10,15)
end()
start('İki düşman / iki ayrı deste','Her biri 32 kart · aile havuzu + 1 özel imza · kart metinleri cards.json içinde')
for col,eid in enumerate(['karah-crawler-avci','korvengrad-watch-muhafiz']):
 e=next(e for e in enemies if e['id']==eid);x=48+col*568;text(x,650,e['name'],17,G);text(x,621,'ROL: '+('İŞARET AVCISI' if col==0 else 'SİPER MUHAFIZI'),12,M)
 for j,item in enumerate(e['deck']):text(x,586-j*21,f"{item['count']}x  {lookup[item['card_id']]['name']}",12)
 y=para(x,191,'İmza: '+lookup[e['unique_signature']]['rules'],64,12,18);para(x,y-8,'Karşı hamle: '+e['counterplay'],64,12,18)
end()
start('18 aile / mekanik ve atmosfer','Her ailede 16 düşman rolü · kültür ile düşmanlık aynı şey değildir')
for i,f in enumerate(fams):
 y=650-i*30;c.setFillColor(HexColor('#14272c') if i%2==0 else B);c.rect(46,y-13,1108,29,fill=1,stroke=0)
 text(56,y,f'{i+1:02}  {f["name"]}',11,G);text(388,y,' / '.join(f['regions']),10,M)
 passive=f['passive_design'];parts=textwrap.wrap(passive,65);text(691,y+3,parts[0],9,I)
 if len(parts)>1:text(691,y-8,parts[1],9,I)
para(48,78,'Aile adları ve büyü/birim çeşitleri oyun eklemesidir. Torg, Borin, Valerus ve Konsey Elçisi, kaynak sahnelerine bağlı özel kimliklerle katalogda bulunur.',143,12,18)
end()
start('Deste davranışı / okunabilir karşı hamle','16 rol yalnız istatistik değişikliği değildir; farklı kart seçimi, imza ve öncelik kullanır')
roles=['izci','surucu','avci','muhafiz','duellocu','kusatmaci','pusucu','buyucu','toplayici','karsici','dirilen','donusturucu','tuketici','koruyucu','elit','reis']
for i,rid in enumerate(roles):
 e=next(e for e in enemies if e['id']=='karah-crawler-'+rid);x=48+(i//8)*568;y=650-(i%8)*72
 text(x,y,e['name'].split(' — ')[-1],13,G);para(x+118,y,e['ai_priority'],58,10,14);para(x+118,y-30,'Cevap: '+e['counterplay'],58,10,14)
end()
start('Bölge bölge keşif / 112 karşılaşma','7 bölge × 16 düğüm · her keşif hattı ana hikâyeden ayrı açılır')
for i,r in enumerate(atlas['regions']):
 y=650-i*77;text(48,y,r['name'],17,G);para(48,y-22,r['subtitle'],40,11,16)
 # Regional topology matches layout_xy and branches_to in the exported asset data.
 for j in range(16):
  x=440+(j%4)*62;yy=y+5-(j//4)*16;c.setStrokeColor(L)
  if j<15:
   nj=j+1;c.line(x,yy,440+(nj%4)*62,y+5-(nj//4)*16)
  c.setFillColor(G if j==15 else HexColor('#466974'));c.circle(x,yy,4 if j==15 else 3,fill=1,stroke=0)
 text(775,y,'Normal / elit / bölge reisi',12);para(775,y-24,'Ödül: keşif kaydı ve bölge kozmetiği. Roman ilerlemesi artırılmaz.',48,11,16)
end()
start('Kanon sınırları ve üretim durumu','Kitap temeli ve yeni oyun içeriği ayrı işaretlendi')
left=[('Fiona','s.66 Gölge Yolu, s.86–100 Kızıl Kale. Hayatta; öldürme hedefi değildir.'),('Torg / Gorn','Torg s.36 etkisizleştirilir; Gorn s.61–62 yardımcıdır. Krovlar topluca düşman değildir.'),('Primus','s.42–44 ilk çizgide yenilgi, ardından Yankı geçişi. Kesitin sonunda Kral’a karşı final zaferi yok.'),('Tensar / Valerus','s.67–70 gölge tezahürü. Valerus’un ölümcül saldırısı ile s.97–98’deki hayatta olduğu sözü arasındaki belirsizlik korunur.'),('Kızıl Kale','s.88 ağızsız kelebek maskeleri; s.94 siyah metal koltuk; s.98 kelebek. Anzer’in gizli motivasyonu kesinleştirilmedi.')]
for i,(title,body) in enumerate(left):y=646-i*99;text(48,y,title,15,G);para(48,y-26,body,66,12,18)
text(662,647,'HAZIR DOSYALAR',18,G,'Title');para(662,612,'Blender + GLB harita; 13 kopya arazi asseti; 62 POI; 42 ana kontrol noktası; 112 keşif düğümü; 288 özel deste; 720 kart metni; 12 aile illüstrasyonu; CSV, JSON ve tam deste listeleri.',58,14,23)
text(662,390,'ÜRETİMDE DEVAM EDECEK',18,G,'Title');para(662,355,'Her düşman/kart için ayrı final illüstrasyon; final PBR/LOD; denge testi; motor uygulaması; sunucu doğrulaması. Bu paket uygulama koduna bağlanmadı.',58,14,23)
para(662,184,'Sıralama: en yüksek tamamlanmış ana hikâye kontrol noktası, ardından aynı noktadaki sezon rekabet puanı. Tekrar oyunları ve keşifler hikâye sırasını yükseltmez.',58,13,20)
end();c.save();print('10-page review saved')
