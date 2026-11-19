# Arsitektur dunia

| Lapisan | Lokasi | Tanggung jawab |
|---|---|---|
| Web publik | app, lib, content | Next.js App Router menghasilkan HTML program, canonical, sitemap dan JSON-LD. |
| Kota pusat | components/Explorer.tsx, GameScene.tsx, Landscape.tsx, City.tsx | Input, kamera orang ketiga, tabrakan, material, bangunan GLB, interaksi dan direktori. |
| Laboratorium | components/WorldLab.tsx, SharedRoom.tsx, RealmScene.tsx | Pratinjau seed, undangan, klien WebSocket, render tetangga dan konfirmasi perubahan. |
| Kontrak bersama | engine/world.ts, engine/avatar.ts | Spesifikasi, koordinat, batas, tabrakan, dokumen, kosmetik dan pesan runtime. |
| Otoritas game | services/world/server.mts, rooms.mts | Autentikasi tamu, pekerjaan, izin, pergerakan, kueri spasial, versi dan audit. |
| Data dan worker | services/world/database.mts, migrations, generate.mts | PostgreSQL, transaksi dan interpretasi prompt dalam worker thread. |

Browser mengambil konten publik langsung dari Next. Jalur /realm meneruskan HTTP dan WebSocket ke layanan game. Pemain memasuki ruang setelah memperoleh tiket. Saat melintasi batas chunk, klien mengganti lingkungan sekitarnya. Bentuk medan dan penempatan deterministik dibagi antara frontend dan backend. Server memutuskan posisi pemain dan penempatan objek.

## Aset

Empat GLB di public/models dibuat oleh scripts/art/landmarks.mjs dan kit.mjs. Grand Library memakai galeri melengkung, rak, tangga/ramp dan oculus. Discovery Center mengelilingi plaza peta. Innovation Campus memiliki atap berundak serta peragaan robotik. Plaza memiliki monumen pusat. Gambar di public/atlas.webp dan gambar distrik berasal dari render runtime. Aset kota berupa geometri dan material buatan proyek. Referensi suasana pada brief digunakan sebagai arahan desain.

Peta globe memakai geometri daratan domain publik dari [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/). Logo diturunkan dari berkas identitas di repositori SocioLine. Paket Fontsource menyertakan lisensi font masing-masing. Sumber pembuatan GLB dapat dijalankan dengan npm run art.
