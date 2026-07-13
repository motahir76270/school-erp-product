// src/controllers/userController.js
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/db.js";
import { users } from "../db/schema/users.js";
import { generateToken } from "../config/auth.js";
import { successResponse, errorResponse } from "../lib/response.js";

// ==================== USER LOGIN ====================
export const userLoging = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return errorResponse(res, "Email and password are required", 400);
    }

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return errorResponse(res, "Invalid email or password", 401);
    }

    if (!user.isActive) {
      return errorResponse(res, "Account is deactivated", 403);
    }

    if (user.password !== password) {
      return errorResponse(res, "Invalid email or password", 401);
    }

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Format user response
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      address: user.address,
      profileImage: user.profileImage,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true in production with HTTPS
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(
      res,
      { user: userData, token },
      "Login successful",
      200,
    );
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse(res, error.message || "Login failed", 500);
  }
};

// ==================== USER REGISTER ====================
export const userCreate = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phone, address } =
      req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName || !role) {
      return errorResponse(
        res,
        "All fields are required: email, password, firstName, lastName, role",
        400,
      );
    }

    // Validate role
    const validRoles = ["super_admin", "admin", "teacher", "student"];

    if (!validRoles.includes(role)) {
      return errorResponse(
        res,
        "Invalid role. Must be: super_admin, admin, teacher, student",
        400,
      );
    }

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return errorResponse(res, "User with this email already exists", 409);
    }

    // Generate UUID
    const userId = uuidv4();

    // Insert user
    await db.insert(users).values({
      id: userId,
      email,
      password, // Hash before saving in production
      firstName,
      lastName,
      role,
      phone: phone || null,
      address: address || null,
      isActive: true,
    });

    // Fetch inserted user
    const [newUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!newUser) {
      return errorResponse(res, "Failed to retrieve created user", 500);
    }

    // Remove password from response
    const userData = {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      phone: newUser.phone,
      address: newUser.address,
      profileImage: newUser.profileImage,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
      lastLoginAt: newUser.lastLoginAt,
    };

    return successResponse(res, userData, "User registered successfully", 201);
  } catch (error) {
    console.error("Register error:", error);

    return errorResponse(res, error.message || "Registration failed", 500);
  }
};

// ==================== USER UPDATE ====================
export const userUpdate = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    const { firstName, lastName, phone, address } = req.body || {};

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      return errorResponse(res, "User not found", 404);
    }

    // Build update data
    const updateData = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;

    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, "No data provided for update", 400);
    }

    updateData.updatedAt = new Date();

    // Update user
    await db.update(users).set(updateData).where(eq(users.id, userId));

    // Fetch updated user
    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!updatedUser) {
      return errorResponse(res, "Failed to retrieve updated user", 500);
    }

    return successResponse(res, updatedUser, "User updated successfully", 200);
  } catch (error) {
    console.error("Update user error:", error);
    return errorResponse(res, error.message || "Failed to update user", 500);
  }
};

// ==================== USER DELETE ====================
export const userDelete = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      return errorResponse(res, "User not found", 404);
    }

    await db
      .delete(users)
      .where(eq(users.id, userId));

    return successResponse(
      res,
      null,
      "User deleted successfully",
      200
    );

  } catch (error) {
    console.error("Delete user error:", error);
    return errorResponse(
      res,
      error.message || "Failed to delete user",
      500
    );
  }
};

// ==================== UPDATE USER ROLE ====================
export const updateUserRole = async (req, res) => {
  try {
    const adminId = req.user?.id;

    if (!adminId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    const { userId, role } = req.body || {};

    if (!userId || !role) {
      return errorResponse(res, "userId and role are required", 400);
    }

    const validRoles = [
      "super_admin",
      "admin",
      "teacher",
      "student",
    ];

    if (!validRoles.includes(role)) {
      return errorResponse(
        res,
        "Invalid role. Must be: super_admin, admin, teacher, student",
        400
      );
    }

    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return errorResponse(res, "User not found", 404);
    }

    if (userId === adminId) {
      return errorResponse(
        res,
        "Cannot update your own role",
        403
      );
    }

    await db
      .update(users)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));


    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);


    return successResponse(
      res,
      {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        phone: updatedUser.phone,
        address: updatedUser.address,
        profileImage: updatedUser.profileImage,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        lastLoginAt: updatedUser.lastLoginAt,
      },
      "User role updated successfully",
      200
    );

  } catch (error) {
    console.error("Update user role error:", error);

    return errorResponse(
      res,
      error.message || "Failed to update user role",
      500
    );
  }
};

// ==================== UPDATE USER PROFILE ====================
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    const {
      firstName,
      lastName,
      phone,
      address,
    } = req.body || {};

    const profileImage = req.file;


    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);


    if (!existingUser) {
      return errorResponse(res, "User not found", 404);
    }


    const updateData = {};


    if (firstName !== undefined)
      updateData.firstName = firstName;

    if (lastName !== undefined)
      updateData.lastName = lastName;

    if (phone !== undefined)
      updateData.phone = phone;

    if (address !== undefined)
      updateData.address = address;


    if (profileImage) {
      updateData.profileImage =
        profileImage.path || profileImage.filename;
    }


    if (Object.keys(updateData).length === 0) {
      return errorResponse(
        res,
        "No data provided for update",
        400
      );
    }


    updateData.updatedAt = new Date();


    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));


    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);


    return successResponse(
      res,
      {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        phone: updatedUser.phone,
        address: updatedUser.address,
        profileImage: updatedUser.profileImage,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        lastLoginAt: updatedUser.lastLoginAt,
      },
      "Profile updated successfully",
      200
    );

  } catch (error) {
    console.error("Update profile error:", error);

    return errorResponse(
      res,
      error.message || "Failed to update profile",
      500
    );
  }
};

export const logoutUser = (req, res) => {
  try {
    const userId = req.user?.id;

    res.clearCookie("token", {
      httpOnly: true,
      secure: false, // true in production with HTTPS
      sameSite: "strict",
    });

  

    return successResponse(res, null, "Logout successful", 200);
  }
  catch (error) {
    console.error("Logout error:", error);
    return errorResponse(res, error.message || "Logout failed", 500);
  }
}
