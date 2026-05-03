import { ApiError } from "../utils/api_error.js";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" })

export const errHandler = (err, req, res, next) => {
     let error = err;

     if (!(error instanceof ApiError)) {
          const statusCode = error?.statusCode || 500;

          const messsage = error.message || "Something Went Wrong";
          error = new ApiError(statusCode, messsage, error?.errors || [], error.stack)
     }

     const response = {
          ...error,
          message: error.message,
          ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {})
     }

     return res.status(error?.statusCode).json(response)
}