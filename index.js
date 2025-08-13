import fetch from "node-fetch";
import { Redis } from "@upstash/redis";
import { Resend } from "resend";

// Load environment variables
const {
  RESEND_API_KEY,
  CRON_SECRET,
  KV_URL,
  KV_REST_API_TOKEN
} = process.env;

// Redis KV store
const redis = new Redis({
  url: KV_URL,
  token: KV_REST_API_TOKEN
});

// Resend email
const resend = new Resend(RESEND_API_KEY);

// User to track (replace with actual username)
const username = "elonmusk"; // Example

async function checkYaps() {
  console.log(`🔍 Checking Yaps for ${username}...`);

  const res = await fetch(`https://api.kaito.ai/api/v1/yaps?username=${username}`);
  const data = await res.json();

  if (!Array.isArray(data) || data.length === 0) {
    console.log("⚠️ No Yaps found.");
    return;
  }

  const latestYap = data[0];
  const lastYapId = await redis.get("lastYapId");

  if (lastYapId !== latestYap.id) {
    console.log("📢 New Yap detected!");
    await redis.set("lastYapId", latestYap.id);

    await resend.emails.send({
      from: "notifications@resend.dev",
      to: "your-email@example.com", // for testing
      subject: "Kaito Yap Updated",
      html: `<p>New Yap from ${username}:</p><p>${latestYap.text}</p>`
    });

    console.log("✅ Email sent.");
  } else {
    console.log("✅ No changes.");
  }
}

checkYaps();
