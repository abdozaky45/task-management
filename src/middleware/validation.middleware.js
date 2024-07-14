import { Types} from "mongoose";
export const isValidObjectId = (value, helper) => {
  return Types.ObjectId.isValid(value)
    ? true
    : helper.message("In-valid objectId");
};
export const validation = joiSchema => {
 return (req,res,next)=>{
 const allDataAllMethods = { ...req.body, ...req.params, ...req.query };
  const validationResult = joiSchema.validate(allDataAllMethods, {
    abortEarly: false
  });
  if (validationResult.error) {
    const MessageError = validationResult.error.details.map(
      error => error.message
    );
    return next(new Error(MessageError), { cause: 400 });
  }
  return next();
 }
};
