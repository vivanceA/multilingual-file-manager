import { Router } from "express";
import * as userAuthController from "../controllers/user-auth.js";

const router = Router();

router.post("/login", userAuthController.login);
router.post("/register", userAuthController.register); // Add this if you have a registration route

export default router;