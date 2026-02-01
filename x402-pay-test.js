import { config } from "dotenv";
import { decodeXPaymentResponse, wrapFetchWithPayment, createSigner } from "x402-fetch";

config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const AGENT_URL = process.env.AGENT_URL || "https://moviememo-production.up.railway.app";

// Supported endpoints:
// - /entrypoints/soundtrack-list/invoke (0.01 USDC)
// - /entrypoints/filming-location/invoke (0.01 USDC)
// - /entrypoints/easter-egg-guide/invoke (0.01 USDC)

const ENDPOINT_PATH = process.env.ENDPOINT_PATH || "/entrypoints/soundtrack-list/invoke";
const MOVIE_TITLE = process.env.MOVIE_TITLE || "Inception";

async function main() {
  if (!PRIVATE_KEY) {
    console.error("❌ 请设置 PRIVATE_KEY 环境变量");
    console.error("示例: PRIVATE_KEY=your_wallet_private_key node x402-pay-test.js");
    process.exit(1);
  }

  const url = `${AGENT_URL}${ENDPOINT_PATH}`;
  console.log(`🔗 请求 URL: ${url}`);
  console.log(`🎬 电影: ${MOVIE_TITLE}\n`);

  try {
    console.log("🔄 正在连接钱包...");
    const signer = await createSigner("base", PRIVATE_KEY);
    console.log(`✅ 钱包连接成功，地址: ${signer.address}\n`);

    console.log("💸 正在发送支付请求 (x402)...");
    const fetchWithPayment = wrapFetchWithPayment(fetch, signer);

    const response = await fetchWithPayment(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: { movieTitle: MOVIE_TITLE } })
    });

    const data = await response.json();
    console.log("\n🎬 === 响应数据 ===");
    console.log(JSON.stringify(data, null, 2));

    const receipt = decodeXPaymentResponse(response.headers.get("x-payment-response"));
    console.log("\n💳 === 支付凭证 ===");
    console.log(JSON.stringify(receipt, null, 2));

    console.log("\n✨ 支付成功！");
  } catch (error) {
    console.error("❌ 错误:", error?.response?.data?.error || error);
    process.exit(1);
  }
}

main();
