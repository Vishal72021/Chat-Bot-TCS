import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 4000,

  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "10m",
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || "C-GPT Bank <no-reply@example.com>",
    secure: process.env.SMTP_SECURE === "true", // true for port 465, false for 587
  },
};
