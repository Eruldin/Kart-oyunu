# LoR görsel üretim araştırması — 5 Ekim 2026

Kullanıcının son kapsamı: **şimdilik tasarım ve asset paketi**. Bu araştırma bir oyun motoru seçimi veya kod geliştirme talebi değildir. Aşağıda kaynaklarda doğrulanan uygulamalar ve Eruldin için öneriler ayrı tutulur. Riot görselleri pakete alınmadı.

## Arayüz neden fiziksel ve tutarlı hissettiriyor?

LoR kıdemli görsel tasarımcısı Tom Sayer, UX wireframe'inden başlayıp oyuncunun ihtiyaç duyduğu bilgiye göre ön/arka plan hiyerarşisini düzenlediklerini anlatıyor. LoR için fiziksel nesne hissi veren bir yaklaşım seçilmiş. Spirit Blossom örneğinde Illustrator'da çizilen şekil Photoshop'a aktarılıyor; bevel/emboss, renk geçişi, gölge ve ışık katmanlarından sonra elle boyanıyor. Bu örnekte metal yüzey ve perspektif hissi arayüzü çevreye bağlıyor. **Çıkarım:** yalnızca altın kenarlık koymak yeterli değil; malzeme, ışık yönü ve derinlik tüm parçalarda birlikte tasarlanmalı. [Riot: Complementary Visual Design in Spirit Blossom, 21 Temmuz 2020](https://www.riotgames.com/en/news/complementary-visual-design-in-spirit-blossom)

