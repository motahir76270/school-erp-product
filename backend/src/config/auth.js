import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d";


if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
}


// ==================== GENERATE ACCESS TOKEN ====================
export const generateToken = (payload) => {
  if (!payload?.id || !payload?.email || !payload?.role) {
    throw {
      message: "Invalid payload",
      statusCode: 400
    };
  }

  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      type: "access"
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN
    }
  );
};


// ==================== GENERATE REFRESH TOKEN ====================
export const generateRefreshToken = (payload) => {
  if (!payload?.id) {
    throw {
      message: "User id is required",
      statusCode: 400
    };
  }

  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      type: "refresh"
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN
    }
  );
};


// ==================== VERIFY ACCESS TOKEN ====================
export const verifyToken = (token) => {

  if (!token) {
    throw {
      message: "No token provided",
      statusCode: 401
    };
  }


  try {

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type !== "access") {
      throw {
        message: "Invalid token type",
        statusCode: 401
      };
    }

    return decoded;


  } catch (error) {

    if (error.name === "TokenExpiredError") {
      throw {
        message: "Token expired",
        statusCode: 401
      };
    }


    if (error.name === "JsonWebTokenError") {
      throw {
        message: "Invalid token",
        statusCode: 401
      };
    }


    throw error;
  }
};


// ==================== VERIFY REFRESH TOKEN ====================
export const verifyRefreshToken = (token) => {

  if (!token) {
    throw {
      message: "No refresh token provided",
      statusCode: 401
    };
  }


  try {

    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);


    if (decoded.type !== "refresh") {
      throw {
        message: "Invalid refresh token",
        statusCode: 401
      };
    }


    return decoded;


  } catch (error) {


    if (error.name === "TokenExpiredError") {
      throw {
        message: "Refresh token expired",
        statusCode: 401
      };
    }


    if (error.name === "JsonWebTokenError") {
      throw {
        message: "Invalid refresh token",
        statusCode: 401
      };
    }


    throw error;
  }
};