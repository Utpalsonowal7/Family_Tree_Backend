import { asyncHandler } from "../utils/async_handler.js";
import { ApiResponse } from "../utils/api_response.js";

export const healthCheck = asyncHandler(async (req, res) => {
     const uptime = process.uptime();

     res.status(200).json(new ApiResponse(
          200,
          "Server is running",
          {
               uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,

               current_time: new Date().toISOString()
          }
     ))
});