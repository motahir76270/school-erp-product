// src/middleware/permissions.js
import { eq } from "drizzle-orm";
import { db } from "../../db/db.js";
import { userPermission } from "../../db/schema/permissions.js";
import { errorResponse } from "../../lib/response.js";

// ==================== Helper to Extract ID ====================
const extractId = (req) => {
  // Check params first
  if (req.params && req.params.id) {
    return req.params.id;
  }
  
  // Check body
  if (req.body && req.body.id) {
    return req.body.id;
  }
  
  // Check query
  if (req.query && req.query.id) {
    return req.query.id;
  }
  
  // Check for specific IDs
  if (req.params && req.params.userId) {
    return req.params.userId;
  }
  
  if (req.params && req.params.teacherId) {
    return req.params.teacherId;
  }
  
  if (req.params && req.params.studentId) {
    return req.params.studentId;
  }
  
  return null;
};

// ==================== Base Permission Checker ====================
const checkPermission = async (userId, permissionKey) => {
  try {
    const permissions = await db
      .select()
      .from(userPermission)
      .where(eq(userPermission.userId, userId));

    if (!permissions || permissions.length === 0) {
      return false;
    }

    return permissions[0][permissionKey] === true;
  } catch (error) {
    console.error(`Error checking ${permissionKey} permission:`, error);
    return false;
  }
};

// ==================== PERMISSION CHECK FUNCTIONS ====================

// -------- 1. ATTENDANCE PERMISSION --------
export const hasAttendancePermission = async (userId) => {
  return await checkPermission(userId, 'attendance');
};

export const attendancePermission = () => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      const hasPermission = await hasAttendancePermission(userId);
      if (!hasPermission) {
        return errorResponse(res, "You don't have permission to access attendance", 403);
      }

      next();
    } catch (error) {
      console.error("Attendance permission error:", error);
      return errorResponse(res, "Permission check failed", 500);
    }
  };
};

// -------- 2. SUBJECT PERMISSION --------
export const hasSubjectPermission = async (userId) => {
  return await checkPermission(userId, 'subject');
};

export const subjectPermission = () => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      const hasPermission = await hasSubjectPermission(userId);
      if (!hasPermission) {
        return errorResponse(res, "You don't have permission to access subjects", 403);
      }

      next();
    } catch (error) {
      console.error("Subject permission error:", error);
      return errorResponse(res, "Permission check failed", 500);
    }
  };
};

// -------- 3. CLASSES PERMISSION --------
export const hasClassesPermission = async (userId) => {
  return await checkPermission(userId, 'classes');
};

export const classesPermission = () => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      const hasPermission = await hasClassesPermission(userId);
      if (!hasPermission) {
        return errorResponse(res, "You don't have permission to access classes", 403);
      }

      next();
    } catch (error) {
      console.error("Classes permission error:", error);
      return errorResponse(res, "Permission check failed", 500);
    }
  };
};

// -------- 4. EXAM PERMISSION --------
export const hasExamPermission = async (userId) => {
  return await checkPermission(userId, 'exam');
};

export const examPermission = () => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      const hasPermission = await hasExamPermission(userId);
      if (!hasPermission) {
        return errorResponse(res, "You don't have permission to access exams", 403);
      }

      next();
    } catch (error) {
      console.error("Exam permission error:", error);
      return errorResponse(res, "Permission check failed", 500);
    }
  };
};

// -------- 5. FEE PERMISSION --------
export const hasFeePermission = async (userId) => {
  return await checkPermission(userId, 'fee');
};

export const feePermission = () => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      const hasPermission = await hasFeePermission(userId);
      if (!hasPermission) {
        return errorResponse(res, "You don't have permission to access fee management", 403);
      }

      next();
    } catch (error) {
      console.error("Fee permission error:", error);
      return errorResponse(res, "Permission check failed", 500);
    }
  };
};

// -------- 6. USERS PERMISSION --------
export const hasUsersPermission = async (userId) => {
  return await checkPermission(userId, 'users');
};

export const usersPermission = () => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      const hasPermission = await hasUsersPermission(userId);
      if (!hasPermission) {
        return errorResponse(res, "You don't have permission to access users", 403);
      }

      next();
    } catch (error) {
      console.error("Users permission error:", error);
      return errorResponse(res, "Permission check failed", 500);
    }
  };
};

// -------- 7. STUDENTS PERMISSION --------
export const hasStudentsPermission = async (userId) => {
  return await checkPermission(userId, 'students');
};

