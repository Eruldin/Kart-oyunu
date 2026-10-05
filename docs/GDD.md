# Eruldin: Yankılar — Oyun Tasarımı (GDD)

**Tür**: tek oyunculu hikâye + karşılıklı düello kart oyunu (LoR akışında)
**Kanon**: Marcel 1. kitap + Kızıl Kral lore + Eruldin atlası

## Çekirdek döngü

1. Sefer haritasında bölüm aç → bilgi + Yankı seç → deste kontrolü
2. Maç: seçim evresi (4 kart, istediğini değiştir) → tur döngüsü → zafer/yenilgi
3. Zafer → sonraki bölüm + yeni Yankı kilitleri açılır

## Kaynak modeli (arka matematik)

| Kaynak | Kural |
|---|---|
| Öz | Tur başında tamamen dolar, maks 10 |
| Anı | Harcanmayan Öz, tur sonunda Anıya döner (maks 3); yalnız büyülerde harcanır |
| Hatıra | Her tur başı +1; kartlar da verir; **6'da nihai yetenek** |

- Tahta: taraf başına 6 saf, el limiti 10, deste 20 kart, kart başına en fazla 3 kopya.
- Sıralı eylem: hamle sahibi kart oynar / taarruz eder / pas geçer → kontrol diğer tarafa geçer.
- Taarruz jetonu her tur el değiştirir; jeton sahibi turda 1 kez toplu taarruz ilan eder.
- Taarruzda rakip savunma evresine girer: her savunan bir saldırganı karşılar (birimler karşılıklı vurur; Çabuk önce vurur, Ezici taşırır, Gölge yalnız Gölge ile savunulur).
- Büyü hızları: **Yavaş** (yalnız hamle sırasında), **Hızlı** (yanıt zincirine girer), **Anı** (anında, yanıt alamaz). Zincir son giren önce çözülür.
- Yorulma: deste biterken çekilen her kart avatarı 1 yaralar.

## Yankılar (pasif + nihai)

| Yankı | Pasif | Nihai (6 Hatıra) |
|---|---|---|
| Marcel — Çamur ve Kül | Her tur ilk taarruz birimi +1 güç | Son düşen 2 dostu +1/+1 dirilt; avatarı 4 iyileştir |
| Beyaz Saçlı Marcel | Avatarın turda aldığı ilk hasar −3 | En güçlü düşmanı ele döndür; kalanlara 2 hasar; +3 iyileş; kart çek |
| Teom Zırhlı Marcel | Tur başı en yaralı dost 1 iyileşir | (tasarımdaki etki listesi engine'de tanımlı) |

## Fraksiyonlar ve anahtar kelimeler

- **Direniş/Koru**: Dayanıklı, Çağrı, iyileştirme — defans/tempo
- **Konsey/Kızıl**: hasar büyüleri, Ezici — baskın/aggro
- **Karah/Yozlaşma**: Gölge, Yozlaşma, Son Nefes — sürü/sabotaj
- **Teom/Göz**: Çelik, Yankı, diriltme — uzun oyun
- **Nötr/Kül**: ucuz doldurma birimleri

Anahtar kelimeler: Dayanıklı (−1 hasar/kaynak), Gölge, Çabuk, Ezici, Teom Çeliği (Yozlaşmaya dokunmaz; Karahlara +2), Yankı (ölünce zayıf kopya ele döner), Son Nefes, Çağrı.

## Hikâye (Marcel 1. kitap akışı)

| # | Bölüm | Rakip | HP | Kaynak |
|---|---|---|---|---|
| 1 | Kızıl Aziz'in Avlusu | Karah Sürüsü | 18 | M1 |
| 2 | Kırk Diş Geçidi | Geçit Nöbetçileri | 18 | M2 |
| 3 | Koru'nun Paslı Kalbi | Koru Muhafızları | 22 | M3 — Beyaz Yankı açılır |
| 4 | Göz'ün Manastırı | Beyaz Yankı | 28 | M4 — Teom Yankısı açılır |
| 5 | İlk Olan | Primus | 34 | M4 |

## Ekonomi / meta

- Bot desteleri bölüme özel; ilerleme aynı katmandaki oyuncularla oda düellosu.
- Denge simülasyonu `tests/simulate.mjs` — bölüm kazanma oranı hedefi %82,5→%30 eğrisinde; rapor `reports/balance.json`.

## Mimari

- `packages/engine` — saf, deterministik (tohumlu), mutasyonsuz durum makinesi; komutlar: mulligan/play/attack/block/pass/ultimate/concede
- `packages/content` — kart/yankı/bölüm verileri + desteler
- `server.mjs` — profil, ilerleme, sıralama, oda düellosu, SSE; gizli bilgi `viewFor` ile maskelenir
- `public/` — istemci (title → map → brief → mulligan → battle); `public/vendor` çevrimdışı kopya
- `dist/` — tek başına statik dağıtım
