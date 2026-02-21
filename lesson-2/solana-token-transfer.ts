/**
 * Solana Token Workshop - Lesson 2
 * Demonstrasi pembuatan dan pengelolaan SPL Token di Solana Devnet
 *
 * Jalankan: npm start
 */

import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  burn,
  setAuthority,
  AuthorityType,
  getAccount,
} from '@solana/spl-token';

// ============================================================================
// KONFIGURASI
// ============================================================================

// Hubungkan ke Solana Devnet — jaringan uji gratis, bukan mainnet
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

const TOKEN_DECIMALS = 9;   // Presisi token: 9 desimal seperti SOL
const MINT_AMOUNT = 1000;   // Jumlah token yang dicetak
const TRANSFER_AMOUNT = 50; // Jumlah token yang ditransfer ke Wallet B
const BURN_AMOUNT = 100;    // Jumlah token yang dibakar dari Wallet A

// ============================================================================
// FUNGSI HELPER
// ============================================================================

/**
 * Cek dan tampilkan saldo SOL sebuah wallet.
 * Saldo di Solana disimpan dalam "lamports" (satuan terkecil).
 * 1 SOL = 1.000.000.000 lamports — mirip seperti 1 rupiah = 100 sen.
 */
async function checkSolBalance(publicKey: PublicKey, label: string): Promise<void> {
  const balance = await connection.getBalance(publicKey);
  const sol = balance / LAMPORTS_PER_SOL;
  console.log(`  ${label}: ${sol.toFixed(4)} SOL`);
}

/**
 * Cek dan tampilkan saldo token dari sebuah Associated Token Account.
 * Amount disimpan dalam unit terkecil, jadi kita bagi dengan 10^TOKEN_DECIMALS
 * untuk mendapatkan jumlah token yang sebenarnya.
 */
async function checkTokenBalance(tokenAccount: PublicKey): Promise<void> {
  const accountInfo = await getAccount(connection, tokenAccount);
  const balance = Number(accountInfo.amount) / Math.pow(10, TOKEN_DECIMALS);
  console.log(`  ${tokenAccount.toBase58().slice(0, 8)}...: ${balance} token`);
}

