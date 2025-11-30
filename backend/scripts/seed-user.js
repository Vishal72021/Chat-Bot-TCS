// backend/scripts/seed-user.js
import { pool } from "../src/config/db.js";
import bcrypt from "bcrypt";

async function main() {
  try {
    const username = "vishal-tripathy";
    const plainPassword = "tripathyvishal";
    const email = "tripathyvishal7@gmail.com";
    const phone = "9178332513";
    const name = "Vishal Tripathy";
    const customerId = "CUST001";
    const accountNumber = "ACC123456789";

    const hash = await bcrypt.hash(plainPassword, 10);

    // 1️⃣ Insert customer
    const userRes = await pool.query(
      `
      INSERT INTO customers (customer_id, username, password_hash, name, email, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (username) DO NOTHING
      RETURNING id
      `,
      [customerId, username, hash, name, email, phone]
    );

    let customerDbId;

    if (userRes.rows.length > 0) {
      customerDbId = userRes.rows[0].id;
      console.log("✅ User inserted with id:", customerDbId);
    } else {
      // user already exists → fetch id
      const existing = await pool.query(
        "SELECT id FROM customers WHERE username = $1",
        [username]
      );
      customerDbId = existing.rows[0].id;
      console.log("ℹ️ User already exists with id:", customerDbId);
    }

    // 2️⃣ Insert account
    await pool.query(
      `
      INSERT INTO accounts (account_number, customer_id, balance)
      VALUES ($1, $2, 52340.75)
      ON CONFLICT (account_number) DO NOTHING
      `,
      [accountNumber, customerDbId]
    );

    console.log("✅ Account ensured");

    console.log("🎉 Demo user + account ready for testing!");
  } catch (err) {
    console.error("❌ Seeding failed:");
    console.error(err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
