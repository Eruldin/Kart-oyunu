// Character identities refer to the supplied book. All numerical rules are design proposals.
export const cards = [
 {id:'marcel',name:'Marcel',en:'Marcel',type:'champion',cost:3,attack:3,health:4,art:0,group:'ash',keyword:'yanki',text:'Oynandığında ek 1 Hatıra kazan. Her saldırıda +1 güç.',source:'M s.1–6',effect:'memory'},
 {id:'akhenten',name:'Akhenten',en:'Akhenten',type:'champion',cost:4,attack:3,health:7,art:3,group:'grove',keyword:'siper',text:'Siper: düşman hedefli büyüler önce beni hedeflemeli.',source:'M s.40, 50'},
 {id:'onbion',name:'Onbion',en:'Onbion',type:'champion',cost:4,attack:5,health:3,art:5,group:'ash',keyword:'iz',text:'İz: saldırıda savunandan önce hasar veririm.',source:'M s.52–55'},
 {id:'karah',name:'Karah',en:'Karah',type:'unit',cost:2,attack:3,health:2,art:4,group:'void',keyword:'',text:'Külün içinden gelen, katranla örtülü bir kâbus.',source:'M s.3–6'},
 {id:'karah-heavy',name:'Karah • Obsidyen',en:'Karah • Obsidian',type:'unit',cost:4,attack:5,health:5,art:4,group:'void',keyword:'',text:'Karanlık güç. Yüksek bedel, yüksek tehdit.',source:'M s.4; variant design proposal'},
 {id:'white',name:'Beyaz Saçlı Marcel',en:'White-haired Marcel',type:'unit',cost:3,attack:2,health:4,art:1,group:'echo',keyword:'yanki',text:'Oynandığında ek 1 Hatıra kazan ve 1 kart çek.',source:'M s.45–47',effect:'recall'},
 {id:'teom',name:'Teom Zırhlı Marcel',en:'Teom-armored Marcel',type:'unit',cost:5,attack:4,health:7,art:2,group:'echo',keyword:'siper',text:'Siper. Oynandığında Bütünlüğünü 2 yenile.',source:'M s.45',effect:'restore'},
 {id:'blade',name:'Teom Çeliği',en:'Teom Steel',type:'spell',cost:2,art:6,group:'echo',keyword:'anlik',text:'Seçilen düşmana 3 hasar ver. Hamle hakkını koru.',source:'M s.5–6; mechanical interpretation',effect:'damage',value:3,target:true},
 {id:'memory',name:'Hatırlama',en:'Remembrance',type:'spell',cost:1,art:7,group:'echo',keyword:'anlik',text:'2 kart çek. 1 Hatıra kazan. Hamle hakkını koru.',source:'M s.8; mechanical interpretation',effect:'draw',value:2},
 {id:'fire',name:'Ocak Işığı',en:'Hearthlight',type:'spell',cost:2,art:8,group:'grove',keyword:'anlik',text:'Bütünlüğünü 5 yenile. Hamle hakkını koru.',source:'M s.15; mechanical interpretation',effect:'heal',value:5},
 {id:'ash',name:'Küllerin Ağırlığı',en:'Weight of Ash',type:'spell',cost:3,art:9,group:'ash',keyword:'',text:'Tüm düşman birimlerine 2 hasar ver.',source:'M chapter 2 title; mechanical interpretation',effect:'aoe',value:2},
 {id:'family',name:'Seçilmiş Aile',en:'Chosen Family',type:'spell',cost:3,art:10,group:'grove',keyword:'',text:'Tüm dost birimlere +1 güç ve +2 dayanıklılık.',source:'M s.55; mechanical interpretation',effect:'buff',value:1}
];
export const cardById = Object.fromEntries(cards.map(c=>[c.id,c]));
export const echoes = [
 {id:'ash',name:'Çamur & Kül',en:'Mud & Ash',art:0,subtitle:'Hayatta kalmak da bir seçimdir.',passive:'İlk birimin +1 dayanıklılıkla başlar.',ultimate:'Külün İçinden',ultimateText:'Tüm dost birimlere +2 güç. 3 Bütünlük yenile.',effect:'rally'},
 {id:'white',name:'Beyaz Saçlı',en:'White-haired',art:1,subtitle:'Her hatıra yeni bir olasılık.',passive:'Koşuya 1 Hatıra ile başla.',ultimate:'Hatıra Kapısı',ultimateText:'1 kart çek. 3 Öz ve 6 Bütünlük yenile.',effect:'recall'},
 {id:'teom',name:'Teom Zırhlı',en:'Teom-armored',art:2,subtitle:'Karanlığın içinde bir parıltı.',passive:'Başlangıç Bütünlüğün +1.',ultimate:'Çeliğin Işığı',ultimateText:'Tüm düşman birimlerine 2 hasar.',effect:'purge'}
];
export const chapters = [
 {id:0,title:'Kör Aziz’in Katedrali',short:'Katedral',place:'Korvengrad',source:'M s.1–6',text:'Gökyüzü soluk ve gri. Korvengrad’ın sivri kemerleri altında Marcel, katedralin avlusunda bir kızın iki Karah tarafından köşeye sıkıştırıldığını görür. Geçmişini hatırlamasa da bedeni ne yapacağını bilir.',opponent:'Karah',health:12,seed:101,goal:'Avludaki Karahları yen.',reward:'Yeni yol: Kül Tarlaları'},
 {id:1,title:'Küllerin Ağırlığı',short:'Kül Tarlaları',place:'Korvengrad’ın ötesi',source:'M s.14–19',text:'Şehrin dışındaki dünya, kül ve ozondan ibaret. Marcel ve Fiona yıkık gözcü kulesindeki ateşin başında soluklanır. Gecenin ardından yollarına devam etmek zorundalar.',opponent:'Karah',health:17,seed:202,goal:'Küller arasından bir yol aç.',reward:'Yeni yol: Kırık Köprü'},
 {id:2,title:'Boşluğun Üzerinde',short:'Kırık Köprü',place:'Kül Tarlaları',source:'M s.21–23',text:'Dar geçit, uçurumun üzerinden uzanır. Fiona’nın yaralı ayakları bu yolu tek başına aşmasına izin vermez. Marcel onu sırtına alır. Rüzgâr yükselir.',opponent:'Karah',health:20,seed:303,goal:'Yolu tutan tehditleri aş.',reward:'Yeni yol: Koru'},
 {id:3,title:'Sıcak Mezarlık',short:'Koru',place:'Direniş sığınağı',source:'M s.24–30',text:'Yıkımın ortasında sıcak ışıklar görünür. Koru bir sığınak vaat eder; yine de bu dünyada güven, kolay kazanılmaz.',opponent:'Karah',health:24,seed:404,goal:'Sığınağa uzanan yolu tamamla.',reward:'Yeni yol: Beyaz Boşluk'},
 {id:4,title:'Bir Başka Olasılık',short:'Beyaz Boşluk',place:'Yankılar',source:'M s.44–47; spoiler ve oyun uyarlaması',text:'Beyazlığın içinde Marcel’in farklı olasılıkları belirir. Aynı yüz, farklı seçimler. Buradaki karşılaşma kitabın olay örgüsü değildir; prototip için tasarlanmış bir Yankı sınamasıdır.',opponent:'Beyaz Saçlı Marcel',health:28,seed:505,goal:'Yankı sınamasını tamamla.',reward:'Prototip hikâyesi tamamlandı'}
];
export const defaultDeck=['marcel','karah','white','blade','memory','fire','akhenten','onbion','karah','blade','teom','family','memory','karah-heavy','ash','marcel','white','fire','blade','akhenten'];
export const enemyDeck=['karah','karah','blade','karah-heavy','ash','karah','fire','karah','blade','ash','karah-heavy','fire','karah','ash','karah','blade','karah-heavy','karah','ash','fire'];
