
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/errorHandling.js"
export const autherized = (role) => {
    return asyncHandler(async (req, res, next) => {
        if (role !== req.user.role)
            throw new ApiErrorError(403, 'user is not autherized')
        return next();
    });
}
