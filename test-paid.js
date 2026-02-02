// 不导入 dotenv，直接用命令行参数
import { wrapFetchWithPayment, createSigner } from "x402-fetch";

const PRIVATE_KEY = process.argv[2];
const MOVIE = process.argv[3] || "La La Land";

if (!PRIVATE_KEY || PRIVATE_KEY.length < 60) {
  console.error("用法: node test-paid.js <私钥> <电影名>");
  console.error("私钥: 64个十六进制字符，可选带0x前缀");
  process.exit(1);
}

// 去掉 0x 前缀
const cleanKey = PRIVATE_KEY.replace(/^0x/, '');

console.log("🔑 私钥长度:", cleanKey.length);
console.log("🎬 电影:", MOVIE);

const signer = await createSigner("base", cleanKey);
console.log("👛 支付钱包:", signer.address);
console.log("");

const fetchWithPayment = wrapFetchWithPayment(fetch, signer);

console.log("💸 发送支付...");
const response = await fetchWithPayment(
  "https://moviememo-production.up.railway.app/entrypoints/soundtrack-list/invoke",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: { movieTitle: MOVIE } })
  }
);

console.log("📊 状态:", response.status);
const data = await response.json();
console.log("📦", JSON.stringify(data, null, 2));
