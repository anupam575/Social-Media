import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import userRoutes from "./route/userRoute.js";
import postRoutes from "./route/postRoute.js";
import messageRoutes from "./route/messageRoute.js";

dotenv.config();

const app = express();

// ✅ Frontend URL ONLY from ENV
const FRONTEND_URL = process.env.FRONTEND_URL?.trim();

if (!FRONTEND_URL) {
  console.error("❌ FRONTEND_URL is missing in environment variables");
}

// ✅ CORS (ONLY ENV, NO localhost)
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =========================
   ROUTES
========================= */

// 🔐 Auth / User
app.use("/api/v1", userRoutes);

// 🖼️ Posts / Messages
app.use("/api/v1", postRoutes);
app.use("/api/v1", messageRoutes);

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.status(200).send("✅ Backend running perfectly!");
});

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

export default app;





