# MyCloud - Kişisel Yerel Bulut Sunucusu

### Masaüstü Görünümü
<p align="center">
  <img src="https://github.com/user-attachments/assets/f0e5db84-2ce3-4aa0-aa0a-f18590789769" width="400" />
  <img src="https://github.com/user-attachments/assets/e402713d-5995-42c6-a66c-aae1c0112c45" width="400" />
</p>
<p align="center">
  <img src="https://github.com/user-attachments/assets/17ef8f7d-be2b-40a3-abb3-be8ec3b1e54c" width="400" />
  <img src="https://github.com/user-attachments/assets/607fef80-95fd-47b2-9720-33ff744b6132" width="400" />
</p>

### Mobil Görünüm
<p align="center">
  <img src="https://github.com/user-attachments/assets/f617f17f-8be1-4aa1-9946-aa690d4d64b7" width="200" />
  <img src="https://github.com/user-attachments/assets/34ba67c7-dda6-4788-bf1a-ea90d5c28b65" width="200" />
  <img src="https://github.com/user-attachments/assets/0ccdd157-025b-4ef9-a6f6-6ab7351fcf54" width="200" />
  <img src="https://github.com/user-attachments/assets/68787753-3076-4777-b459-ff9b8691593e" width="200" />
</p>

<hr>

Bu proje, atıl durumdaki eski bir bilgisayara Ubuntu Server kurularak geliştirilmiş kişisel bir bulut depolama uygulamasıdır. Temel amacı, uzaktan erişim sağlayarak (Tailscale vb. araçlarla) dosya yükleme, indirme, klasör yönetimi ve mobil cihazlardan otomatik yedekleme yapmaktır.

Proje geliştirilirken donanım ve ağ kısıtlamalarından kaynaklı çeşitli sorunlarla karşılaşılmış ve bu sorunlar backend tarafında uygulanan çözümlerle giderilmiştir.

## Karşılaşılan Sorunlar ve Çözümler

### 1. Video Yükleme ve Oynatma Darboğazı (HLS & FFmpeg)
**Sorun:** Telefonlarla çekilen yüksek çözünürlüklü (4K/1080p) ve yüksek boyutlu MP4/MOV videolar, doğrudan sunucudan telefona çekilmeye çalışıldığında ev internetinin yükleme (upload) hızını tıkayarak videoların çok geç açılmasına veya hiç oynatılamamasına neden oluyordu.
**Çözüm:** Backend'de fluent-ffmpeg kütüphanesi kullanıldı. Yüklenen videolar arka planda web formatına (720p ve 2000k bitrate) dönüştürülüp 2 saniyelik .ts parçalarına (HLS formatı) bölündü. Frontend tarafında hls.js kullanılarak, videoların tamamının inmesi beklenmeden sadece ilk birkaç saniyelik parçalar indirilip anında oynatılması sağlandı.

### 2. Sunucu Kilitlenme Sorunu (İşlem Kuyruğu)
**Sorun:** Klasördeki mevcut videolar topluca dönüştürülmek istendiğinde veya aynı anda birden fazla video yüklendiğinde, FFmpeg hepsini aynı anda işlemeye çalışarak eski bilgisayarın işlemci ve RAM'ini %100'e çıkarıyor ve sistemin çökmesine neden oluyordu.
**Çözüm:** İşlemlerin aynı anda değil, sırayla yapılmasını sağlayan asenkron bir kuyruk (queue) sistemi yazıldı. async/await yapısı kullanılarak, bir videonun dönüşümü %100 bitmeden diğerine geçilmesi engellendi. Ayrıca sunucu yeniden başlarsa diye, daha önce dönüştürülmüş videoları kontrol edip atlayan bir yapı kuruldu.

### 3. Büyük Dosya Yüklemeleri (Chunk Upload)
**Sorun:** Gigabaytlarca büyüklükteki dosyaları tek seferde HTTP üzerinden yüklemeye çalışmak bağlantı kopmalarına ve bellek sorunlarına yol açıyordu.
**Çözüm:** Dosyalar frontend tarafında 5 MB'lık parçalara (chunk) bölündü. Backend bu parçaları sırayla alıp fs.createWriteStream ile diskte tekrar birleştirerek dosya yükleme işlemini daha stabil hale getirdi.

### 4. Klasör Yüklenme Hızı (Thumbnail Optimizasyonu)
**Sorun:** Klasör içindeki yüksek çözünürlüklü fotoğrafların tam boyutta listelenmesi arayüzü yavaşlatıyordu.
**Çözüm:** sharp kütüphanesi kullanılarak, yüklenen resimlerin 300px boyutunda düşük kaliteli WebP versiyonları (thumbnail) arka planda otomatik olarak oluşturuldu.

## Kullanılan Teknolojiler
* **Node.js & Express:** Backend sunucusu ve API endpointleri için.
* **Fluent-FFmpeg:** Video dönüştürme ve HLS parçalama işlemleri için.
* **Sharp:** Görsel optimizasyonu ve küçük resim (thumbnail) üretimi için.
* **Socket.io:** Arka planda devam eden uzun video dönüştürme işlemlerinin yüzdesini frontend'e canlı olarak aktarmak için.
* **React & TypeScript:** Kullanıcı arayüzü için.
* **Hls.js:** HLS formatındaki video parçalarını tarayıcıda oynatabilmek için.
* **Capacitor:** Mobil cihazın yerel depolamasına erişip, sadece yeni fotoğrafları bularak sunucuya otomatik yedekleyen (sync) mobil uyumluluk için.
* **PM2:** Sunucu kodlarının arka planda sürekli çalışması ve hata durumunda yeniden başlatılması için.

---

## Kurulum ve Çalıştırma

### Backend (Sunucu) Kurulumu
Sistemde FFmpeg yüklü olmalıdır. (Ubuntu için: `sudo apt install ffmpeg`)

1. Backend klasörüne girip bağımlılıkları yükleyin:
   ```bash
   npm install
Sunucuyu PM2 ile başlatın:

Bash
pm2 start index.js
Logları takip etmek için:

Bash
pm2 logs
Frontend ve Mobil Uygulama (Capacitor) Kurulumu
Uygulamanın arayüzünü çalıştırmak ve Android için APK almak istiyorsanız:

frontend klasörüne girip bağımlılıkları yükleyin:

Bash
npm install
React projesini derleyin (Build alın):

Bash
npm run build
Capacitor ile Android projesini güncelleyin ve Android Studio'da açın:

Bash
npx cap sync android
npx cap open android
Not: Açılan Android Studio üzerinden kendi cihazınıza doğrudan kurabilir veya "Build APK" seçeneği ile telefonunuza yükleyebilirsiniz. (Sunucu IP adresinizi .env veya App.tsx içinden kendi yerel/Tailscale IP'niz ile değiştirmeyi unutmayın!)
