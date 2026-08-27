# Bankacı: Kredi Hesaplama

## Kamuya açık talep formu

`/request/{requestId}` mobil uygulamadaki giriş yapmış Premium bankacının kalıcı bağlantısını açar. Form bankacının güncel profil adını, zorunlu telefonunu ve tercih edilmişse e-postasını gösterir. Müşteri kredi ve iletişim bilgileri, not ve en fazla beş belge gönderebilir; açık veri aktarım onayı zorunludur.

Paylaşılan `/r/{requestId}` adresi Nginx üzerinden API'nin Open Graph çıktısına yönlendirilir. WhatsApp kart başlığı bankacının güncel profil adıyla `{Ad Soyad} | Kredi Talep Formu` biçiminde, açıklama ve 1200×630 `public/request-preview.png` görseli ise genel “Kredi talebinizi güvenle iletebilirsiniz” mesajıyla sunulur. Önizleme sonrasında tarayıcı `/request/{requestId}` formuna geçer. API ve web sürümleri birlikte deploy edilmelidir.

Bankacı web projesi, mobil uygulamayı tanıtan SEO uyumlu landing page ile ileride kullanılacak `/admin` yönetim kabuğunu içerir. Önceki kredi hesaplama motoru kaynak kodda korunmaktadır ancak ana rotada sunulmaz.

https://bankaci.app/

## Web yüzeyleri

- `/`: Bankacı mobil uygulama landing page'i
- `/admin`: Env allowlist'indeki yönetici e-postasına gönderilen tek kullanımlık
  kodla açılan, tokenı kalıcı tarayıcı depolamasına yazmayan yönetim alanı
- `/privacy/`: KVKK aydınlatması; üyelik/OTP, profil ve public feed, RevenueCat
  Premium, push, reklam, GCS medya ve takma kimlikli hesaplama analitiğini kapsar

## Gizlilik metni bakım notu

`public/privacy/index.html` ürünün gerçek veri akışıyla aynı değişiklik setinde
güncellenmelidir. Yeni veri kategorisi, hizmet sağlayıcı, yurt dışı aktarım,
saklama süresi veya kullanıcıya dönük özellik eklenirken privacy metni ve mobil
mağaza veri beyanları birlikte gözden geçirilir.

Doğrulanmış üyelik e-postası, opaque RevenueCat kullanıcı kimliği korunarak
destek sırasında aboneliği bulmak amacıyla RevenueCat subscriber attribute olarak
aktarılır. Bu akış değişirse privacy metni, Apple App Privacy ve Google Play Data
Safety beyanları birlikte güncellenmelidir.

Sürüm 3.0 ile Türkçe metin yeni üyelik altyapısına göre yenilenmiş, artık gerçek
veri akışını yansıtmayan İngilizce çevirinin dil seçicisi yayından kaldırılmıştır.
İngilizce seçenek yeniden açılmadan önce metin Türkçe sürüm 3.0 ile bütünüyle
eşitlenmeli ve ayrıca hukuki dil kontrolünden geçirilmelidir.

Üyelik yayınlanmadan önce mobil uygulamada bulunabilir hesap silme akışı ve
backend'de ilişkili profil/feed/session/push verilerini kapsayan silme endpoint'i
tamamlanmalıdır. Hesap silme mağaza aboneliğini otomatik iptal etmez; kullanıcıya
Apple/Google abonelik yönetimi ayrıca gösterilmelidir.

## Korunan hesaplama kodu

- Standart sabit taksitli kredi hesaplama
- Peşin faiz ödemeli plan
- Eşit anapara ödemeli plan
- Özel / balon ödeme planı
- Anapara ödemesiz dönemli plan
- Artan taksitli plan
- Kredi kullanım tarihi ve ilk taksit tarihine göre kırık dönem farkı
- İlk taksit ertelemesini vadeden düşme seçeneği
- Artan taksitli planlarda artış başlangıç ve bitiş taksiti belirleme
- Detaylı ödeme planı / amortisman tablosu
- Türkçe karakter destekli PDF ödeme planı indirme
- İsteğe bağlı PDF iletişim bilgisi
- Son 20 hesaplamayı tarayıcıda saklama
- Uygulama hakkında bilgi modalı
- Mobil, tablet ve masaüstü için responsive arayüz

## Kurulum

```bash
npm install
```

## Geliştirme

```bash
npm start
```

Uygulama varsayılan olarak `http://localhost:3000` adresinde çalışır.

## Production Build

```bash
npm run build
```

Build çıktısı `build/` klasörüne üretilir.

## Cloud Run

Repo kökündeki `Dockerfile`, React production build'ini oluşturup Nginx ile
Cloud Run'ın sağladığı `$PORT` üzerinden servis eder. Cloud Build sürekli
dağıtım ayarları:

- Branch: `^main$`
- Build type: `Dockerfile`
- Source location: `/Dockerfile`

Entrypoint veya function target girilmez. `/admin` SPA fallback ile açılır;
mevcut `/privacy/` sayfası ayrı statik belge olarak korunur. Sağlık kontrolü
`/healthz` yolundadır.

## Teknik Notlar

- React 17 ve Create React App 4 kullanır.
- PDF çıktıları `jspdf` ve `jspdf-autotable` ile üretilir.
- Türkçe karakter desteği için PDF içinde uygulama fontu gömülür.
- Create React App 4 uyumluluğu için Node sürümü `.nvmrc` ile sabitlenir.
