# Skema PostgreSQL

Migrasi berurutan tersedia di services/world/migrations. Server menjalankannya dalam transaksi dengan advisory lock. Koneksi layanan memakai pool. Server mengunci otoritas simulasi agar dua proses tidak menggerakkan ruang yang sama.

| Tabel | Kunci dan isi penting |
|---|---|
| schema_versions | Versi migrasi dan waktu penerapan. |
| guests, avatars | UUID tamu, hash sesi, kedaluwarsa, preferensi visual tervalidasi. |
| nodes | UUID dan parent_id membentuk pohon universe, planet, continent, region, city dan district. |
| worlds | Kota hasil generator, pemilik, seed, versi generator, spesifikasi JSONB dan revisi dunia. |
| membership, invites | Keanggotaan per dunia dan tamu, peran pemilik/pengunjung, hash undangan kedaluwarsa. |
| jobs | Pemilik pekerjaan, status, seed pratinjau, spesifikasi, hasil dunia atau alasan gagal. |
| chunks | Kunci gabungan dunia dan koordinat, referensi distrik, baseline JSONB dan versi generator. |
| modifications, audit_events | Objek beserta revisi terkini, catatan transaksi perubahan. |
| occupants | Posisi terakhir per tamu dan dunia. |
| npc_state, simulation | Jumlah pertemuan per pemain dan keadaan siklus aktivitas agregat per dunia. |
| project_docs | Penulis, dunia, jenis, kolom JSONB, versi dan waktu perubahan. |
| blocks, reports | Pasangan pengguna yang diblokir dan laporan terkait ruang. |

Migrasi 001 membentuk skema dasar. Migrasi 002 menambahkan seed pekerjaan dan masa berlaku sesi. Migrasi 003 menambahkan avatar, simulasi dan relasi chunk ke distrik. Berkas PostgreSQL dan kata sandi lokal berada di luar kontrol versi dan paket sumber.
