import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/api_response.js";
import { pool } from "../config/db.js";

const saveTree = asyncHandler(async (req, res) => {
     const { name = "familyTree", nodes, conns, childGroups, siblingGroups, scale, ox, oy } = req.body;
     const user_id = req.user.id;


     await pool.query(
          `
     INSERT INTO family_trees (user_id, name, data)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id)
     DO UPDATE SET
          name = EXCLUDED.name,
          data = EXCLUDED.data,
          updated_at = NOW()
     `,
          [
               user_id,
               name,
               JSON.stringify({
                    nodes,
                    conns,
                    childGroups,
                    siblingGroups,
                    scale,
                    ox,
                    oy,
               }),
          ]
     );

     return res.status(200).json(new ApiResponse(200, {}, "Tree saved"));
});

const getTree = asyncHandler(async (req, res) => {

     const result = await pool.query(
          "SELECT user_id, name, data FROM family_trees WHERE user_id = $1",
          [req.user.id]
     );

     if (result.rowCount === 0) {
          return res.status(200).json(new ApiResponse(200, null, "No tree found"));
     }

     return res.status(200).json(
          new ApiResponse(
               200,
               {
                    id: result.rows[0].user_id,
                    name: result.rows[0].name,
                    data: result.rows[0].data
               },
               "Tree loaded"));
});

const imgUpload = asyncHandler(async (req, res) => {
     if (!req.file) {
       throw new ApiError(400, "No file provided")
     };

     return res.status(201).json(
          new ApiResponse(
               201,
               {
                    img: `${process.env.SERVER_URL}/images/${req.file.filename}`
               },
               "Image upload to server storage"
          )
     );

});

export { saveTree, getTree, imgUpload };