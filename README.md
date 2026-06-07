# Kedai 99 POS

**Sistem Informasi Point of Sale (POS) dan Manajemen Penjualan Kedai 99 Berbasis Web**

Aplikasi kasir berbasis web untuk Kedai 99 yang digunakan oleh Admin (Owner) dan Kasir untuk mengelola transaksi penjualan, menu, kategori, stok barang, dan laporan penjualan.

## Teknologi

- **Frontend:** HTML5, CSS3, Bootstrap 5, JavaScript
- **Backend/Data:** Supabase
- **Hosting:** GitHub Pages

## Fitur

### Admin
- ✅ Dashboard (statistik lengkap)
- ✅ POS / Kasir (transaksi penjualan)
- ✅ Kelola Menu (CRUD + upload gambar)
- ✅ Kelola Kategori
- ✅ Kelola Akun Kasir
- ✅ Kelola Stok Barang
- ✅ Daftar Transaksi (filter hari/minggu/bulan)
- ✅ Laporan (harian, mingguan, bulanan)

### Kasir
- ✅ Dashboard Kasir
- ✅ POS / Kasir (transaksi penjualan)

### Fitur POS
- Grid menu dengan pencarian & filter kategori
- Keranjang belanja (tambah/kurangi/hapus)
- Pembayaran: Tunai, QRIS, Transfer, E-Wallet
- Hitung kembalian otomatis (tunai)
- Cetak struk

## Setup Supabase

### 1. Buat Project Supabase
1. Buka [https://supabase.com](https://supabase.com)
2. Daftar / Login
3. Klik **New Project**
4. Isi nama project, password database, pilih region
5. Tunggu sampai project selesai dibuat

### 2. Jalankan SQL Schema
1. Buka **SQL Editor** di dashboard Supabase
2. Copy isi file `supabase-schema.sql`
3. Paste ke SQL Editor
4. Klik **Run**

### 3. Get API Credentials
1. Buka **Settings** → **API**
2. Copy **Project URL** (contoh: `https://xxxxx.supabase.co`)
3. Copy **anon public** key

### 4. Konfigurasi Aplikasi
1. Buka file `js/config.js`
2. Ganti `SUPABASE_URL` dengan Project URL
3. Ganti `SUPABASE_ANON_KEY` dengan anon key

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJxxxx...your_anon_key';
```

### 5. Jalankan Lokal
Buka `index.html` di browser, atau gunakan Live Server di VS Code.

## Deploy ke GitHub Pages

1. Push semua source code ke repository GitHub
2. Buka **Settings** → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **main**, folder: **/ (root)**
5. Klik **Save**
6. Tunggu beberapa menit

URL: `https://username.github.io/kedai99-pos/`

## Akun Default

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@kedai99.com | admin123 |
| Kasir | rina@kedai99.com | kasir123 |
| Kasir | budi@kedai99.com | kasir123 |
| Kasir | sari@kedai99.com | kasir123 |

## Struktur File

```
kedai99-pos/
├── index.html          # Main SPA
├── css/
│   └── style.css       # Custom styles
├── js/
│   ├── config.js       # Supabase config
│   ├── auth.js         # Authentication
│   ├── app.js          # App controller & routing
│   ├── dashboard.js    # Admin dashboard
│   ├── kasir-dashboard.js  # Kasir dashboard
│   ├── menu.js         # Kelola menu
│   ├── kategori.js     # Kelola kategori
│   ├── kasir.js        # Kelola kasir
│   ├── stok.js         # Kelola stok
│   ├── transaksi.js    # Daftar transaksi
│   ├── laporan.js      # Laporan penjualan
│   └── pos.js          # Point of Sale
├── supabase-schema.sql # Database schema + dummy data
└── README.md           # Dokumentasi
```

## License

MIT
