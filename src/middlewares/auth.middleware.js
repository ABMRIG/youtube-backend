import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

// using this we are able to verify the user using AccessTokens
export const verifyJWT = asyncHandler(async (req, resizeBy, next) => {
    try {
        // checking if server is receiving req.cookies or headers that contain "Authorization" token
        // we are able to access cookies because we have written app.use(cookieParser()) middleware in app.js
        // in mobile devices which don't store cookies we might get access token from "header" so we user "header() method"
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
    
        if (!token){
            throw new ApiError(401, "Unauthorized request");
        }
    
    // in "user.model.js" we inserted fields like _id, email etc using jwt.sign and so we can extract them using jwt.verify
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user){
            throw new ApiError(401, "Invalid Access Token");
        }
    
        // adding our user to the req object
        // we will not return a response, we just add the user to the request and let it go forward
        // adding a new user property to the existing req (request) object
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access Token");
    }
})