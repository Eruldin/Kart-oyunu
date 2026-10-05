# Eruldin: Yankılar — tasarım ve asset paketi

## v2 — 6 Ekim 2026

İlk bakış için `07-production/Eruldin-Sanat-ve-Akis-v2.pdf`: açılış, menü/hikâye akışı, savaş kompozisyonu, 12 kartın gerçek Türkçe metinle dizilmiş provası, VFX/ses ve 3D teslim sınırı. Sekiz sayfa render edilip görsel kontrol edildi.

- `02-characters/action-v2`: altı yeni aksiyon kompozisyonu; karakterlerin kanonik görünümüne ek sahne/ışık yorumları sanat önerisidir.
- `04-card-frames`: kompakt birim/şampiyon çerçeveleri ve kart arkası; ilk iki parçanın resim penceresi ve dış köşeleri gerçek alpha 0.
- `10-screen-designs`: yeni açılış ve gözden geçirilmiş savaş konsepti. PNG mockuplar çalışır oyun ekranı değildir; çevre modellerini ikame etmez.
- `06-vfx/animated-v2`: ayrı Blender dosyası ve altı GLB. Her klip 1,5 saniye; bir RGBA düzlem ve on hareketli mesh parçası. Dokular gömülü, harici URI yok. Opaklık eğrisi/final shader ayrı uygulanır; hareket zamanları olay verisinden ayarlanır. Blender dosyası Beyaz Yankı önizlemesi için açılır; diğer koleksiyonların render görünürlüğü istenen etki için değiştirilebilir.
- `09-audio`: 24 ses/müzik dosyası; yedi katmanlı cue. Kaynak, değişiklik ve lisanslar `audio-sources.json` ve `CREDITS.txt` içinde. Scott Buckley müziğinin CC-BY 4.0 atfı korunmalı.
- `11-bindings`: 12 kartın resim/çerçeve/VFX/ses ilişkileri, olay zamanları, ekran/durum akışı ve doğrulama raporu. Bu veri ilişkileri eski prototipe entegrasyon yapıldığı anlamına gelmez.

Güncel dosya listesi ve SHA-256: `manifest-v2.json`. `manifest.json` ilk teslimin tarihsel kaydıdır; güncel paketin doğrulaması için kullanılmaz. V2 ZIP içinde bu eski kayıt `manifest-v1.json` adıyla tutulur. Kod, uygulama veya üretim scriptleri ZIP'e alınmaz. 3D tahta ilk ayrıntılı blok modeldir; final sculpt/PBR/UV/LOD geçişi ve bütün ekran durumlarının üretimi tamamlanmış değildir.

**Güncel kapsam: yalnızca tasarım ve assetler.** Bu klasör kod prototipinden bağımsızdır. Yeni oyun kodu eklenmedi. Kart/arayüz resimleri özgün AI üretimi; çevre için Blender'da gerçek 3D sahne hazırlandı. LoR görselleri paketlenmedi. Meshy kullanılmadı. Bütün teslim ilk sanat/modelleme dilimidir; final kalite onayı değildir.

| Klasör | İçerik |
|---|---|
| 01-environments | Korvengrad ana resim ve boş savaş tahtası |
| 02-characters | Altı karakter portresi, PNG kaynak kesimleri |
| 03-spells | Beş büyü/duygu illüstrasyonu |
| 04-card-frames | Şeffaf kart çerçeveleri |
| 05-interface | Arayüz parçaları ve ekran tasarım önerisi |
| 06-vfx | Statik efekt şekil/doku araştırması |
| 07-production | Kaynaklı LoR araştırması, üretim brifi ve kalite kontrol |
| sources | Kayıpsız atlaslar ve önceki üretimin prompt kayıtları |
| fonts | Cinzel ve Manrope; OFL lisansları |
| 08-3d | Düzenlenebilir Blender sahnesi, 5 GLB model/assembly, render ve 5 saniyelik hareket önizlemesi |

`manifest.json` gerçek dosyaları, boyutları, alpha durumunu, promptları ve kısıtları listeler. PNG'ler raster kaynaklardır; PSD/Figma katmanları değildir. `08-3d/eruldin-korvengrad-board-v1.blend` gerçek geometri, malzeme, ışık ve animasyon içerir. PNG tahta konsepti modelin yerine kullanılacak nihai arka plan değildir.

Kart değerleri ve mockup sıralama adları örnek tasarım verisidir. Borislav'ın kemik zarları yanlış yorumlanan eski görsel bu paketin kullanılacak assetlerine alınmadı. Karakter kıyafeti, arma, çevre ve malzemelerdeki ek yorumlar roman kanonu değildir; kaynak referansları proje `docs/canon` klasöründe bulunur.

Başlangıç okuma: `07-production/LOR_ART_PIPELINE.md` ve `07-production/PRODUCTION_BRIEF.md`. Bu paket için kod çalıştırmak veya sunucu kurmak gerekmez.
