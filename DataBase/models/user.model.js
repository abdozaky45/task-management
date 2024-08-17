import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const userSchema = new Schema({
  profileImage: {
    url: {
      type: String,
      default:
        "https://res.cloudinary.com/dvferafsw/image/upload/v1700258634/default-profile-account-unknown-icon-black-silhouette-free-vector_leqzap.jpg"
    },
    publicId: {
      type: String,
      default:
        "default-profile-account-unknown-icon-black-silhouette-free-vector_leqzap"
    }
  },
  userName: {
    type: String,
    required: true,
    unique: true,
    min: 3,
    max: 22
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: "offline",
    enum: ["offline", "online"]
  },
  role: {
    type: String,
    default: "user",
    enum: ["user", "admin"]
  },
  isConfirmed: {
    type: Boolean,
    default: false
  },
  accessToken: { type: String },
  refreshToken: { type: String },
  agent: String,
  forgetCode: String,
  activationCode: String
});
userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  this.password = bcrypt.hashSync(this.password, parseInt(process.env.SALT_ROUND));
  next();
});
userSchema.methods.isPasswordCorrect = function (password) {
  return bcrypt.compareSync(password, this.password)
}
userSchema.methods.generateAccessToken = function () {
  return jwt.sign({
    _id: this._id,
    email: this.email,
    userName: this.userName,
    role: this.role
  },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" }
  )
}
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "365d" }
  )
}
const userModel = model("User", userSchema);
export default userModel;