Riot'un 2019 teknik yazısı tutarlı metin ve düğme stillerini, cihaz oranı/güvenli alan simülasyonunu, sanatçıların düzenlediği animasyonları anlatıyor. Basit lineer animasyonlarda Unity Timeline, daha karmaşık durumlarda PlayMaker kullanılmış. Kartlara resim yanında VFX, animasyon ve ses bağlanıyor. Bu tarihsel üretim açıklamasıdır; 2026'daki dahili araçların değişmediğini varsaymıyoruz. **Eruldin kararı:** önce ortak malzeme/ölçek sistemi, sonra ekranlar; hareket ve ses için ayrıca olay listesi. [Riot: Bringing Features to Life, 26 Kasım 2019](https://www.riotgames.com/en/news/bringing-features-life-legends-runeterra)

## İllüstrasyon, çerçeve, tahta ve efekt ayrı işler

Riot geliştirici dokümanı tamamlanmış kart görseli ile yalnızca illüstrasyonu ayrı dosyalar olarak sunuyor: kart 768×1024; büyü resmi 1024×1024; diğer kart resimleri 2048×1024. Bunlar Eruldin'e aktarılan assetler değil, kaynak yapısının kanıtı. **Çıkarım:** kart resmi geniş kompozisyonda üretilebilir; portre, eldeki kart ve büyük inceleme penceresi için ayrı kırpım düşünülmeli. [Riot Developer Relations: Card Images](https://support-developer.riotgames.com/hc/en-us/articles/22698735834515-Legends-of-Runeterra)

SIXMOREVODKA'nın kendi LoR Sketches galerisi eskiz/kompozisyon ve sanat yönetimi kredilerini gösteriyor. Bu, kart resmi üretiminde kompozisyon aşamasının önemini destekliyor; tüm kartların aynı sanatçı veya yazılımla üretildiği sonucuna varılamaz. [SIXMOREVODKA: LoR Sketches](https://www.sixmorevodka.com/famous-work/lor-sketches/)

Servando Lupini, Star Guardian tahtasında konsept, modelleme, doku ve VFX fikirlerini yaptığını; efektlerin Jasmine tarafından üretildiğini belirtiyor. Oliver Chipping ilk tahtalarda 2D konsept ve 3D çalışma yaptığını anlatıyor. **Eruldin kararı:** tahta kenarındaki nesneler 3D'ye uygun; kart metni ve çerçeve ayrı 2D katmanlarda kalmalı. [Lupini: Star Guardian Board](https://vando.artstation.com/projects/eJvlDG), [Chipping: Levels & UI](https://chippz.artstation.com/projects/q9Q1EL)

Jocelyn Mettler'in Slaughter Docks örneğinde sıra başladığında oynayan Turn Flare ile ortam efektleri ayrı; bazı ortam efektleri yalnızca oyuncunun sırasında etkinleşiyor. Ortak UI öğeleri başka sanatçılar tarafından hazırlanmış. **Eruldin önerisi:** ortam közleri düşük yoğunlukta, sıra sinyali kısa ve belirgin; hasar/Yankı efektleri için ayrıca öncelik. [Mettler: Slaughter Docks VFX](https://jocelynmettler.artstation.com/projects/4NRwv8)

## Meshy ve Blender nerede işe yarar?

Meshy'nin Image to 3D belgesi tek ve net nesne, sade arka plan ve en az 512×512 referans öneriyor. Ön/yan/arka/üç çeyrek görünümler aynı nesne ve benzer ışıkta olmalı. Bütün tahta görüntüsünü tek seferde modele çevirmek yerine bronz ocak, taş sütun, portal ve avatar kaidesini ayrı ele almak daha uygun. Meshy çıktısının her açıdan incelenmesi ve sonrasında hazırlanması gerekir. [Meshy: Image to 3D](https://docs.meshy.ai/en/webapp/image-to-3d)

Meshy'nin doku rehberi base color, metallic, roughness ve normal haritalarını; GLB/FBX dışa aktarımını açıklıyor. Paket için hedef: konsept → ayrı prop modeli → topoloji/UV kontrolü → malzeme → Blender'da ortak ışık ve kamera → render veya oyun motoruna dışa aktarım. Bu bir **önerilen iş akışı**, bu oturumda yapılmış Meshy/Blender üretimi değildir. [Meshy: Texture workflow](https://www.meshy.ai/tutorials/texture-3d-models-with-ai)

İlk kontrolde `blender` PATH'te ve standart `Program Files/Blender Foundation` konumunda bulunmadı; başka konuma kurulmuş olması dışlanmadı. Bağlı doğrudan Meshy aracı bulunmadı. Kullanıcı sonrasında çevrenin gerçek model olacağını netleştirdi. Bunun üzerine resmi Blender dağıtımından **4.5.14 LTS portable** indirildi, SHA-256 resmi checksum ile eşleştirildi ve yerel 3D sahne oluşturuldu. `.blend` ve GLB çıktıları `design-pack/08-3d` içinde. Meshy üretimi, karakter rig'i, sıvı simülasyonu veya boyanmış final PBR seti yapıldı iddiası yok. Blender'ın render belgesi açılışı başarısız oldu; belge içeriği doğrulanmış gibi kullanılmadı. [Blender resmi dağıtım dizini](https://download.blender.org/release/Blender4.5/)

## Eruldin için kalite ölçütü

Bunlar kaynaklardan alınan sayılar değil, önerilen kontrol ölçütleridir:

1. Elde 140–180 px yükseklikte kart türü, maliyet ve portre odağı ayırt edilmeli; tam kural metni inceleme penceresinde okunmalı.
2. Tahta merkezindeki detay ve ışık, kartların değerlerini bastırmamalı. Süsler kenarlarda kalmalı.
3. Tüm bronz yüzeylerde ışık yönü aynı; düşman soğuk, oyuncu sıcak ayrımı yalnız renk üzerinden yapılmamalı.
4. Düğmeler normal, vurgulu, basılı ve devre dışı halleriyle teslim edilmeli; yalnız bir güzel ekran yeterli değil.
5. Türkçe karakterler ve uzun adlar gerçek fontlarla ayrı metin katmanında dizilmeli. AI mockup yazıları final arayüz metni sayılmaz.
6. Hareket seti için ön sinyal → darbe → sönme tasarlanmalı. Raster efekt örnekleri tamamlanmış animasyon sayılmaz.

Ryan O'Donnell vaka çalışması arama sonucunda bulundu ancak tam sayfa iki denemede açılamadı; esas çıkarımlar bunun üzerine kurulmadı. Bu çalışma birincil kaynak araştırması ve özgün sanat üretimidir; Riot'un gizli üretim dosyalarına erişim veya LoR ile aynı kaliteye ulaşıldığı iddiası değildir.
