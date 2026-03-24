
### 💻 Masaüstü Görünümü
<p align="center">
  <img src="https://github.com/user-attachments/assets/e170f0de-4b18-4e4d-8387-0965df622770" width="400" />
  <img src="https://github.com/user-attachments/assets/5b6dd2e5-e52c-48af-a002-6f2aa4193119" width="400" />
  <img src="https://github.com/user-attachments/assets/81392535-18fd-4434-9267-253f278e9a73" width="400" />
  <img src="https://github.com/user-attachments/assets/2b097a45-f690-49ff-a933-ba64a5be4a1f" width="400" />
</p>

### 📱 Mobil Görünüm (Capacitor)
<p align="center">
  <img src="![mobil_app](https://github.com/user-attachments/assets/939d0bf3-f06c-41cf-9c42-4b50bd07f027)" width="200" />
  <img src="![mobil_app01](https://github.com/user-attachments/assets/2961f24f-64fa-4a98-a720-10a234011d3d)" width="200" />
  <img src="![mobil_app02](https://github.com/user-attachments/assets/c914136a-c454-4c1f-9ecb-932a4c10d31d)" width="200" />
  <img src="![mobil_app04](https://github.com/user-attachments/assets/ca141021-8d97-4284-a2de-e23d69cf5464)" width="200" />
   
</p>

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
![mobil_app04](https://github.com/user-attachments/assets/ca141021-8d97-4284-a2de-e23d69cf5464)

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
### Frontend ve Mobil Uygulama (Capacitor) Kurulumu

Uygulamanın arayüzünü çalıştırmak ve Android için APK almak istiyorsanız:

1. `frontend` klasörüne girip bağımlılıkları yükleyin:
   ```bash
   npm install
React projesini derleyin (Build alın):

Bash
npm run build
Capacitor ile Android projesini güncelleyin ve Android Studio'da açın:

Bash
npx cap sync android
npx cap open android
Açılan Android Studio üzerinden kendi cihazınıza doğrudan kurabilir veya "Build APK" seçeneği ile telefonunuza yükleyebilirsiniz. (Sunucu IP adresinizi .env veya App.tsx içinden kendi yerel/Tailscale IP'niz ile değiştirmeyi unutmayın!)
