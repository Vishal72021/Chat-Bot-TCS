// backend/src/services/otp.service.js
import { query } from "../config/db.js";
import { config } from "../config/env.js";
import sgMail from "@sendgrid/mail";

// -----------------------------
// UTIL: Generate 6-digit OTP
// -----------------------------
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
// SEND EMAIL OTP (SENDGRID API)
// -----------------------------
let sendgridInitialized = false;

function initSendGrid() {
  if (sendgridInitialized) return;

  if (!config.sendgrid?.apiKey) {
    throw new Error("SendGrid API key not configured in environment variables");
  }

  sgMail.setApiKey(config.sendgrid.apiKey);
  sendgridInitialized = true;
}

export async function sendEmailOtp(email, otp) {
  try {
    initSendGrid();

    const from = config.sendgrid.from;

    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: "CGPT Bank",
      },
      subject: "Your C-GPT Banking OTP",
      text: `Your C-GPT banking OTP is ${otp}. It is valid for 5 minutes. Do not share it with anyone.`,
      html: `
        <div style="font-family: system-ui, sans-serif, Arial; font-size: 14px; color:#1f2933;">
          <div style="margin-bottom: 12px;">Hi,</div>

          <div>Your C-GPT Banking one-time password (OTP) is:</div>

          <div style="margin-top: 16px; padding: 16px 20px; border-radius: 8px; background-color: #fef2f2; border: 1px solid #fecaca;">
            <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #b91c1c; margin-bottom: 8px;">
              Your OTP
            </div>
            <div style="font-size: 22px; font-weight: 600; color: #b91c1c;">
              ${otp}
            </div>
          </div>

          <div style="margin-top: 16px; font-size: 13px; line-height: 1.5;">
            This code is valid for <strong>5 minutes</strong>. For your security, do not share this code with anyone.
          </div>

          <div style="margin-top: 24px; font-size: 12px; color:#9ca3af;">
            If you did not request this code, you can safely ignore this email.
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);
    console.log(`✅ Email OTP sent via SendGrid API to ${email}`);
  } catch (err) {
    console.error(
      "❌ SendGrid OTP send failed:",
      err.response?.body || err.message
    );
    throw err;
  }
}

// -----------------------------
// SEND PHONE OTP (DEMO MODE)
// -----------------------------
export async function sendPhoneOtp(phone, otp) {
  // Real-world: integrate Twilio, AWS SNS, etc.
  console.log(`[PHONE OTP - DEMO ONLY] ${phone} => ${otp}`);
}
