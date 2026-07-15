// src/controllers/teacherController.js
import { count, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/db.js";
import { teachers } from "../db/schema/users.js";
import { generateToken } from "../config/auth.js";
import { successResponse, errorResponse } from "../lib/response.js";
import { generateQRCode, deleteQRCodeFile } from "../config/qrCode.js";

// ==================== GENERATE DEFAULT USERNAME ====================
const generateDefaultUsername = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `TEACH-${timestamp}${random}`;
};

// ==================== CREATE TEACHER ====================
export const createTeacher = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      username,
      employeeId,
      qualification,
      experience,
      specialization,
      joiningDate,
      salary,
    } = req.body;

    const adminId = req.user?.id;

    if (!adminId) {
      return errorResponse(res, "Unauthorized - Admin ID required", 401);
    }

    const profileImage = req.file;
    const imagePath = profileImage
      ? profileImage.path.replace(/\\/g, "/")
      : null;

    if (!email || !name || !username || !employeeId || !joiningDate) {
      return errorResponse(
        res,
        "Email, Name, Username, Employee ID and Joining Date are required",
        400,
      );
    }

    // Check email
    const [existingTeacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.email, email))
      .limit(1);

    if (existingTeacher) {
      return errorResponse(res, "Email already registered", 409);
    }

    // Check employee ID
    const [existingEmployee] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.employeeId, employeeId))
      .limit(1);

    if (existingEmployee) {
      return errorResponse(
        res,
        "Teacher with this employee ID already exists",
        409,
      );
    }

    // Check username
    const [existingUsername] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.username, username))
      .limit(1);

    if (existingUsername) {
      return errorResponse(res, "Username already exists", 409);
    }

    const teacherId = uuidv4();

    const finalPassword = password || "123456";

    // Generate QR Code
    const qrData = JSON.stringify({
      id: teacherId,
      userId: adminId,
      name,
      email,
      employeeId,
      qualification,
      specialization,
    });

    let qrCodePath = null;

    try {
      qrCodePath = await generateQRCode(qrData, `${teacherId}.png`);
    } catch (err) {
      console.error("QR generation failed:", err);
    }

    // Insert teacher
    await db.insert(teachers).values({
      id: teacherId,
      userId: adminId,
      email,
      password: finalPassword,
      name,
      username,
      role: "teacher",
      profileImage: imagePath,
      employeeId,
      qualification: qualification || null,
      experience: experience || null,
      specialization: specialization || null,
      joiningDate,
      salary: salary || null,
      qrCode: qrCodePath,
      isActive: true,
    });

    const [newTeacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId))
      .limit(1);

    return successResponse(
      res,
      newTeacher,
      "Teacher created successfully",
      201,
    );
  } catch (error) {
    console.error("Create teacher error:", error);
    return errorResponse(res, "Internal Server Error", 500);
  }
};

// ==================== TEACHER LOGIN ====================
export const teacherLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, "Email and password are required", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find teacher by email
    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.email, normalizedEmail))
      .limit(1);

    if (!teacher) {
      return errorResponse(res, "Invalid email or password", 401);
    }

    // Password check
    if (teacher.password !== password) {
      return errorResponse(res, "Invalid email or password", 401);
    }

    // Check account status
    if (!teacher.isActive) {
      return errorResponse(res, "Account is deactivated", 403);
    }

    // Generate JWT token
    const token = generateToken({
      id: teacher.id,
      email: teacher.email,
      role: teacher.role,
      teacherId: teacher.id,
    });

    const teacherData = {
      id: teacher.id,
      userId: teacher.userId,
      email: teacher.email,
      username: teacher.username,
      name: teacher.name,
      profileImage: teacher.profileImage,
      employeeId: teacher.employeeId,
      qualification: teacher.qualification,
      experience: teacher.experience,
      specialization: teacher.specialization,
      joiningDate: teacher.joiningDate,
      salary: teacher.salary,
      qrCode: teacher.qrCode,
      isActive: teacher.isActive,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
    };

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(
      res,
      {
        teacher: teacherData,
        token,
      },
      "Teacher login successful",
      200,
    );
  } catch (error) {
    console.error("Teacher login error:", error);
    return errorResponse(res, error.message || "Login failed", 500);
  }
};

