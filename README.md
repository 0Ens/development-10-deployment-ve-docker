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

Bu ödeve başlarken Docker'ı hiç kurmamıştım, CORS'un ne olduğunu da bilmiyordum. En çok şu noktalarda takıldım ve en çok oralardan öğrendim:

- **Lokalde çalışan kod canlıda kendiliğinden çalışmıyor.** Bilgisayarımda arayüz isteklerini Vite proxy API'ye taşıyordu ve ben bunun farkında bile değildim. Canlıda proxy olmadığı için API adresini `VITE_API_URL` ile vermek gerekti. Bu değerin build sırasında JS dosyasına gömüldüğünü, yani sır koyulamayacağını da burada öğrendim.

- **CORS hatasını ilk gördüğümde sebebini bilmiyordum.** Vercel'deki sitem açıldı ama "Mesajlar yüklenemedi" yazdı. API çalışıyordu, site çalışıyordu; sorun API'nin benim Vercel adresimi tanımamasıydı. Render'da `CORS_ORIGIN` değişkenini hiç eklememiştim, bu yüzden panelde arayıp bulamadım. Değişkeni ekleyince düzeldi ve koda hiç dokunmadım. Aklımda kalan şey: CORS'u sunucu değil tarayıcı uygular; API izinsiz siteye de cevap verir, sadece izin başlığını eklemez.

- **`npm install` hangi klasördeysem oraya kuruyor.** `cors` paketini yanlışlıkla kullanıcı klasörüme kurdum. Lokalde fark etmeyebilirdim ama paket `server/package.json`'a girmediği için Render'da ve Docker'da bulunamayacaktı. Artık komut yazmadan önce hangi klasörde olduğuma bakıyorum.

- **Container geçici, veri kalıcı olmalı.** Render'ın her restart'ta container'ı sıfırdan kurduğunu ve içindeki SQLite dosyasının silineceğini öğrendim. Ücretsiz planda kalıcı disk olmadığı için veriyi Turso'ya taşıdık. Mesaj yazıp servisi kendi elimle restart ettim ve mesajın durduğunu gördüm; "kalıcılık" kelimesi benim için o an somutlaştı.

- **Veritabanı uzaktaysa kod beklemeyi bilmeli.** Dosyadan okurken cevap anında geliyordu; Turso'ya geçince her sorgunun önüne `await` geldi, çünkü cevap artık ağ üzerinden geliyor.

- **Sırlar sadece çalışacakları yerde durur.** Veritabanı token'ımı yanlışlıkla bir sohbete yapıştırdım ve bunun neden sorun olduğunu öğrendim: o token veritabanına tam erişim veriyor. Token'ın yeri repo ya da sohbet değil, Render paneli. Token üretirken yetki seçmem de gerekti; API hem okuyup hem yazdığı için read & write seçtim.

- **Docker'ı kurmak düşündüğümden uzun sürdü.** Windows'ta Docker, WSL olmadan çalışmıyor. Önce "WSL not installed" hatası aldım, WSL'i kurdum, motor yine açılmadı; bilgisayarı yeniden başlatınca düzeldi. Hata mesajını okuyup adım adım gitmek gerektiğini gördüm.

- **Dockerfile gözümü korkutmuştu ama aslında tanıdık çıktı.** Baştan ne yazacağımı bilmiyordum. Sonra Render'da elle girdiğim ayarların (Node, `npm ci`, `npm start`) aynısı olduğunu gördüm: Node'lu bir Linux seç, bağımlılıkları kur, kodu kopyala, başlat. `COPY . .` satırının sonda durmasının sebebi de kod değişince bağımlılıkların yeniden kurulmaması.

- **CI aynı işi her push'ta benim yerime yapıyor.** Testleri lokalde çalıştırmayı unutsam bile GitHub boş bir makinede koşuyor; yeşil işaret, kodun sadece benim bilgisayarımda değil temiz bir ortamda da çalıştığını gösteriyor.

Tutorial'larda bu iş yirmi dakika gibi görünüyor; bende günlere yayıldı ve zamanın çoğu kod yazmaya değil ayarlara, hesaplara ve hata mesajlarına gitti. Sanırım deploy'un asıl öğrettiği de bu.
