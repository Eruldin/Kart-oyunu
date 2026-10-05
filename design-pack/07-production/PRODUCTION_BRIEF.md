# Eruldin — tasarım ve asset üretim brifi

Bu paket 5 Ekim 2026 tarihli **ilk sanat/modelleme dilimi**. Final oyun veya katmanlı PSD teslimi değildir. Gerçek 3D modelleme kapsamı son kullanıcı açıklamasıyla eklendi; `08-3d` içindeki Blender sahnesi ve GLB'ler bunun ilk uygulamasıdır. Mevcut kod prototipinden bağımsız hazırlanmıştır. Tüm yeni görseller tasarım önerisidir; romanda geçmeyen geometri, arma ve işlemeler kanon değildir.

## Görsel kimlik

Gotik çürüme, sığınak sıcaklığı ve Yankıların soğuk ışığı. Aşınmış bronz (#B99B62), koyu yeşil taş (#192A25), kemik beyazı (#E6E0CF), amber (#E0A150), soğuk mavi (#7EADB7). Ana ışık sol üstten; yeşil kadife, metal, taş ve parşömen farklı pürüzlülükte. Çerçevede katedral kemeri/çatlak dal biçimleri ortak; her kartı aşırı süslemek yerine şampiyonda belirgin, birimde sade, büyüde soğuk gümüş dil.

Metin: başlık Cinzel, arayüz/kural Manrope, OFL lisansları fonts klasöründe. Gerçek metin ayrı dizilir; mockup üstündeki AI yazıları yeniden kullanılmaz.

## Ekranların tasarım kapsamı

| Ekran | Öncelik ve yerleşim | Gerekli ayrı assetler |
|---|---|---|
| Ana merkez | Birincil eylem hikâyeye devam; çevre ana resim; Marcel/Yankı sağda; rekabet bilgisi altta | Ana resim, logo, birincil düğme, portre yuvası, ilerleme plakası |
| Hikâye | Tamamlanan/açık/kilitli durak; mevcut sahne büyük; gelecek hikâye spoiler vermeden siluet | Rota resmi, üç düğüm hali, bağlantı, kilit, olay paneli |
| Savaş | Merkezde iki saf; avatarlar solda; enerji/sıra sağda; elde kartlar altta | Tahta, kart çerçeveleri, avatar halkası, kaynak yuvası, sıra düğmesi, hedef oku |
| Koleksiyon | Büyük resim, arama/filtre, kart inceleme; seçim çerçevesi ayrı | Kartlar, filtre düğmeleri, detay paneli, seçili/vurgulu çerçeve |
| Deste | Kart havuzu solda; deste listesi sağda; sayı ve geçerlilik sabit | Liste satırı, sayaç, seçili destenin kapak resmi |
| Rekabet/sıralama | Önce ulaşılan hikâye durağı, aynı durakta rekabet puanı; mevcut oyuncu vurgusu | Lig plakaları, tablo satırı, oyuncu rozeti, boş/yükleniyor durumları |
| Diyalog/ödül | Karakter ve tek sonraki eylem; ödül açılışı kısa | Portre, konuşma paneli, ödül çerçevesi, onay düğmesi |

Hikâye sıralamasında önerilen birincil ölçüt **ulaşılan en ileri durak**, ikincil ölçüt **aynı duraktaki rekabet puanı**. Oyuncu kart gücünü satın alarak hikâye sıralamasını yükseltmemeli. Bu bir tasarım önerisi; sezon reseti, eşleşme aralıkları ve tiebreak kuralları final karar değildir.

## Kart anatomisi

Çerçeve, portre kırpımı, ad bandı, maliyet, tür, anahtar kelimeler ve sayılar ayrı katmanlardır. Portre üst bölümde; yüz/odak üst üçte birde. 3:4 kart hedefi. Resim penceresinde taşma payı; dış çerçevede gölge dahil güvenli pay. Harf ve sayı PNG'ye gömülmez. Şampiyon/birim iki stat yuvası, büyü bir tür medalyonu kullanır. Elde kısa bilgi, büyütülmüş incelemede tam kural.

PNG kaynaklar ilk dilim boyutundadır; final 4K/2K üretim kabulü verilmedi. Orijinal atlaslar sources içinde korunur. Kırpılan assetlerin gerçek ölçüleri manifestte kaydedilir. AI geometrisi milimetrik olarak tutarlı kabul edilmez; final çerçevede ortak şablona temizleme gerekir.

## Meshy → Blender için nesne brifleri

Aşağıdaki hedefler planlanan final prop bütçesidir; ilk sahnenin gerçek ölçümü `08-3d/glb-validation.json` içindedir. Meshy hesabı/bağlantısı kullanılmadı. Blender 4.5.14 LTS ile `.blend` ve `.glb` çıktıları oluşturuldu; detaylar `08-3d/README.md` içinde.

| Nesne | Ayrı model parçaları | Önerilen bütçe | Referans |
|---|---|---|---|
| Amber ocak | Bronz kase, ayaklar, kömür; ateş ayrı VFX | 3–6 bin üçgen, 1K/2K PBR | Tahta sağ alt köşe |
| Avatar kaidesi | Halka, taş merkez, çatlak kristal | 4–8 bin üçgen, 2K PBR | Tahta sol kenar |
| Kırık kemer | Taş blok, sarmaşık, metal süs | 6–12 bin üçgen, 2K PBR | Tahta sağ üst |
| Yankı kapısı | Dış kemer, iç boşluk, kristal | 8–15 bin üçgen, 2K PBR | Ayrı tek nesne konsepti gerekir |
| Marcel sunum modeli | Gövde, yüz, saç, yeşil palto, ekipman | Önce anatomi ve siluet onayı | Portre tek başına arka görünüşü tanımlamaz |

Meshy'ye bütün ekran/tahta yerine bir nesnenin temiz, gölgesiz, sade arka planlı görünümü verilir. Çoklu açıların aynı nesneyi tutarlı göstermesi gerekir. Blender'da ölçek, normals, ince yüzeyler, UV, malzeme bağlantıları ve siluet kontrol edilir. Doku haritaları base color/roughness/metallic/normal olarak ayrı korunur. Tahta için ortak kamera/ışık kurulur; UI kaplamaları renderdan ayrı tutulur. Kameranın hareket etmeyeceği ilk dilimde düz tahta renderı kullanılabilir; perspektif/paralaks veya etkileşim istendiğinde gerçek 3D sahne gerekir.

## Efekt brifi

| Olay | Önerilen hareket | Önerilen süre | Vurgu |
|---|---|---|---|
| Kart çağırma | İnce amber halka → yükselen köz → sönme | 350–550 ms | Kart yüzünü örtmez |
| Darbe | Kısa yönlü ışık çizgisi → lokal patlama | 180–280 ms | Hasar sayısından önce |
| İyileşme | Yumuşak yeşil/altın spiral | 450–650 ms | Saldırıdan farklı siluet |
| Beyaz Yankı | Buz beyazı çatlak → içe toplanan ışık | 700–1100 ms | Kaynak değişimiyle eşleşir |
| Karah | Mor/siyah mürekkep dağılımı | 450–700 ms | Arka plan üzerinde ayrılır |
| Bölüm açılışı | Kısa taç ışığı → ilerleme halkası | 700–1000 ms | Ekranı uzun süre kilitlemez |

Efekt süreleri ölçülmüş LoR değerleri değildir. Paketteki efekt atlası **statik şekil/doku araştırmasıdır**; zaman tutarlı flipbook, shader veya tamamlanmış animasyon değildir. Final için ön sinyal/darbe/sönme ayrı kareleri, ortak pivot ve alpha kenar kontrolü gerekir. Az hareket modu titreşim/yoğun parçacıkları kaldırır; bilgi sinyalleri korunur.

## Teslim kontrolü

Üretildiğinde her kaynak dosya yerelde açılıp kompozisyon ve alpha kontrolü yapılır. Şeffaf çerçevede pencere gerçekten boş olmalı; siyah/beyaz dolgu şeffaf sayılmaz. Kart metni, sıra, can ve enerji ekranın en parlak dekorundan daha okunabilir olmalı. Ana ekran, savaş, hikâye, koleksiyon ve sıralama ayrı ekranlar olarak ayrıca dizilmelidir. Bu ilk paket bütün ekranlar ve durumlar tamamlandı iddiası taşımaz.
