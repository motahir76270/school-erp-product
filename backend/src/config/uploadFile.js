// src/config/uploadFile.js
import multer from "multer";
import path from "path";
import fs from "fs";

// ==================== ENSURE UPLOAD DIRECTORIES EXIST ====================
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Create upload directories
const uploadDirs = ["uploads/profile", "uploads/qrcode"];
uploadDirs.forEach((dir) => ensureDirectoryExists(dir));

// ==================== STORAGE CONFIGURATION ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "profileImage") {
      cb(null, "uploads/profile/");
    } else if (file.fieldname === "qrcode") {
      cb(null, "uploads/qrcode/");
    }else if(file.fieldname === "post"){
      cb(null, "uploads/posts/");
    } else {
      cb(null, "uploads/");
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// ==================== FILE FILTER ====================
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"),
      false,
    );
  }
};

// ==================== MULTER CONFIG ====================
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// ==================== SINGLE FILE UPLOAD ====================
export const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

// ==================== MULTIPLE FILES UPLOAD ====================
export const uploadMultiple = (fieldName, maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

// ==================== FIELDS UPLOAD ====================
export const uploadFields = (fields) => {
  return upload.fields(fields);
};

// ==================== SINGLE FILE WITH ERROR HANDLING ====================
export const single = (fieldName) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);

    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "FILE_TOO_LARGE") {
          return res.status(400).json({
            success: false,
            message: "File too large. Maximum size is 5MB",
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  };
};

export default upload;
