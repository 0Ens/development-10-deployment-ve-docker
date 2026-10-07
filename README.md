# Ziyaretçi Defteri — Deployment ve Docker

development-09'da yazdığım ziyaretçi defterinin canlıya çıkmış hali: React arayüzü Vercel'de, Express API'si Render'da, veriler Turso'da duruyor. API için bir Dockerfile ve her push'ta testleri koşan bir GitHub Actions workflow'u var.

## Canlı adresler

| Parça | Adres |
|---|---|
| Arayüz (Vercel) | https://development-10-deployment-ve-docker.vercel.app |
| API (Render) | https://development-10-deployment-ve-docker.onrender.com |
| API sağlık kontrolü | https://development-10-deployment-ve-docker.onrender.com/health |

Render'ın ücretsiz planı 15 dakika istek gelmeyince servisi uyutur; ilk istek yaklaşık bir dakika sürebilir.

## Bir istek nereden nereye gider

```
Tarayıcı
   │  1) Sayfayı ister
   ▼
Vercel  ── client/ klasörünün build edilmiş hali (HTML + JS + CSS)
   │
   │  2) Sayfadaki JS, VITE_API_URL adresine istek atar
   ▼
Render  ── server/ klasöründeki Express API
   │        - CORS: yalnızca izinli origin'e cevap başlığı ekler
   │        - JWT: mesaj yazmak için giriş ister
   │
   │  3) API, DATABASE_URL + DATABASE_AUTH_TOKEN ile veritabanına bağlanır
   ▼
Turso   ── SQLite uyumlu managed veritabanı (veri burada, diskte kalıcı durur)
```

Önemli nokta: veri Render'daki container'ın içinde değil. Render container'ı her deploy ve restart'ta sıfırdan kurar; içine yazılan her dosya silinir.

## Klasör yapısı

```
client/   React + Vite + TypeScript arayüzü
server/   Express API, Dockerfile, testler
.github/workflows/ci.yml   CI
```

## Lokal kurulum

Gerekenler: Node 22.

```bash
# API
cd server
cp .env.example .env     # JWT_SECRET değerini değiştir
npm ci
npm run dev              # http://localhost:3000

# Arayüz (ayrı terminalde)
cd client
npm ci
npm run dev              # http://localhost:5173
```

Lokalde arayüzün `.env` dosyasına ihtiyacı yok: `VITE_API_URL` boş kalır ve istekler Vite proxy üzerinden `localhost:3000`'e gider.

## Kullanım

1. Arayüzü aç; mesaj listesi herkese açıktır.
2. "Hesabın yok mu? Kayıt ol" bağlantısıyla e-posta ve en az 8 karakterlik şifreyle kayıt ol.
3. Mesajını yaz ve gönder; listenin en üstünde görünür.

## Testler

```bash
cd server && npm test             # 17 API testi (Jest + Supertest)
cd client && npm test -- --run    # 7 arayüz testi (Vitest + Testing Library)
```

API testleri gerçek bir veritabanına bağlanmaz; `DATABASE_URL=:memory:` ile bellekte geçici bir veritabanı kullanır. Bu yüzden lokalde ve CI'da aynı sonucu verir.

## CI

`.github/workflows/ci.yml` her push'ta iki işi koşar:

- **API testleri:** `server/` içinde `npm ci` ve `npm test`
- **Arayüz testleri ve build:** `client/` içinde `npm ci`, `npm test -- --run` ve `npm run build`

Koşular: https://github.com/0Ens/development-10-deployment-ve-docker/actions

## Docker

API'yi container içinde çalıştırmak için:

```bash
cd server
docker build -t guestbook-api .
docker run -p 3000:3000 -e JWT_SECRET=uzun-rastgele-bir-deger guestbook-api
```

Başka bir terminalden kontrol:

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

Container varsayılan olarak veriyi kendi içindeki `/data/guestbook.db` dosyasına yazar; container silinince veri de gider. Kalıcı olsun istenirse `-v guestbook-data:/data` eklenir ya da `-e DATABASE_URL=... -e DATABASE_AUTH_TOKEN=...` ile Turso'ya bağlanılır.

`.dockerignore` sayesinde `node_modules`, `.env`, veritabanı dosyaları ve testler imaja kopyalanmaz.

## Environment variable'lar

Gerçek değerler repoda yoktur; `.env` gitignore'dadır, production değerleri Render ve Vercel panellerinde tanımlıdır.

