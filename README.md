# Eruldin: Yankılar

**Güncel çalışma: tasarım ve asset paketi.** Kullanıcının son yönlendirmesiyle yeni geliştirme `design-pack/` klasöründeki sanat üretimine çevrildi. Aşağıdaki oynanabilir prototip önceki çalışmadır; asset paketini incelemek için çalıştırılması gerekmez. Güncel durum `STATUS.md` içinde.

Hikâyede ulaştığın en uzak noktaya göre sıralandığın, aynı hikâye katmanında düello yaptığın özgün kart oyununun ilk oynanabilir sürümü.

## Başlat

Node.js 22 veya üzeri gerekir. Harici npm paketi veya API anahtarı gerekmez.

```powershell
npm.cmd start
```

Tarayıcı: http://localhost:3000

`Oyunu-Baslat.cmd` dosyasına çift tıklamak da oyunu ve tarayıcıyı açar. Sunucu terminali açık kalmalı.

## Oyna

- **Hikâye yolu:** karşılaşmaya gir, Yankını seç. İlk dört karşılaşma kaynak kitaptaki yolculuğu temel alır; beşincisi bir oyun uyarlaması olan Yankı sınamasıdır.
- **Kart çağır:** eldeki karta tıkla veya dost safına sürükle. Hedefli büyü için bir düşman birimi veya rakip portresini seç.
- **Taarruz:** kendi safında birimleri seç, Taarruz et. Savunurken önce saldıran düşmana, sonra savunacak dost birimine tıkla; Savunmayı tamamla.
- **Tur:** iki taraf art arda Hamleyi bırak seçerse ilerler. Öz yenilenir, bir kart çekilir ve taarruz hakkı el değiştirir.
- **Yankı:** 6 Hatıra biriktir, yeteneğini maçta bir kez kullan.
- **Destelerim:** 20 kart, aynı karttan en fazla 3 kopya. Tüm prototip kartları açık.
- **Çevrimiçi:** Yankı düellosu → Oda oluştur. İkinci oyuncu aynı sunucuya başka tarayıcı profili/gizli pencere veya cihazdan bağlanıp kodu girer. Hikâye katmanları eşit olmalı.

İki cihaz aynı ağdaysa ikinci oyuncu `http://SUNUCU_BILGISAYARININ_YEREL_IP_ADRESI:3000` üzerinden bağlanabilir; işletim sisteminin mevcut güvenlik duvarı izinlerine bağlıdır. Bu sürüm internette yayımlanmış değildir; global hesap sistemi yoktur.

## Doğrula

```powershell
npm.cmd test
npm.cmd run simulate
```

Motorun 29 testi ve ayrı geçici verilerle çalışan sunucu entegrasyon testi vardır. Simülasyon 9 Yankı eşleşmesinde toplam 900 tohumlu bot maçı üretir; `reports/balance.json` içine kaydeder.

## Dosyalar

- `packages/engine/index.mjs`: deterministik komut/olay motoru; gizli bilgi görünümü ve bot.
- `packages/content/cards.mjs`: 12 kart, 3 Yankı, 5 karşılaşma; kaynak referansları.
- `server.mjs`: sunucu otoriteli HTTP komutları, SSE canlı maç güncellemeleri, odalar, ilerleme ve sıralama.
- `public/`: istemci, özgün görseller, fontlar, Türkçe/İngilizce arayüz sözlüğü.
- `docs/research/MARKET.md`: birincil kaynaklı rakip araştırması ve çıkarımlar.
- `docs/GDD.md`: uygulanmış kurallar ve daha sonraki tasarım önerileri.
- `docs/canon/`: doğrulanan kaynaklar ve süreklilik notları.
- `STATUS.md`: teslimat, sınırlar ve sonraki işler.

## Kalıcılık ve kapsam

Profilin tarayıcıdaki rastgele oturum anahtarıyla tanınır. İlerleme, deste ve puan sunucudaki `data/profiles.json` dosyasına yazılır. Tarayıcı verisini silmek erişimi kaybettirir. Maçlar ve odalar bellektedir; sunucu yeniden başlatıldığında devam eden maçlar kaybolur. Hikâye/puan kayıtları kalır.

Bu bir üretim sürümü değildir. İnternete açmadan önce hesap kurtarma, HTTPS, hız sınırları, maç süreleri, bağlantı kopma hükmü, veritabanı, kaydedilen replay, hile/çift hesap önleme ve operasyon izleme gerekir. İngilizce arayüz mevcut; hikâye, kart açıklamaları ve kanon uyarlaması henüz Türkçedir.

Eruldin adı çalışma adıdır. Üretilmiş görseller görsel tasarım yorumudur; final kanon/sanat onayı sayılmaz. Riot veya başka oyunlara ait görsel, ses, kart çerçevesi alınmadı. Cinzel ve Manrope fontlarının OFL lisansları `public/assets` içindedir.
