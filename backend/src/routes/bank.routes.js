import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { getBalance, getMini, getStatement, getFaq } from "../controllers/bank.controller.js";

const router = Router();
router.get("/balance", authRequired, getBalance);
router.get("/mini-statement", authRequired, getMini);
router.get("/statement", authRequired, getStatement);
router.get("/faq", authRequired, getFaq);

export default router;
