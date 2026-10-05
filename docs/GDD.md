# Eruldin: Yankılar — oyun tasarımı v0.1

**TASARIM ÖNERİSİ**. Bu belgedeki bütün sayı, yetenek, anahtar kelime ve rekabet modeli oyun uyarlamasıdır. Kitaptaki olaylar/karakterler `docs/canon/CANON.md` referanslarıyla ayrılır.

## Ürün

Her seçim başka bir Marcel. Hikâyede **tamamlanan** en uzak karşılaşma sıralamanın birinci ölçütüdür. Aynı hikâye katmanındaki oyuncular çevrimiçi düello yapar. Yenilgi tamamlanmış hikâye ilerlemesini geri almaz. Hikâyenin sonunda rekabet puanı sıralamayı ayrıştırır.

Ana ekranda: Sığınak, Hikâye yolu, Yankılar, Koleksiyon, Desteler, Düello, Sıralama. Renkler kadife yeşili, kül, kemik, soluk altın. Koru sıcak ışık; Karah mor/katran; Beyaz Saçlı ve Teom soğuk metal/ivory. VFX, bilgi okunabilirliğini aşmamalı.

## Uygulanmış kurallar

- İki oyuncu; **20 kart**, aynı karttan **en fazla 3**. Tahta **5 birim**. El **9 kart** ile sınırlı; fazla çekilen kart atılır.
- Yankı **24 Bütünlük** ile başlar. Teom +1 Bütünlük. Bütünlük sıfırsa yenilgi; aynı çözümde ikisi sıfırsa beraberlik.
- İlk tur 2 Öz; her tur üst sınır +1, en fazla 10. Yeni turda bütünü yenilenir. Harcanmayan Öz bir sonraki tura ayrı rezerv olarak taşınmaz.
- Başlangıçta 5 kart. Her yeni tur 1 kart. Boş desteden çekişte 1, sonra 2, sonra 3… Bütünlük kaybı. Fatigue bir kazanma/bitirme mekanizmasıdır.
- Birim ve normal büyü hamle hakkını geçirir. **Anlık** büyü hak geçirmez. İki taraf üst üste pas verince tur ilerler; bir eylem yapılırsa pas dizisi sıfırlanır.
- Taarruz hakkı tur başında belirlenir ve tur başına bir kez kullanılır. Saldıracak birimler seçilir. Rakip saldıran başına tek savunmacı eşler; bir savunmacı iki saldırana eşlenemez.
- Bloklanmış birimler eşzamanlı hasar verir. Savunmacının ölmesi, saldırının aynı savaşta avatarı da vurmasına yol açmaz. Fazla hasar avatarı aşmaz. Bloklanmayan saldırı Bütünlüğü azaltır.
- **İz** saldırı tarafında önce hasar verir; savunan ölürse karşı hasar veremez.
- **Siper** varken düşmanın hedefli büyüsü Siper birimlerinden birini hedeflemek zorundadır. Alan etkileri bundan etkilenmez. Siper avatarı normal taarruzdan otomatik korumaz; blok seçimi oyuncunundur.
- Her oynanan kart +1 Hatıra. Yankı işaretli kartlar/Hatırlama ek +1. Üst sınır 6. 6 Hatıra, maç başına bir Yankı yeteneği. Yetenek normal hamle gibi hak geçirir.
- Oyuncu istediği anda teslim olabilir. Maç sonucu yalnızca sunucudaki motorun sonucundan kaydedilir.

Şimdilik büyü yığını, büyüye büyü yanıtı, mulligan, şampiyon seviye atlaması ve birimler için çağırma yorgunluğu yok. Özellikle derin LoR etkileşiminin tümünü uyguladığımız söylenemez. İkinci tasarım diliminde **tepkili büyü penceresi** üzerinde çalışılmalı; basit prototipte bile saldırı öncesi savunma seçimi gerçek oyuncu kararıdır.

## Yankılar

| Yankı | Miras | Maçta bir kez 6 Hatıra | Zayıflık |
|---|---|---|---|
| Çamur & Kül | İlk birim +1 dayanıklılık | Dost safa +2 güç; 3 Bütünlük yenile | Boş safla yetenek değeri düşük |
| Beyaz Saçlı | Başlangıçta 1 Hatıra | 1 kart çek, 3 Öz ve 6 Bütünlük yenile | Öz üst sınırı; kısa deste nedeniyle gereksiz çekiş riskli |
| Teom Zırhlı | Başlangıç Bütünlüğü +1 | Düşman safına 2 alan hasarı | Büyük dayanıklı birimlere karşı temizleyici olmayabilir |

Kitaptaki diğer Yankılar (Karah, komutan, çocuk, Primus) bu sürümde oynanabilir değildir. Primus için boss/oyuncu kararı verilmedi; hikâye finaline dair yeni sonuç yazılmadı. Teom ve Beyaz Saçlı'nın yaşam öyküsü veya alternatif seçimleri icat edilmedi.

## Hikâye uyarlaması

5 **karşılaşma** prototip yoludur; 5 kitap bölümü değildir. Her galibiyet bir sonraki karşılaşmayı açar. Önceki yollar tekrar oynanır; ilerleme aynı kalır. İlk dört karşılaşmanın düşman destesinde yalnızca Karah birimleri vardır; oyuncunun şampiyonları düşman Karah kimliğine rastgele geçirilmez. Büyüler savaş uyarlamasıdır, metindeki olay olarak sunulmaz.

