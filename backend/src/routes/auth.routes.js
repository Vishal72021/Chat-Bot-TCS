import { Router } from "express";
import { sendOtp, login } from "../controllers/auth.controller.js";

const router = Router();
router.post("/send-otp", sendOtp);
router.post("/login", login);

export default router;
