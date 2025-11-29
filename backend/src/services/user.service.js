import bcrypt from "bcrypt";
import { query } from "../config/db.js";

export async function findUserByUsername(username) {
  const { rows } = await query(
    "SELECT * FROM customers WHERE username = $1",
    [username]
  );
  return rows[0] || null;
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
