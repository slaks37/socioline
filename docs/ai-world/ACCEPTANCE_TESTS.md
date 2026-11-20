# Bukti penerimaan lokal

Perintah berikut dijalankan dari root proyek pada Node 24. Browser memakai Chromium dan SwiftShader. Bukti numerik dan gambar tersedia di [direktori QA](../qa-v3/).

| Perintah | Cakupan dan hasil |
|---|---|
| npm run typecheck | Pembuatan tipe rute dan TypeScript. PASS. |
| npm run lint | ESLint untuk app, components dan lib. PASS. |
| npm test | Tiga uji konten dan penerbitan. PASS. |
| npm run build | Build produksi Next, kompilasi dan pembuatan HTML. PASS. |
| npm run test:world | PostgreSQL temporer asli dan dua klien WebSocket. Sembilan pemeriksaan PASS. |
| node scripts/model.integration.mjs | Model CLIP ONNX asli di CPU. Satu prompt dan satu gambar melewati worker, pratinjau, konfirmasi, dan pembacaan kembali seed/spesifikasi. PASS. Lihat model.json. |
| npm run test:provider | Worker mengirim gambar ke penyedia HTTP tiruan dan menolak spesifikasi di luar skema. PASS untuk kontrak adaptor. |
| node scripts/image-browser.mjs | Unggah WebP dari formulir, inferensi CLIP, pratinjau, simpan dan masuk ke dunia sembilan chunk. PASS. |
| node scripts/world-browser.mjs | Sesi tamu, pratinjau, izin simpan, masuk ruang lewat gateway, sembilan chunk, pemandu, bangku, dokumen dan masuk kembali. PASS. |
| npm run qa | 60 URL di sitemap dan 72 tujuan tautan internal. HTML, canonical, judul unik, metadata sosial, JSON-LD dan navigasi tanpa JavaScript. Empat sampel axe tanpa temuan otomatis. PASS. |
| npm run visual | Avatar, jalan, perpustakaan, stasiun, panel HTML, keluar, peta, tiga distrik dan tampilan ponsel. Sepuluh PNG runtime serta laju frame dalam gameplay.json. |
| npm run perf | Tiga konteks browser baru per halaman pada tiga halaman publik. Sampel lokal, rincian LCP/CLS/INP yang teramati ada di performance.json. |

Uji dunia menolak masukan tidak valid dan mencatat kegagalan penyedia model. Dua sesi berbagi perubahan yang dikonfirmasi. Pengunjung tidak dapat mengubah objek milik pemilik. Satu dari dua penulisan bersaing menerima 409. Pengujian juga mencakup gerak melintasi chunk, tabrakan, blokir, visibilitas, kosmetik dan dokumen privat. Setelah backend serta PostgreSQL dimulai ulang, klien membaca kembali lokasi, baseline, objek, simulasi dan pertemuan NPC.

Performa gameplay berstatus **PARTIAL**. Pada uji alur permainan, Chromium SwiftShader mencatat 6,6 FPS pada viewport 1120 × 700 di Welcome Terrace dan 7,0 FPS pada emulasi sentuh 390 × 780 di Grand Library. Pada rilis sebelumnya, uji ini mencatat masing-masing 0,5 dan 1,1 FPS. Targetnya 60/30 FPS. Sembilan sampel halaman HTML memberikan LCP 136–384 ms, CLS 0 dan INP 8–16 ms pada mesin lokal. Emulasi viewport dan sentuhan tidak memverifikasi kinerja atau ergonomi ponsel fisik. Evaluasi mutu lintas gambar, pengujian beban, audit aksesibilitas manual serta latihan pemulihan cadangan masih terbuka.

## Perbandingan render di Welcome Terrace

Kedua build diuji berurutan dengan Chromium SwiftShader, kamera diam, viewport dan preset yang sama. Setelah pemuatan dan pemanasan, pengukuran berjalan sekurangnya 15 frame dan lima detik. FPS mengukur interval requestAnimationFrame. Panggilan WebGL dan segitiga dihitung pada canvas permainan. Ini satu sampel lokal per build dan preset.

| Preset | Resolusi render | FPS sebelum → sesudah | Panggilan gambar per frame | Segitiga per frame |
|---|---|---|---|---|
| Desktop Balanced | 560 × 350 | 0.84 → 6.32 | 475 → 167 | 358074 → 142292 |
| Emulasi sentuh Low | 280 × 561 | 2.42 → 8.74 | 215 → 112 | 196874 → 117940 |

Jalankan `QA_URL=http://localhost:3000 node scripts/city-benchmark.mjs` dari direktori proyek. Data perbandingan ada dalam [city-before.json](../qa-v3/city-before.json) dan [city-after.json](../qa-v3/city-after.json).
