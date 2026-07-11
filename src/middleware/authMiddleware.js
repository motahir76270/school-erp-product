import { verifyToken } from '../config/auth.js';
import { errorResponse } from '../lib/response.js';


export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return errorResponse(res, 'No token provided', 401);
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return errorResponse(
        res,
        'Invalid token format. Use Bearer token',
        401
      );
    }

    const token = parts[1];

    const decoded = verifyToken(token);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();

  } catch (error) {
    if (error.message.includes('expired')) {
      return errorResponse(res, 'Token has expired. Please login again', 401);
    }

    return errorResponse(res, 'Invalid token', 401);
  }
};


// ==================== ADMIN MIDDLEWARE ====================
export const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'User not authenticated', 401);
  }

  if (req.user.role !== 'admin') {
    return errorResponse(res, 'Admin access required', 403);
  }

  next();
};


// ==================== SUPER ADMIN MIDDLEWARE ====================
export const superAdminMiddleware = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'User not authenticated', 401);
  }

  if (req.user.role !== 'super_admin') {
    return errorResponse(res, 'Super admin access required', 403);
  }

  next();
};