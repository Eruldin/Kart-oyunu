# Sanat yönü — prototip

**Güncel kapsam değişikliği:** kullanıcı yalnız tasarım ve asset paketi istedi. Yeni teslim `design-pack/` içindedir; ayrıntılı fiziksel malzeme/arayüz brifi `design-pack/07-production/PRODUCTION_BRIEF.md`, birincil kaynak araştırması `docs/research/LOR_ART_PIPELINE.md`. Aşağıdaki CSS/Web Audio açıklamaları mevcut kod prototipine aittir; yeni sanat teslimi olarak sayılmaz.

Kullanıcının ikinci açıklamasıyla kale, mumlar, ocak ve çevre hareketleri gerçek 3D olarak üretildi. `design-pack/08-3d/` düzenlenebilir `.blend`, beş GLB ve hareket renderı içerir. Düz tahta resmi yalnız konsept referansıdır. Detaylı ilk blok model, final sculpt/PBR/LOD teslimi değildir.

Çerçeve: gotik çürüme + sıcak ışık adaları + Yankıların soğuk parıltısı. LoR yalnızca sunum/okunabilirlik kalite referansıdır; mevcut kartları veya görselleri taşınmaz.

## Tokenlar

| Token | Değer | Rol |
|---|---|---|
| bg | #101613 | Koyu kadife yeşili zemin |
| panel | #19201a | Taş/yeşil yüzeyler |
| text | #e7e6da | Kemik beyazı metin |
| muted | #90968b | İkincil metin |
| accent | #c5a770 | Soluk altın |
| bright | #e1c48c | Etkileşim/sıcak ışık |
| green | #355747 | Birim safı ve kaynak |
| danger | #a64d42 | Hasar ve karşı tehdit |

Başlık: yerelde Cinzel variable; arayüz: yerelde Manrope variable. OFL dosyaları beraber saklanır. Gövde ve kart metni dark fantasy serif başlıklarından ayrılarak okunabilir tutulur. Kart ayrıntısına sağ tıkla erişilir. Küçük yükseklikte tahta/elin birlikte görünmesi için yoğun görünüm; mobilde kaydırılabilir el.

## Üretim ve dosyalar

Built-in **imagegen** ile üç özgün raster üretimi yapıldı: Korvengrad çevresi, altı portreli karakter atlası, altı nesne/duygu resimli büyü atlası. Atlaslar kayıpsız kaynak olarak saklanır; üçe iki panel kesimi ve WebP dışa aktarımı yalnızca asset hazırlama işlemidir. Tüketilen dosyaların hepsi `public/assets/` içindedir. Son promptların tamamı `public/assets/manifest.json` içindedir.

Karakterler: Marcel, beyaz saçlı Yankı, Teom zırhlı Yankı, Akhenten, Karah, Onbion. Büyüler: Teom Çeliği, Hatırlama, Ocak Işığı, Küllerin Ağırlığı, Seçilmiş Aile. Ek Borislav nesne paneli üretildi ancak zarları parmak kemiği yerine küp biçiminde olduğundan oyunda kullanılmadı. Final kanon referansına dönüştürülmemeli.

Görsel yorumlar **TASARIM ÖNERİSİ**; örneğin taş/köprü geometrisi, zırh işlemeleri ve resimdeki ışık fiziksel kanon detayı değildir. Üretilen assetlerin ticari son onayı, tutarlılık değerlendirmesi ve Steam ifşası sonraki aşamadır. Sanatçı/AI/hibrit kalıcı üretim hattı kararı verilmedi.

## Efekt dili

- Kart çağırma: kısa ölçek/ışık yükselişi, saf etrafında altın yeşil parıltı.
- Taarruz: öne seçilen saf, saldırı oku, rakibin eşlediği savunmacı etiketi.
- Çözüm: darbe sarsıntısı, dağılan amber parçacıklar, avatar üstünde hasar/iyileşme sayısı.
- Yankı: halka dalgası ve daha uzun altın parçacık dağılımı.
- Sığınak: düşük yoğunluklu ember parçacıkları, yavaş çevre yakınlaşması.
- Ses: üçüncü taraf kayıt yok; Web Audio ile kısa kart/taarruz/yetenek tonları. Müzik, karakter voice-over, profesyonel ses miksajı yok.
- `prefers-reduced-motion` ve oyun ayarı animasyonları kapatır; ses ayrıca kapatılabilir.

60 FPS hedefi varsayımdır; profesyonel GPU/cihaz profillemesi yapılmadı. Uzun karakter animasyonu ve shader tabanlı özel kart yetenekleri bir sonraki görsel dilim işidir.