| Karşılaşma | Kaynak | Spoiler tutumu |
|---|---|---|
| Kör Aziz’in Katedrali | M s.1–6 | Açılış karşılaşması; kızın kimliği girişte açıklanmaz |
| Küllerin Ağırlığı | M s.14–19 | Yol açılınca kardeşlik/yolculuk açığa çıkar |
| Boşluğun Üzerinde | M s.21–23 | Yolculuk ve taşıma; oyun dövüşü tasarım önerisi |
| Sıcak Mezarlık | M s.24–30 | Koru adı ve atmosferi; tutuklanma/ihanet sonucu açıklanmaz |
| Bir Başka Olasılık | M s.44–47 motifleri | Olay zincirinin devamı değil, açıkça işaretli Yankı sınaması; Primus/Fiona büyük açıklamaları verilmez |

Yenilgi sonrası geri dönüş görsel kimliği mevcut; yeni Yankıyla prosedürel koşu, dallanan yol, relic, seçim olayları ve Tensar geri sayım boss'u henüz uygulanmadı. Kitap sonu ve Atlas'ın P katmanı kullanılmadı.

## Rekabet

Ana sıralama anahtarı: `progress DESC, rating DESC, wins DESC`. İlerleme `0..5` tamamlanan karşılaşma sayısıdır. Oda katılımı için iki oyuncunun ilerlemesi eşit olmalı. PvP ilk hamle sunucuda rastgele seçilir; hikâyede önce oyuncu hamle yapar.

Düello puanı 1000 ile başlar; K=24 Elo değişimi kullanılır. Beraberlikte puan değişmez. Hikâye puanı/ilerlemesi düello galibiyetinden etkilenmez. Yerel sunucudaki gerçek profiller listelenir; hayali dünya oyuncuları eklenmez. Dereceli kuyruğa otomatik eşleşme, sezon sıfırlama, co-op ve arkadaş listesi henüz yok.

## İleride sınanacak 8 arketip

Bu liste içerik büyütme önerisidir; 12 kartla bütün arketiplerin tamamlandığı iddia edilmez.

| Arketip | Kazanma planı | Karşı oyun |
|---|---|---|
| Kül temposu | Ucuz birimler, Marcel ile artan saldırı | Savunma ve alan hasarı |
| Krov siperi | Dayanıklı saf, güç artırımı | Hedefli büyü, saf doluluğuna zorlama |
| Avcının izi | Önce vuran düşük dayanıklılıklı tehdit | Anlık hasar |
| Teom kontrolü | Alan hasarı sonrası kaliteli saf | Büyük dayanıklılık / kaynak baskısı |
| Hatıra döngüsü | Kart ve kaynak dönüşümü | Fatigue, elde kart taşması |
| Karanlık sürü | Birçok küçük Karah | Alan hasarı / savunma |
| Seçilmiş aile | Üç kimlikle saf birlikte güçlenir | Tek tek hedef alıp çeşitliliği bozma |
| Unutulmuşlar | Mezarlık yerine Unutulmuş bölgesinden geri çağırma | Geri çağırmayı sınırlayan maliyetler; henüz kod yok |

## Denge ve metrikler

İlk 900 maçta Teom/Beyaz Saçlı aşırı ayrıştı. Teom Bütünlük bonusu +3→+1, alan hasarı 3→2; Beyaz Saçlı çekişi 3→1, iyileşmesi 4→6 ve 3 Öz yenileme eklendi. Aynı 100 tohum × 9 eşleşmede tekrar ölçüldü. İlk ve yeni raporlar `reports/balance-initial.json` ve `reports/balance.json`.

Yeni testte Teom'un Beyaz Saçlı karşısındaki oyuncu-0 zaferi %84→%52; karşı rolde Beyaz Saçlı %8→%31. Rol farkı ve kalan dengesizlik hâlâ var; insan dengesi kanıtlanmadı. Takılan maç yok. Ortalama tur yaklaşık 12–13. Gerçek dakika, 60 FPS, bellek, insan karar kalitesi ve uzun vadeli meta ölçülmedi. Üretim hedefi: rol simetrisiyle düzeltilmiş eşleşmelerde geniş %40–60 bandı; 12 kartlık küçük havuzun dışında yeniden sınanmalı.

## Kopya risk kontrolü

Riot kartları, sesleri, görselleri, fontları, çerçeveleri ve ikonları kullanılmadı. Nexus/bölge/shard/spell mana gibi UI ifadeleri taşınmadı. Türsel ortaklık: sıra, kart maliyeti, saldırı/savunma, karakter kartı. Sapmalar: Marcel avatar/Miras/yetenek; Hatıra ile olaylara bağlı şarj; hikâye katmanına dayanan rekabet ve sıralama. Geri sayım kuşatması üçüncü mekanik olarak **planlı**, uygulanmış gibi sunulmuyor.

Anahtar kelimeler kısa Türkçe oyun terimleridir; münhasırlık/trademark iddiası yok. Kullanıcı sanat hattının ticari/final şeklini henüz seçmedi; mevcut üretilmiş resimler yalnızca oynanabilir prototipin yorumudur.
