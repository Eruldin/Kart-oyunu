ERULDİN / YANKILAR — ÇERÇEVE DÜZELTMESİ V4

Güncel kontrol dosyası: 07-production/Eruldin-Kart-Cerceveleri-v4.pdf
Önce/sonra: 04-card-frames/before-after-v4.png

5 yeni şeffaf raster asset:
champion-frame-v4.png, unit-frame-v4.png, spell-frame-v4.png,
board-unit-frame-v4.png, board-champion-frame-v4.png.

Portreye sarkan kemer/taş/üst süs kaldırıldı. Yan bordürler inceltildi. Maliyet rozeti küçültülüp üst dış köşeye, saldırı/can rozetleri alt alana alındı. Masa kartları kare portreyi küçücük ortada bırakmayacak şekilde yeniden oranlandı.

Asıl ikinci düzeltme yerleşimdir: frame-layout-v4.json her assetin ölçülmüş şeffaf penceresini ve güvenli görsel dikdörtgenini içerir. Görsel bu dikdörtgene oranı korunarak sığdırılır; büyütülüp doldurulmaz, kırpılmaz veya esnetilmez. Yalnız frame dosyasını değiştirip eski zoom/clip ayarını tutmak düzeltmeyi tam uygulamaz.

Güncel kart eşlemesi: 11-bindings/card-bindings-v4.json
Güncel düşman eşlemesi: 13-enemies/asset-bindings-v4.json
Kontrol kaydı: 11-bindings/frame-validation-v4.json

7 karakter, 5 büyü, 12 düşman aile portresi ve 7 masa kartı gerçek sanat dosyalarıyla görsel olarak kontrol edildi. Eski karakter görselleri, önceki PDF’ler, roman ve harita kaynak klasörü değiştirilmedi. V1/V2/V3 çerçeve/belgeleri tarihsel kayıt; yeni yerleşim için v4 kullanılır.

Raster düzeltmeler image_gen ile yapıldı. Promptlar sources/frame-v4/ içinde saklıdır. Programla yalnız kayıpsız atlas kesimi, şeffaflık ölçümü ve PDF dizgisi yapıldı.

Bu teslimat tasarım ve asset paketidir; yeni çerçeveler uygulama koduna bağlanmadı. Tam pakette önceki harita, düşman, ses ve efekt assetleri de korunur. Harita ve hikâye için README-v3.txt; çerçeve için bu dosya; güncel dosya bütünlüğü için manifest-v4.json kullanılır.
