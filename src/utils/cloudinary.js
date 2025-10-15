import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_KEY // Click 'View API Keys' above to copy your API secret
});


const uploadOnCloudinary = async (localFilePath) => {
    try{
        if (!localFilePath) return null
        // if "if statement" doesn't work then below occurs
        const response = await cloudinary.uploader.upload(
            localFilePath, {
                resource_type: "auto"
            }
        )
        console.log("File uploaded to Cloudinary ",response.url);
        // "response.url" gives the cloudinary url of the uploaded file
        return response;
    }
    catch(error){
        fs.unlinkSync(localFilePath);
        // "fs.unlinkSync" removes the file from the server
        return null;
    }
}   

export {uploadOnCloudinary}