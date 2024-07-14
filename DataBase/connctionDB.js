import mongoose from "mongoose";
const connectDB = async () => {
  return await mongoose
    .connect(process.env.DB_URL)
    .then(result => {
      console.log("DataBase connected --------->");
    })
    .catch(error => {
      console.log(`Database connection error ----${error}`);
    });
};
export default connectDB;