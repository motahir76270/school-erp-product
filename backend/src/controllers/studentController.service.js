// src/controllers/studentController.js
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/db.js";
import { students, users } from "../db/schema/users.js";
import { generateToken } from "../config/auth.js";
import { successResponse, errorResponse } from "../lib/response.js";
import { generateQRCode, deleteQRCodeFile } from "../config/qrCode.js";

// ==================== GENERATE DEFAULT USERNAME ====================
const generateDefaultUsername = () => {
  const random = 230 + Math.floor(Math.random() * 1000)
    .toString()
  return `STU-${random}`;
};

// ==================== CREATE STUDENT ====================
export const createStudent = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      phone,
      address,
      username,
      rollNumber,
      admissionNumber,
      classId,
      sectionId,
      dateOfBirth,
      gender,
      bloodGroup,
      religion,
      caste,
      nationality,
      aadharNumber,
      admissionDate,
    } = req.body;

    const profileImage = req.file;

       const imagePath = profileImage
      ? profileImage.path.replace(/\\/g, "/")
      : null;

    // Validate required fields
    if (!email || !name || !rollNumber || !classId || !admissionDate) {
      return errorResponse(
        res,
        "Required fields missing: email, name, rollNumber, classId, admissionDate",
        400,
      );
    }
     const userId = req.user?.id;
    // Check if student exists by email
    const existingStudentByEmail = await db
      .select()
      .from(students)
      .where(eq(students.email, email))
      .limit(1);

    if (existingStudentByEmail.length > 0) {
      return errorResponse(res, "Student with this email already exists", 409);
    }

    // Check if student exists by roll number
    const existingStudentByRoll = await db
      .select()
      .from(students)
      .where(eq(students.rollNumber, rollNumber))
      .limit(1);

    if (existingStudentByRoll.length > 0) {
      return errorResponse(
        res,
        "Student with this roll number already exists",
        409,
      );
    }

    // Check if student exists by admission number
    if (admissionNumber) {
      const existingStudentByAdmission = await db
        .select()
        .from(students)
        .where(eq(students.admissionNumber, admissionNumber))
        .limit(1);

      if (existingStudentByAdmission.length > 0) {
        return errorResponse(
          res,
          "Student with this admission number already exists",
          409,
        );
      }
    }


    // Generate username if not provided
    let finalUsername = username;
    if (!finalUsername) {
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        finalUsername = generateDefaultUsername();
        const existingUsername = await db
          .select()
          .from(students)
          .where(eq(students.username, finalUsername))
          .limit(1);

        if (existingUsername.length === 0) {
          isUnique = true;
        }
        attempts++;
      }
    }

    const finalPassword = password || "123456";
    const studentId = uuidv4();

    // Generate QR Code
    const qrData = JSON.stringify({
      id: studentId,
      name: name,
      email: email,
      rollNumber: rollNumber,
      admissionNumber: admissionNumber || null,
      classId: classId,
    });

    const qrFileName = `${studentId}.png`;
    let qrCodePath = null;

    try {
      qrCodePath = await generateQRCode(qrData, qrFileName);
    } catch (qrError) {
      console.error("QR Code generation failed:", qrError);
      qrCodePath = null;
    }

    // Create student
    await db.insert(students).values({
      id: studentId,
      userId: userId,
      username: finalUsername,
      email: email,
      name: name,
      password: finalPassword,
      role: "student",
      rollNumber: rollNumber,
      admissionNumber: admissionNumber || null,
      classId: classId,
      sectionId: sectionId || null,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      profileImage: imagePath || null,
      bloodGroup: bloodGroup || null,
      religion: religion || null,
      caste: caste || null,
      nationality: nationality || null,
      aadharNumber: aadharNumber || null,
      admissionDate: admissionDate,
      qrCode: qrCodePath,
      status: "active",
    });

    // Get the created student
    const [newStudent] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!newStudent) {
      return errorResponse(res, "Failed to create student", 500);
    }



    return successResponse(
      res,
      newStudent,
      "Student created successfully",
      201,
    );
  } catch (error) {
    console.error("Create student error:", error);
    return errorResponse(res, error.message || "Failed to create student", 500);
  }
};

