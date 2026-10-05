# Korvengrad 3D tahta — ilk modelleme dilimi

**Gerçek Blender geometrisi.** Kale, mum, ocak ve alevler arka plan resmi değildir. PNG'ler yalnızca bu sahnenin kamera renderı ve önceki konseptleridir. Projede kart/arayüz hâlâ ayrı 2D asset olarak tasarlanır.

## Dosyalar

| Dosya | Kullanım |
|---|---|
| eruldin-korvengrad-board-v1.blend | Düzenlenebilir ana kaynak; model, bevel, malzeme, ışık, kamera, keyframe |
| models/eruldin-board-animated-v1.glb | Tam sahne; tek birleştirilmiş ortam animasyonu |
| models/board-surface-v1.glb | Tahta yüzeyi, çerçeve ve avatar kaideleri |
| models/korvengrad-castle-v1.glb | Katedral/kale mimarisi, kuleler, pencereler, çatı, taş sıraları, bayraklar |
| models/candle-clusters-v1.glb | Dört kümede 12 mum, fitiller, balmumu damlaları ve tepsiler |
| models/brazier-assembly-v1.glb | İki bronz ocak, pençeler, kömür, ayak/kaideler |
| previews/board-camera-frame001.png | Ana kameradan Cycles renderı |
| previews/board-loop-v1.gif | 640×400, 60 kare, 5 saniye; sahnedeki hareketlerin render önizlemesi |
| scene-inventory.json | Nesne, koleksiyon ve üretim kapsamı |
| glb-validation.json | Dışa aktarılan gerçek geometri/animasyon sayıları |
| animation-validation.json | Döngü başlangıç/bitiş ve orta poz kontrolü |

Blender 4.5.14 LTS veya uyumlu yeni sürümde File → Open ile `.blend` açılır. Numpad 0 kamera; Space animasyonu oynatır. Materyal/ışıklar için Rendered görünüm kullanılır. Ana kaynak beş saniyelik 24 fps aralığına ayarlanmıştır; 121. kare ilk pozun döngü kopyasıdır. Dosya kendi malzemelerini içerir; harici görsel/PBR dosyasına bağımlı değildir.

## Üretilenler

- Koyu yeşil taş oyun alanı, ceviz gövde, bronz kenarlar, perçinler, iki boş avatar kaidesi.
- Altı sivri kule, katedral ana kütlesi, eğimli çatı ve kaburgalar, gerçek mesh sivri pencereler, gül pencere ve traceries, taş yüzey detayları, merdiven ve bayraklar.
- Dört mum grubu; mum/fitil/balmumu ayrı geometri.
- İki ocak, kömür ve bronz/iron detaylar.
- Üç katmanlı 3D alev meshleri; ölçek/dönüş hareketi. 3D saydam duman tüpleri, yükselen kıvılcımlar, mum ve ocak ışıklarında titreşim.
- Ana kamera, soğuk çevre ve sıcak oyuncu ışığı, Blender compositor'da lokal glow.

Tam GLB: **747 mesh, 88.240 üçgen, tek animasyon/186 kanal, 23 point light; sıfır görsel texture ve sıfır harici URI**. Bu sayılar dosyadan okundu. `.blend` ayrıca üç area light içerir; glTF'ye bu ışık tipi aktarılmaz. Keyframe döngüsü kontrol edildi; karşılaştırma sonucu JSON'da.

## Bu aşamanın sınırları

Bu ayrıntılı ilk blok modeldir; LoR'un final sanat cila düzeyi değildir. Heykel/hasar pass'i, boyanmış PBR dokular, ince çevre detayları, tekil prop originleri, UV/LOD ve cihaz performans çalışması sürdürülmeli. Ayrı GLB parçaları ana tahtadaki assembly konumlarını korur.

Alev ve duman **animasyonlu 3D mesh katmanlarıdır**, Mantaflow sıvı simülasyonu değildir. Blender'daki procedural bump, compositor glow ve ışık enerjisi animasyonu GLB'de aynı şekilde taşınmaz; oyun motorunda eşdeğer materyal/efekt kurulmalıdır. GLB'de dönüş/ölçek/konum animasyonu birleştirildi. Oyuna entegrasyon, tarayıcı 3D oynatımı veya 60 FPS kabul testi yapılmadı. Bu teslim yalnızca sanat/modelleme paketidir.

Blender portable resmi kaynaktan indirildi ve SHA-256 checksum kontrol edildi; sistem kurulumu yapılmadı. Araç `C:/Users/PC/.cache/eruldin-tools/blender-4.5.14-windows-x64` içinde; pakete Blender programı veya oyun kaynak kodu dahil edilmez.
