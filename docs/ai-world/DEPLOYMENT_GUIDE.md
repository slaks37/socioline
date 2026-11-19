# Menjalankan layanan dan menyimpan data

Versi yang diuji memakai Node 24, npm 11, Chromium, Linux x86_64 dan PostgreSQL. Dari root proyek jalankan npm ci, npm run build, lalu npm run local -- --production. Web tersedia pada http://localhost:3000, layanan dunia pada http://127.0.0.1:4100/health. Untuk mode pengembangan jalankan npm run local. Untuk menjalankan proses terpisah gunakan npm run world dan npm run dev. Hentikan peluncur bersama dengan Ctrl+C untuk menutup WebSocket dan PostgreSQL secara tertib.

| Variabel opsional | Penggunaan |
|---|---|
| DATABASE_URL | PostgreSQL milik operator. Sediakan basis data dengan hak membuat tabel, indeks dan migrasi. |
| WORLD_DATA_DIR, WORLD_PG_PORT | Direktori data dan port cluster lokal. Bawaan .world-data dan 55432. Jalankan embedded PostgreSQL sebagai pengguna OS biasa. |
| WORLD_PORT, WORLD_HOST | Alamat layanan game. Bawaan loopback pada port 4100. |
| WORLD_BACKEND_URL | URL backend tujuan rewrite Next. Tetapkan sebelum build jika memakai tujuan lain. |
| WORLD_ORIGINS | Daftar origin browser yang diizinkan, dipisah koma. Sertakan port yang digunakan. |
| WORLD_SECURE_COOKIE | Isi true untuk cookie Secure pada lingkungan HTTPS. |
| WORLD_MODEL_URL, WORLD_MODEL_NAME, WORLD_MODEL_KEY | Endpoint chat completions yang kompatibel, nama model, dan kunci opsional. Dukungan gambar bergantung pada model. Mode lokal siap dipakai tanpa konfigurasi ini. |
| SITE_URL | Origin canonical publik saat build. Bawaan lokal memakai http://localhost:3000. |
| CHROMIUM_PATH, QA_URL | Lokasi Chromium dan origin pengujian browser. |

## Mode AI lokal

Jalankan npm run local -- --ai --production setelah build. Sediakan Python 3.11/3.12, venv, pip, serta ruang untuk lingkungan Python dan model. Peluncur menyiapkan bobot sekali, memeriksa checksum, lalu menunggu layanan CPU siap sebelum membuka game. WORLD_LOCAL_MODEL_PORT mengubah port default 4120. PYTHON memilih interpreter venv. Jalankan node scripts/model.integration.mjs pada terminal kedua untuk menguji dua masukan melalui API game. Pengujian ini membuat dua dunia privat milik sesi uji.

Model, game dan Next dapat pula dijalankan sebagai proses terpisah. Gunakan services/model/fetch.py untuk menyiapkan direktori model dan services/model/server.py --directory untuk membacanya. Arahkan WORLD_MODEL_URL ke http://127.0.0.1:4120/v1/chat/completions dan WORLD_MODEL_NAME ke CLIP-ViT-B32-CPU ketika menjalankan game. Adaptor yang sama mendukung penyedia kompatibel lain.

## Cadangan dan pemulihan

Untuk cluster lokal, hentikan layanan dengan tertib lalu salin seluruh direktori WORLD_DATA_DIR termasuk berkas tersembunyi dan hak aksesnya. Pulihkan salinan ke direktori terpisah dengan versi mayor PostgreSQL yang sama. Untuk PostgreSQL eksternal gunakan pg_dump dan pg_restore milik operator. Periksa akses pemilik, revisi objek, posisi, dokumen dan riwayat pemandu setelah pemulihan. Uji integrasi mencakup restart dengan data lokal, sedangkan pemulihan cadangan operator memerlukan latihan tersendiri.

## Operasi publik mendatang

Frontend dan layanan WebSocket harus mendukung upgrade koneksi serta origin yang konsisten. Skala saat ini memerlukan satu otoritas game per basis data. Sebelum membagi proses, tetapkan afinitas ruang dan koordinasi penulisan. Penyimpanan objek eksternal, antrean terdistribusi, domain dan layanan model berbayar tidak dibutuhkan untuk menjalankan versi lokal. Rilis ini hanya dijalankan di loopback.
