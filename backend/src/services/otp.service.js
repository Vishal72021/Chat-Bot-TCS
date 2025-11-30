import fetch from "node-fetch";
import { query } from "../config/db.js";
import { config } from "../config/env.js";

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// -----------------------------
// CREATE + STORE OTP
// -----------------------------
export async function createOtp(contact, contactType) {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await query(
    `INSERT INTO otps (contact, contact_type, otp_code, expires_at, used)
     VALUES ($1, $2, $3, $4, false)`,
    [contact, contactType, otp, expiresAt]
  );

  return otp;
}

// -----------------------------
// VERIFY OTP
// -----------------------------
export async function verifyOtp(contact, contactType, otp) {
  const { rows } = await query(
    `SELECT *
       FROM otps
      WHERE contact = $1
        AND contact_type = $2
        AND otp_code = $3
        AND used = false
        AND expires_at > now()
      ORDER BY created_at DESC
      LIMIT 1`,
    [contact, contactType, otp]
  );

  if (!rows.length) return false;

  await query(`UPDATE otps SET used = true WHERE id = $1`, [rows[0].id]);
  return true;
}

// -----------------------------
// SEND EMAIL VIA EMAILJS
// -----------------------------
export async function sendEmailOtp(email, otp) {
  const { serviceId, templateId, publicKey, privateKey } = config.emailjs;

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    throw new Error("EmailJS is not configured in environment variables");
  }

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey,
    template_params: {
      to_email: email,
      otp: otp,
    },
  };

  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("EmailJS failed: " + text);
  }

  console.log(`✅ Email OTP sent to ${email}`);
}

// -----------------------------
// PHONE OTP (UNCHANGED - LOG MODE)
// -----------------------------
export async function sendPhoneOtp(phone, otp) {
  console.log(`[PHONE OTP] ${phone} => ${otp}`);
}
