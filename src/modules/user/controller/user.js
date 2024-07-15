import userModel from "../../../../DataBase/models/user.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import crypto from "crypto";
import { sendEmail } from "../../../utils/sendEmails.js";
import { forgetPASS, signUpTemp } from "../../../utils/html.js";
import jwt from "jsonwebtoken";
import Randomstring from "randomstring";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import slugify from "slugify";
import { compare, hash } from "../../../utils/HashAndCompare.js";
// ? Referesh Token Access Token
const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await userModel.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    return { accessToken, refreshToken }
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating referesh and access token")
  }
}
// ? Register
export const register = asyncHandler(async (req, res, next) => {
  // data from request
  const { userName, email, password } = req.body;
  // check user existence
  const isUser = await userModel.findOne({
    $or: [
      { userName },
      { email }
    ]
  });
  if (isUser) {
    throw new ApiError(409, "User already registered with this username or email");
  }
  //generate activationcode
  const activationCode = crypto.randomBytes(64).toString("hex");
  const uniqueNumber = Randomstring.generate({
    length: 1,
    charset: 'numeric',
  });
  const Alphabetic = Randomstring.generate({
    length: 1,
    charset: 'alphabetic',
  });
  // create user
  const user = await userModel.create({
    userName: slugify(`${userName}-${uniqueNumber}${Alphabetic}`),
    email,
    password,
    activationCode
  });
  // create link confirmEmail
  const link = `${req.protocol}://${req.headers
    .host}/auth/confirmEmail/${activationCode}`;
  // send Email
  const isSend = await sendEmail({
    to: email,
    subject: "please active Account",
    html: signUpTemp(link)
  });
  //response
  return isSend
    ? res.status(200).json(new ApiResponse(200, {}, "please review your Email"))
    : next(new Error("Something went wrong "));
});
// ? Active Account
export const activationAccount = asyncHandler(async (req, res) => {
  // find user , update isconfirmed ,  delete activationCode
  const user = await userModel.findOneAndUpdate(
    {
      activationCode: req.params.activationCode
    },
    { isConfirmed: true, $unset: { activationCode: 1 } }
  );
  if (!user) throw new ApiError(404, "user not found!");
  return res.status(200).json(new ApiResponse(200, {}, "Done activate account , try to login now"));
});
// ? login
export const login = asyncHandler(async (req, res) => {
  //Data
  const { userName, password } = req.body;
  // exist
  const user = await userModel.findOne({ userName });
  if (!user)
    throw new ApiError(400, "This user does not exist")
  // is confirmed
  if (!user.isConfirmed)
    throw new ApiError(400, "This account is inactive")
  // password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid)
    throw new ApiError(401, "In-Valid Email Or Password")
  //return next(new Error("In-Valid Email Or Password", { cause: 400 }));
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id); //get tokens
  // save token model refreshToken
  user.refreshToken = refreshToken;
  user.agent = req.headers["user-agent"];
  await user.save();
  const loggedInUser = await userModel.findById(user._id).select("-password -refreshToken")
  // change status
  user.status = "online";
  await user.save();
  // send res
  return res
    .status(200)
    .json(
      new ApiResponse(200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged In Successfully"
      ));
});
// ? logout
export const logout = asyncHandler(async (req, res) => {
  const user = await userModel.findById(
    req.params._id,
    {
      $unset: { refreshToken: 1 } // this removes the field from document
    }
  );
  user.status = "offline";
  await user.save();
  res.status(200).json(new ApiResponse(200, {}, "User logged Out"));
});
// ? refreshAccessToken
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const { authorization } = req.headers;
  if (!authorization)
    throw new ApiError(401, "unauthorized request");
  const decodedToken = jwt.verify(authorization, process.env.REFRESH_TOKEN_SECRET);
  const user = await userModel.findById(decodedToken?._id);
  if (!user) {
    throw new ApiError(401, "Invalid refresh token")
  }
  if (authorization !== user?.refreshToken)
    throw new ApiError(401, "Refresh token is expired or used");
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { accessToken },
        "Access token refreshed"
      )
    )
});
// ? send code forget Password
export const forgetPass = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) throw new ApiError(401, "user not found!,please create account")
  const code = Randomstring.generate({ length: 4, charset: "numeric" });
  const hashCode = hash({ plaintext: code });
  user.forgetCode = hashCode;
  await user.save();
  return (await sendEmail({
    to: email,
    subject: "forget code",
    html: forgetPASS(code)
  }))
    ? res.json(new ApiResponse(200, {}, "check Your Email!"))
    : next(new Error("", { cause: 400 }));
});
// ? resetPassword
export const resetPassword = asyncHandler(async (req, res) => {
  const { forgetCode, email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (!user) throw new ApiError(400, "In-valid email!")
  if (!compare({ plaintext: forgetCode, hashValue: user.forgetCode }))
    throw new ApiError(401, "In-valid code");
  user = await userModel.findOneAndUpdate(
    { email },
    { $unset: { forgetCode: 1 } }
  );
  user.password = password;
  await user.save();
  return res.json(new ApiResponse(200, {}, "try to login"));
});