# Spesifikasi generasi

Pengguna memasukkan deskripsi, memilih mode, lalu meminta pratinjau. Worker menghasilkan objek dengan nama 2–72 karakter, tipe village/campus/city, bioma tropical/temperate/highland, medan rolling/mountain/plain, serta 1–7 fitur. Pilihan fitur ialah school, market, library, farm, community, river dan lake. Zod menolak nilai di luar kontrak. Aturan lokal mengerti kata kunci Indonesia dan Inggris yang dicantumkan di engine/world.ts.

Pekerjaan melalui queued → running → preview → saved, atau failed. Nomor seed pada pratinjau juga dipakai saat menyimpan. Menyimpan ulang pekerjaan yang sama mengembalikan ID dunia semula. Isi gambar diproses ulang di server. Dengan persetujuan pengguna melalui mode model, worker mengirim masukan ke endpoint model yang dikonfigurasi. Jalur lokal menerima teks. Waktu tunggu model dibatasi 25 detik.

Chunk berukuran 32 unit. Versi generator 1 memakai seed dan koordinat bilangan bulat, termasuk nilai negatif. Lingkungan yang dimuat adalah kisi 3 × 3 di sekitar pemain. Ketinggian, vegetasi dan fasilitas mengikuti spesifikasi. Wilayah memiliki batas ±1024 unit dengan margin gerak. Baseline dan perubahan pengguna disimpan terpisah agar restart dapat merekonstruksi dunia. Perubahan algoritme yang memengaruhi baseline memerlukan versi baru beserta pembaca untuk dunia lama.

## Model semantik lokal

Layanan Python opsional di services/model menjalankan dua encoder CLIP ViT-B/32 terkuantisasi melalui ONNX Runtime CPU. Encoder teks membentuk vektor label dan deskripsi. Encoder gambar membaca potongan persegi 224 piksel. Untuk masukan gabungan, vektor gambar dan teks yang sudah dinormalisasi diberi bobot 0,78 dan 0,22. Kedekatan dengan label mengusulkan tipe, bioma, medan dan tiga fitur. Permintaan eksplisit dalam teks dipertahankan ketika tidak ambigu, termasuk permintaan lebih dari tiga fasilitas. Generator kemudian mewujudkan spesifikasi itu sebagai geometri yang dapat dijelajahi. Kosakata terbatas membuat interpretasi sebuah foto berbeda dari rekonstruksi arsitekturnya. Dalam pengujian, foto runtime Grand Library memunculkan klasifikasi kampus dengan sekolah, komunitas, dan pasar. Perpustakaan tidak muncul sebagai fitur. Hasil dua masukan tersedia di ../qa-v3/model.json.

Bobot dan tokenizer memakai [konversi ONNX Xenova dari OpenAI CLIP ViT-B/32](https://huggingface.co/Xenova/clip-vit-base-patch32), lisensi MIT menurut kartu model. Fetcher mematok revisi dan memeriksa SHA-256 tiap berkas. Bobot diunduh terpisah dari arsip sumber. Input pengguna diproses lokal bila memakai opsi --ai.
