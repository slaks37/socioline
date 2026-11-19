# SocioLine Digital World — 3D City Masterplan & Experience Specification v2.0

**Status:** Rancangan untuk diskusi desain dan PRD. Belum merupakan spesifikasi implementasi yang disetujui atau website yang sudah berfungsi.  
**Brand:** SocioLine  
**Program inti:** The Word · The World · The Work  
**Prinsip:** Faithful · Contextual · Strategic · Sustainable  
**Brand message:** From Calling to Collaborative Impact.

## 1. Visi pengalaman
SocioLine adalah satu kota virtual yang dapat dijelajahi menggunakan avatar third-person. Tiga distrik besar tersambung melalui jalan kota dan Central Hub: The Word (kiri), The World (tengah-belakang), The Work (kanan). Pengunjung dapat berjalan, berlari, mendekati bangunan, masuk ke ruang publik, membuka konten HTML, membaca blog/news, memahami program, dan mengambil tindakan nyata (daftar, berkolaborasi, membaca sumber daya). Pengalaman utama adalah sebuah dunia imersif, tetapi semua informasi juga mempunyai halaman SEO yang bisa diakses tanpa WebGL.

SocioLine bukan hanya penyelenggara kelas; berperan sebagai *orchestrator* yang mempertemukan peserta, komunitas, profesional, gereja, organisasi, industri, sumber daya dan kebutuhan. Karya, bukan sekadar eksplorasi virtual, menjadi titik akhir pengalaman.

## 2. Prinsip desain yang tidak boleh dilanggar
- Satu dunia terpadu, bukan tiga level yang terputus.
- Kualitas visual stylized semi-realistic (life-simulation) sebagai default; anime 3D sebagai opsi. Roblox-style hanya kemungkinan kosmetik di fase lanjut; jangan meniru atau menggunakan IP/asset karakter game komersial.
- Avatar bersifat opsional: mode *Explore without Avatar* harus tersedia, bersama menu HTML standar.
- Pengunjung tidak diwajibkan mendaftar untuk membaca konten publik.
- Semua teks penting, heading, tautan, artikel, berita, program, dan data inti tersedia sebagai HTML server-rendered/hasil prerender; jangan disimpan eksklusif sebagai tekstur WebGL.
- Program iman dijelaskan secara transparan; aktivitas spiritual tidak menjadi syarat untuk mengakses bantuan masyarakat, berkolaborasi, atau menggunakan konten umum.
- Klaim hasil dan berita harus akurat; konten contoh ditandai jelas sebagai konsep.

## 3. Kawasan kota dan hubungan fisik
### Peta zonasi konseptual
- **Barat / kiri: The Word District.** Warna navy, indigo, violet hangat, lampu perpustakaan dan pepohonan; suasana kontemplatif, tetap urban dan modern.
- **Pusat / tengah: The World District.** Warna teal dan biru, plaza warga, pasar ide, research center, peta interaktif, pedestrian street; suasana multikultural dan partisipatif.
- **Timur / kanan: The Work District.** Warna lime dan turquoise, bangunan maker-space, work labs, collab offices, prototyping studio; suasana aktif dan berorientasi tindakan.
- **Depan-tengah: SocioLine Central Hub.** Spawn plaza, fountain/landmark logo, informasi, mini-map, Avatar Studio, News Tower, Resource Library, Partnership Center.
- **Ring road dan pedestrian network.** Semua distrik disambungkan dengan jalan, trotoar, jalur sepeda/pejalan, taman, titik teleport opsional, dan landmark jarak jauh yang tetap terlihat.

### Grid sebagai sketsa, bukan koordinat final
| Kawasan barat | Kawasan tengah | Kawasan timur |
|---|---|---|
| Word Library; Scripture Gallery; Calling House | World Civic Hall; Community Lab; Global Gallery | Innovation Studio; Mission Model Building; Experiment Lab |
| Reflection Garden; Leadership Room | Research Center; Cultural Market; Opportunity Board | Project Workshop; Impact Observatory; Venture & BAM Hub |
| --- akses boulevard --- | Central City Plaza + News Tower + Resource Center | --- akses boulevard --- |

