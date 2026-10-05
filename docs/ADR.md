# Teknik kararlar

## ADR-001 — Tek sunuculu yerel web prototipi

**TASARIM ÖNERİSİ; uygulandı.** Node.js ESM, saf JavaScript motoru, HTML/CSS arayüz. Kullanıcı yerelde kurulabilir ilk sürüm istedi; başlangıçta kod yoktu. TypeScript/PixiJS kurulumunu ve build hattını sonraya bırakarak çalışır oyun, özgün sanat, otoriteli komut hattı teslim edildi. Harici npm paketi kullanılmıyor. Node 24.18.1 ve npm 11.16.0 çalıştırılarak doğrulandı.

| Yön | Web / mevcut seçim | Godot | Unity |
|---|---|---|---|
| İlk çalıştırma | Node + tarayıcı | Editör ve export hattı | Editör ve proje/build hattı |
| Kart metni/menü düzeni | DOM/CSS erişilebilirliği | Control node sistemi | UI toolkit/Canvas |
| Aynı motoru sunucuda çalıştırma | Doğrudan ESM | Ayrı sunucu entegrasyonu | .NET sunucu mümkün |
| 2D shader / ağır VFX | Daha sonra Canvas/WebGL | Yerleşik motor hattı | Yerleşik motor hattı |
| İlk dilim kararı | **Seçildi** | Değerlendirme önerisi | Değerlendirme önerisi |

Motor alternatifleri bu oturumda kurulup benchmark edilmedi; matris performans ölçümü değildir. Steam paketleme henüz yapılmadı. Önerilen sonraki teknik geçiş: TS tipleri, JSON şema, ESLint, içerik dosyalarını modülden ayırma ve daha büyük VFX gerektiren tahtaya Canvas katmanı.

## ADR-002 — HTTP komutu + SSE durumu

Sunucu motoru çağırır; istemci yalnızca komut gönderir. SSE ile kişiye özel görünüm yayınlanır. İstemci rakibin elinin/destesinin kimliğini alamaz. Kart, can, sonuç, puan istemciden kabul edilmez. Küçük prototipte WebSocket paketinden kaçınmak için SSE kullanıldı. SSE tek yönde olduğu için hamle POST olur. Kaynak: [MDN SSE](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events).

Yerelde odalar ve maçlar bellektedir. Profil, ilerleme ve puan JSON dosyasına seri yazma kuyruğuyla kaydedilir. Üretim için transaction destekli veritabanı, komut idempotency anahtarı, timeout, snapshot/replay, çok sunucu koordinasyonu ve hesap sistemi gereklidir.

## ADR-003 — Saf ve tekrar üretilebilir motor

`command(state, actor, command)` girdiyi değiştirmeden yeni state döndürür. Tohumlu PRNG yalnızca başlangıç destesi sıralamasında kullanılır. Komutlar, olaylar ve saldırı/savunma penceresi açıktır. Aynı yapılandırma + aynı komutlar = aynı state testi geçti. Kart etkileri ortak `effect` alanı üzerinden uygulanır; tam DSL yorumlayıcısı henüz yoktur.

PvP ilk oyuncusu sunucuda rastgele seçilir; hikâye oyuncu 0 ile başlar. Bot gizli kart kimliği okumaz; halka açık safı ve kendi elini kullanır. Bot, bilgi kümesi araması/MCTS uygulaması değildir.

## ADR-004 — Özgün raster sanat + CSS çerçeve

Yerel üretilmiş çevre, karakter atlası ve büyü atlası; yeniden üretim promptları manifestte. Çerçeve, menü, ikon, parçacık ve geçişler kodla oluşturuldu. Görseller final kanon ilanı değildir. Cinzel/Manrope OFL dosyaları beraber saklanır. Kaynak atlaslar korunur; tüketilen WebP dosyaları proje içinde yereldir. Sesler Web Audio ile sentezlenir, üçüncü taraf kayıt kullanılmaz.
