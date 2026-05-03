import jwt from "jsonwebtoken";

const generateAccssToken = (user) => {
     return jwt.sign(
          { id: user.id, email: user.email },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
     );
};

const generateRefreshToken = (user) => {
     return jwt.sign(
          { id: user.id },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
     );
};

export { generateAccssToken, generateRefreshToken };