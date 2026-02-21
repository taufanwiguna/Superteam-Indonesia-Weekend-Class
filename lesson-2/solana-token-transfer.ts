/**
 * Solana Token Workshop - Lesson 2
 * Demonstrasi pembuatan dan pengelolaan SPL Token di Solana Devnet
 *
 * Jalankan: npm start
 */

import * as fs from 'fs'; // Gunakan format * as fs agar lebih kompatibel
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

// Cukup satu kali deklarasi connection saja
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

const TOKEN_DECIMALS = 9;   // Presisi token: 9 desimal seperti SOL
const MINT_AMOUNT = 1000;   // Jumlah token yang dicetak
const TRANSFER_AMOUNT = 50; // Jumlah token yang ditransfer ke Wallet B
const BURN_AMOUNT = 100;    // Jumlah token yang dibakar dari Wallet A

// ============================================================================
// FUNGSI HELPER
// ============================================================================

async function checkSolBalance(publicKey: PublicKey, label: string): Promise<void> {
  const balance = await connection.getBalance(publicKey);
  const sol = balance / LAMPORTS_PER_SOL;
  console.log(`  ${label}: ${sol.toFixed(4)} SOL`);
}

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
  console.log('║           SOLANA TOKEN WORKSHOP - Lesson 2             ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  // --- Langkah 1: Buat atau Load Wallet ---
  console.log('\n--- Langkah 1: Load Wallet dari File ---');

  let walletA: Keypair;
  let walletB: Keypair;

  // Cek apakah file wallet sudah ada, jika ada maka pakai yang lama
  if (fs.existsSync("walletA.json") && fs.existsSync("walletB.json")) {
    const dataA = JSON.parse(fs.readFileSync("walletA.json", "utf-8"));
    const dataB = JSON.parse(fs.readFileSync("walletB.json", "utf-8"));
    
    walletA = Keypair.fromSecretKey(Uint8Array.from(dataA));
    walletB = Keypair.fromSecretKey(Uint8Array.from(dataB));
    
    console.log("✅ Berhasil menggunakan wallet lama dari file .json");
  } else {
    // Jika belum ada file, baru buat baru (seperti sebelumnya)
    walletA = Keypair.generate();
    walletB = Keypair.generate();
    fs.writeFileSync("walletA.json", `[${walletA.secretKey.toString()}]`);
    fs.writeFileSync("walletB.json", `[${walletB.secretKey.toString()}]`);
    console.log("✅ Wallet baru dibuat dan disimpan.");
  }

  console.log('Wallet A:', walletA.publicKey.toBase58());

  // --- Langkah 2: Buat Token Mint ---
  console.log('\n--- Langkah 2: Buat Token Mint ---');
  const mint = await createMint(
    connection,
    walletA,
    walletA.publicKey,
    walletA.publicKey,
    TOKEN_DECIMALS
  );
  console.log('Mint Address:', mint.toBase58());

  // --- Langkah 3: Mint Token ke Wallet A ---
  console.log('\n--- Langkah 3: Mint Token ke Wallet A ---');
  const tokenAccountA = await getOrCreateAssociatedTokenAccount(
    connection,
    walletA,
    mint,
    walletA.publicKey
  );
  
  await mintTo(
    connection,
    walletA,
    mint,
    tokenAccountA.address,
    walletA,
    MINT_AMOUNT * Math.pow(10, TOKEN_DECIMALS)
  );
  console.log(`${MINT_AMOUNT} token berhasil dicetak!`);
  await checkTokenBalance(tokenAccountA.address);

  // --- Langkah 4: Transfer Token ---
  console.log('\n--- Langkah 4: Transfer Token ke Wallet B ---');
  const tokenAccountB = await getOrCreateAssociatedTokenAccount(
    connection,
    walletA,
    mint,
    walletB.publicKey
  );

  await transfer(
    connection,
    walletA,
    tokenAccountA.address,
    tokenAccountB.address,
    walletA,
    TRANSFER_AMOUNT * Math.pow(10, TOKEN_DECIMALS)
  );
  console.log(`${TRANSFER_AMOUNT} token ditransfer!`);

  // --- Langkah 5: Burn Token ---
  console.log('\n--- Langkah 5: Burn Token ---');
  await burn(
    connection,
    walletA,
    tokenAccountA.address,
    mint,
    walletA,
    BURN_AMOUNT * Math.pow(10, TOKEN_DECIMALS)
  );
  console.log(`${BURN_AMOUNT} token dibakar!`);

  // --- Langkah 6: Revoke Mint Authority ---
  console.log('\n--- Langkah 6: Nonaktifkan Minting ---');
  await setAuthority(
    connection,
    walletA,
    mint,
    walletA,
    AuthorityType.MintTokens,
    null
  );
  console.log('Mint authority dicabut. Supply tetap selamanya!');

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║               WORKSHOP SELESAI!                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });