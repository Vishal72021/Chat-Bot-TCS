// backend/scripts/reset-user.js
import { pool } from "../src/config/db.js";
import bcrypt from "bcrypt";

async function main() {
  try {
    console.log("🔄 Resetting user: vishal-tripathy");

    // 1️⃣ Delete dependent rows first (transactions → accounts → customers)
    await pool.query(
      `DELETE FROM transactions 
       WHERE account_id IN (
         SELECT id FROM accounts WHERE customer_id IN (
           SELECT id FROM customers
         )
       )`
    );

    await pool.query(`DELETE FROM accounts`);
    await pool.query(`DELETE FROM otps`);
    await pool.query(`DELETE FROM customers`);

    console.log("✅ Old users, accounts, transactions, otps deleted");

    // 2️⃣ Insert your real user
    const username = "vishal-tripathy";
    const plainPassword = "tripathyvishal";
    const email = "tripathyvishal7@gmail.com";
    const phone = "9178332513";
    const name = "Vishal Tripathy";
    const customerId = "CUST001";
    const accountNumber = "ACC123456789";

    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const userRes = await pool.query(
      `
      INSERT INTO customers (customer_id, username, password_hash, name, email, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
      [customerId, username, passwordHash, name, email, phone]
    );

    const customerDbId = userRes.rows[0].id;

    await pool.query(
      `
      INSERT INTO accounts (account_number, customer_id, balance)
      VALUES ($1, $2, $3)
      `,
      [accountNumber, customerDbId, 50000.0]
    );

    console.log("✅ New real user inserted:");
    console.log("   Username:", username);
    console.log("   Email:", email);
    console.log("   Phone:", phone);
    console.log("   Account:", accountNumber);

    console.log("\n🎉 Database reset complete.");
  } catch (err) {
    console.error("❌ Database reset failed:");
    console.error(err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