// ==================== UPDATE TEACHER ====================
export const updateTeacher = async (req, res) => {
  try {
    const teacherId = req.user?.teacherId || req.user?.id;

    if (!teacherId) {
      return errorResponse(res, "Teacher not authenticated", 401);
    }

    const {
      name,
      username,
      qualification,
      experience,
      specialization,
      salary,
    } = req.body;

    const profileImage = req.file;

    // Check if teacher exists
    const [existingTeacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId))
      .limit(1);

    if (!existingTeacher) {
      return errorResponse(res, "sadmfnsamdf,n not found", 404);
    }

    // Check if username is unique
    if (username && username !== existingTeacher.username) {
      const [existingTeacherByUsername] = await db
        .select()
        .from(teachers)
        .where(eq(teachers.username, username))
        .limit(1);

      if (existingTeacherByUsername) {
        return errorResponse(res, "Username already taken", 409);
      }
    }

    // Build update data
    const teacherUpdateData = {};
    if (name !== undefined) teacherUpdateData.name = name;
    if (username !== undefined) teacherUpdateData.username = username;
    if (qualification !== undefined)
      teacherUpdateData.qualification = qualification;
    if (experience !== undefined) teacherUpdateData.experience = experience;
    if (specialization !== undefined)
      teacherUpdateData.specialization = specialization;
    if (salary !== undefined) teacherUpdateData.salary = salary;
    if (profileImage) {
      teacherUpdateData.profileImage = profileImage.path.replace(/\\/g, "/");
    }
    teacherUpdateData.updatedAt = new Date();

    // Regenerate QR code if important data changes
    if (name || qualification || specialization) {
      const qrData = JSON.stringify({
        id: existingTeacher.id,
        adminId: existingTeacher.userId,
        name: name || existingTeacher.name,
        email: existingTeacher.email,
        employeeId: existingTeacher.employeeId,
        qualification: qualification || existingTeacher.qualification,
        specialization: specialization || existingTeacher.specialization,
      });
    }

    if (Object.keys(teacherUpdateData).length === 0) {
      return errorResponse(res, "No data provided for update", 400);
    }

    // Update teacher
    await db
      .update(teachers)
      .set(teacherUpdateData)
      .where(eq(teachers.id, teacherId));

    // Fetch updated teacher
    const [updatedTeacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId))
      .limit(1);

    if (!updatedTeacher) {
      return errorResponse(res, "Failed to retrieve updated teacher", 500);
    }

    return successResponse(
      res,
      updatedTeacher,
      "Teacher updated successfully",
      200,
    );
  } catch (error) {
    console.error("Update teacher error:", error);
    return errorResponse(res, error.message || "Failed to update teacher", 500);
  }
};

