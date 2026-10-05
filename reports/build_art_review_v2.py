from pathlib import Path
import json, textwrap
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from fontTools.ttLib import TTFont as FontToolsFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT=Path(r'C:\Users\PC\Desktop\Marcel Kart Oyunu\design-pack')
OUT=ROOT/'07-production/Eruldin-Sanat-ve-Akis-v2.pdf'
medium=ROOT.parent/'reports/manrope-medium-pdf.ttf'
instantiateVariableFont(FontToolsFont(str(ROOT/'fonts/manrope.ttf')),{'wght':500},inplace=False).save(str(medium))
pdfmetrics.registerFont(TTFont('Manrope',str(medium)))
pdfmetrics.registerFont(TTFont('Cinzel',str(ROOT/'fonts/cinzel.ttf')))
W,H=1200,800
c=canvas.Canvas(str(OUT),pagesize=(W,H));c.setTitle('Eruldin: Yankılar — sanat ve akış v2');c.setAuthor('Eruldin tasarım çalışması')
BG=HexColor('#0c171c');GOLD=HexColor('#c9aa6c');INK=HexColor('#e9e4d8');MUTED=HexColor('#a5b4b6')
page=0
def txt(x,y,text,size=14,color=INK,font='Manrope'):
    c.setFillColor(color);c.setFont(font,size);c.drawString(x,y,text)
def para(x,y,text,width=70,size=14,leading=22):
    for line in textwrap.wrap(text,width):txt(x,y,line,size);y-=leading
    return y
def start(title,subtitle):
    global page
    page+=1;c.setFillColor(BG);c.rect(0,0,W,H,fill=1,stroke=0)
    txt(48,750,title,28,GOLD,'Cinzel');txt(48,715,subtitle,13,MUTED)
    c.setStrokeColor(HexColor('#304548'));c.line(48,692,W-48,692)
    txt(48,26,'ERULDIN / YANKILAR    ·    SANAT VE ASSET PAKETİ v2    ·    6 EKİM 2026',10,MUTED)
    txt(W-68,26,str(page),11,GOLD)
def img(path,x,y,w,h):c.drawImage(str(ROOT/path),x,y,w,h,preserveAspectRatio=True,anchor='c',mask='auto')
def end():c.showPage()
start('Dünyaya ilk adım','Açılış konsepti · tek eylem, güçlü atmosfer, okunabilir başlık')
img('10-screen-designs/title-concept-v2.png',48,150,1104,522)
para(48,118,'Başla → ilk kısa hikâye → rehberli karşılaşma. Geri dönen oyuncuda Devam et. Açılıştaki mum/ocak/kale gelecekte ayrı 3D sahne öğeleridir; bu PNG sanat yönü örneğidir.',130,13,20)
end()
start('Menüden hikâyeye','Birincil eylem: Hikâyeye devam et · sıralama ilerleme kategorisine bağlı')
img('05-interface/main-menu-concept-v1.png',48,324,700,350)
txt(782,638,'TASARIM KARARLARI',17,GOLD,'Cinzel')
para(782,603,'Bir ana eylem. Yankı ve deste seçimi görünür, fakat hikâye odağını bastırmaz.',36,14)
para(782,495,'En ileri tamamlanan karşılaşma kategori rozetidir. Aynı kategoride rekabet puanı sıralar.',36,14)
para(782,365,'Gelecek bölümler açılana kadar spoiler içeren ad ve resimler saklanır.',36,14)
steps=['Katedral','Kül Tarlaları','Kırık Köprü','Koru','Kilitli Yankı']
for i,label in enumerate(steps):
    x=128+i*228
    if i<4:c.setStrokeColor(HexColor('#53666b'));c.line(x,234,x+228,234)
    node='05-interface/story-completed-v1.png' if i==0 else '05-interface/story-current-v1.png' if i==1 else '05-interface/story-locked-v1.png'
    # Find source filename without assuming generated suffix spelling.
    candidates=list((ROOT/'05-interface').glob('*'+('completed' if i==0 else 'current' if i==1 else 'locked')+'*.png'))
    if candidates:img(str(candidates[0].relative_to(ROOT)),x-34,200,68,68)
    txt(x-64,170,label,13,GOLD if i<2 else MUTED)
para(48,111,'Akış: düğüm → kısa bölüm özeti → Yankı/deste → karşılaşma → ödül → yeni düğüm. Eğitim: kart oynama, saldırı/savunma, büyü yanıtı. Harita ve kurallar tasarım önerisidir.',135,13,20)
end()
start('Karşılaşma: bilgi ve hareket','Tam kart elde · kompakt birim tahtada · tek ana eylem sağ kenarda')
img('10-screen-designs/battle-concept-v2-reviewed.png',48,125,1104,555)
para(48,98,'Görsel bir oynanış kaydı değildir. Kural metni gerçek fontla ayrı katman olarak dizilir. Hedef seçimi, hazırlık, darbe ve sönme; kaynak/değerlerin okunabilirliğini korur.',138,12,18)
end()
cards=json.loads((ROOT/'11-bindings/card-bindings-v2.json').read_text(encoding='utf-8'))['cards']
def card(card,x,y,w=175,h=264):
    c.saveState()
    # Document composition: original raster art/frame with separately typeset real game text.
    p=c.beginPath();p.roundRect(x+w*.14,y+h*.405,w*.72,h*.48,32)
    c.clipPath(p,stroke=0,fill=0)
    c.drawImage(str(ROOT/card['illustration']),x+w*.075,y+h*.38,w*.85,h*.57,mask='auto')
    c.restoreState()
    c.drawImage(str(ROOT/card['full_frame']),x,y,w,h,mask='auto')
    c.setFillColor(INK);c.setFont('Manrope',17);c.drawCentredString(x+w*.18,y+h*.86,str(card['cost']))
    label=card['name'];fs=9
    while pdfmetrics.stringWidth(label,'Manrope',fs)>w*.75:fs-=.25
    c.setFont('Manrope',fs);c.drawCentredString(x+w*.5,y+h*.355,label)
    rule=card['text'];lines=textwrap.wrap(rule,29)[:5]
    c.setFont('Manrope',8)
    for n,line in enumerate(lines):c.drawCentredString(x+w*.5,y+h*.295-n*10,line)
    if card['type']!='spell':
        c.setFont('Manrope',17);c.drawCentredString(x+w*.18,y+h*.105,str(card['attack']));c.drawCentredString(x+w*.84,y+h*.105,str(card['health']))
    else:c.setFont('Manrope',8);c.drawCentredString(x+w*.5,y+h*.10,'BÜYÜ')