Setiap distrik memiliki 2–3 blok kota dan sedikitnya 3–5 objek besar yang dapat ditemukan. Jangan menciptakan grid luas tanpa isi: gedung dekoratif boleh ada, tetapi bangunan prioritas harus memiliki interaksi, papan, dan fungsi yang terlihat.

## 4. Daftar bangunan dan konten
| District / Landmark | Fungsi interaksi | URL publik yang harus tersedia |
|---|---|---|
| Central Hub — SocioLine Plaza | Pengenalan organisasi, pilih jalur | `/`, `/about` |
| Mission Compass | Penjelasan W3 Journey | `/programs/w3-journey` |
| Avatar Studio | Pemilihan avatar; bukan laman SEO | `/explore` |
| News Tower | Headline, berita tanggal terbit | `/news`, `/news/[slug]` |
| Knowledge Library | Worksheet dan resource | `/resources` |
| Collaboration Center | Mitra dan pendaftaran minat | `/collaborate/partner`, `/contact` |
| Word Library | Firman, pengantar program | `/the-word`, `/the-word/program` |
| Scripture Gallery | Rujukan misi dan konteks | `/the-word/encounter` |
| Calling House | Refleksi panggilan | `/the-word/discern` |
| Commitment Room | Mission Charter template | `/the-word/commit` |
| World Civic Hall | Pengenalan The World | `/the-world` |
| Culture Gallery | Mengenali budaya | `/the-world/explore` |
| Community Research Center | Panduan observasi dan wawancara | `/the-world/research` |
| Opportunity Board | Peta kebutuhan dan kesempatan | `/the-world/opportunities` |
| Work Innovation Studio | Pengenalan The Work | `/the-work` |
| Design & VPC Lab | Co-design dan value map | `/the-work/co-design` |
| Mission Model Building | Model operasi dan kemitraan | `/the-work/mission-model` |
| Experiment Workshop | Prototipe, validasi | `/the-work/experiment` |
| Impact Observatory | Case study dan laporan | `/impact`, `/impact/projects` |
| Venture/BAM Hub | Proyek lanjut; hanya setelah siap | `/the-work/venture-studio` |

**Interaksi standar:** avatar masuk radius aktif -> highlight ikon informasi -> tekan `E`/tap -> panel HTML dengan judul, ringkasan, CTA halaman, opsi baca penuh; menu selalu mempunyai tautan yang sama. Masuk interior dapat berupa adegan 3D terpisah yang dimuat secara bertahap, tetapi URL tetap kanonis.

## 5. Alur pengunjung
### Jalur A: Explore as Guest
1. Buka homepage HTML server-rendered, terlihat visual kota dengan CTA **Enter Digital World**, **Browse Website**, dan **Programs**.
2. Klik Enter; tampil **Avatar Creator**; default preset Male/Female, style life-simulation/anime, rambut, kulit, outfit, nickname opsional; ada opsi lewati.
3. Pilih **Enter City**; load dunia 3D secara progresif dan spawn di SocioLine Central Plaza.
4. Petunjuk kontrol singkat; buka minimap dan lihat tiga distrik.
5. Berjalan ke Word/World/Work, mendekati landmark, buka panel konten HTML; panel dan halaman mandiri saling terhubung.
6. Buka program/blog/berita/proyek dengan URL jelas; lanjut ke pendaftaran atau kemitraan bila berminat.
7. Keluar; tawarkan kunjungan ulang dan pilihan *Use Previous Avatar*, *Customize*, *Explore without Avatar*.

### Jalur B: Google Search / URL langsung
1. Pengunjung mendarat pada artikel, berita, atau program HTML tanpa harus masuk dunia 3D.
2. Dapat membaca konten lengkap dan menggunakan navigasi standar.
3. Tombol **Visit This Location in 3D** bisa membawa ke landmark sesuai artikel.
4. Bila perangkat tidak mendukung WebGL, tetap tersedia semua materi dan CTA.

### Jalur C: Calon mitra/komunitas
1. Mendarat dari halaman proyek/impact atau masuk ke Collaboration Center di kota.
2. Membaca tujuan, model kerja sama, dan proyek yang telah diverifikasi.
3. Mengisi formulir minat kemitraan; tim SocioLine memproses sesuai SOP.

