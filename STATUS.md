# Eruldin çalışma durumu — 5 Ekim 2026

## 5 Ekim 2026 — v1.0 büyük genişleme

İçerik ve sistemler genişletildi (hedef: 300+ kart, 60 bölüm, envanter, market, TFT bossları, çevrimiçi):

- **Kart havuzu**: `tools/gen-cards.mjs` tohumlu üretici → `pool.mjs` (312 kart + 8 token, 7 set ailesi × maliyet eğrisi; nadirlik dağılımı common/rare/epic/legendary; kombinasyonlar: set sinerjileri, tetik zincirleri).
- **Sefer**: `tools/gen-campaign.mjs` → `campaign.mjs` (55 üretilmiş + 5 kanon = 60 bölüm, 3 perde; her ~10. düğüm boss, %10→elite, id%10==7 düğümler TFT). Bossların `mutators` alanı (hpBonus/shield/hatira/ozStart/kwAll) zorluk ölçekler.
- **Ekonomi**: `drops.mjs` — parça (◆) para birimi, tür-bazlı drop ağırlıkları (boss %15 efsanevi, TFT %20), pity sistemi (+10%/kuru kesim), 3+ kopya iadesi parçaya dönüşür. `shop.mjs` — paketler (std/elite) + kozmetikler (kart arkalığı/saha/kıvılcım rengi) + `buyItem`/`equipCosmetic`.
- **TFT boss modu**: `engine/tft.mjs` deterministik ızgara oto-savaşı (7×4, en yakın hedef, anahtar kelimeler taşındı, 3+ grup sinerjisi) + `tft.js` dizilim ekranı ve animasyonlu tekrar. Kazanma `applyRewards` ile drop verir.
- **Deste kurma**: koleksiyon sahipliği doğrulamalı arayüz (set/tür/maliyet/nadirlik süzgeçleri, 20-kart/3-kopya kuralı); `saveDeck` iki uçta da doğrular.
- **Çevrimiçi**: oda oluştur/katıl → mulligan → tur değişimi uçtan uca doğrulandı; gizli bilgi maskesi (`hand: 'back'`) yerinde.
- **Motor düzeltmesi**: savaş içi ölümler artık erteleniyor (`_kills` → `finalizeKill`) — slot kaymasıyla çakma vuruş hatası giderildi; ölü blokcu saldırganı yüze vurdurtmaz.
- **Denge**: teom nihai 3→2 hasar (85%→60% beyaz eşleşmesi); simülatör 40 maç/eşleşme raporu `reports/balance.json`.
- **Optimizasyon**: kart görselleri `loading=lazy`, kritik görseller preload; `dist/` 37 MB.
- Test: 38/38 yeşil (motor, drop, market, TFT, sunucu).

## 5 Ekim 2026 (geç saat) — v0.2 görsel/animasyon turu

Kullanıcı geri bildirimi: arka planlar hareketsiz, animasyon yok, öğretici yok, haritada oklar takılı kalıyor, bölüm işaretleri düzensiz. Yapılanlar:

- **Canlı arka plan**: tahta, harita ve açılışta süzülen kor/soğuk parçacıklar, kayan sis katmanı, yavaş kayan arka plan, dönen alev mührü.
- **Savaş hissi**: tur bandı ("TUR n" + kimin taarruzu), kartın elden tahtaya uçuşu, kart çekme uçuşu, saldıran birimlerin merkeze öne çıkması, avatar vurulma parlaklığı, savas sırasında parlayan orta çizgi.
- **Saldırı önizlemesi**: saldıran seçildiğinde rakibe kırmızı kesikli ok (LoR Oracle's Eye benzeri, özgün); blok evresinde saldırgan→avatar kırmızı, savunan→saldırgan mavi ok.
- **Öğretici**: 1. bölümde ilk oyunda 5 adımlı spot-ışıklı rehber (seçim → kart oyna → taarruz → blok → tur bitir). `localStorage eruldin.tut` ile bir kez gösterilir; "öğreticiyi atla" → herhangi bir öğretici kutusunda.
- **Harita**: bölüm işaretleri S eğrisi rotaya yerleştirildi, kesikli yol çizgisi + tamamlanan kısım parlayan altın, mevcut bölüm hafifçe yüzüyor/parlıyor.
- **Hata düzeltmesi**: tahtadan çıkınca kalan ok katmanı temizleniyor (`destroyBattle` → `clearArrows` + `hideTutor`) ve `arrow()` artık görünmez/ölçüsüz hedeflere ok çizmiyor.
- `npm test` 17/17 geçiyor.

## 5 Ekim 2026 — oynanabilir istemci (v4 istemcisi)

Önceki tüm çalışma birleştirildi ve gerçek tarayıcı oyunu ortaya çıktı.

Yapılanlar:
- **Motor**: seçim evresi (mulligan), taarruz jetonu, blok evresi, yanıt zinciri (stack), `concede` komutu eklendi. Motor girdi durumunu hiçbir zaman mutasyona uğratmaz.
- **İçerik**: 32 kart, 3 Yankı (pasif + 6 Hatıra ile ateşlenen nihai yetenek), 5 bölümlük hikâye, deste kuralları (20 kart, en fazla 3 kopya).
- **İstemci**: yeni LoR-tarzı arayüz — açılış ekranı, sefer haritası, bölüm bilgisi + Yankı seçimi, seçim evresi, tahta (sürükle-bırak kart oynama, saldırı okları, blok atama, büyü sırası görünümü), zafer/yenilgi ekranı, koleksiyon, deste görünümü, düello lobisi, ayarlar/katkıda bulunanlar.
- **Ses/Müzik**: gerçek dosyalar entegre — karta/eyleme özel 50+ efekt sesi, 5 müzik parçası (Kevin MacLeod, CC BY). Arayüz sesleri Kenney (CC0).
- **Sunucu**: profil/ilerleme/sıralama + oda düellosu + SSE canlı güncelleme çalışıyor; istemci sunucu yokken kendi motoruyla çevrimdışı da oynanır (`vendor/` kopyası).
- **Dağıtım**: `dist/` klasörü tek başına statik istemcidir (~25 MB — sıkıştırılmış görsel/ses). Kökten servis eden `server.mjs` değişmedi.

Doğrulama: 17/17 test geçti (16 motor + 1 sunucu entegrasyonu); tarayıcıda açılış→harita→bölüm→seçim→tahta→saldırı→savunma→teslim akışı elle oynandı.

Eksik/bekleyen: düello lobisinin bekleme ekranı sade; çevrimdışı modda sıralama yok (tasarım gereği); kart illüstrasyonları v1 üretimdir — v4 binding'lerdeki güncel sanatlar henüz tüm kartlara eşleştirilmedi; GLB VFX'ler DOM/CSS parçacıklarıyla temsil ediliyor.

## 6 Ekim 2026 — sanat paketi v2

Kapsam tasarım ve assetler olarak korundu. Resmî LoR videosunda açılış, kart/büyü yerleşimi, karşı hamle ve öngörü bölümleri; Riot'un 2022 Path of Champions rehberindeki menü/harita/karakter seçimi görüntüleri tarayıcıda incelendi. Güncel istemciyi tamamen oynayarak inceleme iddiası yok.

Üretildi: altı yeni aksiyon kart resmi; açılış ve gözden geçirilmiş savaş konsepti; iki kompakt tahta çerçevesi, ana eylem parçası ve kart arkası; gerçek font/metinle 12 kart provası içeren 8 sayfalık PDF; ayrı Blender VFX sahnesi ve altı 1,5 saniyelik GLB klibi; 24 kayıt/cue/müzik dosyası ve kaynak/lisansları; 12 kart için resim/efekt/ses bağlantı verisi, olay zamanları, ekran/durum akışı. Teslim: `Eruldin-Tasarim-ve-Asset-Paketi-v2.zip`.

Doğrulama: PDF'nin 8 sayfası render edildi; font ağırlığı ve eksik başlık glifleri düzeltildi. RGBA çerçeve pencereleri alpha 0, veri referansları mevcut, VFX GLB'lerinde animasyon/gömülü resim/BLEND/süre/harici URI kontrolü geçti. 24 ses teknik olarak çözüldü; dinleme/mastering kabulü yapılmadı. ZIP bütünlüğü kontrol edildi, uygulama/script içermiyor. Önceki oyun motoru değişmedi; oyun içi entegrasyon ve senkronizasyon testi bu kapsamda yapılmadı.

Final kalite için 3D sculpt/PBR/UV/LOD, çerçevelerde ortak geometri/ölçek temizliği, bütün UI durumları, hedef/etki oyun içi senkronizasyonu, ses miksajı ve insan/cihaz testleri bekliyor. Yeni VFX klipleri dokulu düzlem + mesh parçalarıdır; sıvı simülasyonu/flipbook değildir. Önceki aşama kaydı aşağıda korunmuştur.

## Kullanıcının güncel yönü

Son açıklama: **Şimdilik yalnızca tasarım ve asset paketi.** Kodla çizilmiş görseller yerine resmedilmiş/üretilmiş assetler; LoR'un arayüz, illüstrasyon, tahta ve efekt üretim mantığının ayrıntılı araştırılması. Mevcut prototip korunuyor; yeni çalışma `design-pack` klasöründe bağımsız sanat teslimidir.

## Önceki prototip

Yerel JS/Node prototipinde 12 kart, 3 Yankı, 5 hikâye karşılaşması, deste düzenleme, aynı ilerleme seviyesinde oda düellosu, sunucuda kayıtlı ilerleme ve sıralama bulunuyor. Bu final oyun değildir. Anonim yerel oturum, bellekte maçlar; hesap kurtarma, genel internet barındırması, kalıcı maç/sıra zamanlayıcıları ve üretim güvenliği yok. İngilizce UI var, tüm içerik çevirisi tamamlanmadı.

Son doğrulama: 30 motor/sunucu testi geçti. 900 bot maçında takılma görülmedi; ikinci denge raporu `reports/balance.json`. İnsan oyun testi ve cihaz/GPU profillemesi yapılmadı. Bunlar asset paketinin final oyun olduğu anlamına gelmez.

## Sanat kapsamı

Built-in imagegen ile özgün çevre, karakter, büyü, çerçeve, UI ve statik VFX resimleri oluşturuldu. Kullanıcı çevrenin gerçek 3D model olacağını netleştirdi; Blender 4.5.14 LTS ile düzenlenebilir tahta/kale/mum/ocak sahnesi, mesh alev/duman hareketleri ve ışık titreşimi eklendi. `.blend`, 5 GLB ve hareket önizlemesi `design-pack/08-3d` içinde. Final dosyaların durum ve boyutları `design-pack/manifest.json` içinde tutulur. LoR assetleri ve Meshy kullanılmadı.

Bekleyen sonraki üretimler: ortak şablona temizlenmiş final UI geometrisi ve tüm durumlar; bütün ekranların ayrı kompozisyonu; kart efektlerinin zaman tutarlı flipbook/shader üretimi; 3D sahnede final sculpt, boyanmış PBR, tekil prop originleri ve LOD optimizasyonu; geniş kompozisyonlu özgün kart illüstrasyonları; karakter model sheet/kanon onayı; kayıtlı müzik, efekt ve seslendirme. Yeni Blender sahnesi ayrıntılı ilk blok modeldir; LoR'un final sanat kalitesine ulaşıldığı iddia edilmez.
