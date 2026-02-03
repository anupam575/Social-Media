import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import userRoutes from "./route/userRoute.js";
import postRoutes from "./route/postRoute.js";
import messageRoutes from "./route/messageRoute.js";

dotenv.config();

const app = express();

// ✅ Load environment variables
dotenv.config();
const FRONTEND_URL = process.env.FRONTEND_URL?.trim() || "http://localhost:3000";
console.log("✅ FRONTEND_URL Loaded:", FRONTEND_URL);

// ✅ CORS configuration (production ready)
app.use(
  cors({
    origin: [FRONTEND_URL, "http://localhost:3000"], // allowed frontend origins
    credentials: true, // cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"], // ✅ include Cache-Control
  })
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", FRONTEND_URL);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control"); // ✅ include Cache-Control

  if (req.method === "OPTIONS") {
    return res.sendStatus(204); // Preflight response
  }

  next();
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =========================
   ROUTES
========================= */

// 🔐 User / Auth routes
app.use("/api/v1", userRoutes);

// 🖼️ Post / Feed / Like / Comment routes
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
