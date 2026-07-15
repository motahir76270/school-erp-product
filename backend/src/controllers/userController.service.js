// src/controllers/userController.js
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/db.js";
import { users } from "../db/schema/users.js";
import { generateToken } from "../config/auth.js";
import { successResponse, errorResponse } from "../lib/response.js";
import { transporter } from "../config/mail.js";

// ==================== USER LOGIN ====================
export const userLogin = async (req, res) => {
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

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }
    return successResponse(res, user, "User profile retrieved successfully", 200);
  } catch (error) {
    console.error("Get profile error:", error);
    return errorResponse(res, error.message || " Failed to retrieve user profile", 500);
  }
}

// ==================== USER REGISTER ====================
export const userCreate = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phone, address } =
      req.body;
      let profileImage = req.file;
       const img = profileImage.path.replace(/\\/g, "/")


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
    const id = uuidv4();

    // Insert user
    await db.insert(users).values({
      id: id,
      email,
      password, // Hash before saving in production
      firstName,
      lastName,
      profileImage:img || null,
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
    const profileImage = req.file;

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

   if (profileImage) {
      updateData.profileImage =
        profileImage.path.replace(/\\/g, "/")
    }

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

// ==================== USER RESET PASSWORD ====================
export const userRestPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    if(!email) {
      errorResponse(res, "Email is required", 400);
    }

    const [exisiting] = await db.select()
    .from(users)
    .where(eq(users.email, email));

    if(!exisiting){
      errorResponse(res, "User not found", 404);
    }

    const token = generateToken({
      id: exisiting.id,
      email: exisiting.email,
      role: exisiting.role,
    });

    await db
      .update(users)
      .set({resetPasswordToken:token})
      .where(eq(users.email, email));
  

    const info = await transporter.sendMail({
      from: `"XYZ School" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px;">
          <table align="center" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden;">
            <tr>
              <td style="background:#4F46E5; padding:20px; text-align:center;">
                <h1 style="color:#ffffff; margin:0;">XYZ School</h1>
              </td>
            </tr>
    
            <tr>
              <td style="padding:40px;">
                <h2 style="color:#333;">Reset Your Password</h2>
    
                <p style="color:#555; line-height:1.6;">
                  We received a request to reset your password.
                  Click the button below to create a new password.
                </p>
    
                <div style="text-align:center; margin:35px 0;">
                  <a
                    href="${process.env.FRONTEND_URL}/reset-password?token=${token}"
                    style="
                      background:#4F46E5;
                      color:#fff;
                      text-decoration:none;
                      padding:15px 35px;
                      border-radius:6px;
                      font-size:16px;
                      display:inline-block;
                    "
                  >
                    Reset Password
                  </a>
                </div>
    
                <p style="color:#777;">
                  If you didn't request a password reset, you can safely ignore this email.
                </p>
    
                <hr style="border:none;border-top:1px solid #eee;margin:30px 0;" />
    
                <p style="font-size:12px;color:#999;text-align:center;">
                  © ${new Date().getFullYear()} Your App Name. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </div>
      `,
    });
 
    successResponse(res, "Reset password link sent successfully on email", 200);
  
  } catch (error) {
    console.error("Reset password error:", error);
    return errorResponse(res, error.message || "Failed to send reset password email", 500);
  }
}