// ==================== STUDENT LOGIN ====================
export const studentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, "Email and password are required", 400);
    }

    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.email, email))
      .limit(1);

    if (!student) {
      return errorResponse(res, "Invalid email or password", 401);
    }

    if (student.status !== "active") {
      return errorResponse(res, "Account is deactivated", 403);
    }

    if (student.password !== password) {
      return errorResponse(res, "Invalid email or password", 401);
    }

    const token = generateToken({
      id: student.id,
      email: student.email,
      role: "student",
    });


    return successResponse(
      res,
      { student, token },
      "Student login successful",
      200,
    );
  } catch (error) {
    console.error("Student login error:", error);
    return errorResponse(res, error.message || "Login failed", 500);
  }
};

// ==================== UPDATE STUDENT ====================
export const updateStudent = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return errorResponse(res, "Student not authenticated", 401);
    }

    const {
      name,
      phone,
      address,
      username,
      rollNumber,
      admissionNumber,
      classId,
      sectionId,
      dateOfBirth,
      gender,
      bloodGroup,
      religion,
      caste,
      nationality,
      aadharNumber,
      status,
    } = req.body;

    const profileImage = req.file;

    const [existingStudent] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!existingStudent) {
      return errorResponse(res, "Student not found", 404);
    }

    // Check if roll number is unique
    if (rollNumber && rollNumber !== existingStudent.rollNumber) {
      const existingStudentByRoll = await db
        .select()
        .from(students)
        .where(eq(students.rollNumber, rollNumber))
        .limit(1);

      if (existingStudentByRoll.length > 0) {
        return errorResponse(res, "Roll number already exists", 409);
      }
    }

    // Check if username is unique
    if (username && username !== existingStudent.username) {
      const existingStudentByUsername = await db
        .select()
        .from(students)
        .where(eq(students.username, username))
        .limit(1);

      if (existingStudentByUsername.length > 0) {
        return errorResponse(res, "Username already taken", 409);
      }
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (username !== undefined) updateData.username = username;
    if (rollNumber !== undefined) updateData.rollNumber = rollNumber;
    if (admissionNumber !== undefined)
      updateData.admissionNumber = admissionNumber;
    if (classId !== undefined) updateData.classId = classId;
    if (sectionId !== undefined) updateData.sectionId = sectionId;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updateData.gender = gender;
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
    if (religion !== undefined) updateData.religion = religion;
    if (caste !== undefined) updateData.caste = caste;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (aadharNumber !== undefined) updateData.aadharNumber = aadharNumber;
    if (status !== undefined) updateData.status = status;
    if (profileImage) {
      updateData.profileImage =
        profileImage.path.replace(/\\/g, "/");
    }
    updateData.updatedAt = new Date();

    // Regenerate QR code if important data changes
    if (rollNumber || admissionNumber || classId || name) {
      const qrData = JSON.stringify({
        id: existingStudent.id,
        name: name || existingStudent.name,
        email: existingStudent.email,
        rollNumber: rollNumber || existingStudent.rollNumber,
        admissionNumber: admissionNumber || existingStudent.admissionNumber,
        classId: classId || existingStudent.classId,
      });

      try {
        const qrFileName = `${existingStudent.id}.png`;
        const newQRPath = await generateQRCode(qrData, qrFileName);
        updateData.qrCode = newQRPath;

        if (existingStudent.qrCode) {
          await deleteQRCodeFile(existingStudent.qrCode);
        }
      } catch (qrError) {
        console.error("QR Code regeneration failed:", qrError);
      }
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, "No data provided for update", 400);
    }

    await db.update(students).set(updateData).where(eq(students.id, studentId));

    // Get updated student
    const [updatedStudent] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!updatedStudent) {
      return errorResponse(res, "Failed to update student", 500);
    }

  

    return successResponse(
      res,
      updatedStudent,
      "Student updated successfully",
      200,
    );
  } catch (error) {
    console.error("Update student error:", error);
    return errorResponse(res, error.message || "Failed to update student", 500);
  }
};

