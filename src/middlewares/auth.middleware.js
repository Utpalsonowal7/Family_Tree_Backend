import jwt from "jsonwebtoken";
import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/api_response.js";
import { asyncHandler } from "../utils/async_handler.js";
import { pool } from "../config/db.js";

export const verifyJwt = asyncHandler(async (req, res, next) => {
     const token = req.cookies?.accessToken || req.headers["authorization"]?.replace("Bearer ", "");
  
     if (!token) {
          throw new ApiError(401, "Unauthorized access")
     };

     try {
          const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

          const query = await pool.query("SELECT id, email FROM users WHERE id = $1", [decodedToken.id]);
          if (query.rowCount === 0) {
               throw new ApiError(401, "Invalid token")
          };

          req.user = query.rows[0];
          next();
     } catch (error) {
          throw new ApiError(401, "Invalid access token")
     };
});