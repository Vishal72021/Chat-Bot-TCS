import {
  getAccountForCustomer,
  getMiniStatement,
  getFullStatement
} from "../services/bank.service.js";

export async function getBalance(req, res) {
  try {
    const account = await getAccountForCustomer(req.user.customerId);
    if (!account) return res.status(404).json({ error: "Account not found" });

    return res.json({
      accountNumber: account.account_number,
      balance: account.balance,
      currency: account.currency
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch balance" });
  }
}

export async function getMini(req, res) {
  try {
    const account = await getAccountForCustomer(req.user.customerId);
    if (!account) return res.status(404).json({ error: "Account not found" });

    const txns = await getMiniStatement(account.id, 5);
    return res.json(txns);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch mini statement" });
  }
}

export async function getStatement(req, res) {
  try {
    const account = await getAccountForCustomer(req.user.customerId);
    if (!account) return res.status(404).json({ error: "Account not found" });

    const txns = await getFullStatement(account.id);
    return res.json(txns);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch account statement" });
  }
}

export async function getFaq(req, res) {
  res.json({
    items: [
      { q: "Is this a real bank?", a: "No, this is a demo system." },
      { q: "Is OTP secure?", a: "In demo mode, OTP is logged to the console." }
    ]
  });
}
