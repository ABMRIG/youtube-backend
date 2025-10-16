import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler( async (req, res) => {
    // get user details from front-end
    // validation - fields are not empty
    // check if user already exists -> use email, username
    // check for images, check for avatar -> if there are any images to upload and avatar is a required field
    // upload the above to coludinary
    // create user object -> entry created in DB
    // remove password and refresh-token fields from the DB response
    // check for user creation
    // return the response of above



    //handling response that are coming in the Body
    const {fullname, email, username, password} = req.body;
    console.log("fullname: ",fullname);
    console.log("Email: ",email);

    if ([fullname, email, username, password].some((field) => {
        field?.trim === ""
    })){
        throw new ApiError(400, "All fields are required")
    }

    // "User" is from user.model
    const existedUser = User.findOne(
        {
            // if we find either username or email in DB then throw error
            // "$or" checks for the above
            $or: [{ username }, { email }]
        }
    )

    if (existedUser){
        throw new ApiError(409, "User with this email or username already exists in DB");
    }


    // req.body object in Express.js is designed to contain parsed data from the request body, but it cannot directly handle file uploads.
    // To handle file uploads in an Express application, specialized middleware is required. Libraries like Multer or Formidable are commonly used for this purpose.

    // we get ".files" property from multer since data is coming from user.routes.js which contains multer

    // ".avatar[0]" gives us the path of avatar file in storage
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar){
        throw new ApiError(400, "Avatar file is required");
    }

    // now adding the user and user-info to the DB
    const user = await User.create(
        {
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        }
    )

    // we will find the created user on the DB but we won't bring the Password and Refresh Token from the DB while checking if the user is created

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken");

    if (!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully",)
    )

})

export {registerUser};