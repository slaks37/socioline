# Pemandu dan simulasi NPC

Central City menampilkan NPC ambient. Di dunia privat, pemandu komunitas dapat diajak berbicara saat pemain berada di dekatnya. Respons memakai konteks waktu serta jumlah pertemuan dan dapat merujuk pemain ke materi mendengar komunitas. Respons tersedia tanpa kunci model.

Server menyimpan jumlah pertemuan per pemain, pemandu dan dunia. Aktivitas agregat berputar setiap dua menit antara meja informasi, observasi komunitas, dan rangkuman kunjungan. Endpoint anggota GET /worlds/:w/simulation menghitung siklus terlewat saat dibaca serta menyimpan aktivitas terakhir. Pendekatan ini menjaga biaya dunia kosong tetap kecil. NPC dan angka aktivitas pada UI diberi konteks simulasi.

Pemulihan riwayat dan keadaan agregat diuji setelah restart. Pekerjaan lanjutan mencakup rute tugas individual, interaksi antaragen, pengawasan penggunaan model serta evaluasi konsistensi respons. Tidak ada angka simulasi yang dipublikasikan sebagai laporan dampak masyarakat.
