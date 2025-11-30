// backend/src/index.js
import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import bankRoutes from "./routes/bank.routes.js";

const app = express();

// --- CORS: allow all origins for demo/portfolio ---
app.use(
  cors({
    origin: "*", // allow any origin
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Preflight
app.options("*", cors());

// --- Body parsing ---
app.use(express.json());

// --- Health check ---
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "C-GPT Banking Backend (Postgres + SMTP)",
  });
});

// --- Routes ---
app.use("/auth", authRoutes);
app.use("/bank", bankRoutes);

// --- Start server ---
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
