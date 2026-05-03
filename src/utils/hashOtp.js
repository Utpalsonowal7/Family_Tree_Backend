import crypto from "crypto";

export const hashOtp = (otp) => {
     return crypto.createHash("sha256").update(otp).digest("hex");
};