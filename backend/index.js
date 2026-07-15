import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from 'dotenv';
import userRouter from "./src/routes/userRoutes.service.js";
import studentRouter from "./src/routes/studentRoutes.service.js";
import teacherRouter from "./src/routes/teacherRoutes.service.js";
import classRouter from "./src/routes/classesRoutes.service.js";
import attendanceRouter from "./src/routes/attendanceRoutes.service.js";
import subjectRouter from "./src/routes/subjectRoutes.service.js";

dotenv.config();
const app = express();
const port = 3030;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Recreate __filename and __dirname in ES Modules
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json("hello");
});

app.use("/api/auth", userRouter);
app.use("/api/students", studentRouter);
app.use("/api/teachers", teacherRouter);
app.use("/api/classes", classRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/subjects", subjectRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
