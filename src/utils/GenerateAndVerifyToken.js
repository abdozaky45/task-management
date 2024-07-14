import jwt from 'jsonwebtoken'
export const verifyToken = ({ token , signature = process.env.ACCESS_TOKEN_SECRET } = {}) => {
    const decoded = jwt.verify(token, signature);
    return decoded
}