// ==================== GET ALL TEACHERS ====================
export const getAllTeachers = async (req, res) => {
  try {
    console.log("dsjfbjsdfgbjfgb");
    
    const adminId = req.user?.id;

    if (!adminId) {
      return errorResponse(res, "Unauthorized - Admin ID required", 401);
    }
    const page = req.query.page ||  req.params.page;
    const limit =  10;
    const offset = (page - 1) * limit;

    // Get teachers for the current page
    const allTeachers = await db
      .select()
      .from(teachers)
      .where(eq(teachers.userId, adminId))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalResult] = await db
      .select({ total: count() })
      .from(teachers)
      .where(eq(teachers.userId, adminId));

    const total = totalResult?.total || 0;

    return successResponse(
      res,
      {
        teachers: allTeachers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Teachers fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get all teachers error:", error);
    return errorResponse(res, error.message || "Failed to get teachers", 500);
  }
};

// ==================== GET TEACHER BY ID ====================
export const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, "Teacher ID is required", 400);
    }

    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, id))
      .limit(1);

    if (!teacher) {
      return errorResponse(res, "sfnaf not found", 404);
    }

    // Only generate token if this is a teacher accessing their own profile
    // or an admin accessing a teacher's details
    const isTeacher = req.user?.teacherId === id || req.user?.id === id;
    const isAdmin = req.user?.role === "admin";

    let token = null;
    if (isTeacher || isAdmin) {
      token = generateToken({
        id: teacher.id,
        email: teacher.email,
        role: teacher.role,
        teacherId: teacher.id,
      });

      // Only set cookie for teacher accessing their own profile
      if (isTeacher) {
        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }
    }

    return successResponse(
      res,
      { teacher, ...(token && { token }) },
      "Teacher fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get teacher error:", error);
    return errorResponse(res, error.message || "Failed to get teacher", 500);
  }
};
// ==================== GET TEACHER PROFILE ====================
export const getTeacherProfile = async (req, res) => {
  try {
    const teacherId = req.user?.teacherId || req.user?.id;

    if (!teacherId) {
      return errorResponse(res, "Teacher not authenticated", 401);
    }

    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId))
      .limit(1);

    if (!teacher) {
      return errorResponse(res, "Tesdksdfher not found", 404);
    }

    return successResponse(
      res,
      teacher,
      "Teacher profile fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get teacher profile error:", error);
    return errorResponse(
      res,
      error.message || "Failed to get teacher profile",
      500,
    );
  }
};

// ==================== UPDATE TEACHER PROFILE ====================
export const updateTeacherProfile = async (req, res) => {
  try {
    const teacherId = req.user?.teacherId || req.user?.id;

    if (!teacherId) {
      return errorResponse(res, "Teacher not authenticated", 401);
    }

    const { name, username, qualification, experience, specialization } =
      req.body;

    const profileImage = req.file;

    const [existingTeacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId))
      .limit(1);

    if (!existingTeacher) {
      return errorResponse(res, "sfnbfn not found", 404);
    }

    if (username && username !== existingTeacher.username) {
      const [existingTeacherByUsername] = await db
        .select()
        .from(teachers)
        .where(eq(teachers.username, username))
        .limit(1);

      if (existingTeacherByUsername) {
        return errorResponse(res, "Username already taken", 409);
      }
    }

    // Build update data
    const teacherUpdateData = {};
    if (name !== undefined) teacherUpdateData.name = name;
    if (username !== undefined) teacherUpdateData.username = username;
    if (qualification !== undefined)
      teacherUpdateData.qualification = qualification;
    if (experience !== undefined) teacherUpdateData.experience = experience;
    if (specialization !== undefined)
      teacherUpdateData.specialization = specialization;
    if (profileImage) {
      teacherUpdateData.profileImage = profileImage.path.replace(/\\/g, "/");
    }
    teacherUpdateData.updatedAt = new Date();

    // Regenerate QR code if name or qualification changes
    if (name || qualification || specialization) {
      const qrData = JSON.stringify({
        id: existingTeacher.id,
        adminId: existingTeacher.userId,
        name: name || existingTeacher.name,
        email: existingTeacher.email,
        employeeId: existingTeacher.employeeId,
        qualification: qualification || existingTeacher.qualification,
        specialization: specialization || existingTeacher.specialization,
      });
    }

    if (Object.keys(teacherUpdateData).length === 0) {
      return errorResponse(res, "No data provided for update", 400);
    }

    // Update teacher
    await db
      .update(teachers)
      .set(teacherUpdateData)
      .where(eq(teachers.id, teacherId));

    // Fetch updated teacher
    const [updatedTeacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId))
      .limit(1);

    if (!updatedTeacher) {
      return errorResponse(res, "Failed to retrieve updated teacher", 500);
    }

    return successResponse(
      res,
      updatedTeacher,
      "Teacher profile updated successfully",
      200,
    );
  } catch (error) {
    console.error("Update teacher profile error:", error);
    return errorResponse(
      res,
      error.message || "Failed to update teacher profile",
      500,
    );
  }
};

