import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/api_response.js";
import { asyncHandler } from "../utils/async_handler.js";
import { generateOtp } from "../utils/generateOtp.js";
import { hashOtp } from "../utils/hashOtp.js";
import { sendEmail } from "../services/mail.services.js";
import { OtpEmailTemplate, ResendOtpEmailTemplate } from "../utils/mail.js";
import { generateAccssToken, generateRefreshToken } from "../utils/tokens.js";
import { pool } from "../config/db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshToken = async (user) => {
     try {
          const accessToken = generateAccssToken(user);
          const refreshToken = generateRefreshToken(user);

          await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [refreshToken, user.id]);

          return { accessToken, refreshToken };
     } catch (error) {
          throw new ApiError(
               500,
               "something went wrong while genarating the tokens",
               error
          )
     };
};

const register = asyncHandler(async (req, res) => {
     const { email, password } = req.body;

     if (!email && !password) {
          throw new ApiError(400, "email and password are required");
     };

     const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
     if (existingUser.rowCount > 0) {
          throw new ApiError(409, "User email already exists");
     };

     const otp = generateOtp();
     const hashotp = hashOtp(otp);
     const hashedPassword = await bcrypt.hash(password, 10);
     const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

     let newUser;
     const client = await pool.connect();

     try {
          await client.query("BEGIN");

          newUser = await client.query(
               "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
               [email, hashedPassword]
          );

          await client.query(
               "INSERT INTO otp_verification (user_id, otp, expired_at) VALUES ($1, $2, $3)",
               [newUser.rows[0].id, hashotp, expiresAt]
          );

          await client.query("COMMIT");
     } catch (err) {
          await client.query("ROLLBACK");
          console.log(`❌Something went wrong!: ${err}`);
          throw new ApiError(500, "Failed to register user");
     } finally {
          client.release();
     };

     sendEmail({
          email: newUser.rows[0].email,
          subject: "Your OTP Code for Family Tree App Registration",
          mailgenContent: OtpEmailTemplate(otp),
     });

     return res.status(201).json(
          new ApiResponse(201, { user: newUser.rows[0], msg: "Please check your email for the OTP to verify your account" }, "✅ User registered successfully")
     );
});

const verifyOtp = asyncHandler(async (req, res) => {
     const { user_id, otp } = req.body;

     if (!user_id || !otp) {
          throw new ApiError(400, "user_id and otp are required");
     };

     const otpRecord = await pool.query("SELECT otp, expired_at, is_consumed, attemp FROM otp_verification WHERE user_id = $1", [user_id]);

     if (otpRecord.rowCount === 0) {
          throw new ApiError(404, "otp not found for the user");
     };

     const otpData = otpRecord.rows[0];

     if (otpData.is_consumed) {
          throw new ApiError(400, "OTP has already been verified");
     };

     if (otpData.attemp >= 3) {
          throw new ApiError(429, "Too many failed attempts. Please request a new OTP after some time.");
     };

     if (new Date() > otpData.expired_at) {
          throw new ApiError(400, "OTP has expired");
     };

     const isValidOtp = crypto.timingSafeEqual(Buffer.from(hashOtp(otp)), Buffer.from(otpData.otp));
     if (!isValidOtp) {
          await pool.query("UPDATE otp_verification SET attemp = (attemp + 1) WHERE user_id = $1 RETURNING attemp", [user_id]);

          throw new ApiError(400, "Invalid OTP");
     };

     const client = await pool.connect();
     try {
          await client.query("BEGIN");

          await client.query("UPDATE otp_verification SET is_consumed = true WHERE user_id = $1", [user_id]);

          const isVerified = await client.query("UPDATE users SET is_verified = true WHERE id = $1 RETURNING id, email", [user_id]);

          await client.query("COMMIT");

          return res.status(200).json(
               new ApiResponse(200, { user: isVerified.rows[0] }, "✅ OTP verified successfully")
          );
     } catch (err) {
          await client.query("ROLLBACK");

          console.log(`❌Something went wrong!: ${err}`);
          throw new ApiError(500, "Failed to verify OTP");
     } finally {
          client.release();
     }

});

