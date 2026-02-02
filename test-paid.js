/**
 * Quick buyer-side payment test for MovieMemo x402 endpoints
 * 
 * Usage:
 *   node test-paid.js "0xBUYER_PRIVATE_KEY" "La La Land"
 * 
 * Or with environment variables:
 *   AGENT_URL="http://localhost:8787" node test-paid.js "0xPRIVATE_KEY" "Movie Title"
 */

import { wrapFetchWithPayment, createSigner } from "x402-fetch";

// Configuration
const AGENT_URL = process.env.AGENT_URL || 'http://localhost:8787';
const PRIVATE_KEY = process.argv[2];
const MOVIE = process.argv[3] || 'La La Land';

if (!PRIVATE_KEY || PRIVATE_KEY.length < 60) {
  console.error('Usage: node test-paid.js <private_key> <movie_title>');
  console.error('');
  console.error('Examples:');
  console.error('  node test-paid.js 0xabc... "La La Land"');
  console.error('  AGENT_URL=http://localhost:8787 node test-paid.js 0xabc... "Inception"');
  process.exit(1);
}

// Normalize private key
const normalizedKey = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : '0x' + PRIVATE_KEY;

async function main() {
  console.log('MovieMemo x402 Quick Test');
  console.log('=========================');
  console.log('Agent:', AGENT_URL);
  console.log('Movie:', MOVIE);
  console.log('');

  try {
    const signer = await createSigner('base', normalizedKey);
    console.log('Wallet:', signer.address);
    console.log('');

    const fetchWithPayment = wrapFetchWithPayment(fetch, signer);
    const url = `${AGENT_URL}/entrypoints/soundtrack-list/invoke`;
    
    console.log('Sending payment request...');
    const response = await fetchWithPayment(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: { movieTitle: MOVIE } }),
    });

    console.log('Status:', response.status);
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    console.log('');
    console.log(response.status === 200 ? 'SUCCESS' : 'FAILED');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
