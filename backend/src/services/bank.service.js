import { query } from "../config/db.js";

export async function getAccountForCustomer(customerId) {
  const { rows } = await query(
    `SELECT a.*
       FROM accounts a
       JOIN customers c ON c.id = a.customer_id
      WHERE c.customer_id = $1`,
    [customerId]
  );
  return rows[0] || null;
}

export async function getMiniStatement(accountId, limit = 5) {
  const { rows } = await query(
    `SELECT *
       FROM transactions
      WHERE account_id = $1
      ORDER BY txn_time DESC
      LIMIT $2`,
    [accountId, limit]
  );
  return rows;
}

export async function getFullStatement(accountId) {
  const { rows } = await query(
    `SELECT *
       FROM transactions
      WHERE account_id = $1
      ORDER BY txn_time DESC`,
    [accountId]
  );
  return rows;
}