// ==================== GET ALL STUDENTS ====================
export const getAllStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const offset = (page - 1) * limit;

    const status = req.query.status || null;
    const classId = req.query.classId || null;
    const sectionId = req.query.sectionId || null;

    let query = db.select().from(students);

    if (status) {
      query = query.where(eq(students.status, status));
    }

    if (classId) {
      query = query.where(eq(students.classId, classId));
    }

    if (sectionId) {
      query = query.where(eq(students.sectionId, sectionId));
    }

    const allStudents = await query
      .limit(limit)
      .offset(offset);

    // Get total count without pagination
    let countQuery = db.select().from(students);

    if (status) {
      countQuery = countQuery.where(eq(students.status, status));
    }

    if (classId) {
      countQuery = countQuery.where(eq(students.classId, classId));
    }

    if (sectionId) {
      countQuery = countQuery.where(eq(students.sectionId, sectionId));
    }

    const totalStudents = await countQuery;
    const total = totalStudents.length;

    return successResponse(
      res,
      {
        students: allStudents,
        pagination: {
          page,
          limit,
          total
        },
      },
      "Students fetched successfully",
      200
    );

  } catch (error) {
    console.error("Get all students error:", error);
    return errorResponse(
      res,
      error.message || "Failed to get students",
      500
    );
  }
};

// ==================== GET STUDENT BY ID ====================
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, "Student ID is required", 400);
    }

    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, id))
      .limit(1);

    if (!student) {
      return errorResponse(res, "Student not found", 404);
    }

    const token = generateToken({
      id: student.id,
      email: student.email,
      role: "student",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true in production with HTTPS
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(
      res,
      { student, token },
      "Student fetched successfully",
      200
    );

  } catch (error) {
    console.error("Get student error:", error);
    return errorResponse(
      res,
      error.message || "Failed to get student",
      500
    );
  }
};

// ==================== GET STUDENTS BY CLASS ID ====================
export const getStudentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!classId) {
      return errorResponse(res, "Class ID is required", 400);
    }

    const studentsData = await db
      .select()
      .from(students)
      .where(eq(students.classId, classId));

    return successResponse(
      res,
      studentsData,
      "Students fetched by class successfully",
      200,
    );
  } catch (error) {
    console.error("Get students by class error:", error);
    return errorResponse(res, error.message || "Failed to get students", 500);
  }
};

// ==================== GET STUDENTS BY SECTION ID ====================
export const getStudentsBySection = async (req, res) => {
  try {
    const { sectionId } = req.params;

    if (!sectionId) {
      return errorResponse(res, "Section ID is required", 400);
    }

    const studentsData = await db
      .select()
      .from(students)
      .where(eq(students.sectionId, sectionId));


    return successResponse(
      res,
      studentsData,
      "Students fetched by section successfully",
      200,
    );
  } catch (error) {
    console.error("Get students by section error:", error);
    return errorResponse(res, error.message || "Failed to get students", 500);
  }
};

// ==================== GET STUDENTS BY CLASS AND SECTION ====================
export const getStudentsByClassAndSection = async (req, res) => {
  try {
    const { classId, sectionId } = req.params;

    if (!classId || !sectionId) {
      return errorResponse(res, "Both classId and sectionId are required", 400);
    }

    const studentsData = await db
      .select()
      .from(students)
      .where(
        and(eq(students.classId, classId), eq(students.sectionId, sectionId))
      );


    return successResponse(
      res,
      studentsData,
      "Students fetched by class and section successfully",
      200,
    );
  } catch (error) {
    console.error("Get students by class and section error:", error);
    return errorResponse(res, error.message || "Failed to get students", 500);
  }
};

// ==================== GET STUDENT PROFILE ====================
export const getStudentProfile = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return errorResponse(res, "Student not authenticated", 401);
    }

    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!student) {
      return errorResponse(res, "Student not found", 404);
    }


    return successResponse(
      res,
      student,
      "Student profile fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get student profile error:", error);
    return errorResponse(
      res,
      error.message || "Failed to get student profile",
      500,
    );
  }
};

