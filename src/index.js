import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./.env"
})

//this is our server file. we connect to the db from here. We also begin the server listening here

connectDB()
.then(() => {
    app.on("error", (error) => {
        console.log("MongoDB connection Error: ",error);
    })
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is runnign on ${process.env.PORT}`);
    })
})
.catch((error) => {
    console.log("MongoDB connection failed !!! ",error)
})











// const app = express();

// (async () => {
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         //checking if there is any problem while trying to connect to db
//         app.on("error",(error)=>{
//             console.log("ERROR: ",error);
//             throw error
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on ${process.env.PORT}`);
//         })

//     }
//     catch (error){
//         console.log("ERROR: ",error);
//     }
// })

