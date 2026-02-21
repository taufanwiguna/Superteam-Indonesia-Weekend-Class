# Solana Token Workshop — Lesson 2

Workshop ini mendemonstrasikan pembuatan dan pengelolaan token di blockchain Solana menggunakan library `@solana/web3.js` dan `@solana/spl-token`.

---

## Prasyarat

- **Node.js** versi 18 atau lebih baru

  ```bash
  node --version   # harus >= 18.0.0
  ```

- **npm** (sudah termasuk dalam instalasi Node.js)

  ```bash
  npm --version
  ```

---

## Instalasi

```bash
cd lesson-2
npm install
```

Perintah ini menginstal dua package:

| Package | Fungsi |
|---------|--------|
| `@solana/web3.js` | SDK utama Solana: koneksi ke jaringan, pembuatan keypair, pengiriman transaksi |
| `@solana/spl-token` | Library untuk membuat dan mengelola SPL Token (standar token di Solana) |

---

## Cara Menjalankan

```bash
npm start
```

> **Catatan:** Script ini terhubung ke **Devnet** (jaringan uji Solana). Diperlukan koneksi internet yang aktif agar airdrop SOL dan transaksi berhasil dieksekusi.

---

## Penjelasan Kode — 6 Langkah

### Langkah 1: Buat Wallet

Di Solana, wallet adalah **keypair** — pasangan kunci kriptografi:

- **Public key** (kunci publik): alamat wallet, aman dibagikan ke siapa saja
- **Private key** (kunci privat): digunakan untuk menandatangani transaksi, **harus dijaga kerahasiaannya**

Kita membuat dua wallet baru (`walletA` dan `walletB`), lalu meminta **airdrop SOL** dari faucet Devnet. SOL diperlukan untuk membayar biaya transaksi (*transaction fee*) di setiap operasi berikutnya. Airdrop hanya tersedia di Devnet/Testnet — tidak berlaku di mainnet.

---

### Langkah 2: Buat Token Mint

**Token Mint** adalah account di blockchain yang berfungsi sebagai "pabrik" token. Mint menyimpan metadata token kita:

| Field | Penjelasan |
|-------|------------|
| **Mint Authority** | Siapa yang boleh mencetak token baru (bisa direvoke) |
| **Freeze Authority** | Siapa yang boleh membekukan token account pengguna |
| **Decimals** | Presisi token — `9` artinya bisa sampai `0.000000001` (seperti SOL) |

Alamat mint adalah "identitas" token kita di seluruh ekosistem Solana.

---

### Langkah 3: Mint Token ke Wallet A

Di Solana, token **tidak disimpan langsung di wallet**. Setiap wallet membutuhkan **Associated Token Account (ATA)** — semacam rekening tabungan khusus untuk satu jenis token.

- `getOrCreateAssociatedTokenAccount()` — membuat ATA jika belum ada, atau pakai yang sudah ada
- `mintTo()` — mencetak token baru ke ATA tersebut
- Jumlah harus dalam unit terkecil: `1000 × 10^9 = 1_000_000_000_000` (bukan `1000`)

---

### Langkah 4: Transfer Token ke Wallet B

Sebelum bisa menerima token, `walletB` juga perlu ATA-nya sendiri untuk token ini.

Yang **membayar biaya pembuatan ATA** adalah pengirim (`walletA`) — bukan penerima. Ini pola umum di Solana: siapa yang ingin mengirim token, dia yang menanggung biaya setup akun tujuan.

Setelah transfer:
- Wallet A: **950 token**
- Wallet B: **50 token**

---

### Langkah 5: Burn Token

**Burn** = menghancurkan token secara permanen dari peredaran.

Token yang dibakar:
- Dikurangi dari total *circulating supply*
- **Tidak bisa dikembalikan**

Burn digunakan dalam berbagai strategi *tokenomics*:
- **Deflasi** — membuat token yang tersisa lebih langka seiring waktu
- **Fee burning** — sebagian biaya transaksi dibakar (seperti mekanisme ETH EIP-1559)
- **Redeem mechanics** — tukar token dengan layanan/produk, lalu token dibakar

Setelah burn 100 token dari Wallet A, tersisa **850 token**.

---

### Langkah 6: Nonaktifkan Minting (Revoke Mint Authority)

Dengan memanggil `setAuthority(..., null)`, **Mint Authority diserahkan ke `null`** — artinya tidak ada siapapun yang bisa mencetak token baru lagi, termasuk kita sendiri.

Ini membuat **total supply menjadi TETAP selamanya** (*fixed supply*). Langkah ini penting untuk membangun kepercayaan komunitas bahwa tidak akan ada pencetakan token tersembunyi (*hidden inflation*).

> ⚠️ **Peringatan:** Tindakan ini **tidak bisa dibalik**. Setelah mint authority dicabut, supply token terkunci permanen.

---

## Ringkasan Operasi

| Langkah | Operasi | Fungsi yang Dipakai | Efek |
|---------|---------|---------------------|------|
| 1 | Buat & isi wallet | `Keypair.generate()` + `requestAirdrop()` | 2 wallet baru dengan SOL di Devnet |
| 2 | Buat token mint | `createMint()` | Identitas token terdaftar di blockchain |
| 3 | Cetak token | `getOrCreateAssociatedTokenAccount()` + `mintTo()` | 1000 token masuk ke Wallet A |
| 4 | Transfer token | `getOrCreateAssociatedTokenAccount()` + `transfer()` | 50 token pindah ke Wallet B |
| 5 | Bakar token | `burn()` | 100 token dihapus permanen dari supply |
| 6 | Kunci supply | `setAuthority(..., null)` | Tidak ada token baru yang bisa dicetak |

**Saldo akhir:** Wallet A = **850 token** | Wallet B = **50 token** | Total supply = **900 token**
