import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import userRouter from "./src/routes/userRoutes.service.js";

const app = express();
const port = 3030;

// Recreate __filename and __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json("hello");
});

app.use("/auth", userRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});