MyCloud - Kişisel Yerel Bulut Sunucusu
Bu proje, atıl durumdaki eski bir bilgisayara Ubuntu Server kurularak geliştirilmiş kişisel bir bulut depolama uygulamasıdır. Temel amacı, uzaktan erişim sağlayarak (Tailscale vb. araçlarla) dosya yükleme, indirme, klasör yönetimi ve mobil cihazlardan otomatik yedekleme yapmaktır.

Proje geliştirilirken donanım ve ağ kısıtlamalarından kaynaklı çeşitli sorunlarla karşılaşılmış ve bu sorunlar backend tarafında uygulanan çözümlerle giderilmiştir.

Karşılaşılan Sorunlar ve Çözümler
1. Video Yükleme ve Oynatma Darboğazı (HLS & FFmpeg)
Sorun: Telefonlarla çekilen yüksek çözünürlüklü (4K/1080p) ve yüksek boyutlu MP4/MOV videolar, doğrudan sunucudan telefona çekilmeye çalışıldığında ev internetinin yükleme (upload) hızını tıkayarak videoların çok geç açılmasına veya hiç oynatılamamasına neden oluyordu.
Çözüm: Backend'de fluent-ffmpeg kütüphanesi kullanıldı. Yüklenen videolar arka planda web formatına (720p ve 2000k bitrate) dönüştürülüp 2 saniyelik .ts parçalarına (HLS formatı) bölündü. Frontend tarafında hls.js kullanılarak, videoların tamamının inmesi beklenmeden sadece ilk birkaç saniyelik parçalar indirilip anında oynatılması sağlandı.

2. Sunucu Kilitlenme Sorunu (İşlem Kuyruğu)
Sorun: Klasördeki mevcut videolar topluca dönüştürülmek istendiğinde veya aynı anda birden fazla video yüklendiğinde, FFmpeg hepsini aynı anda işlemeye çalışarak eski bilgisayarın işlemci ve RAM'ini %100'e çıkarıyor ve sistemin çökmesine neden oluyordu.
Çözüm: İşlemlerin aynı anda değil, sırayla yapılmasını sağlayan asenkron bir kuyruk (queue) sistemi yazıldı. async/await yapısı kullanılarak, bir videonun dönüşümü %100 bitmeden diğerine geçilmesi engellendi. Ayrıca sunucu yeniden başlarsa diye, daha önce dönüştürülmüş videoları kontrol edip atlayan bir yapı kuruldu.

3. Büyük Dosya Yüklemeleri (Chunk Upload)
Sorun: Gigabaytlarca büyüklükteki dosyaları tek seferde HTTP üzerinden yüklemeye çalışmak bağlantı kopmalarına ve bellek sorunlarına yol açıyordu.
Çözüm: Dosyalar frontend tarafında 5 MB'lık parçalara (chunk) bölündü. Backend bu parçaları sırayla alıp fs.createWriteStream ile diskte tekrar birleştirerek dosya yükleme işlemini daha stabil hale getirdi.

4. Klasör Yüklenme Hızı (Thumbnail Optimizasyonu)
Sorun: Klasör içindeki yüksek çözünürlüklü fotoğrafların tam boyutta listelenmesi arayüzü yavaşlatıyordu.
Çözüm: sharp kütüphanesi kullanılarak, yüklenen resimlerin 300px boyutunda düşük kaliteli WebP versiyonları (thumbnail) arka planda otomatik olarak oluşturuldu.

Kullanılan Teknolojiler
* Node.js & Express: Backend sunucusu ve API endpointleri için.

* Fluent-FFmpeg: Video dönüştürme ve HLS parçalama işlemleri için.

* Sharp: Görsel optimizasyonu ve küçük resim (thumbnail) üretimi için.

* Socket.io: Arka planda devam eden uzun video dönüştürme işlemlerinin yüzdesini frontend'e canlı olarak aktarmak için.

* React & TypeScript: Kullanıcı arayüzü için.

* Hls.js: HLS formatındaki video parçalarını tarayıcıda oynatabilmek için.

* Capacitor: Mobil cihazın yerel depolamasına erişip, sadece yeni fotoğrafları bularak sunucuya otomatik yedekleyen (sync) mobil uyumluluk için.

PM2: Sunucu kodlarının arka planda sürekli çalışması ve hata durumunda yeniden başlatılması için.

Kurulum ve Çalıştırma
Sistemde FFmpeg yüklü olmalıdır. (Ubuntu için: sudo apt install ffmpeg)

Bağımlılıkları yüklemek için:

Bash
npm install
Sunucuyu PM2 ile başlatmak için:

Bash
pm2 start index.js
Logları takip etmek için:

Bash
pm2 logs