// ==================== USER RESET PASSWORD   VERIFY ====================
export const userResetPasswordToken = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if(newPassword !== confirmPassword ){
      return errorResponse(res, "newPassword and ConfirmPassword mismatch")
    }

    if (!token || !newPassword || !confirmPassword) {
      return errorResponse(
        res,
        `${!token ? "Token" : !newPassword ? "New password" : "Confirm password"} is required`,
        400,
      );
    }

    console.log(token)

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.resetPasswordToken, token.trim()))

    if (!existing) {
      return errorResponse(res, "User not found", 404);
    }


    await db
      .update(users)
      .set({
        password: newPassword,
        resetPasswordToken: null,
      })
      .where(eq(users.resetPasswordToken, token));

    await transporter.sendMail({
      from: `"xyz school" <${process.env.EMAIL_USER}>`,
      to: existing.email,
      subject: "Your New Password",
      html: `
        <div style="font-family:Arial;background:#f4f4f4;padding:40px;">
          <table width="600" align="center" style="background:white;padding:30px;border-radius:10px;">
            <tr>
              <td>
                <h2 style="color:#4F46E5;">
                  Password Reset Successful
                </h2>

                <p>Your temporary password is:</p>

                <div style="
                  background:#f1f1f1;
                  padding:15px;
                  font-size:22px;
                  font-weight:bold;
                  text-align:center;
                  border-radius:6px;
                ">
                  ${newPassword}
                </div>

                <p>
                  Please login and change your password immediately.
                </p>

                <p style="color:#777;">
                  If you did not request this change, contact support.
                </p>
              </td>
            </tr>
          </table>
        </div>
      `,
    });

    return successResponse(
      res,
      "New password sent successfully to your email",
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Failed to reset password", 500);
  }
};

// ==================== USER CHANGE PASSWORD ====================
export const userPasswordChange = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    const { currentPassword, newPassword } = req.body || {};

    if (!newPassword) {
      return errorResponse(res, "New password is required", 400);
    }

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      return errorResponse(res, "User not found", 404);
    }

    // Update password
    await db
      .update(users)
      .set({ password: newPassword })
      .where(and(eq(users.password, currentPassword), eq(users.id, userId)));

    return successResponse(res, null, "Password reset successfully", 200);
  } catch (error) {
    console.error("Reset password error:", error);
    return errorResponse;
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
        profileImage.path.replace(/\\/g, "/");
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

// ==================== GET All USER  ====================
export const getAllUsers = async (req, res) => {
  const id = req.user.id;

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = 10;
  const offset = (page - 1) * limit;

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, id));

  if (!existing) {
    return errorResponse(res, "User not found", 404);
  }

  const allUsers = await db
    .select()
    .from(users)
    .limit(limit)
    .offset(offset);

  return successResponse(
    res,
    {
      page,
      limit,
      data: allUsers,
    },
    200 
  );
};

// ==================== Create USER BY SUPER admin ====================
export const userCreateByadmin = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phone } = req.body;
    const profileImage = req.file;
    const userId = req.user.id;

    // Validate input
    if (!email || !password || !firstName || !lastName || !role) {
      return errorResponse(
        res,
        "All fields are required: email, password, firstName, lastName, role",
        400
      );
    }

    // Check if email already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser) {
      return errorResponse(res, "User with this email already exists", 409);
    }

    // Generate UUID
    const id = uuidv4();

    // Normalize image path
    const imagePath = profileImage
      ? profileImage.path.replace(/\\/g, "/")
      : null;

    // Insert user
    await db.insert(users).values({
      id,
      userId,
      email,
      password,
      firstName,
      lastName,
      role,
      phone: phone || null,
      address: null,
      profileImage: imagePath,
      isActive: true,
    });

    // Fetch newly created user
    const [newUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (!newUser) {
      return errorResponse(res, "Failed to retrieve created user", 500);
    }


    return successResponse(
      res,
      newUser,
      "User registered successfully",
      201
    );
  } catch (error) {
    console.error("Register error:", error);
    return errorResponse(
      res,
      error.message || "Registration failed",
      500
    );
  }
};

// ==================== GET USER BY ID ====================
export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUserId = req.user?.id;
    const requestingUserRole = req.user?.role;


    // Check authentication
    if (!requestingUserId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    // Validate user ID
    if (!userId) {
      return errorResponse(res, "User ID is required", 400);
    }

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, requestingUserId))
      .limit(1);

    if (!existingUser) {
      return errorResponse(res, "User not found", 404);
    }

    // Get target user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return errorResponse(res, "Target user not found", 404);
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

        res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true in production with HTTPS
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(
      res,
      {user ,token},
      "User fetched successfully",
      200
    );
  } catch (error) {
    console.error("Get user by ID error:", error);
    return errorResponse(
      res,
      error.message || "Failed to fetch user",
      500
    );
  }
};

