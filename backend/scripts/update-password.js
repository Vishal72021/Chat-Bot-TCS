// scripts/update-password.js
import { pool } from "../src/config/db.js"; // uses env + SSL from your existing config

// TODO: paste the hash you got from gen-hash.js here:
const newHash = "$2b$10$ooxLnYOpXH2DJe5BfDieiuwkgI8NDr1pEZHkemAKDHLN65.utFLwu";

async function main() {
  try {
    if (!newHash || newHash.includes("PASTE_HASH_HERE")) {
      throw new Error("Please set newHash to the bcrypt hash string first.");
    }

    console.log("Updating password hash for user 'vishal-chat'...");

    const res = await pool.query(
      "UPDATE customers SET password_hash = $1 WHERE username = 'vishal-chat'",
      [newHash]
    );

    console.log("✅ Done. Rows affected:", res.rowCount);
  } catch (err) {
    console.error("❌ Failed to update password:");
    console.error(err);
  } finally {
    // force exit so the script ends cleanly
    process.exit(0);
  }
}

main();
