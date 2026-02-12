/**
 * Solana Token Workshop - Using @solana/web3.js
 * Educational script demonstrating token operations with standard Solana libraries
 * 
 * Prerequisites:
 * - Install dependencies: npm install @solana/web3.js @solana/spl-token
 * - Set up two wallets (A and B) with some SOL for transaction fees
 * - This uses the standard Solana JavaScript SDK
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
  getMint,
  getAccount,
} from '@solana/spl-token';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Connect to Solana Devnet (testnet for development)
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// Token configuration
const TOKEN_DECIMALS = 9; // Standard for Solana tokens (like SOL)
const MINT_AMOUNT = 1000; // Number of tokens to mint
const TRANSFER_AMOUNT = 50; // Number of tokens to transfer
const BURN_AMOUNT = 100; // Number of tokens to burn

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Request SOL airdrop for a wallet (Devnet only)
 */
async function requestAirdrop(publicKey: PublicKey, amount: number): Promise<void> {
  console.log(`  Requesting ${amount} SOL airdrop...`);
  const signature = await connection.requestAirdrop(
    publicKey,
    amount * LAMPORTS_PER_SOL
  );

  // Wait for confirmation
  await connection.confirmTransaction(signature);
  console.log(`  ✓ Airdrop confirmed`);
}

/**
 * Check SOL balance of a wallet
 */
async function checkBalance(publicKey: PublicKey, label: string): Promise<number> {
  const balance = await connection.getBalance(publicKey);
  const sol = balance / LAMPORTS_PER_SOL;
  console.log(`  ${label}: ${sol.toFixed(4)} SOL`);
  return sol;
}

/**
 * Get token balance for a wallet
 */
async function getTokenBalance(tokenAccount: PublicKey): Promise<number> {
  try {
    const accountInfo = await getAccount(connection, tokenAccount);
    return Number(accountInfo.amount) / Math.pow(10, TOKEN_DECIMALS);
  } catch (error) {
    return 0;
  }
}

// ============================================================================
// STEP 1: CREATE AND FUND WALLETS
// ============================================================================

async function step1_CreateWallets() {
  console.log('\n========================================');
  console.log('STEP 1: Creating and funding wallets');
  console.log('========================================');

  // Generate two new keypairs for our wallets
  const walletA = Keypair.generate();
  const walletB = Keypair.generate();

  console.log('✓ Wallet A created');
  console.log('  Public Key:', walletA.publicKey.toBase58());

  console.log('\n✓ Wallet B created');
  console.log('  Public Key:', walletB.publicKey.toBase58());

  // Request airdrops for both wallets
  console.log('\n📥 Requesting airdrops from Devnet faucet...');
  await requestAirdrop(walletA.publicKey, 2);
  await requestAirdrop(walletB.publicKey, 1);

  console.log('\n💰 Final balances:');
  await checkBalance(walletA.publicKey, 'Wallet A');
  await checkBalance(walletB.publicKey, 'Wallet B');

  return { walletA, walletB };
}

// ============================================================================
// STEP 2: CREATE TOKEN MINT
// ============================================================================

async function step2_CreateMint(payer: Keypair) {
  console.log('\n========================================');
  console.log('STEP 2: Creating a new token mint');
  console.log('========================================');

  console.log('Configuration:');
  console.log('  Decimals:', TOKEN_DECIMALS);
  console.log('  Mint Authority:', payer.publicKey.toBase58());

  // Create the token mint
  const mint = await createMint(
    connection,           // Connection to cluster
    payer,                // Payer of the transaction
    payer.publicKey,      // Account that will control minting
    payer.publicKey,      // Account that can freeze token accounts
    TOKEN_DECIMALS        // Number of decimals
  );

  console.log('\n✓ Token Mint Created!');
  console.log('  Mint Address:', mint.toBase58());
  console.log('  Explorer:', `https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`);

  return mint;
}

// ============================================================================
// STEP 3: MINT 1000 TOKENS TO WALLET A
// ============================================================================

async function step3_MintTokens(
  mint: PublicKey,
  mintAuthority: Keypair,
  destination: PublicKey
) {
  console.log('\n========================================');
  console.log('STEP 3: Minting 1000 tokens to Wallet A');
  console.log('========================================');

  // Get or create the associated token account for Wallet A
  console.log('Creating token account for Wallet A...');
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    mintAuthority,        // Payer
    mint,                 // Token mint
    destination           // Owner
  );

  console.log('  ✓ Token Account:', tokenAccount.address.toBase58());

  // Mint tokens
  const amount = MINT_AMOUNT * Math.pow(10, TOKEN_DECIMALS);

  const signature = await mintTo(
    connection,
    mintAuthority,
    mint,
    tokenAccount.address,
    mintAuthority,
    amount
  );

  console.log(`\n✓ Minted ${MINT_AMOUNT} tokens!`);
  console.log('  Transaction:', signature);

  const balance = await getTokenBalance(tokenAccount.address);
  console.log(`  Balance: ${balance} tokens`);

  return tokenAccount;
}