## 6. Avatar creator
**Default:** karakter original 3D stylized semi-realistic, bukan voxel/kotak. Model sebaiknya berbagi humanoid rig, animation retargeting, collision capsule.  
**Preset awal:** Male dan Female, tetapi pilihan rambut, warna kulit, outfit tidak dikunci oleh preset.  
**Customizations MVP:** 2 preset, 3 bentuk rambut awal per preset, beberapa skin tones, 3 outfit (casual/urban/explorer), nickname opsional, rotasi preview dan zoom.  
**Dua style:** menggunakan satu set rig compatible; anime style bisa diwujudkan dengan proporsi/material yang berbeda; jangan menargetkan kombinasi style tanpa biaya aset yang realistis.  
**Persistence:** saat kunjungan baru selalu sediakan avatar gate dengan opsi *Continue Previous*, *Customize*, atau *Skip*; simpan preferensi hanya atas pilihan pengguna, dan jangan wajib menyimpan gender sebagai profil demografis.  
**Animasi inti:** idle, walk, run, turn, jump, land, interact, inspect, read, talk.  
**Kontrol:** WASD, mouse pointer lock untuk look, shift/run, space/jump, E/interact; touch joystick, drag look, tombol interact; opsi reduced-motion, sensitivitas kamera, volume, grafik Low/Medium/High.

## 7. Cara W3 muncul sebagai program nyata di kota
- **The Word:** gedung untuk pembelajaran berbasis Firman, refleksi, panggilan dan komitmen. Contoh output: Calling Map, Mission Charter.
- **The World:** ruang untuk memahami masyarakat, budaya, pemangku kepentingan, aset dan tantangan. Contoh output: Community Profile, Stakeholder Map, Opportunity Brief.
- **The Work:** ruang co-design, Value Proposition Canvas, Mission Model Canvas, eksperimen, pelaksanaan, evaluasi, dan multiplikasi. Contoh output: Mission Portfolio dan Impact Review.
- **Lintas distrik:** semua keputusan tetap diperiksa terhadap kesetiaan Firman, konteks masyarakat, dan pertanggungjawaban pelaksanaan; tiga kawasan adalah penekanan pedagogis, bukan tiga tujuan yang saling lepas.
- **W3 Discovery-to-Impact Journey:** satu halaman `/programs/w3-journey` dengan pengantar 12 minggu; desain pembagian minggu per kawasan tetap usulan sampai disetujui kurikulum.

## 8. Billboard dan News Tower
Billboard tampil sebagai konten dunia namun sumbernya dari CMS yang sama dengan halaman publik:
- **Values Billboards:** Faithful, Contextual, Strategic, Sustainable; klik ke `/about/values`.
- **Program Billboards:** W3 Journey, open cohort bila benar-benar dibuka; link ke `/programs/w3-journey`.
- **News Screens:** berita terbaru yang terbit, tanpa headline rekaan; link ke `/news/[slug]`.
- **Impact Screens:** proyek terverifikasi; tidak menampilkan angka sebelum validasi.
- **Opportunity Board:** peluang kolaborasi; moderasi dan tanggal kadaluarsa konten.

CMS menyimpan `billboard_slot`, `title`, `short_text`, `target_url`, `content_ref`, `publish_at`, `unpublish_at`, `status`, `priority`, `locale`; kampanye selalu melewati review editor. Scene 3D memuat teks pendek dari CMS dan tidak menjadi sumber tunggal konten.

## 9. Content and SEO architecture
Satu model konten, dua presentasi:
1. **Server-rendered/SSG semantic HTML:** route mandiri, H1/H2, judul/meta, artikel, program, internal linking, breadcrumb, CTA, schema yang sesuai.
2. **Client-side 3D experience:** karakter, environment, billboard, landmark, interaksi; data konten berasal dari CMS, terkait route kanonis.