const resendOtp = asyncHandler(async (req, res) => {
     const { user_id } = req.body;

     if (!user_id) {
          throw new ApiError(400, "user_id is required");
     };

     const userRecord = await pool.query("SELECT id, email FROM users WHERE id = $1", [user_id]);
     if (userRecord.rowCount === 0) {
          throw new ApiError(404, "User not found");
     };

     const resendVerification = await pool.query("SELECT expired_at, is_consumed, attemp FROM otp_verification WHERE user_id = $1", [user_id])

     const storedOtp = resendVerification.rows[0];

     if (storedOtp.is_consumed) {
          throw new ApiError(409, "Otp is already Verified")
     };

     if (storedOtp.expired_at > new Date()) {
          return res.status(200).json(
               new ApiResponse(200, {}, "OTP already sent to your email")
          )
     };

     const otp = generateOtp();
     const otpHash = hashOtp(otp);
     const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

     const reSetOtp = await pool.query("UPDATE otp_verification SET otp = $1, expired_at = $2, attemp = 0 WHERE user_id = $3", [otpHash, expiresAt, user_id]);

     if (reSetOtp.rowCount === 0) {
          throw new ApiError(500, "Something went wrong")
     };

     sendEmail({
          email: userRecord.rows[0].email,
          subject: "Your new OTP Code for Family Tree App",
          mailgenContent: ResendOtpEmailTemplate(otp)
     });

     return res.status(200).json(
          new ApiResponse(200, {}, "Otp Resend Successfully")
     );
});

const logIn = asyncHandler(async (req, res) => {
     const { email, password } = req.body;

     if (!email || !password) {
          throw new ApiError(400, "Both email and password required")
     };

     const query = await pool.query("SELECT id, email, password, is_verified FROM users WHERE email = $1", [email]);
     if (query.rowCount === 0) {
          throw new ApiError(404, "user not found")
     };

     const user = query.rows[0];

     if (!user.is_verified) {
          throw new ApiError(403, "Please verify your email first")
     };

     const isPassValid = await bcrypt.compare(password, user.password);
     if (!isPassValid) {
          throw new ApiError(401, "Invalid credentials!")
     };

     const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user);

     const { password: _, ...userData } = user;

     const options = {
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          sameSite: "none"
     };

     return res
          .status(200)
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", refreshToken, options)
          .json(
               new ApiResponse(
                    200,
                    {
                         data: userData,
                         accessToken,
                         refreshToken
                    },
                    "User logged In successfully"

               )
          );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
     const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
     console.log(refreshToken);
     if (!refreshToken) {
          throw new ApiError(401, "Unauthorized Access")
     };

     try {
          const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

          const query = await pool.query("SELECT id, email, refresh_token FROM users WHERE id = $1", [decodedToken.id]);
          if (query.rowCount === 0) {
               throw new ApiError(401, "Invalid refresh token")
          };

          if (refreshToken !== query.rows[0].refresh_token) {
               throw new ApiError(401, "Expired refresh token")
          };

          const user = query.rows[0];
          const accessToken = generateAccssToken(user);

          const { refresh_token: _, ...dataUser } = user;
          const options = {
               httpOnly: true,
               secure: true
          };

          return res
               .status(200)
               .cookie("accessToken", accessToken, options)
               .json(
                    new ApiResponse(
                         200,
                         {
                              data: dataUser,
                              accessToken,
                         },
                         "Access Token Refresh Successfully"
                    )
               );
     } catch (err) {
          if (err instanceof ApiError) {
               next(err);
          } else {
               next(new ApiError(401, "Invalid Refresh Token"));
          }
     }
});

const getCurrentUser = asyncHandler(async (req, res) => {
     const userData = req.user;

     return res.status(200).json(
          new ApiResponse(
               200,
               {
                    id: userData.id,
                    email: userData.email
               },
               "✅ User fetch Successfully"
          )
     );
});

const logOut = asyncHandler(async (req, res) => {
     await pool.query("UPDATE users SET refresh_token = NULL WHERE id = $1", [req.user.id]);

     const options = {
          httpOnly: true,
          secure: true
     };

     return res.status(200)
          .clearCookie("accessToken", options)
          .clearCookie("refreshToken", options)
          .json(
               new ApiResponse(
                    200,
                    "✅ User log out successfully"
               )
          );

});

export { register, verifyOtp, resendOtp, logIn, refreshAccessToken, getCurrentUser, logOut };