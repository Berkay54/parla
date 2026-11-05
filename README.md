# Parla Diş Kliniği — konsept web sitesi

Bir diş kliniği için hazırlanmış konsept web sitesi. Tasarım ve geliştirme: [DAB Labs](https://dablabs.net).

> Parla Diş Kliniği hayali bir markadır. Hekim isimleri, adres, telefon, puan ve hasta sayıları örnek amaçlıdır.

## Özellikler
- Duyarlı (mobil uyumlu) tasarım, kaydırınca beliren animasyonlar, sayaçlar
- Online randevu penceresi: tedavi, tarih, saat, ad ve telefon seçimi; doğrulama ve onay ekranı
- SEO: meta etiketleri, `Dentist` ve `FAQPage` yapısal verisi, sitemap, robots.txt
- Güvenlik başlıkları (`vercel.json`)

## Yerelde çalıştırma
Derleme adımı yoktur, düz HTML/CSS/JS'dir:

```
npx http-server . -p 8081 -c-1
```

## Ayarlar
`assets/js/main.js` dosyasının başındaki `CONFIG`:
- `WEB3FORMS_KEY`: boşsa randevu formu **demo modunda** çalışır (talep gönderilmez). Bir [Web3Forms](https://web3forms.com) anahtarı girilirse talepler e-postaya gelir.
- `WHATSAPP`: örn. `905551234567`. Boşsa WhatsApp butonu gizlenir.
- Çalışma günleri ve saat dilimleri (`SLOTS_WEEKDAY`, `SLOTS_SATURDAY`).

Dolu saatler şu an örnek bir desenle gösterilir; gerçek bir randevu takvimine bağlı değildir.