export const studentsPermission = () => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      const hasPermission = await hasStudentsPermission(userId);
      if (!hasPermission) {
        return errorResponse(res, "You don't have permission to access students", 403);
      }

      next();
    } catch (error) {
      console.error("Students permission error:", error);
      return errorResponse(res, "Permission check failed", 500);
    }
  };
};

// -------- 8. TEACHERS PERMISSION --------
export const hasTeachersPermission = async (userId) => {
  return await checkPermission(userId, 'teachers');
};

export const teachersPermission = () => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      const hasPermission = await hasTeachersPermission(userId);
      if (!hasPermission) {
        return errorResponse(res, "You don't have permission to access teachers", 403);
      }

      next();
    } catch (error) {
      console.error("Teachers permission error:", error);
      return errorResponse(res, "Permission check failed", 500);
    }
  };
};

// ==================== PERMISSION WITH ID EXTRACTION ====================

// -------- 9. TEACHER PERMISSION WITH ID --------
export const teacherAttendancePermission = () => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      // Extract teacher ID from params, body, or query
      const teacherId = req.params.teacherId || 
                       req.params.id || 
                       req.body.teacherId || 
                       req.body.id || 
                       req.query.teacherId || 
                       req.query.id;

      if (!teacherId) {
        return errorResponse(res, "Teacher ID is required", 400);
      }

      // Check teacher permission
      const hasPermission = await checkTeacherPermission(userId, teacherId, 'attendance');
      if (!hasPermission) {
        return errorResponse(res, "You don't have permission to access teacher attendance", 403);
      }

      next();
    } catch (error) {
      console.error("Teacher attendance permission error:", error);
      return errorResponse(res, "Permission check failed", 500);
    }
  };
};

// Check teacher specific permission
const checkTeacherPermission = async (userId, teacherId, permissionKey) => {
  try {
    const permissions = await db
      .select()
      .from(teacherPermission)
      .where(
        and(
          eq(teacherPermission.userId, userId),
          eq(teacherPermission.teacherId, teacherId)
        )
      );

    if (!permissions || permissions.length === 0) {
      return false;
    }

    return permissions[0][permissionKey] === true;
  } catch (error) {
    console.error(`Error checking teacher ${permissionKey} permission:`, error);
    return false;
  }
};

// ==================== COMBINED PERMISSION CHECKERS ====================

// Check multiple permissions (AND condition - all required)
export const hasAllPermissions = async (userId, permissions) => {
  try {
    const userPerm = await db
      .select()
      .from(userPermission)
      .where(eq(userPermission.userId, userId));

    if (!userPerm || userPerm.length === 0) {
      return false;
    }

    return permissions.every(perm => userPerm[0][perm] === true);
  } catch (error) {
    console.error("Error checking multiple permissions:", error);
    return false;
  }
};

// Check any permission (OR condition - at least one)
export const hasAnyPermission = async (userId, permissions) => {
  try {
    const userPerm = await db
      .select()
      .from(userPermission)
      .where(eq(userPermission.userId, userId));

    if (!userPerm || userPerm.length === 0) {
      return false;
    }

    return permissions.some(perm => userPerm[0][perm] === true);
  } catch (error) {
    console.error("Error checking any permission:", error);
    return false;
  }
};

// -------- Combined Permission Middleware --------
export const requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      const hasPermissions = await hasAllPermissions(userId, permissions);
      if (!hasPermissions) {
        return errorResponse(
          res, 
          `You need all of these permissions: ${permissions.join(', ')}`,
          403
        );
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return errorResponse(res, "Permission check failed", 500);
    }
  };
};

export const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      const hasPermissions = await hasAnyPermission(userId, permissions);
      if (!hasPermissions) {
        return errorResponse(
          res, 
          `You need at least one of these permissions: ${permissions.join(', ')}`,
          403
        );
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return errorResponse(res, "Permission check failed", 500);
    }
  };
};

// ==================== PERMISSION CHECKER WITH DYNAMIC ID ====================

export const checkPermissionWithId = (permissionKey, idKey = 'id') => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, "User not authenticated", 401);
      }

      // Extract ID from params, body, or query
      const id = req.params[idKey] || 
                 req.body[idKey] || 
                 req.query[idKey];

      if (!id) {
        return errorResponse(res, `${idKey} is required`, 400);
      }

      // Check permission
      const hasPermission = await checkPermission(userId, permissionKey);
      if (!hasPermission) {
        return errorResponse(
          res, 
          `You don't have permission to access ${permissionKey}`,
          403
        );
      }

      // Attach ID to request for use in controller
      req.targetId = id;
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return errorResponse(res, "Permission check failed", 500);
    }
  };
};