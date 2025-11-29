import { query } from "../config/db.js";

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createOtp(contact, contactType) {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await query(
    `INSERT INTO otps (contact, contact_type, otp_code, expires_at, used)
     VALUES ($1, $2, $3, $4, false)`,
    [contact, contactType, otp, expiresAt]
  );

  console.log("OTP (Demo):", otp);
  return otp;
}

export async function verifyOtp(contact, contactType, otp) {
  const { rows } = await query(
    `SELECT * FROM otps
      WHERE contact = $1
        AND contact_type = $2
        AND otp_code = $3
        AND used = false
        AND expires_at > now()
      ORDER BY created_at DESC
      LIMIT 1`,
    [contact, contactType, otp]
  );

  const record = rows[0];
  if (!record) return false;

  await query("UPDATE otps SET used = true WHERE id = $1", [record.id]);
  return true;
}
