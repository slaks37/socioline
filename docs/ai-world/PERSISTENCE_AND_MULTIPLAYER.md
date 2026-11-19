# Persistensi dan multipemain

Sesi tamu memiliki cookie HttpOnly dan masa berlaku 30 hari. PostgreSQL menyimpan hash kredensial. Penghapusan cookie menghilangkan akses identitas tamu pada browser tersebut. Pemilik dapat mengundang tamu dengan token sekali pakai selama 30 menit. Bergabung via WebSocket memerlukan pemeriksaan anggota dan tiket singkat.

Klien mengirim arah gerak. Setiap 100 ms server menjalankan langkah gerak, menyelesaikan tabrakan, lalu mengirim posisi pemain yang terlihat dalam radius 64 unit. Simpan posisi berkala dan saat putus mendukung koneksi ulang. Batas proses adalah 64 koneksi dan 16 pemain per ruang. Angka ini adalah batas konfigurasi. Uji konkuren menggunakan dua sesi.

Perubahan bangku atau pohon memerlukan pemilik, persetujuan, lokasi terjangkau dan revisi dunia yang sesuai. Dalam satu transaksi server mengunci versi, memeriksa tabrakan, menyimpan perubahan, menaikkan revisi dan menulis audit. Perubahan bersaing dengan versi usang menghasilkan HTTP 409. Pengunjung dapat membuat dokumen pribadinya sendiri. Blokir menyaring visibilitas dua arah. Laporan disimpan untuk tindak lanjut oleh pengelola. Moderasi manusia memerlukan alur operasional tersendiri.
