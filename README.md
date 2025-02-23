# StockPoint Pro

StockPoint Pro adalah sistem manajemen gudang dan POS (Point of Sale) yang komprehensif yang membantu bisnis dalam mengelola inventaris, menangani transfer stok antar lokasi, dan mempertahankan pengawasan operasional secara real-time.

## 👨‍💻 Dibuat Oleh

**MOHAMAD MARSTIAS BILLY (koncoweb)**
- YouTube: [KONCOWEB](https://www.youtube.com/@mohmbilly)
- GitHub: [koncoweb](https://github.com/koncoweb)

## 🌟 Fitur

- 📦 Manajemen Inventaris
- 🏪 Point of Sale (POS)
- 🏢 Manajemen Gudang
- 🔄 Sistem Transfer Stok
- 👥 Manajemen Pengguna
- 📊 Laporan Real-time
- 👔 Sistem Persetujuan Pemilik

## 🚀 Memulai

### Prasyarat

- Node.js (v14 atau lebih tinggi)
- npm atau yarn
- Akun Firebase

### Instalasi

1. Clone repositori:
```bash
git clone https://github.com/yourusername/stockpoint-pro.git
cd stockpoint-pro
```

2. Install dependensi:
```bash
npm install
# atau
yarn install
```

3. Siapkan Firebase (lihat bagian Firebase Setup di bawah)

4. Jalankan server development:
```bash
npm run dev
# atau
yarn dev
```

## 🔥 Pengaturan Firebase

### Langkah 1: Buat Proyek Firebase

1. Kunjungi [Firebase Console](https://console.firebase.google.com/)
2. Klik "Add Project"
3. Masukkan nama proyek (misal: "stockpoint-pro")
4. Ikuti wizard pengaturan (Anda dapat menonaktifkan Google Analytics jika tidak diperlukan)

### Langkah 2: Aktifkan Autentikasi

1. Di Firebase Console, buka "Authentication"
2. Klik "Get Started"
3. Aktifkan metode sign-in "Email/Password"

### Langkah 3: Buat Database Firestore

1. Buka "Firestore Database"
2. Klik "Create Database"
3. Mulai dalam mode produksi
4. Pilih lokasi terdekat dengan pengguna Anda

### Langkah 4: Dapatkan Konfigurasi Firebase

1. Buka Project Settings (ikon gerigi)
2. Di bawah "Your apps", pilih ikon web (</>)
3. Daftarkan aplikasi Anda dengan nickname
4. Salin objek firebaseConfig

### Langkah 5: Konfigurasi Aplikasi

1. Buat file `.env` di root proyek:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

2. Update src/lib/firebase.ts dengan konfigurasi Anda

## 📚 Struktur Database Firestore

### Struktur Koleksi

1. **users**
```typescript
{
  id: string; // Auto-generated
  name: string;
  email: string;
  role: 'owner' | 'staff';
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

2. **products**
```typescript
{
  id: string; // Auto-generated
  name: string;
  price: number;
  stock: number;
  category: string;
  sku: string;
  stocks: [{
    warehouseName: string;
    quantity: number;
  }];
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

3. **warehouses**
```typescript
{
  id: string; // Auto-generated
  name: string;
  address: string;
  capacity: number;
  manager: string;
  status: 'active' | 'inactive';
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

4. **transfers**
```typescript
{
  id: string; // Auto-generated
  transferNumber: string;
  transferType: string;
  sourceLocation: {
    id: string;
    name: string;
    type: string;
    address: string;
  };
  destinationLocation: {
    id: string;
    name: string;
    type: string;
    address: string;
  };
  items: [{
    productId: string;
    quantity: number;
    currentStock: number;
    condition: string;
  }];
  status: string;
  priority: string;
  requestDate: timestamp;
  expectedDeliveryDate: timestamp;
  requestedBy: {
    userId: string;
    name: string;
    role: string;
  };
  validatedBy?: {
    userId: string;
    name: string;
    role: string;
    date: timestamp;
    notes: string;
  };
  totalItems: number;
  totalQuantity: number;
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

5. **transactions**
```typescript
{
  id: string; // Auto-generated
  items: [{
    productId: string;
    quantity: number;
    price: number;
  }];
  total: number;
  date: timestamp;
  cashierId: string;
  status: string;
  createdAt: timestamp;
}
```

### Aturan Firestore

Tambahkan aturan ini ke database Firestore Anda untuk keamanan dasar:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner() {
      return isSignedIn() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isOwner();
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
    
    // Warehouses collection
    match /warehouses/{warehouseId} {
      allow read: if isSignedIn();
      allow write: if isOwner();
    }
    
    // Transfers collection
    match /transfers/{transferId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn();
      allow delete: if isOwner();
    }
    
    // Transactions collection
    match /transactions/{transactionId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isOwner();
      allow delete: if isOwner();
    }
  }
}
```

## 🏗️ Struktur Proyek

```
src/
├── components/        # Komponen React
├── contexts/         # Konteks React
├── lib/             # Fungsi utilitas dan setup Firebase
├── pages/           # Komponen halaman
└── types/           # Definisi tipe TypeScript
```

## 🔐 Peran Autentikasi

- **Owner**: Memiliki akses penuh ke semua fitur, termasuk persetujuan
- **Staff**: Dapat membuat transfer, mengelola inventaris, dan memproses penjualan

## 🛠️ Development

### Script yang Tersedia

- `npm run dev`: Menjalankan server development
- `npm run build`: Build untuk produksi
- `npm run preview`: Preview build produksi

### Variabel Lingkungan

Buat file `.env` dengan variabel berikut:

```env
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

## 📝 Lisensi

### Ketentuan Penggunaan

StockPoint Pro dikembangkan oleh MOHAMAD MARSTIAS BILLY (koncoweb) dan tersedia untuk penggunaan komersial dan non-komersial dengan ketentuan berikut:

1. **Atribusi**: Setiap penggunaan aplikasi ini harus mencantumkan kredit kepada:
   - Nama: MOHAMAD MARSTIAS BILLY
   - Channel YouTube: KONCOWEB (https://www.youtube.com/@mohmbilly)

2. **Penggunaan Komersial**:
   - Diperbolehkan menggunakan aplikasi ini untuk tujuan komersial
   - Wajib mencantumkan atribusi yang jelas dan mudah dilihat
   - Tidak boleh mengklaim aplikasi ini sebagai karya sendiri

3. **Penggunaan Non-Komersial**:
   - Bebas menggunakan untuk tujuan non-komersial
   - Tetap wajib mencantumkan atribusi
   - Diperbolehkan memodifikasi sesuai kebutuhan

4. **Distribusi**:
   - Diperbolehkan mendistribusikan ulang dengan mencantumkan atribusi
   - Tidak boleh menghapus atau mengubah informasi lisensi dan atribusi asli

Dengan menggunakan aplikasi ini, Anda setuju untuk mematuhi ketentuan penggunaan di atas.

## 🤝 Kontribusi

1. Fork repositori
2. Buat branch fitur (`git checkout -b feature/FiturKeren`)
3. Commit perubahan (`git commit -m 'Menambah fitur keren'`)
4. Push ke branch (`git push origin feature/FiturKeren`)
5. Buat Pull Request
