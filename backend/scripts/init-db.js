// scripts/init-db.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../src/config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    const sqlPath = path.join(__dirname, "..", "sql", "schema.sql");
    const sql = await fs.readFile(sqlPath, "utf8");

    console.log("Running schema.sql against configured Postgres...");
    await pool.query(sql);

    console.log("✅ Database initialized successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to initialize database:");
    console.error(err);
    process.exit(1);
  }
}

main();
