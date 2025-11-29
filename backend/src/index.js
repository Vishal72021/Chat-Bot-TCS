import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import bankRoutes from "./routes/bank.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "C-GPT Banking Backend (Postgres)" });
});

app.use("/auth", authRoutes);
app.use("/bank", bankRoutes);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