for group,title in [(cards[:6],'Kart seti · karakterler'),(cards[6:],'Kart seti · zırh ve büyüler')]:
    start(title,'12 kartın gerçek metinle dizilmiş tasarım provası · tüm sayısal değerler öneridir')
    for i,carddata in enumerate(group):
        x=40+(i%3)*395;y=374-(i//3)*299
        card(carddata,x,y)
        txt(x+187,y+240,carddata['id'],12,GOLD)
        txt(x+187,y+217,'Şampiyon' if carddata['type']=='champion' else 'Büyü' if carddata['type']=='spell' else 'Birim',12,MUTED)
        para(x+187,y+186,carddata['text'],23,11,17)
        para(x+187,y+78,carddata['source'],26,9,13)
    end()
start('Efekt: hazırlık / darbe / sönme','Statik RGBA doku + hareketli GLB klibi + ses olayı ayrı assetlerdir')
effects=['summon-amber','impact-silver','heal-gold-green','white-echo','karah-ink','victory-shards']
labels=['Çağırma','Çelik darbesi','İyileştirme','Beyaz Yankı','Karah / kül','Zafer']
for i,(name,label) in enumerate(zip(effects,labels)):
    x=58+i*187;img(f'06-vfx/{name}-texture-v1.png',x,430,160,160);txt(x,402,label,14,GOLD)
txt(58,331,'ÖRNEK: YANKI YETENEĞİ',18,GOLD,'Cinzel')
for x,label,time in [(80,'Hazırlık',260),(440,'Darbe',650),(950,'Sönme',1500)]:
    c.setStrokeColor(GOLD);c.circle(x,268,5,stroke=1,fill=0);txt(x-8,238,f'{time} ms',14);txt(x-8,214,label,14,MUTED)
c.line(80,268,950,268)
para(58,159,'Klipler alfa dokulu bir düzlem ve on hareketli mesh parçasından oluşur. GLB dönüşüm animasyonunu taşır; final opaklık eğrisi olay verisindedir. Oyun içi senkronizasyon ve shader kabulü yapılmadı.',132,14,22)
end()
start('Ses: malzeme ve olay','24 dosya · 7 katmanlı ses tasarımı · kaynak ve lisans kaydı')
items=[('Kart çek / yerleştir','Kenney kitap ve eşya kayıtları'),('Saldırı / çelik','Bıçak sürtünmesi + metal darbe'),('Hatırlama / iyileştirme','Cam + perde/zamanı düzenlenmiş çan'),('Karah / kül','Yavaşlatılmış gıcırtı, kumaş ve ağır darbe'),('Yankı / zafer','Katmanlı çan, cam ve metal'),('Çevre','PagDev Fireplace Sound loop, CC0'),('Müzik','Scott Buckley — The Illusionist, CC-BY 4.0')]
for i,(name,description) in enumerate(items):
    y=646-i*54;txt(58,y,name,15,GOLD);txt(335,y,description,15)
txt(58,240,'ZORUNLU MÜZİK ATFI',17,GOLD,'Cinzel')
para(58,210,"'The Illusionist' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au",110,15,23)
para(58,145,'FFprobe + FFmpeg: 24 dosyanın biçim, süre ve çözümleme kontrolü tamamlandı. Final dinleme/mastering, cihaz miksajı ve müzik döngü kabulü yapılmadı. Müzik/SFX ayrı kapatılmalı; Yankı sırasında müzik 6 dB azaltılmalı.',125,14,22)
end()
start('3D ve teslim sınırı','Tahta, kale, mum, ocak ve çevre hareketi gerçek model dosyalarıdır')
img('08-3d/previews/board-camera-frame001.png',48,240,705,430)
txt(790,635,'DOSYALAR',18,GOLD,'Cinzel')
para(790,593,'Düzenlenebilir Blender tahta sahnesi; tam sahne ve dört alt GLB. VFX için ayrı Blender sahnesi ve altı GLB klibi.',35,14,22)
para(790,423,'Kart, çerçeve, efekt, ses ve ekran ilişkileri JSON teslim verisi. Eski uygulamaya entegrasyon bu paketin kapsamında değil.',35,14,22)
para(48,185,'Bu paket sanat yönünü somutlaştırır; LoR ile aynı final üretim kalitesine ulaşıldığı iddiası taşımaz. 3D final sculpt/PBR/UV/LOD, ortak kart şablonu, tüm arayüz durumları, cihaz/kontrast kontrolü ve insan oyun testi bekliyor.',130,14,22)
para(48,99,'İnceleme kaynakları: resmî LoR oynanış videosu (2019 dönemi), Riot Path of Champions rehberi (2022), Riot sanat/teknik yazıları. Güncel istemciyi tamamen oynayarak inceleme yapılmadı.',136,12,18)
end();c.save();print(OUT)