// ==================== UPDATE STUDENT PROFILE ====================
export const updateStudentProfile = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return errorResponse(res, "Student not authenticated", 401);
    }

    const {
      name,
      phone,
      address,
      username,
      dateOfBirth,
      gender,
      bloodGroup,
      religion,
      caste,
      nationality,
      aadharNumber,
    } = req.body;

    const profileImage = req.file;

    const [existingStudent] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!existingStudent) {
      return errorResponse(res, "Student not found", 404);
    }

    if (username && username !== existingStudent.username) {
      const existingStudentByUsername = await db
        .select()
        .from(students)
        .where(eq(students.username, username))
        .limit(1);

      if (existingStudentByUsername.length > 0) {
        return errorResponse(res, "Username already taken", 409);
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (username !== undefined) updateData.username = username;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updateData.gender = gender;
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
    if (religion !== undefined) updateData.religion = religion;
    if (caste !== undefined) updateData.caste = caste;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (aadharNumber !== undefined) updateData.aadharNumber = aadharNumber;
    if (profileImage) {
      updateData.profileImage = profileImage.path || profileImage.filename;
    }
    updateData.updatedAt = new Date();

    // Regenerate QR code if name changes
    if (name) {
      const qrData = JSON.stringify({
        id: existingStudent.id,
        name: name || existingStudent.name,
        email: existingStudent.email,
        rollNumber: existingStudent.rollNumber,
        admissionNumber: existingStudent.admissionNumber,
        classId: existingStudent.classId,
      });

      try {
        const qrFileName = `${existingStudent.id}.png`;
        const newQRPath = await generateQRCode(qrData, qrFileName);
        updateData.qrCode = newQRPath;

        if (existingStudent.qrCode) {
          await deleteQRCodeFile(existingStudent.qrCode);
        }
      } catch (qrError) {
        console.error("QR Code regeneration failed:", qrError);
      }
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, "No data provided for update", 400);
    }

    await db.update(students).set(updateData).where(eq(students.id, studentId));

    // Get updated student
    const [updatedStudent] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!updatedStudent) {
      return errorResponse(res, "Failed to update profile", 500);
    }
    return successResponse(
      res,
      updatedStudent,
      "Student profile updated successfully",
      200,
    );
  } catch (error) {
    console.error("Update student profile error:", error);
    return errorResponse(
      res,
      error.message || "Failed to update student profile",
      500,
    );
  }
};

// ==================== CHANGE STUDENT PASSWORD ====================
export const changeStudentPassword = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return errorResponse(res, "Student not authenticated", 401);
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

    const [existingStudent] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!existingStudent) {
      return errorResponse(res, "Student not found", 404);
    }

    if (existingStudent.password !== currentPassword) {
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
      .update(students)
      .set({
        password: newPassword,
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId));

    return successResponse(res, null, "Password changed successfully", 200);
  } catch (error) {
    console.error("Change student password error:", error);
    return errorResponse(
      res,
      error.message || "Failed to change password",
      500,
    );
  }
};

// ==================== RESET STUDENT PASSWORD (ADMIN) ====================
export const resetStudentPassword = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { newPassword } = req.body;

    if (!studentId) {
      return errorResponse(res, "Student ID is required", 400);
    }

    const [existingStudent] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!existingStudent) {
      return errorResponse(res, "Student not found", 404);
    }

    const finalPassword = newPassword || "123456";

    await db
      .update(students)
      .set({
        password: finalPassword,
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId));

    const responseData = {
      message: "Password reset successfully",
      studentId: studentId,
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
    console.error("Reset student password error:", error);
    return errorResponse(res, error.message || "Failed to reset password", 500);
  }
};

// ==================== DELETE STUDENT (SOFT) ====================
export const deleteStudent = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return errorResponse(res, "Student not authenticated", 401);
    }

    const [existingStudent] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!existingStudent) {
      return errorResponse(res, "Student not found", 404);
    }

    await db
      .update(students)
      .set({
        status: "inactive",
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId));

    return successResponse(res, null, "Student deactivated successfully", 200);
  } catch (error) {
    console.error("Delete student error:", error);
    return errorResponse(res, error.message || "Failed to delete student", 500);
  }
};

// ==================== HARD DELETE STUDENT ====================
export const hardDeleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return errorResponse(res, "Student ID is required", 400);
    }

    const [existingStudent] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!existingStudent) {
      return errorResponse(res, "Student not found", 404);
    }

    if (existingStudent.qrCode) {
      await deleteQRCodeFile(existingStudent.qrCode);
    }

    await db.delete(students).where(eq(students.id, studentId));

    return successResponse(res, null, "Student deleted permanently", 200);
  } catch (error) {
    console.error("Hard delete student error:", error);
    return errorResponse(res, error.message || "Failed to delete student", 500);
  }
};

// ==================== UPDATE STUDENT STATUS ====================
export const updateStudentStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status } = req.body;

    if (!studentId || !status) {
      return errorResponse(res, "Student ID and status are required", 400);
    }

    if (!["active", "inactive", "suspended"].includes(status)) {
      return errorResponse(
        res,
        "Invalid status. Must be: active, inactive, suspended",
        400,
      );
    }

    const [existingStudent] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!existingStudent) {
      return errorResponse(res, "Student not found", 404);
    }

    await db
      .update(students)
      .set({
        status: status,
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId));

    // Get updated student
    const [updatedStudent] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!updatedStudent) {
      return errorResponse(res, "Failed to update student status", 500);
    }

    return successResponse(
      res,
      { status: updatedStudent.status },
      "Student status updated successfully",
      200,
    );
  } catch (error) {
    console.error("Update student status error:", error);
    return errorResponse(
      res,
      error.message || "Failed to update student status",
      500,
    );
  }
};

// ==================== GET STUDENT QR CODE ====================
export const getStudentQRCode = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return errorResponse(res, "Student not authenticated", 401);
    }

    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!student) {
      return errorResponse(res, "Student not found", 404);
    }

    if (!student.qrCode) {
      return errorResponse(res, "QR code not found for this student", 404);
    }

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const qrCodeUrl = `${baseUrl}${student.qrCode}`;

    return successResponse(
      res,
      {
        qrCode: student.qrCode,
        qrCodeUrl: qrCodeUrl,
      },
      "QR code fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get student QR code error:", error);
    return errorResponse(res, error.message || "Failed to get QR code", 500);
  }
};

// ==================== REGENERATE STUDENT QR CODE ====================
export const regenerateStudentQRCode = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return errorResponse(res, "Student not authenticated", 401);
    }

    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!student) {
      return errorResponse(res, "Student not found", 404);
    }

    const qrData = JSON.stringify({
      id: student.id,
      name: student.name,
      email: student.email,
      rollNumber: student.rollNumber,
      admissionNumber: student.admissionNumber,
      classId: student.classId,
    });

    const qrFileName = `${student.id}.png`;
    let qrCodePath = null;

    try {
      if (student.qrCode) {
        await deleteQRCodeFile(student.qrCode);
      }

      qrCodePath = await generateQRCode(qrData, qrFileName);

      await db
        .update(students)
        .set({
          qrCode: qrCodePath,
          updatedAt: new Date(),
        })
        .where(eq(students.id, student.id));
    } catch (qrError) {
      console.error("QR Code regeneration failed:", qrError);
      return errorResponse(res, "Failed to generate QR code", 500);
    }

    const [updatedStudent] = await db
      .select()
      .from(students)
      .where(eq(students.id, student.id))
      .limit(1);

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const qrCodeUrl = `${baseUrl}${updatedStudent.qrCode}`;

    return successResponse(
      res,
      {
        qrCode: updatedStudent.qrCode,
        qrCodeUrl: qrCodeUrl,
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

// ==================== SCAN STUDENT QR CODE ====================
export const scanStudentQRCode = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return errorResponse(res, "Student ID is required", 400);
    }

    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!student) {
      return errorResponse(res, "Student not found", 404);
    }


    return successResponse(
      res,
      student,
      "Student data fetched for QR scan",
      200,
    );
  } catch (error) {
    console.error("Scan QR code error:", error);
    return errorResponse(res, error.message || "Failed to scan QR code", 500);
  }
};