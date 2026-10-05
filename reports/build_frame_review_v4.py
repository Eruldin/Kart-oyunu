from pathlib import Path
from PIL import Image
import json,textwrap
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
P=Path.cwd()/'design-pack';OUT=P/'07-production/Eruldin-Kart-Cerceveleri-v4.pdf'
pdfmetrics.registerFont(TTFont('Body',str(P.parent/'reports/manrope-medium-pdf.ttf')));pdfmetrics.registerFont(TTFont('Title',str(P/'fonts/cinzel.ttf')))
c=canvas.Canvas(str(OUT),pagesize=(1200,800));c.setTitle('Eruldin / karakter görünürlüğü ve kart çerçeveleri v4')
I=HexColor('#e9e4d8');G=HexColor('#cfb27c');B=HexColor('#0b171c');M=HexColor('#9fb4b9');L=HexColor('#29434a');page=0
spec=json.loads((P/'04-card-frames/frame-layout-v4.json').read_text(encoding='utf-8'))['frames'];new=json.loads((P/'11-bindings/card-bindings-v4.json').read_text(encoding='utf-8'))['cards'];old=json.loads((P/'11-bindings/card-bindings-v2.json').read_text(encoding='utf-8'))['cards'];enemy=json.loads((P/'13-enemies/asset-bindings-v4.json').read_text(encoding='utf-8'));ecards=json.loads((P/'13-enemies/cards.json').read_text(encoding='utf-8'))
def text(x,y,s,size=13,col=I,font='Body'):c.setFillColor(col);c.setFont(font,size);c.drawString(x,y,s)
def start(title,sub):
 global page;page+=1;c.setFillColor(B);c.rect(0,0,1200,800,fill=1,stroke=0);text(45,750,title,27,G,'Title');text(45,716,sub,13,M);c.setStrokeColor(L);c.line(45,694,1155,694);text(45,25,'ERULDIN / YANKILAR  ·  ÇERÇEVE VE GÖRSEL YERLEŞİMİ v4  ·  ASSET PAKETİ',10,M);text(1130,25,str(page),12,G)
def end():c.showPage()
def card(d,x,y,w=176,h=267,before=False):
 art=d['illustration'];frame=d['full_frame']
 if before:
  c.saveState();p=c.beginPath();p.roundRect(x+w*.14,y+h*.405,w*.72,h*.48,32);c.clipPath(p,stroke=0,fill=0);c.drawImage(str(P/art),x+w*.075,y+h*.38,w*.85,h*.57,mask='auto');c.restoreState()
 else:
  s=spec[Path(frame).name];u0,v0,u1,v1=s['safe_art_rectangle_normalized'];xx=x+u0*w;yy=y+(1-v1)*h;ww=(u1-u0)*w;hh=(v1-v0)*h
  c.setFillColor(HexColor('#0c171a'));bounds=s['transparent_window_bounds'];nw,nh=s['native_size'];c.rect(x+bounds[0]/nw*w,y+(1-bounds[3]/nh)*h,(bounds[2]-bounds[0])/nw*w,(bounds[3]-bounds[1])/nh*h,fill=1,stroke=0)
  iw,ih=Image.open(P/art).size;scale=min(ww/iw,hh/ih);aw,ah=iw*scale,ih*scale;c.drawImage(str(P/art),xx+(ww-aw)/2,yy+(hh-ah)/2,aw,ah,mask='auto')
 c.drawImage(str(P/frame),x,y,w,h,mask='auto')
 c.setFillColor(I);costx=.18 if before else .122 if d['type']=='unit' else .074;costy=.86 if before else .923
 c.setFont('Body',13 if before else 10);c.drawCentredString(x+w*costx,y+h*costy-4,str(d['cost']))
 fs=8.7
 while pdfmetrics.stringWidth(d['name'],'Body',fs)>w*.78:fs-=.2
 c.setFont('Body',fs);c.drawCentredString(x+w*.50,y+h*.345,d['name'])
 rules=textwrap.wrap(d['text'],32);c.setFont('Body',7.6)
 for i,line in enumerate(rules[:6]):c.drawCentredString(x+w*.5,y+h*.258-i*10,line)
 if d['type']!='spell':
  c.setFont('Body',14);ax=.18 if before else .145 if d['type']=='unit' else .10;hx=.84 if before else .855 if d['type']=='unit' else .90
  c.drawCentredString(x+w*ax,y+h*.089,str(d['attack']));c.drawCentredString(x+w*hx,y+h*.089,str(d['health']))
