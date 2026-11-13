# Sasayaki LRCLIB Publisher

Web tool untuk memublikasikan plain lyrics dan synced lyrics (LRC) ke [LRCLIB](https://lrclib.net/).

## Fitur

- Metadata lagu: judul, artis, album, durasi.
- Validasi plain lyrics dan format LRC.
- Upload file `.lrc` untuk mengisi synced lyrics otomatis.
- Generate plain lyrics otomatis dari file atau textarea LRC.
- Baca metadata `[ti:]`, `[ar:]`, `[al:]`, dan `[length:]` dari file LRC.
- Pencarian duplikasi melalui LRCLIB.
- SHA-256 Proof of Work untuk publish token.
- Fallback server-side saat request browser terkena `Failed to fetch` atau CORS.
- Tanpa dependency runtime eksternal.

## Struktur

```text
.
├── api/lrclib-publish/route.js  # Route POST untuk Next.js/Vercel
├── lrclib-publisher.html        # UI browser
├── server-proxy.mjs             # LRCLIB challenge, PoW, dan publish client
├── server.mjs                   # Server lokal Node.js
├── package.json
├── .env.example
└── .gitignore
```

## Syarat

- Node.js 18 atau lebih baru.
- Browser modern.
- Koneksi internet ke `https://lrclib.net`.

## Jalankan lokal

Di folder repo:

```bash
npm start
```

Buka:

```text
http://localhost:3000
```

Jangan buka `lrclib-publisher.html` langsung dengan `file://`. Server lokal menyediakan route `/api/lrclib-publish` yang dipakai fallback publish.

Hentikan server dengan `Ctrl+C`.

## Tes syntax dan Proof of Work

```bash
npm test
```

Tes tanpa dependency tambahan:

```bash
node --check server-proxy.mjs
node --check server.mjs
node --check api/lrclib-publish/route.js
```

## Alur penggunaan

1. Jalankan server dan buka `http://localhost:3000`.
2. Isi metadata manual, atau upload file `.lrc`.
3. App mengambil baris timestamp sebagai synced lyrics.
4. App menghapus timestamp untuk membuat plain lyrics.
5. Jika tersedia, tag LRC mengisi field kosong:
   - `[ti:Judul]` → judul lagu
   - `[ar:Artis]` → artis
   - `[al:Album]` → album
   - `[length:04:00]` → durasi `240` detik
6. Periksa hasil, cari duplikasi, lalu publikasikan.

Metadata dari file tidak menimpa field yang sudah diisi.

## Alur publish

1. Browser validasi metadata dan lirik.
2. Browser mencoba `POST https://lrclib.net/api/request-challenge`.
3. Browser menghitung nonce SHA-256.
4. Browser mencoba `POST https://lrclib.net/api/publish`.
5. Jika direct request gagal dengan `Failed to fetch` atau CORS, browser mengirim data ke `/api/lrclib-publish`.
6. Server meminta challenge baru, menghitung nonce, lalu publish ke LRCLIB.
7. Success LRCLIB memakai HTTP `201 Created` dan body kosong.

## Lisensi

MIT
