import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import {
  findUserByUsername,
  verifyPassword,
} from "../services/user.service.js";
import {
  createOtp,
  verifyOtp,
  sendEmailOtp,
  sendPhoneOtp,
} from "../services/otp.service.js";

// POST /auth/send-otp
export async function sendOtp(req, res) {
  try {
    const { method, email, phone } = req.body;

    let contact, type;

    if (method === "email") {
      if (!email) return res.status(400).json({ error: "Email is required" });
      contact = email;
      type = "email";
    } else if (method === "phone") {
      if (!phone) return res.status(400).json({ error: "Phone is required" });
      contact = phone;
      type = "phone";
    } else {
      return res.status(400).json({ error: "Invalid method" });
    }

    const otp = await createOtp(contact, type);

    try {
      if (type === "email") {
        await sendEmailOtp(contact, otp);
      } else {
        await sendPhoneOtp(contact, otp);
      }
    } catch (deliverErr) {
      console.error("OTP delivery failed:", deliverErr);
      return res
        .status(500)
        .json({ error: "OTP generated but email delivery failed" });
    }

    return res.json({ ok: true, via: type });
  } catch (err) {
    console.error("sendOtp error:", err);
    return res
      .status(500)
      .json({ error: "Failed to send OTP: " + err.message });
  }
}

export async function login(req, res) {
  try {
    const { username, password, method, email, phone, otp } = req.body;

    const user = await findUserByUsername(username);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const passOk = await verifyPassword(password, user.password_hash);
    if (!passOk) return res.status(401).json({ error: "Invalid credentials" });

    let contact, type;

    if (method === "email") {
      if (email !== user.email)
        return res.status(401).json({ error: "Email mismatch" });
      contact = email;
      type = "email";
    } else {
      if (phone !== user.phone)
        return res.status(401).json({ error: "Phone mismatch" });
      contact = phone;
      type = "phone";
    }

    const otpOk = await verifyOtp(contact, type, otp);
    if (!otpOk) return res.status(401).json({ error: "Invalid OTP" });

    const token = jwt.sign(
      { customerId: user.customer_id, username: user.username },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      token,
      user: {
        customerId: user.customer_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Login failed" });
  }
}
