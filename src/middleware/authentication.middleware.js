
import userModel from '../../DataBase/models/user.model.js';
import { asyncHandler } from '../utils/errorHandling.js';
import { verifyToken } from '../utils/GenerateAndVerifyToken.js';
import { ApiError } from '../utils/ApiError.js';
export const auth = asyncHandler(async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith(process.env.BEARER_TOKEN))
    throw new ApiError(400, 'authorization is required or in-valid Bearer Key')
  const token = authorization.split(process.env.BEARER_TOKEN)[1];
  const decoded = verifyToken({ token })
  if (!decoded?._id)
    throw new ApiError(400, 'in-valid token payload');
  const tokenDB = await userModel.findOne({ accessToken: token });
  if (!tokenDB)
    throw new ApiError(401, 'token expired')
  console.log(decoded);
  const user = await userModel.findById(decoded._id);
  if (!user)
    throw new ApiError(400, 'Not register account')
  req.user = user;
  return next();
});