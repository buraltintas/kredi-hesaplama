# Bankacı: Kredi Hesaplama

Bankacı web projesi, mobil uygulamayı tanıtan SEO uyumlu landing page ile ileride kullanılacak `/admin` yönetim kabuğunu içerir. Önceki kredi hesaplama motoru kaynak kodda korunmaktadır ancak ana rotada sunulmaz.

Planlanan ana adres: https://bankaci.app/

Mevcut adres: https://bankaci.burak-altintas.com/

## Web yüzeyleri

- `/`: Bankacı mobil uygulama landing page'i
- `/admin`: Şimdilik statik ve veri bağlantısı olmayan yönetim kabuğu
- `/privacy/`: Mağaza ve mevzuat için mevcut gizlilik sayfası (korunur)

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