// ============================================================================
// PROGRAM UTAMA
// ============================================================================

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║          SOLANA TOKEN WORKSHOP - Lesson 2             ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  // ─────────────────────────────────────────────────────────────────────────
  // Langkah 1 — Buat Wallet
  // ─────────────────────────────────────────────────────────────────────────
  // Keypair = pasangan kunci publik + privat.
  // Public key  = alamat wallet, aman dibagikan ke siapa saja.
  // Private key = kunci rahasia untuk menandatangani transaksi — jangan bocor!
  console.log('\n--- Langkah 1: Buat Wallet ---');

  const walletA = Keypair.generate();
  const walletB = Keypair.generate();

  console.log('Wallet A:', walletA.publicKey.toBase58());
  console.log('Wallet B:', walletB.publicKey.toBase58());

  // Airdrop SOL agar wallet punya dana untuk membayar biaya transaksi.
  // Airdrop hanya tersedia di Devnet/Testnet — tidak berlaku di mainnet.
  console.log('\nMeminta airdrop SOL dari Devnet faucet...');

  const airdropSigA = await connection.requestAirdrop(walletA.publicKey, 2 * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(airdropSigA);
  console.log('  Airdrop Wallet A berhasil');

  const airdropSigB = await connection.requestAirdrop(walletB.publicKey, 1 * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(airdropSigB);
  console.log('  Airdrop Wallet B berhasil');

  console.log('\nSaldo SOL:');
  await checkSolBalance(walletA.publicKey, 'Wallet A');
  await checkSolBalance(walletB.publicKey, 'Wallet B');

  // ─────────────────────────────────────────────────────────────────────────
  // Langkah 2 — Buat Token Mint
  // ─────────────────────────────────────────────────────────────────────────
  // Token Mint = "pabrik" token. Ini adalah on-chain account yang menyimpan
  // metadata token: siapa yang boleh mencetak, siapa yang boleh membekukan,
  // dan berapa desimal presisinya.
  //
  // Mint Authority   = satu-satunya yang boleh mencetak (mintTo) token baru.
  // Freeze Authority = bisa membekukan token account pengguna.
  console.log('\n--- Langkah 2: Buat Token Mint ---');

  const mint = await createMint(
    connection,
    walletA,            // Payer: yang membayar biaya pembuatan account
    walletA.publicKey,  // Mint Authority: yang berhak mencetak token baru
    walletA.publicKey,  // Freeze Authority: yang berhak membekukan akun
    TOKEN_DECIMALS      // Desimal: 9 = presisi seperti SOL (0.000000001)
  );

  console.log('Mint Address:', mint.toBase58());
  console.log('Explorer:', `https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`);

  // ─────────────────────────────────────────────────────────────────────────
  // Langkah 3 — Mint Token ke Wallet A
  // ─────────────────────────────────────────────────────────────────────────
  // Di Solana, token TIDAK disimpan langsung di wallet.
  // Setiap wallet perlu "Associated Token Account" (ATA) untuk setiap jenis token.
  // ATA = rekening tabungan khusus untuk satu jenis token tertentu.
  //
  // getOrCreateAssociatedTokenAccount akan membuat ATA jika belum ada,
  // atau langsung pakai yang sudah ada — aman dipanggil berkali-kali.
  console.log('\n--- Langkah 3: Mint Token ke Wallet A ---');

  const tokenAccountA = await getOrCreateAssociatedTokenAccount(
    connection,
    walletA,            // Payer: yang membayar biaya pembuatan ATA
    mint,               // Token mint yang akan ditampung di ATA ini
    walletA.publicKey   // Owner: siapa pemilik ATA ini
  );
  console.log('Token Account A:', tokenAccountA.address.toBase58());

  await mintTo(
    connection,
    walletA,                  // Payer
    mint,                     // Token mint
    tokenAccountA.address,    // Tujuan: ATA penerima token
    walletA,                  // Mint Authority (harus punya private key)
    MINT_AMOUNT * Math.pow(10, TOKEN_DECIMALS) // Jumlah dalam unit terkecil
  );
  console.log(`${MINT_AMOUNT} token berhasil dicetak!`);

  console.log('Saldo token:');
  await checkTokenBalance(tokenAccountA.address);

  // ─────────────────────────────────────────────────────────────────────────
  // Langkah 4 — Transfer Token ke Wallet B
  // ─────────────────────────────────────────────────────────────────────────
  // Wallet B juga butuh ATA untuk token ini sebelum bisa menerima.
  // Yang membayar biaya pembuatan ATA adalah pengirim (walletA) — bukan penerima.
  // Ini pola umum di Solana: yang ingin kirim token, dia yang setup akun tujuan.
  console.log('\n--- Langkah 4: Transfer Token ke Wallet B ---');

  const tokenAccountB = await getOrCreateAssociatedTokenAccount(
    connection,
    walletA,            // Payer: walletA bayar pembuatan ATA milik walletB
    mint,
    walletB.publicKey   // Owner: walletB yang akan memiliki ATA ini
  );
  console.log('Token Account B:', tokenAccountB.address.toBase58());

  await transfer(
    connection,
    walletA,                  // Payer & penandatangan transaksi
    tokenAccountA.address,    // Sumber token
    tokenAccountB.address,    // Tujuan token
    walletA,                  // Owner dari token account sumber
    TRANSFER_AMOUNT * Math.pow(10, TOKEN_DECIMALS)
  );
  console.log(`${TRANSFER_AMOUNT} token berhasil ditransfer!`);

  console.log('Saldo token setelah transfer:');
  await checkTokenBalance(tokenAccountA.address);
  await checkTokenBalance(tokenAccountB.address);

  // ─────────────────────────────────────────────────────────────────────────
  // Langkah 5 — Burn Token dari Wallet A
  // ─────────────────────────────────────────────────────────────────────────
  // Burn = menghancurkan token secara permanen dari peredaran.
  // Token yang dibakar dikurangi dari total supply — tidak bisa dikembalikan.
  // Digunakan dalam tokenomics: deflasi supply, fee burning, redeem mechanics.
  console.log('\n--- Langkah 5: Burn Token dari Wallet A ---');

  await burn(
    connection,
    walletA,                  // Payer
    tokenAccountA.address,    // Token account yang tokennya akan dibakar
    mint,                     // Token mint
    walletA,                  // Owner token account
    BURN_AMOUNT * Math.pow(10, TOKEN_DECIMALS)
  );
  console.log(`${BURN_AMOUNT} token berhasil dibakar!`);

  console.log('Saldo token setelah burn:');
  await checkTokenBalance(tokenAccountA.address);

  // ─────────────────────────────────────────────────────────────────────────
  // Langkah 6 — Nonaktifkan Minting (Revoke Mint Authority)
  // ─────────────────────────────────────────────────────────────────────────
  // Dengan mengeset Mint Authority ke `null`, tidak ada yang bisa mencetak
  // token baru lagi — termasuk kita sendiri. Supply menjadi TETAP selamanya.
  //
  // Ini digunakan proyek yang ingin membuktikan tidak ada inflasi tersembunyi.
  // PERINGATAN: Tindakan ini tidak bisa dibalik!
  console.log('\n--- Langkah 6: Nonaktifkan Minting ---');

  await setAuthority(
    connection,
    walletA,                  // Payer & current authority
    mint,                     // Target: token mint
    walletA,                  // Current mint authority yang akan dilepas
    AuthorityType.MintTokens, // Jenis otoritas yang dicabut
    null                      // null = tidak ada pemilik baru = permanen
  );
  console.log('Mint authority berhasil dicabut!');
  console.log('Supply token sekarang TETAP selamanya — tidak bisa dicetak lagi.');

  // ─────────────────────────────────────────────────────────────────────────
  // Ringkasan Akhir
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║               WORKSHOP SELESAI!                       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n  Token dicetak   : ${MINT_AMOUNT}`);
  console.log(`  Token ditransfer: ${TRANSFER_AMOUNT} ke Wallet B`);
  console.log(`  Token dibakar   : ${BURN_AMOUNT} dari Wallet A`);
  console.log(`  Saldo Wallet A  : ${MINT_AMOUNT - TRANSFER_AMOUNT - BURN_AMOUNT} token`);
  console.log(`  Saldo Wallet B  : ${TRANSFER_AMOUNT} token`);
  console.log('\n  Semua operasi berhasil!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
