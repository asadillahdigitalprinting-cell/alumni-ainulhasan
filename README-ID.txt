PANDUAN WEBSITE ALUMNI AINUL HASAN

ISI PAKET
- index.html : formulir publik alumni
- admin.html : dashboard admin, pencarian, filter, verifikasi, hapus, ekspor .xlsx
- style.css  : desain responsif
- app.js     : logika formulir publik
- admin.js   : logika dashboard admin
- config.js  : URL dan publishable/anon key Supabase (isi sendiri)
- schema.sql : struktur tabel dan aturan keamanan database

BAGIAN 1 — BUAT AKUN
1. Daftar di https://github.com
2. Daftar di https://supabase.com
3. Verifikasi email jika diminta.

BAGIAN 2 — BUAT DATABASE SUPABASE
1. Buat project baru di Supabase dan simpan password database di tempat aman.
2. Buka SQL Editor > New query.
3. Salin seluruh isi schema.sql, tempel, lalu klik Run.
4. Buka Project Settings > API. Salin Project URL dan publishable/anon key.
5. Buka config.js dan ganti nilai:
   SUPABASE_URL: URL project Anda
   SUPABASE_ANON_KEY: publishable/anon key Anda
   Nilai ini boleh berada di frontend hanya karena kebijakan RLS membatasi akses.
   JANGAN masukkan service_role key atau secret key di frontend/GitHub.

BAGIAN 3 — BUAT AKUN ADMIN
1. Supabase > Authentication > Users > Add user, masukkan email dan password admin.
2. Salin UUID user tersebut dari daftar Authentication > Users.
3. Buka SQL Editor dan jalankan (ganti UUID contoh dengan UUID akun Anda):
   insert into public.admin_users (user_id)
   values ('GANTI-DENGAN-UUID-AKUN-ADMIN');
4. Simpan password admin dengan aman. Buat akun admin hanya untuk pengelola resmi.

BAGIAN 4 — UPLOAD KE GITHUB
1. Login ke GitHub, klik tanda + > New repository.
2. Nama repository: alumni-ainulhasan
3. Pilih Public, lalu Create repository.
4. Klik Add file > Upload files.
5. Unggah semua file dari folder paket (bukan file ZIP-nya saja).
6. Klik Commit changes.

BAGIAN 5 — AKTIFKAN GITHUB PAGES
1. Repository > Settings > Pages.
2. Pada Build and deployment pilih Deploy from a branch.
3. Branch: main, folder: /(root), klik Save.
4. Tunggu proses deployment selesai. Alamat biasanya:
   https://USERNAME.github.io/alumni-ainulhasan/
   Ganti USERNAME dengan nama pengguna GitHub Anda.

LINK YANG DIBAGIKAN
- Formulir: https://USERNAME.github.io/alumni-ainulhasan/
- Admin: https://USERNAME.github.io/alumni-ainulhasan/admin.html

UJI WAJIB SEBELUM DIBAGIKAN
1. Buka formulir dan kirim satu data uji.
2. Pastikan data terlihat di Supabase > Table Editor > alumni.
3. Login admin melalui admin.html.
4. Verifikasi data uji, lalu uji ekspor Excel.
5. Hapus data uji setelah selesai.
6. Jangan bagikan link admin atau file Excel berisi data pribadi kepada publik.

CATATAN KEAMANAN
- Supabase URL dan publishable/anon key bukan password admin. Akses dibatasi oleh Row Level Security (RLS).
- Jangan pernah menyimpan service_role key, password database, atau secret key di file JavaScript.
- RLS pada schema.sql mengizinkan publik INSERT dengan status pending; SELECT/UPDATE/DELETE hanya untuk admin terdaftar.
- Sebelum dipakai luas, pertimbangkan proteksi spam/rate limit, kebijakan privasi, backup, dan proses verifikasi data.
- Ekspor Excel memerlukan internet untuk memuat pustaka SheetJS dari CDN.
- GitHub Pages menayangkan file publik. Jangan menyimpan data alumni di file HTML atau repository.
- Setelah mengubah config.js, lakukan Commit changes dan tunggu Pages menerbitkan versi baru.
