import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

// function to generate Refresh and Access tokens

const generateAccessAndRefreshTokens = async (userId) => {
    try{
        const user = await User.findById(userId);
        const accessToken = user.genarateAccessToken();
        const refreshToken = user.genarateRefreshToken();

        user.refreshToken = refreshToken;
        // although we have provided the token we still need to save/push the changes in the DB so we do the following:
        await user.save({validateBeforeSave: false});
        // validateBeforeSave is needed bcs it prevents the requirement of passing fields like password, email, username etc here which are required field.
        return { accessToken, refreshToken };

    }
    catch(error){
        throw new ApiError(500, "Something went wrong while generating Access and Refresh Tokens");
    }
}

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
    // console.log("fullname: ",fullname);
    // console.log("Email: ",email);

    if ([fullname, email, username, password].some((field) => {
        field?.trim === ""
    })){
        throw new ApiError(400, "All fields are required")
    }

    // "User" is from user.model
    const existedUser = await User.findOne(
        {
            // if we find either username or email in DB then throw error
            // "$or" checks for the above
            $or: [{ username }, { email }]
        }
    )
    // console.log("existedUSer: ", existedUser);
    if (existedUser){
        throw new ApiError(409, "User with this email or username already exists in DB");
    }


    // req.body object in Express.js is designed to contain parsed data from the request body, but it cannot directly handle file uploads.
    // To handle file uploads in an Express application, specialized middleware is required. Libraries like Multer or Formidable are commonly used for this purpose.

    // we get ".files" property from multer since data is coming from user.routes.js which contains multer

    // ".avatar[0]" gives us the path of avatar file in storage
    const avatarLocalPath = req.files?.avatar[0]?.path
    
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    const coverImageLocalPath = req.files?.coverImage ? req.files.coverImage[0].path : null

    
    // console.log("avatarLocalPath: ", avatarLocalPath)

    if (!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // console.log("Avatar: ", avatar);

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
    
    // we will find the created user on the DB but we won't bring the Password and Refresh Token from the DB while checking if the user is created so we write the select statement according to that

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken");

    if (!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully",)
    )
})

// Login user
const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // get username or email from user
    // find the user
    // password check
    // access and refresh token checked
    // send cookie


    //object destructuring:
    const { email, username, password } = req.body;

    if (!email && !username){
        throw new ApiError(404, "username or email is required");
    }

    const user = await User.findOne(
        {
            $or: [{username}, {email}]
        }
    )

    if (!user){
        throw new ApiError(404, "User does not exist");
    }

    //from "User" we get properties of Mongoose and using "user" we get properties from "user.model.js" i.e. the matched user
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id); // we get this user._id from "const user"

    // we need to fetch "user" again bcs the current "const user" doesn't have the refreshToken field but the DB has already been updated to have that field. So when we fetch "user" again we get the latest user details that contains refreshToken field
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken") //we didn't bring password and refreshToken so that we don't send these to the frontend/(to the user)

    // We could have updated the old user obj by adding the refreshToken field to avoid contacting the DB


    // options is a setting of our cookies so that they are viewable but not modifiable by the user/client
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken,
                refreshToken
            },
            "User logged in Successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    // we need to remove cookies of user
    // we need to remove refreshTokwn of user from DB


    // in "loginUser" we were able to identify user bcs we took email/username, password from the user so we got "user._id" but in the case of logoutUser we don't get that from user bcs we can't use a logout form to logout the user else if we give form then user can logout other users too 

    await User.findByIdAndUpdate(
        req.user._id,
        {   
            // using "$set" we set the refreshToken as undefined which indicates user is logged out 
            $set: {
                refreshToken: undefined
            }
        },
        // the { new: true } option for findByIdAndUpdate() tells the query to return the modified document rather than the original otherwise mongodb would return the old document
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }  

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))

})




export { registerUser, loginUser, logoutUser };