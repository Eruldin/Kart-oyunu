# Eruldin: Yankılar — tasarım ve asset paketi

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
