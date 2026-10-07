# 1) Icinde Node 22 kurulu, kucuk bir Linux (Alpine) ile basla
FROM node:22-alpine

# 2) Container icinde calisacagimiz klasor
WORKDIR /app

# 3) Once sadece bagimlilik listesini kopyala ve kur.
#    Kod degisse bile bu iki dosya degismediyse Docker bu adimi onbellekten alir.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 4) Kodun geri kalanini kopyala (neyin kopyalanmayacagi .dockerignore'da)
COPY . .

# 5) Veritabani dosyasi icin yazilabilir bir klasor; root olmayan kullaniciyla calis
RUN mkdir /data && chown node:node /data
ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/guestbook.db
USER node

# 6) API'nin dinledigi port ve baslatma komutu
EXPOSE 3000
CMD ["node", "src/server.js"]
