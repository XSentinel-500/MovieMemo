import { wrapFetchWithPayment, createSigner } from "x402-fetch";

// 从命令行参数读取私钥，不是 .env
const PRIVATE_KEY = process.argv[2];
const MOVIE = process.argv[3] || "La La Land";

if (!PRIVATE_KEY || PRIVATE_KEY.length < 60) {
  console.error("❌ 错误: 需要提供私钥");
  console.error("");
  console.error("命令: node test-paid.js <私钥> <电影名>");
  console.error("");
  console.error("私钥格式: 64个十六进制字符，可选带0x前缀");
  console.error("示例: node test-paid.js a26f7be...f5 'La La Land'");
  console.error("");
  console.error("注意: 这是你要付款的钱包私钥，不是 Agent 的收款钱包！");
  process.exit(1);
}

// 去掉 0x 前缀（如果有）
const cleanPrivateKey = PRIVATE_KEY.replace(/^0x/, '');

async function main() {
  console.log("🔑 私钥长度:", cleanPrivateKey.length, "字符");
  console.log("🎬 电影:", MOVIE);
  console.log("");
  
  const signer = await createSigner("base", cleanPrivateKey);
  console.log("👛 支付钱包:", signer.address);
  console.log("");

  const fetchWithPayment = wrapFetchWithPayment(fetch, signer);
  
  console.log("💸 发送支付请求...");
  const response = await fetchWithPayment(
    "https://moviememo-production.up.railway.app/entrypoints/soundtrack-list/invoke",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: { movieTitle: MOVIE } })
    }
  );

  console.log("📊 HTTP 状态:", response.status);
  console.log("💳 支付响应:", response.headers.get("x-payment-response") ? "有" : "无");
  console.log("");
  
  const data = await response.json();
  console.log("📦 返回数据:");
  console.log(JSON.stringify(data, null, 2));
}

main().catch(err => {
  console.error("❌ 错误:", err.message);
  process.exit(1);
});
