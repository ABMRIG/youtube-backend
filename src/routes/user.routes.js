import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

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


router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken)

export default router;