// ==================== UPDATE USER BY ID ====================
export const updateUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if target user exists
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return errorResponse(res, "User not found", 404);
    }

    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      address, 
      role, 
      isActive,
      password 
    } = req.body || {};
    const profileImage = req.file;

    const updateData = {};

    if (profileImage) {
      updateData.profileImage =
        profileImage.path.replace(/\\/g, "/");
    }

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Only super_admin can update role
    if (role !== undefined) {
      if (adminRole !== "super_admin") {
        return errorResponse(res, "Only super_admin can update user roles", 403);
      }
      const validRoles = ["super_admin", "admin", "teacher", "student"];
      if (!validRoles.includes(role)) {
        return errorResponse(
          res,
          "Invalid role. Must be: super_admin, admin, teacher, student",
          400
        );
      }
      updateData.role = role;
    }

    // Update password if provided
    if (password !== undefined) {
      if (password.length < 6) {
        return errorResponse(res, "Password must be at least 6 characters", 400);
      }
      updateData.password = password;
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, "No data provided for update", 400);
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

    const { password: _, resetPasswordToken: __, ...userData } = updatedUser;

    return successResponse(
      res,
      userData,
      "User updated successfully",
      200
    );
  } catch (error) {
    console.error("Update user by ID error:", error);
    return errorResponse(
      res,
      error.message || "Failed to update user",
      500
    );
  }
};

// ==================== UPDATE USER ROLE ====================
export const updateUserRoleById = async (req, res) => {
  try {
    const userId = req.params.id;
    const adminId = req.user?.id;
    const adminRole = req.user?.role;
    const { role } = req.body || {};

    // Check authentication
    if (!adminId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    // Validate inputs
    if (!userId) {
      return errorResponse(res, "User ID is required", 400);
    }

    if (!role) {
      return errorResponse(res, "Role is required", 400);
    }

    // Check if admin exists
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, adminId))
      .limit(1);

    if (!adminUser) {
      return errorResponse(res, "Admin user not found", 404);
    }

    // Check if target user exists
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return errorResponse(res, "User not found", 404);
    }

    // Only super_admin can update roles
    if (adminRole !== "super_admin") {
      return errorResponse(res, "Unauthorized: Only super_admin can update user roles", 403);
    }

    // Prevent self-role update
    if (userId === adminId) {
      return errorResponse(res, "Cannot update your own role", 403);
    }

    // Validate role
    const validRoles = ["super_admin", "admin", "teacher", "student"];
    if (!validRoles.includes(role)) {
      return errorResponse(
        res,
        "Invalid role. Must be: super_admin, admin, teacher, student",
        400
      );
    }

    // Update role
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

    const { password, resetPasswordToken, ...userData } = updatedUser;

    return successResponse(
      res,
      userData,
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

// ==================== DELETE USER ====================
export const deleteUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const adminId = req.user?.id;
    const adminRole = req.user?.role;

    // Check authentication
    if (!adminId) {
      return errorResponse(res, "User not authenticated", 401);
    }

    // Validate user ID
    if (!userId) {
      return errorResponse(res, "User ID is required", 400);
    }

    // Check if admin exists
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, adminId))
      .limit(1);

    if (!adminUser) {
      return errorResponse(res, "Admin user not found", 404);
    }

    // Check if target user exists
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return errorResponse(res, "User not found", 404);
    }

    // Authorization
    if (adminRole !== "super_admin" && adminRole !== "admin") {
      return errorResponse(res, "Unauthorized: Only admins can delete users", 403);
    }

    // Only super_admin can delete super_admin
    if (targetUser.role === "super_admin" && adminRole !== "super_admin") {
      return errorResponse(res, "Unauthorized: Only super_admin can delete super_admin users", 403);
    }

    // Prevent self-deletion
    if (userId === adminId) {
      return errorResponse(res, "Cannot delete your own account", 403);
    }

    // Delete user
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



