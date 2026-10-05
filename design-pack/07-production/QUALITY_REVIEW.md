# İlk dilim görsel kontrolü

Kayıt: 5 Ekim 2026. İllüstrasyon/arayüz üretimi built-in imagegen; 3D sahne üretimi Blender 4.5.14 LTS. Kaynak PNG'ler korundu; atlas kesimi yalnız dosya hazırlama işlemidir. Üretim promptları `sources/prompts-v1.json` ve `sources/initial-manifest.json` içinde.

| Kontrol | Bulgular |
|---|---|
| Korvengrad ana resim | Gotik çevre/sıcak ışık odağı tutarlı; çevre kanonik geometri değildir |
| Tahta konsepti | Merkez sakin, süsler kenarlarda; bu raster final oyun çevresi olarak sunulmaz |
| Karakterler | Altı kaynak portre kesildi; tam boy/arka görünüş/rig yok |
| Büyüler | Beş illüstrasyon paketlendi; yanlış kemik zar paneli kullanılacak assetlere alınmadı |
| Kart çerçeveleri | RGBA; resim penceresi merkezinde alpha 0. Gerçek boyutlar farklı, ortak 3:4 şablon temizliği bekliyor |
| Arayüz atlası | 12 RGBA parça; avatar merkezi alpha 0. Üretilen satır yükseklikleri eşit olmadığından nesne siluetine göre kesildi |
| Düğme durumları | Dört durum üretildi; pressed/disabled farkları final erişilebilirlik/kontrast kabulünden geçmedi |
| Ana ekran | Kaynak çevre ve portrelerle tasarım önerisi üretildi; 12. sıra örnek veridir. Resimdeki yazılar final metin katmanı değildir |
| VFX | Altı RGBA statik doku; atlas kaynakları korundu. Tam zaman tutarlı animasyon/flipbook değildir |
| 3D kadraj | İlk renderda kesilen kuleler düzeltildi; son render tüm dioramayı gösteriyor |
| 3D alev | İlk opak kabuk saydam katmanlara çevrildi; son renderda lokal glow ve çekirdek görünüyor |
| 3D hareket | 60 kare/5 saniye render önizlemesi üretildi. Başlangıç/bitiriş ve orta poz JSON ile doğrulandı |
| GLB | Dosya uzunluğu/header, mesh, üçgen, animasyon ve harici URI kontrolü yapıldı; oyun motoru entegrasyonu test edilmedi |

Final kabul için ortak çerçeve geometri temizliği, bütün ekran/durum tasarımları, gerçek fontlarla Türkçe metin dizimi, hareket/kontrast kontrolü, final model sculpt ve PBR/UV/LOD üretimi gerekir. Bunlar ilk pakette tamamlandı diye işaretlenmez.