Homepage dan route publik harus berguna meski 3D tidak termuat. URL langsung `/the-word`, `/the-world`, `/the-work`, `/programs/w3-journey`, `/blog/[slug]`, `/news/[slug]`, `/impact/projects/[slug]` tidak boleh bergantung pada status game. Link navigasi gunakan anchor/link yang menghasilkan `href`. Pertahankan `canonical`, metadata unik, OG image, sitemap, RSS, robots yang benar, schema `Organization`, `BreadcrumbList`, dan `Article`/`NewsArticle` yang relevan.

**Index:** semua halaman publik dengan nilai unik. **Noindex:** langkah avatar, guest session, progress personal, halaman terima kasih, draft, preview dan halaman editor. Jangan mencoba membuat setiap objek dekoratif menjadi halaman SEO. 

**Performa target HTML publik:** LCP <= 2.5s, INP <= 200ms, CLS <= 0.1 (target Core Web Vitals; uji lapangan). Target rendering game diukur terpisah, misalnya 30 FPS yang stabil pada perangkat mobile target dan 60 FPS desktop pada preset menengah; jangan menjanjikan jika belum diuji. Load WebGL setelah konten utama tersedia/atas interaksi pengguna, gunakan GLB/GLTF dengan compression, LOD, instancing, streaming per chunk, asset/CDN cache, culling, adaptive DPR, fallback 2D dan pengujian memory leaks.

## 10. Arsitektur teknologi yang disarankan
- Website: **Next.js App Router + TypeScript**, server-rendered public routes; Tailwind untuk UI overlay.
- Game rendering: **Three.js / React Three Fiber** untuk scene, Drei helpers; physics/collision lewat library yang dipilih setelah uji vertical slice.
- Asset pipeline: Blender -> rigged GLB, optimasi Draco/Meshopt, LOD, atlas, instancing.
- Game systems: `worldState` (district, landmark, avatar config), `playerController`, `cameraController`, `interactionRegistry`, `sceneLoader`, `mediaOverlay`, `navigationRouter`, `performanceManager`.
- CMS: headless content model (contoh Sanity/Strapi atau dashboard custom); pilihan final setelah pertimbangan editorial dan hosting.
- Data bila aplikasi/progres diperlukan: Postgres/Neon atau penyimpanan sesuai keputusan proyek; tidak perlu database profil pengunjung untuk guest MVP.
- Publishing: CI preview, staging, lalu produksi dengan gate aksesibilitas, SEO, performa, keamanan dan kualitas berita.

**Catatan:** Tumpukan teknologi adalah rekomendasi rancangan, bukan sesuatu yang sudah diimplementasikan dalam repository SocioLine.

## 11. CMS entities minimum
- `district`: name, slug, color, description, landingPage, assetBundle.
- `landmark`: districtId, sceneNodeId, worldPosition, triggerRadius, label, pageUrl, contentRef, interactionType.
- `page`: title, slug, sections, SEO metadata, publication state.
- `program`: title, curriculum, outcome, enrollmentState, CTA, SEO.
- `billboard`: slot, ref, campaignText, target, schedule, moderationState.
- `blogPost`: author, category, body, slug, references, publishedAt.
- `newsPost`: verifiedTitle, source, eventDate, publishedAt, correctionHistory, slug.
- `project`: community, consentState, partner, stage, results, evidence, privacyLevel.
- `resource`: type, license, file, version, summary.
- `event`: time, timezone, registration, organizer, status.

## 12. UI dan aksesibilitas
- HUD desktop: navbar brand, minimap kiri atas, journey tracker kanan atas, contextual interaction prompt dekat objek, hotbar bawah, settings/pause.
- HUD mobile: minimap yang bisa dikecilkan, joystick kiri, kamera/tombol interaksi kanan, menu tombol besar, mode hemat data.
- Semua kontrol memiliki alternatif keyboard dan fokus untuk menu HTML; WebGL tidak boleh mengunci navigasi tab dan pembaca layar. Dialog HTML harus semantik dan dapat ditutup dengan Escape.
- Opsi: skip 3D, fast travel, reduced motion, font scaling, kontras, subtitle jika ada audio, volume mute default bila sesuai kebijakan.