### API (`server/`, Render)

| Değişken | Örnek değer | Açıklama |
|---|---|---|
| `JWT_SECRET` | `replace_with_a_long_random_string` | Token'ları imzalayan sır |
| `DATABASE_URL` | `file:./guestbook.db` (lokal) / `libsql://ornek-db.turso.io` (canlı) | Veritabanı adresi |
| `DATABASE_AUTH_TOKEN` | `ornek-token` | Turso erişim token'ı; lokalde boş bırakılır |
| `CORS_ORIGIN` | `https://ornek.vercel.app,http://localhost:5173` | İzinli arayüz adresleri, virgülle ayrılır |
| `PORT` | `3000` | Render kendisi verir, elle girilmez |

### Arayüz (`client/`, Vercel)

| Değişken | Örnek değer | Açıklama |
|---|---|---|
| `VITE_API_URL` | `https://ornek-api.onrender.com` | API adresi, sonunda `/` olmadan |

`VITE_` ile başlayan değişkenler build sırasında JS dosyasına gömülür ve tarayıcıda herkes görebilir; buraya sır konmaz.

## CORS kararı

`app.use(cors())` her siteye izin verir; yani herhangi bir site, ziyaretçisinin tarayıcısı üzerinden bu API'yi çağırabilirdi. Bunun yerine yalnızca `CORS_ORIGIN`'de listelenen adreslere (kendi Vercel adresim ve lokal geliştirme adresi) izin verdim. Listeyi koda gömmek yerine environment variable'dan okuyorum ki arayüz adresi değişince kod değil panel değişsin.

## Kalıcılık kararı

Mesajlar Turso'da (SQLite uyumlu managed database) duruyor. İlk hali SQLite dosyasını API ile aynı yerde tutuyordu; bu Render'da çalışmaz, çünkü container her deploy ve restart'ta sıfırdan kurulur ve içindeki dosya silinir. İki seçenek vardı: Render'ın kalıcı diski ya da managed database. Kalıcı disk Render'ın ücretsiz planında bulunmadığı için managed database'i seçtim. Turso'yu seçmemin sebebi SQLite ile uyumlu olması: SQL sorgularım aynı kaldı, testler hâlâ bellekteki veritabanıyla koşuyor; yalnızca `better-sqlite3` yerine `@libsql/client` kullanıp veritabanı çağrılarını `async/await`'e çevirmem gerekti. Bedeli, her sorgunun artık ağ üzerinden gitmesi ve aynı makinedeki dosyaya göre daha yavaş olması. **Kanıt:** canlı siteden "benim ilk mesajim :)" mesajını yazdım, Render panelinden servisi restart ettim, sayfayı yeniledim; mesaj duruyordu.

## Ne öğrendim

- **Lokalde çalışmak canlıda çalışmak demek değil.** Lokalde Vite proxy istekleri API'ye taşıyordu; canlıda proxy yok, API adresini `VITE_API_URL` ile vermek gerekti.
- **CORS'u tarayıcı uygular, sunucu değil.** API izinsiz siteye de cevap veriyor; sadece izin başlığını eklemiyor ve tarayıcı cevabı sayfaya vermiyor. Canlı sitede "Mesajlar yüklenemedi" hatasını aldım; sebebi Render'da `CORS_ORIGIN`'in tanımlı olmamasıydı. Kodu değil paneldeki değeri değiştirerek düzelttim.
- **Container geçicidir.** İçine yazılan dosya restart'ta gider; kalıcı veri container'ın dışında durmalı.
- **Sırlar repoya ve sohbete girmez.** Token yalnızca çalışacağı platformun panelinde durur; başka bir yere yapıştırılan token iptal edilip yenisi üretilmelidir.
- **Dockerfile, deploy panelindeki ayarların dosyaya yazılmış halidir:** Node'u seç, `npm ci` ile bağımlılıkları kur, kodu kopyala, başlat. `COPY . .` sonda durur ki kod değişince bağımlılıklar yeniden kurulmasın.
- **`npm install` hangi klasörde çalışırsa oraya kurar.** `cors`'u önce yanlış klasöre kurdum; `package.json`'a girmeyen paket canlıda bulunamaz.
- **Windows'ta Docker, WSL olmadan çalışmaz;** kurulumdan sonra motorun açılması için bilgisayarı yeniden başlatmam gerekti.