// ==================== CHANGE TEACHER PASSWORD ====================
export const changeTeacherPassword = async (req, res) => {
  try {
    const teacherId = req.user?.teacherId || req.user?.id;

    if (!teacherId) {
      return errorResponse(res, "Teacher not authenticated", 401);
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(
        res,
        "Current password and new password are required",
        400,
      );
    }

    if (newPassword.length < 6) {
      return errorResponse(
        res,
        "New password must be at least 6 characters",
        400,
      );
    }

    const [existingTeacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId))
      .limit(1);

    if (!existingTeacher) {
      return errorResponse(res, "Teacher not fjdsnf", 404);
    }

    if (existingTeacher.password !== currentPassword) {
      return errorResponse(res, "Current password is incorrect", 400);
    }

    if (currentPassword === newPassword) {
      return errorResponse(
        res,
        "New password must be different from current password",
        400,
      );
    }

    await db
      .update(teachers)
      .set({
        password: newPassword,
        updatedAt: new Date(),
      })
      .where(eq(teachers.id, teacherId));

    return successResponse(res, null, "Password changed successfully", 200);
  } catch (error) {
    console.error("Change teacher password error:", error);
    return errorResponse(
      res,
      error.message || "Failed to change password",
      500,
    );
  }
};

// ==================== RESET TEACHER PASSWORD (ADMIN) ====================
export const resetTeacherPassword = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { newPassword } = req.body;

    if (!teacherId) {
      return errorResponse(res, "Teacher ID is required", 400);
    }

    const [existingTeacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId))
      .limit(1);

    if (!existingTeacher) {
      return errorResponse(res, "Teacher not dsfnm,f", 404);
    }

    const finalPassword = newPassword || "123456";

    await db
      .update(teachers)
      .set({
        password: finalPassword,
        updatedAt: new Date(),
      })
      .where(eq(teachers.id, teacherId));

    const responseData = {
      message: "Password reset successfully",
      teacherId: teacherId,
    };

    if (!newPassword) {
      responseData.newPassword = finalPassword;
      responseData.note =
        "This is the default password. Please change it after first login.";
    }

    return successResponse(
      res,
      responseData,
      "Password reset successfully",
      200,
    );
  } catch (error) {
    console.error("Reset teacher password error:", error);
    return errorResponse(res, error.message || "Failed to reset password", 500);
  }
};

// ==================== DELETE TEACHER (SOFT) ====================
export const deleteTeacher = async (req, res) => {
  try {
    const teacherId = req.params?.id || req.user?.teacherId || req.user?.id;

    if (!teacherId) {
      return errorResponse(res, "Teacher ID is required", 400);
    }

    const [existingTeacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId))
      .limit(1);

    if (!existingTeacher) {
      return errorResponse(res, "Teacher not dfsndsnalskdf", 404);
    }

    // Soft delete
    await db
      .update(teachers)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(teachers.id, teacherId));

    return successResponse(res, null, "Teacher deactivated successfully", 200);
  } catch (error) {
    console.error("Delete teacher error:", error);
    return errorResponse(res, error.message || "Failed to delete teacher", 500);
  }
};

