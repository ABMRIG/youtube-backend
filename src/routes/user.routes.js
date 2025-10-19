import { registerUser } from "../controllers/user.controller.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js"

const router = Router()
router.route("/register").post(
    //".fields" is provided by multer even though we created multer.middleware.js. It's a multer thing
    upload.fields([
            {
                name: "avatar",
                maxCount: 1
            },
            {
                name: "coverImage",
                maxCount: 1
            }
        ]
    ),
    registerUser
);
// when request comes from /api/v1/users it is redirected to /api/v1/users/register thus control is transfarred to user.controller.js (registerUser);
// router.route("/login").post(login);
// console.log("Router", router);
export default router;