// ============================================================================
// STEP 4: TRANSFER 50 TOKENS FROM WALLET A TO WALLET B
// ============================================================================

async function step4_TransferTokens(
  mint: PublicKey,
  fromWallet: Keypair,
  fromTokenAccount: PublicKey,
  toWallet: PublicKey
) {
  console.log('\n========================================');
  console.log('STEP 4: Transferring 50 tokens to Wallet B');
  console.log('========================================');

  console.log('Creating token account for Wallet B...');
  const toTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    mint,
    toWallet
  );

  console.log('  ✓ Token Account:', toTokenAccount.address.toBase58());

  // Transfer tokens
  const amount = TRANSFER_AMOUNT * Math.pow(10, TOKEN_DECIMALS);

  const signature = await transfer(
    connection,
    fromWallet,
    fromTokenAccount,
    toTokenAccount.address,
    fromWallet,
    amount
  );

  console.log(`\n✓ Transferred ${TRANSFER_AMOUNT} tokens!`);
  console.log('  Transaction:', signature);

  const balanceA = await getTokenBalance(fromTokenAccount);
  const balanceB = await getTokenBalance(toTokenAccount.address);
  console.log(`\n  Wallet A: ${balanceA} tokens`);
  console.log(`  Wallet B: ${balanceB} tokens`);

  return toTokenAccount;
}

// ============================================================================
// STEP 5: BURN 100 TOKENS FROM WALLET A
// ============================================================================

async function step5_BurnTokens(
  mint: PublicKey,
  owner: Keypair,
  tokenAccount: PublicKey
) {
  console.log('\n========================================');
  console.log('STEP 5: Burning 100 tokens from Wallet A');
  console.log('========================================');

  const amount = BURN_AMOUNT * Math.pow(10, TOKEN_DECIMALS);

  const signature = await burn(
    connection,
    owner,
    tokenAccount,
    mint,
    owner,
    amount
  );

  console.log(`✓ Burned ${BURN_AMOUNT} tokens!`);
  console.log('  Transaction:', signature);

  const balance = await getTokenBalance(tokenAccount);
  console.log(`  Remaining balance: ${balance} tokens`);
  console.log('  🔥 These tokens are permanently destroyed!');
}

// ============================================================================
// STEP 6: DISABLE MINTING (REVOKE MINT AUTHORITY)
// ============================================================================

async function step6_DisableMinting(
  mint: PublicKey,
  currentAuthority: Keypair
) {
  console.log('\n========================================');
  console.log('STEP 6: Disabling token minting');
  console.log('========================================');

  console.log('⚠️  Revoking mint authority permanently...');

  const signature = await setAuthority(
    connection,
    currentAuthority,
    mint,
    currentAuthority,
    AuthorityType.MintTokens,
    null
  );

  console.log('✓ Mint authority revoked!');
  console.log('  Transaction:', signature);
  console.log('\n  Token supply is now FIXED forever');
  console.log('  No one can mint new tokens');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     SOLANA TOKEN WORKSHOP - @solana/web3.js           ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('\n  Using: @solana/web3.js + @solana/spl-token\n');

  try {
    const { walletA, walletB } = await step1_CreateWallets();
    const mint = await step2_CreateMint(walletA);
    const tokenAccountA = await step3_MintTokens(mint, walletA, walletA.publicKey);
    await step4_TransferTokens(mint, walletA, tokenAccountA.address, walletB.publicKey);
    await step5_BurnTokens(mint, walletA, tokenAccountA.address);
    await step6_DisableMinting(mint, walletA);

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                 WORKSHOP COMPLETE! 🎉                  ║');
    console.log('╚════════════════════════════════════════════════════════╝');

    console.log('\n✅ What You Accomplished:');
    console.log('  ✓ Created and funded wallets on Devnet');
    console.log('  ✓ Created a new SPL token mint');
    console.log('  ✓ Minted 1000 tokens to Wallet A');
    console.log('  ✓ Transferred 50 tokens to Wallet B');
    console.log('  ✓ Burned 100 tokens from Wallet A');
    console.log('  ✓ Disabled minting permanently');

    console.log('\n✨ All operations completed successfully!');

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
