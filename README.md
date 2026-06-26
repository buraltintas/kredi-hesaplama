# Bankacı Kredi Hesaplama

Bankacı Kredi Hesaplama, kredi tutarı, vade, aylık faiz oranı, KKDF/BSMV ve ödeme planı tipine göre detaylı geri ödeme planı oluşturan Türkçe bir React web uygulamasıdır.

Canlı adres: https://kredi-hesaplama.netlify.app/

## Özellikler

- Standart sabit taksitli kredi hesaplama
- Peşin faiz ödemeli plan
- Eşit anapara ödemeli plan
- Özel / balon ödeme planı
- Anapara ödemesiz dönemli plan
- Artan taksitli plan
- Kredi kullanım tarihi ve ilk taksit tarihine göre kırık dönem farkı
- Detaylı ödeme planı / amortisman tablosu
- PDF ödeme planı indirme
- İsteğe bağlı PDF iletişim bilgisi
- Son 20 hesaplamayı tarayıcıda saklama
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

## Teknik Notlar

- React 17 ve Create React App 4 kullanır.
- PDF çıktıları `jspdf` ve `jspdf-autotable` ile üretilir.
- Türkçe karakter desteği için PDF içinde uygulama fontu gömülür.
- Node 20/OpenSSL uyumluluğu için `start` ve `build` scriptlerinde `NODE_OPTIONS=--openssl-legacy-provider` kullanılır.
