import { Router } from "express";
import { saveTree, getTree, imgUpload } from "../controllers/tree.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/save-tree").post(verifyJwt, saveTree); 
router.route("/get-tree").get(verifyJwt, getTree); 
router.route("/upload-img").post(verifyJwt, upload.single("image"), imgUpload); 

export default router;