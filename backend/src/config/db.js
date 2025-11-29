import pkg from "pg";
import { config } from "./env.js";

const { Pool } = pkg;

// Optional SSL toggle via env
const useSSL = process.env.DB_SSL === "true";

export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  ssl: useSSL
    ? {
        rejectUnauthorized: false, // fine for demo; for strict security use a proper cert
      }
    : false,
});

export async function query(text, params) {
  const res = await pool.query(text, params);
  return { rows: res.rows };
}
