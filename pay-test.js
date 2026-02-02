import { config } from "dotenv";
import { wrapFetchWithPayment, createSigner, decodeXPaymentResponse } from "x402-fetch";

config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const AGENT_URL = process.env.AGENT_URL || "https://moviememo-production.up.railway.app";
const ENDPOINT = process.env.ENDPOINT || "/entrypoints/soundtrack-list/invoke";
const MOVIE = process.env.MOVIE || "Inception";

if (!PRIVATE_KEY) {
  console.error("❌ 需要设置 PRIVATE_KEY 环境变量");
  console.error("示例: PRIVATE_KEY=你的钱包私钥 node pay-test.js");
  process.exit(1);
}

async function main() {
  const url = `${AGENT_URL}${ENDPOINT}`;
  console.log(`🎬 测试电影: ${MOVIE}`);
  console.log(`🔗 URL: ${url}\n`);

  try {
    console.log("🔄 正在连接钱包...");
    const signer = await createSigner("base", PRIVATE_KEY);
    console.log(`✅ 钱包: ${signer.address}\n`);

    console.log("💸 正在发送支付请求...");
    const fetchWithPayment = wrapFetchWithPayment(fetch, signer);

    const response = await fetchWithPayment(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: { movieTitle: MOVIE } })
    });

    const data = await response.json();
    console.log("\n📦 === 响应数据 ===");
    console.log(JSON.stringify(data, null, 2));

    if (response.headers.get("x-payment-response")) {
      const receipt = decodeXPaymentResponse(response.headers.get("x-payment-response"));
      console.log("\n💳 === 支付凭证 ===");
      console.log(JSON.stringify(receipt, null, 2));
    }

    console.log("\n✅ 测试完成！");
  } catch (error: any) {
    console.error("\n❌ 错误:", error?.response?.data?.error || error.message || error);
    process.exit(1);
  }
}

main();
