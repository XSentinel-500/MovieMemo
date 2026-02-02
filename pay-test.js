/**
 * Buyer-side payment test script for MovieMemo x402 endpoints
 * 
 * Usage:
 *   AGENT_URL="http://localhost:8787" \
 *   ENDPOINT="/entrypoints/filming-location/invoke" \
 *   MOVIE="La La Land" \
 *   PRIVATE_KEY="0xBUYER_PRIVATE_KEY" \
 *   node pay-test.js
 * 
 * Environment variables:
 *   AGENT_URL - Agent server URL (default: http://localhost:8787)
 *   ENDPOINT - Endpoint path (e.g., /entrypoints/filming-location/invoke)
 *   MOVIE - Movie title to query
 *   PRIVATE_KEY - Buyer wallet private key (0x-prefixed)
 */

import { wrapFetchWithPayment, createSigner } from "x402-fetch";

// Configuration from environment
const AGENT_URL = process.env.AGENT_URL || 'http://localhost:8787';
const ENDPOINT = process.env.ENDPOINT || '/entrypoints/filming-location/invoke';
const MOVIE = process.env.MOVIE || 'La La Land';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('Error: PRIVATE_KEY environment variable is required');
  console.error('Usage:');
  console.error('  AGENT_URL="http://localhost:8787" \\');
  console.error('  ENDPOINT="/entrypoints/filming-location/invoke" \\');
  console.error('  MOVIE="La La Land" \\');
  console.error('  PRIVATE_KEY="0xBUYER_PRIVATE_KEY" \\');
  console.error('  node pay-test.js');
  process.exit(1);
}

// Normalize private key (add 0x if missing)
const normalizedKey = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : '0x' + PRIVATE_KEY;

async function main() {
  console.log('MovieMemo x402 Payment Test');
  console.log('===========================');
  console.log('Agent URL:', AGENT_URL);
  console.log('Endpoint:', ENDPOINT);
  console.log('Movie:', MOVIE);
  console.log('');

  try {
    // Create signer from private key
    const signer = await createSigner('base', normalizedKey);
    console.log('Buyer wallet:', signer.address);
    console.log('');

    // Create payment-enabled fetch
    const fetchWithPayment = wrapFetchWithPayment(fetch, signer);

    // Build request URL
    const url = `${AGENT_URL}${ENDPOINT}`;
    console.log('Sending payment request to:', url);
    console.log('');

    // Send request with payment
    const startTime = Date.now();
    const response = await fetchWithPayment(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { movieTitle: MOVIE },
      }),
    });
    const elapsed = Date.now() - startTime;

    console.log('Response status:', response.status);
    console.log('Time taken:', elapsed + 'ms');
    console.log('');

    // Parse response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      // Check for x402 payment response header
      const paymentResponse = response.headers.get('x-payment-response');
      if (paymentResponse) {
        console.log('Payment response received: YES');
        try {
          const paymentData = JSON.parse(Buffer.from(paymentResponse, 'base64').toString());
          console.log('Payment receipt:');
          console.log(JSON.stringify(paymentData, null, 2));
        } catch (e) {
          console.log('Could not parse payment response');
        }
      } else {
        console.log('Payment response received: NO');
      }

      console.log('');
      console.log('Response data:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('Non-JSON response:', await response.text());
    }

    console.log('');
    console.log('Test', response.status === 200 ? 'PASSED' : 'FAILED');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
