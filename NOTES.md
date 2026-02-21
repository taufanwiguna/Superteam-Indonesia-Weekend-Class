📝 NOTES — Superteam Weekend Class (Lesson 2)

Catatan teknis pribadi untuk Lesson 2.
Berisi alamat wallet nyata, alur lifecycle SPL Token, serta perbaikan logika kode berdasarkan hasil eksekusi script di Solana Devnet.

🔑 Identity & Verified Addresses

Dieksekusi pada Sat, Feb 21, 2026 (Devnet)

Wallet A (Public Key)
FcK5myyT8jk5QNyXMdajkJEJfmNRo7WFSpnMXd3rMdp5

Wallet B (Public Key)
BwaQajgREssrCuUx8ejep8dLXRbnG4zrW75RrFE5EiLC

Token Mint Address
7FqnXUDhvn7WEz6VrPazH9WURkFRhtmBcBWUAWae6PGA

💾 1. Wallet Persistence (Logic Update)

Agar wallet tidak berubah setiap kali script dijalankan, ditambahkan mekanisme persistensi secret key menggunakan file .json.

Error yang Ditemui

Cannot find name 'fs'

Cannot redeclare variable

Solusi

Menambahkan import fs di awal file.

Memastikan objek connection hanya dideklarasikan satu kali (global scope).

Logika Load Wallet
if (fs.existsSync("walletA.json")) {
  const dataA = JSON.parse(fs.readFileSync("walletA.json", "utf-8"));
  walletA = Keypair.fromSecretKey(Uint8Array.from(dataA));
  console.log("✅ Loaded existing wallet from JSON");
}
🏗️ 2. SPL Token Lifecycle
Step 1 — Mint Token

Mencetak 1,000 token ke Wallet A.

Function: mintTo()

Outcome: Initial supply created

Step 2 — Transfer Token

Transfer 50 token dari Wallet A ke Wallet B.

Function: transfer()

Catatan: Wallet A membayar biaya pembuatan ATA untuk Wallet B

Step 3 — Burn Token

Menghancurkan 100 token dari Wallet A.

Function: burn()

Tujuan: Mengurangi suplai token secara permanen

Step 4 — Revoke Mint Authority

Menonaktifkan hak mint secara permanen.

Function: setAuthority(..., null)

Dampak: Token menjadi fixed supply

📊 Final State
Parameter	Value
Wallet A Balance	850 Token
Wallet B Balance	50 Token
Total Supply	900 Token
Mint Authority	None (Revoked)
🧪 Environment

OS: Ubuntu 20.04.6 LTS (WSL2)

Network: Solana Devnet

Verified: Feb 21, 2026