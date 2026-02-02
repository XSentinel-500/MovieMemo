import { wrapFetchWithPayment, createSigner } from "x402-fetch";

const PRIVATE_KEY = process.argv[2];
const MOVIE = process.argv[3] || "La La Land";

if (!PRIVATE_KEY || PRIVATE_KEY.length !== 64) {
  console.error("命令: node test-paid.js <64字符私钥> <电影名>");
  console.error("私钥格式: 64个十六进制字符，不带0x前缀");
  process.exit(1);
}

async function main() {
  const signer = await createSigner("base", PRIVATE_KEY);
  console.log("👛 钱包:", signer.address);
  console.log("🎬 电影:", MOVIE);
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
  
  const data = await response.json();
  console.log("📦 数据:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
