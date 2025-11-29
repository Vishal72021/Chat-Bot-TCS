// scripts/check-user.js
import { pool } from "../src/config/db.js";

async function main() {
  try {
    const res = await pool.query(
      "SELECT username, email, phone FROM customers WHERE username = 'vishal-chat'"
    );
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