// ==================== HARD DELETE TEACHER ====================
export const hardDeleteTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    if (!teacherId) {
      return errorResponse(res, "Teacher ID is required", 400);
    }

    const [existingTeacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId))
      .limit(1);

    if (!existingTeacher) {
      return errorResponse(res, "dsmfnas,mdnm,sadf not found", 404);
    }

    // Delete QR code file
    if (existingTeacher.qrCode) {
      await deleteQRCodeFile(existingTeacher.qrCode);
    }

    // Delete teacher
    await db.delete(teachers).where(eq(teachers.id, teacherId));

    return successResponse(res, null, "Teacher deleted permanently", 200);
  } catch (error) {
    console.error("Hard delete teacher error:", error);
    return errorResponse(res, error.message || "Failed to delete teacher", 500);
  }
};

// ==================== UPDATE TEACHER STATUS ====================
export const updateTeacherStatus = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { status } = req.body;

    if (!teacherId) {
      return errorResponse(res, "Teacher ID is required", 400);
    }

    if (!status) {
      return errorResponse(res, "Status is required", 400);
    }

    const validStatuses = ["active", "inactive", "suspended"];
    if (!validStatuses.includes(status.toLowerCase())) {
      return errorResponse(
        res,
        "Invalid status. Must be: active, inactive, suspended",
        400,
      );
    }

    const [existingTeacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId))
      .limit(1);

    if (!existingTeacher) {
      return errorResponse(res, "ds;flaskl;sdk not found", 404);
    }

    // Convert status to boolean
    const isActive = status.toLowerCase() === "active";

    // Update teacher status
    await db
      .update(teachers)
      .set({
        isActive: isActive,
        updatedAt: new Date(),
      })
      .where(eq(teachers.id, teacherId));

    // Fetch updated teacher
    const [updatedTeacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId))
      .limit(1);

    return successResponse(
      res,
      {
        status: updatedTeacher.isActive ? "active" : "inactive",
        teacher: updatedTeacher,
      },
      "Teacher status updated successfully",
      200,
    );
  } catch (error) {
    console.error("Update teacher status error:", error);
    return errorResponse(
      res,
      error.message || "Failed to update teacher status",
      500,
    );
  }
};

// ==================== UPDATE TEACHER BY ID (ADMIN) ====================
export const updateTeacherById = async (req, res) => {
  try {
    const teacherId = req.params.id;

    if (!teacherId) {
      return errorResponse(res, "Teacher ID is required", 400);
    }

    // Ensure req.body exists with fallback
    const body = req.body || {};
    const {
      name,
      username,
      qualification,
      experience,
      specialization,
      salary,
      isActive,
    } = body;

    const profileImage = req.file;

    // Check if teacher exists
    const [existingTeacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId))
      .limit(1);

    if (!existingTeacher) {
      return errorResponse(res, "smdfnafm not found", 404);
    }

    // Check if username is unique
    if (username && username !== existingTeacher.username) {
      const [existingTeacherByUsername] = await db
        .select()
        .from(teachers)
        .where(eq(teachers.username, username))
        .limit(1);

      if (existingTeacherByUsername) {
        return errorResponse(res, "Username already taken", 409);
      }
    }

    // Build update data
    const teacherUpdateData = {};
    if (name !== undefined && name !== null) teacherUpdateData.name = name;
    if (username !== undefined && username !== null) teacherUpdateData.username = username;
    if (qualification !== undefined && qualification !== null) teacherUpdateData.qualification = qualification;
    if (experience !== undefined && experience !== null) teacherUpdateData.experience = experience;
    if (specialization !== undefined && specialization !== null) teacherUpdateData.specialization = specialization;
    if (salary !== undefined && salary !== null) teacherUpdateData.salary = salary;
    if (isActive !== undefined && isActive !== null) teacherUpdateData.isActive = isActive;
    if (profileImage) {
      teacherUpdateData.profileImage = profileImage.path.replace(/\\/g, "/");
    }
    teacherUpdateData.updatedAt = new Date();

    // Regenerate QR code if important data changes
    if (name || qualification || specialization) {
      const qrData = JSON.stringify({
        id: existingTeacher.id,
        adminId: existingTeacher.userId,
        name: name || existingTeacher.name,
        email: existingTeacher.email,
        employeeId: existingTeacher.employeeId,
        qualification: qualification || existingTeacher.qualification,
        specialization: specialization || existingTeacher.specialization,
      });
    }

    if (Object.keys(teacherUpdateData).length === 0) {
      return errorResponse(res, "No data provided for update", 400);
    }

    // Update teacher
    await db
      .update(teachers)
      .set(teacherUpdateData)
      .where(eq(teachers.id, teacherId));

    // Fetch updated teacher
    const [updatedTeacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId))
      .limit(1);

    if (!updatedTeacher) {
      return errorResponse(res, "Failed to retrieve updated teacher", 500);
    }

    return successResponse(
      res,
      updatedTeacher,
      "Teacher updated successfully",
      200,
    );
  } catch (error) {
    console.error("Update teacher by ID error:", error);
    return errorResponse(res, error.message || "Failed to update teacher", 500);
  }
};

