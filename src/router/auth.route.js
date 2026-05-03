import { Router } from "express";
import { register, verifyOtp, resendOtp, logIn, refreshAccessToken, getCurrentUser, logOut } from "../controllers/auth.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
     
const router = Router();

router.route("/register").post(register);
router.route("/verify-otp").post(verifyOtp);
router.route("/resend-otp").post(resendOtp);
router.route("/login").post(logIn);
router.route("/refresh-token").get(refreshAccessToken)
router.route("/current_user").get(verifyJwt, getCurrentUser);
router.route("/logout").post(verifyJwt, logOut);

export default router;