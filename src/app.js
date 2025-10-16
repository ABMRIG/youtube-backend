import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//this is our EXPRESS handling file. This will contain the Middlewares

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//this app.use is going to accept json files sent from the user
app.use(express.json({limit:"16kb"}));

//this is going to accept data from places like username, password from forms
//extended property allows nested objects as inputs from users
app.use(express.urlencoded({extended: true, limit: "16kb"}));

//this is going to store files like PDFs, images etc from inputs in the public/temp folder that are available as public assests (accessible by anyone).
app.use(express.static("public"));

// cookieParser inside a server is to handle and manage cookies in incoming HTTP requests easily. It enables the server to read, parse, and access cookie data sent by the client, allowing functionalities like user authentication, session management, personalization, and tracking.
app.use(cookieParser());

// routing for /api/v1/users
import userRouter from "./routes/user.routes.js";

app.use("/api/v1/users", userRouter)    
//userRouter is "router" of user.routes.js

export {app};