// ==================== GET TEACHER QR CODE ====================
export const getTeacherQRCode = async (req, res) => {
  try {
    const teacherId = req.params?.id || req.user?.teacherId || req.user?.id;

    if (!teacherId) {
      return errorResponse(res, "Teacher ID is required", 401);
    }

    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId))
      .limit(1);

    if (!teacher) {
      return errorResponse(res, "dfs,mnasm,dn not found", 404);
    }

    if (!teacher.qrCode) {
      return errorResponse(res, "QR code not found for this teacher", 404);
    }

    const qrCodeUrl = `${teacher.qrCode}`;

    return successResponse(
      res,
      {
        qrCode: teacher.qrCode,
        qrCodeUrl: qrCodeUrl,
        teacher: {
          id: teacher.id,
          name: teacher.name,
          employeeId: teacher.employeeId,
        },
      },
      "QR code fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get teacher QR code error:", error);
    return errorResponse(res, error.message || "Failed to get QR code", 500);
  }
};

// ==================== REGENERATE TEACHER QR CODE ====================
export const regenerateTeacherQRCode = async (req, res) => {
  try {
    const teacherId = req.params?.id || req.user?.teacherId || req.user?.id;

    if (!teacherId) {
      return errorResponse(res, "Teacher ID is required", 401);
    }

    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId))
      .limit(1);

    if (!teacher) {
      return errorResponse(res, "smdfnam,nm not found", 404);
    }

    const qrData = JSON.stringify({
      id: teacher.id,
      adminId: teacher.userId,
      name: teacher.name,
      email: teacher.email,
      employeeId: teacher.employeeId,
      qualification: teacher.qualification,
      specialization: teacher.specialization,
    });

    const qrFileName = `${teacher.id}.png`;
    let qrCodePath = null;

    try {
      if (teacher.qrCode) {
        await deleteQRCodeFile(teacher.qrCode);
      }

      qrCodePath = await generateQRCode(qrData, qrFileName);

      await db
        .update(teachers)
        .set({
          qrCode: qrCodePath,
          updatedAt: new Date(),
        })
        .where(eq(teachers.id, teacher.id));
    } catch (qrError) {
      console.error("QR Code regeneration failed:", qrError);
      return errorResponse(res, "Failed to generate QR code", 500);
    }

    // Fetch updated teacher
    const [updatedTeacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacher.id))
      .limit(1);


    const qrCodeUrl = `${updatedTeacher.qrCode}`;

    return successResponse(
      res,
      {
        qrCode: updatedTeacher.qrCode,
        qrCodeUrl: qrCodeUrl,
        teacher: {
          id: updatedTeacher.id,
          name: updatedTeacher.name,
          employeeId: updatedTeacher.employeeId,
        },
      },
      "QR code regenerated successfully",
      200,
    );
  } catch (error) {
    console.error("Regenerate QR code error:", error);
    return errorResponse(
      res,
      error.message || "Failed to regenerate QR code",
      500,
    );
  }
};