start('Yüzü kapatan süsler kaldırıldı','Aynı karakter görseli / eski kırpma ve yeni güvenli yerleşim')
for i,cid in enumerate(['akhenten','onbion']):
 for j,group in enumerate([old,new]):
  d=next(a for a in group if a['id']==cid);x=70+i*580+j*245;text(x,650,('ÖNCE' if j==0 else 'SONRA')+' / '+d['name'],15,G if j else M);card(d,x,250,215,326,before=j==0)
text(70,171,'Düz üst kenar · dışarı alınmış süsler · küçük maliyet rozeti · oranı korunmuş portre',15,G)
text(70,136,'Yeni yerleşimde kaynak görsel kırpılmadan şeffaf pencereye sığar. Yüz ve silah üstündeki çerçeve örtüşmesi giderildi.',13)
end()
start('Şampiyon ve birim kartları','7 karakter / çerçeve düzeltmesi gerçek görsellerin tamamında kontrol edildi')
characters=[d for d in new if d['type']!='spell']
for i,d in enumerate(characters):x=65+(i%4)*286;y=366-(i//4)*302;card(d,x,y);text(x, y-15,d['name'],10,M)
end()
start('Büyü kartları / ortak pencere','Büyü çerçevesi de dikdörtgen ve açık; çerçeve görselin içine taşmıyor')
for i,d in enumerate([d for d in new if d['type']=='spell']):
 x=52+(i%3)*385;y=364-(i//3)*301;card(d,x,y,176,267);text(x+188,y+235,d['name'],13,G)
 for j,line in enumerate(textwrap.wrap(d['text'],24)):text(x+188,y+205-j*18,line,11)
end()
enemylist=[f for f in enemy['families'] if f['portrait_asset']]
for group in [enemylist[:6],enemylist[6:]]:
 start('Düşman kartları / açık portre','Karah, asker ve muhafız aileleri / aynı ince çerçeve, farklı karakter siluetleri')
 for i,f in enumerate(group):
  cc=next(a for a in ecards if a['family']==f['family_id'] and a['type']=='birim');d={'illustration':f['portrait_asset'],'full_frame':'04-card-frames/unit-frame-v4.png','type':'unit','name':cc['name'],'cost':cc['cost'],'attack':cc['attack'],'health':cc['health'],'text':cc['rules']};x=50+(i%3)*385;y=362-(i//3)*300;card(d,x,y);text(x+190,y+234,cc['name'],12,G)
  for j,line in enumerate(textwrap.wrap(cc['rules'],26)):text(x+190,y+205-j*17,line,10)
 end()
start('Masa kartları / değerler alt şeritte','Saldırı ve can rozetleri portreye taşmıyor; portre esnetilmiyor ve kesilmiyor')
for i,d in enumerate(characters):
 x=64+(i%4)*286;y=385-(i//4)*283;w,h=208,239;frame=d['board_frame'];s=spec[Path(frame).name];u0,v0,u1,v1=s['safe_art_rectangle_normalized'];iw,ih=Image.open(P/d['illustration']).size;ww=(u1-u0)*w;hh=(v1-v0)*h;scale=min(ww/iw,hh/ih);aw,ah=iw*scale,ih*scale
 c.drawImage(str(P/d['illustration']),x+u0*w+(ww-aw)/2,y+(1-v1)*h+(hh-ah)/2,aw,ah,mask='auto');c.drawImage(str(P/frame),x,y,w,h,mask='auto');c.setFillColor(I);c.setFont('Body',15);attackx=.150 if d['type']=='champion' else .201;c.drawCentredString(x+w*attackx,y+h*.145,str(d['attack']));c.drawCentredString(x+w*.867,y+h*.145,str(d['health']));text(x,y-16,d['name'],12,G)
text(45,51,'5 yeni RGBA çerçeve + güvenli portre yerleşimi. Tasarım/asset paketi; uygulama koduna bağlanmadı.',12,M)
end();c.save();print('6-page frame review saved')
