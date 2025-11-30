// backend/src/index.js
import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import bankRoutes from "./routes/bank.routes.js";

const app = express();

// --- CORS: allow local dev + any future frontend ---
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests from:
      // - your local dev (127.0.0.1 / localhost)
      // - any browser origin (for portfolio demos)
      if (!origin) return callback(null, true); // curl / Postman / same-origin
      return callback(null, true); // <-- allow all origins for now
    },
  })
);

// Preflight
app.options("*", cors());

// JSON parsing
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "C-GPT Banking Backend (Postgres + SMTP)",
  });
});

// Routes
app.use("/auth", authRoutes);
app.use("/bank", bankRoutes);

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
