import { verifyToken } from "../config/auth.js";
import { errorResponse } from "../lib/response.js";

export const authMiddleware = (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header
    const authHeader = req.headers.authorization

    if (authHeader) {
      const parts = authHeader.split(" ");

      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    // Fallback to cookie
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return errorResponse(res, `No token provided ${req?.cookies?.token}`, 401);
    }

    const decoded = verifyToken(token);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("Auth error:", error);

    if (error.message.includes("expired")) {
      return errorResponse(res, "Token has expired. Please login again", 401);
    }

    return errorResponse(res, "Invalid token", 401);
  }
};

// ==================== ADMIN MIDDLEWARE ====================
export const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, "User not authenticated", 401);
  }

  if (req.user.role !== "admin") {
    return errorResponse(res, "Admin access required", 403);
  }

  next();
};

// ==================== SUPER ADMIN MIDDLEWARE ====================
export const superAdminMiddleware = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, "User not authenticated", 401);
  }

  if (req.user.role !== "super_admin") {
    return errorResponse(res, "Super admin access required", 403);
  }

  next();
};

export const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user exists
    if (!req.user) {
      return errorResponse(res, "User not authenticated", 401);
    }

    // Check if user role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Required roles: ${allowedRoles.join(", ")}`,
        403,
      );
    }

    next();
  };
};
