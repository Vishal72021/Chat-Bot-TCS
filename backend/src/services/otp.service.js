import { query } from "../config/db.js";
import { config } from "../config/env.js";
import nodemailer from "nodemailer";

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// --- create / verify OTP in DB ---

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

  const record = rows[0];
  if (!record) return false;

  await query("UPDATE otps SET used = true WHERE id = $1", [record.id]);
  return true;
}

// --- Email / SMS sending ---

// Create transporter only if SMTP is configured
let transporter = null;
if (config.smtp.host && config.smtp.user && config.smtp.pass) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465, // true for 465, false for 587
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
}

export async function sendEmailOtp(email, otp) {
  if (!transporter) {
    console.log(
      `[EMAIL OTP DEMO] Would send ${otp} to ${email} (SMTP not configured)`
    );
    return;
  }

  await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: "Your C-GPT Bank OTP",
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    html: `<p>Your OTP is <b>${otp}</b>. It is valid for 5 minutes.</p>`,
  });
}

export async function sendPhoneOtp(phone, otp) {
  // Still demo: integrate with Twilio/SMS later if you want real SMS.
  console.log(`[PHONE OTP DEMO] Send ${otp} to ${phone}`);
}