## 13. Keamanan dan moderasi
- Guest tidak wajib membuat akun dan tidak dapat mengirim pesan publik pada MVP. Multiplayer, chat, user-generated content, dan transaksi bukan cakupan awal.
- Jangan menampilkan data individu, cerita penerima bantuan atau lokasi sensitif tanpa izin sah. Perlindungan anak dan anggota komunitas rentan harus menjadi prasyarat publikasi.
- Proyek dan angka dampak hanya muncul setelah verifikasi; halaman demo diberi label eksplisit.
- Hindari gamifikasi konversi agama, skor kesalehan, atau bantuan bersyarat kegiatan spiritual.
- Form partner memerlukan anti-spam, rate limiting, consent, dan pengamanan data.

## 14. Urutan implementasi (milestone, bukan janji waktu)
**M0 — Design freeze:** world map v1, style guide kota, brand tokens, daftar bangunan prioritas, skema URL, avatar rig spec, konten dasar dan acceptance criteria.
**M1 — Playable vertical slice:** Central Plaza dan satu blok The Word, avatar male/female, third-person controls, objek interaksi, panel HTML, halaman SEO langsung. Gate: alur berjalan dari spawn ke gedung lalu membaca halaman berjalan end-to-end.
**M2 — Connected City:** tiga distrik W3 lengkap dengan boulevard, street blocks, landmark, minimap, fast travel dan mobile fallback. Gate: pengguna mampu mencapai tiga kawasan tanpa layar error/teleport wajib.
**M3 — Content & Editorial:** CMS program, blog, news, resource, proyek dan billboard; publikasi terjadwal, status draft/review/publish, URL & sitemap. Gate: editor menerbitkan berita dan layar kota diperbarui dari satu sumber.
**M4 — Quality & Launch:** render QA lintas perangkat, accessibility, SEO, perf budget, security dan content checks. Gate: halaman publik lolos direct-load SEO tanpa JS game, serta pengalaman 3D dapat dimainkan pada target hardware.
**M5 — Expansion:** interior tambahan, karakter anime opsional, misi belajar interaktif, koordinator mitra, fitur sosial jika ada kebutuhan dan kesiapan moderasi.

## 15. Acceptance criteria minimum
1. Pengunjung baru bisa memilih male/female dan masuk kota tanpa login; opsi tanpa avatar tersedia.
2. Karakter dapat bergerak, berlari, berbelok, berhenti, berinteraksi dengan papan/gedung dan membuka panel HTML.
3. Kota terdiri atas tiga distrik yang tersambung secara fisik serta Central Hub, bukan scene kartu yang hanya dinavigasikan lewat tombol.
4. Semua landmark prioritas memiliki `href` yang cocok dengan route publik dan bisa langsung dibuka.
5. Kunjungan langsung dari Google ke artikel atau halaman program berhasil tanpa memuat WebGL.
6. Editor bisa memublikasikan blog/news dan mengaitkannya ke News Tower tanpa perubahan kode.
7. Halaman konten punya metadata unik, heading semantik, sitemap, canonical dan pengaturan index/noindex yang benar.
8. Situs usable dari ponsel tanpa GPU kuat lewat fallback 2D dan navigasi standar.
9. Informasi yang belum sah/terverifikasi tidak dipublikasikan sebagai fakta atau hasil nyata.
10. Tidak ada kewajiban membuat akun atau menerima praktik spiritual untuk mengakses informasi publik atau peluang bantuan.

## 16. Keputusan terbuka untuk sesi desain berikutnya
- Rasio gaya semi-realistis vs anime; pemilihan aset/model orisinal.
- Mekanisme interior: seamless streamed vs door transition.
- Target perangkat kelas bawah dan performance profile yang disetujui.
- CMS dan deployment pilihan akhir.
- Apakah avatar akan punya nama, emotes, outfit tambahan dan progress lokal.
- Kapan fitur login, multiplayer dan virtual event dipertimbangkan.
- Kurikulum W3 final dan detail institusional yang disahkan.

## 17. Referensi teknologi (verifikasi dokumentasi resmi 19 November 2026)
- Google Search Central: JavaScript SEO, crawlable links, WebGL/canvas limitations.
- Google Search Central: Core Web Vitals (LCP, INP, CLS).
- Next.js App Router: Server/Client Components, metadata, sitemap, robots.
- React Three Fiber: performance scaling, LOD/instancing dan optimization.