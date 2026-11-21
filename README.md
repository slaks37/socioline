# SocioLine — From Calling to Collaborative Impact

SocioLine menghubungkan pembelajaran Firman, pengenalan komunitas, dan kerja kolaboratif. Aplikasi ini mempunyai kota 3D dengan tiga distrik, direktori program HTML, serta laboratorium untuk membuat dunia privat dan menjelajahinya bersama.

## Menjalankan di komputer lokal

Gunakan Node.js 24 dan npm. Pada Linux, jalankan sebagai pengguna biasa agar PostgreSQL dapat menginisialisasi direktori datanya.

```sh
npm ci
npm run build
npm run local -- --production
```

Buka http://localhost:3000/explore untuk membuat avatar dan masuk ke Central City. Ikuti petunjuk kontrol pada layar. Di Grand Library, masuk lewat pintu lalu dekati stasiun belajar untuk membuka materi Encounter. Direktori HTML tersedia langsung di halaman eksplorasi.

Buka http://localhost:3000/worlds untuk memulai sesi tamu dan membuat pratinjau dari deskripsi. Konfirmasi untuk memasuki dunia. Pemilik dapat membuat undangan sekali pakai untuk browser lain yang dapat menjangkau server yang sama. Simpan dokumen melalui panel Dokumen kerja W3 dan ekspor hasilnya sebagai Markdown. Sesi memerlukan cookie browser.

Untuk membuat dunia dari **gambar atau teks dengan model AI di CPU sendiri**, jalankan `npm run local -- --ai --production` sesudah build. Opsi ini membutuhkan Python 3.11 atau 3.12 dengan venv. Pada pemakaian pertama, peluncur mengunduh dependensi Python dan sekitar 156 MB bobot serta tokenizer CLIP. Buka /worlds, pilih **Model AI · teks atau gambar**, lalu buat pratinjau.

Untuk pengembangan jalankan `npm run local`. PostgreSQL lokal dibuat di `.world-data`. Pengaturan basis data eksternal dan model opsional dijelaskan dalam [panduan operasi](docs/ai-world/DEPLOYMENT_GUIDE.md).

## Sumber dan verifikasi

- [Masterplan implementasi dan status fase](docs/ai-world/MASTERPLAN_V3.md)
- [Bukti uji dan perintah reproduksi](docs/ai-world/ACCEPTANCE_TESTS.md)
- [Tangkapan runtime, termasuk interior dan dunia buatan](docs/qa-v3/)
- [Masterplan kota dan sumber identitas SocioLine](docs/socioline-reference/)

Lab Dunia menyediakan ruang privat hasil generator. Central City memiliki mode sendiri dan mode kota bersama. Performa 3D pada perangkat fisik masih perlu diukur.

### Kontrol kota dan bermain bersama

Di Studio Avatar, tab **Bentuk** mengubah tinggi, lebar tubuh, wajah, rahang, hidung, mata, dan mulut. Di kota, gunakan WASD atau joystick untuk berjalan, Shift untuk lari, dan Spasi untuk lompat. Tahan Spasi atau tombol Lompat di sisi tangga panjat untuk naik ke atap. Berjalanlah ke dalam air untuk berenang atau naik ke platform kuning di belakang pustaka untuk menggunakan lift. Menu Peta memuat tujuan sungai, air terjun, rumah, bengkel, dan gerai.

Gunakan **Bersama → Gabung kota bersama** untuk bertemu pemain di sekitar. Penanda hijau menandai pemain. Progres tamu dan posisi terakhir tersimpan di PostgreSQL dan ditautkan ke cookie browser. Mode sendiri menyimpan aktivitas di perangkat. Rumah singgah memulihkan energi, bengkel membuat produk dan pesanan, dan gerai menerima kiriman. Koin hanya dipakai dalam simulasi.

Untuk menjalankan multiplayer Central City, atur variabel server `CITY_DATABASE_URL` ke PostgreSQL khusus kota dan jalankan `node scripts/city-schema.mjs`. Build menjalankan migrasi aditif ini otomatis saat variabel tersedia. Lab Dunia tetap menggunakan layanan tersendiri.
