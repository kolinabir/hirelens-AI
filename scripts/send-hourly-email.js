// Simple script to trigger the hourly email sender endpoint
// Usage: npm run send-hourly

const url =
  process.env.EMAIL_SENDER_URL || "http://localhost:3000/api/email/send-hourly";

async function main() {
  try {
    const res = await fetch(url, { method: "POST" });
    const json = await res.json();
    console.log("send-hourly result:", json);
  } catch (err) {
    console.error("send-hourly error:", err);
    process.exit(1);
  }
}

main();
