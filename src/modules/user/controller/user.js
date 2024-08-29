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
import { OAuth2Client } from 'google-auth-library';
import { customAlphabet } from 'nanoid'
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
  const link = `${req.protocol}://${req.headers.host}/auth/confirmEmail/${activationCode}`;
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
export const login = asyncHandler(async (req, res, next) => {
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
  user.accessToken = accessToken;
  user.agent = req.headers["user-agent"];
  // change status
  user.status = "online";
  await user.save();
  const loggedInUser = await userModel.findById(user._id).select("-password -refreshToken")

  // send res
  return res
    .status(200)
    .json(
      new ApiResponse(200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged In Successfully"
      ));
});
// ? signupOrloginWithGamil
export const signupOrloginWithGamil = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  const client = new OAuth2Client(process.env.CLIENT_ID);
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.CLIENT_ID,
      // audience: [process.env.CLIENT_ID_1, process.env.CLIENT_ID_2, process.env.CLIENT_ID_3],
    });
    const payload = ticket.getPayload();
    return payload;
  }
  const { email, email_verified, name, given_name, family_name, picture } = await verify();
  if (!email_verified) {
    throw new ApiError(400, "In-valid email");
  }
  const user = await userModel.findOne({ email: email.toLowerCase() });
  if (user) {
    // login 
    if (user.provider != 'GOOGLE')
      throw new ApiError(404, "In-valid provider");
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id); //get tokens
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    user.agent = req.headers['user-agent'];
    user.status = "online";
    await user.save();
    const userLoggend = await userModel.findById(user._id).select("-refreshToken -password");
    return res
      .status(201)
      .json(
        new ApiResponse(201, { user: userLoggend }, "User logged In Successfully")
      );
  }
  // register
  const customPassword = customAlphabet(process.env.ALPHABET, process.env.PASSWORD_LENGTH);
  const userRegister = await userModel.create({
    userName: name,
    email,
    password: customPassword,
    provider: "GOOGLE",
    url: picture,
    isConfirmed: "true"
  });
  const { accessToken, refreshToken } = generateAccessAndRefereshTokens(userRegister._id);
  userRegister.accessToken = accessToken;
  userRegister.refreshToken = refreshToken;
  userRegister.agent = req.headers['user-agent'];
  userRegister.status = "online";
  await user.save();
  return res
    .status(200)
    .json(
      new ApiResponse(200,
        { accessToken, refreshToken },
        "User logged In Successfully"
      ));
});
// ? logout
export const logout = asyncHandler(async (req, res) => {
  const user = await userModel.findById(
    req.params._id,
    {
      $unset: { refreshToken: 1, accessToken: 1 }  // this removes the field from document
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
  user.accessToken = accessToken;
  await user.save();
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