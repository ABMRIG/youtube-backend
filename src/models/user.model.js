import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String, // cloudinary url
            required: true,
        },
        coverImage: {
            type: String, // cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
        password: {
            type: String,
            required: [true, "Password is required!"],
        },
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

/*You use userSchema.pre('save', ...) to define a piece of middleware logic. This code tells Mongoose, "Before you execute any save() operation on a document created from this schema, run this function first".

Use the Model: Whenever you call the .save() method on an instance of the User model, Mongoose consults the schema for any registered middleware. It finds the pre('save') hook and executes your password-hashing function automatically before saving the document to the database.*/

// Also we used Async since Hashing would take time
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// When user submits password it will not match the hashed password so we need to convert it into the hashed password so that user can be authenticated
userSchema.methods.isPasswordCorrect = async function (password) {
    // "password" is the password provided while user tries to login & "this.password" is the password present in the db (encrypted one)

    // bcrypt looks at this.password and extracts the salt and hashes the password using that salt and then comapres them. Returns in boolean
    return await bcrypt.compare(password, this.password);
};

//JWT stands for JSON Web Token, which is an open, industry-standard (RFC 7519) for securely transmitting information between two parties as a compact and self-contained JSON object. It is commonly used for authentication and authorization because it can be digitally signed to verify its authenticity and integrity. A JWT consists of three parts—a header, a payload (claims), and a signature—separated by dots, such as xxxxx.yyyyy.zzzzz
//Used to verify the sender's identity and ensure that the token has not been altered.

userSchema.methods.generateAccessToken = function () {
    // "jwt.sign" is used to make a signed token (encoding, i.e. generating a string of characters) that contains the below payload and using "jwt.verify" we decode the signature so that we can access the contents of the Token
    return jwt.sign(
        {
            _id: this._id, //.this values come from DB
            email: this.email,
            username: this.username,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

userSchema.methods.generateRefreshToken = function () {
    // "jwt.sign" is used to make a signed token (encoding, i.e. generating a string of characters) that contains the below payload and using "jwt.verify" we decode the signature so that we can access the contents of the Token
    return jwt.sign(
        {
            _id: this.id, // this is the payload
        },
        process.env.REFRESH_TOKEN_SECRET, //this is secret to validate token
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY, // optional settings of token
        }
    );
};

export const User = mongoose.model("User", userSchema);
