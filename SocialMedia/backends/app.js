import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import userRoutes from "./route/userRoute.js";
import postRoutes from "./route/postRoute.js";
import messageRoutes from "./route/messageRoute.js";

/* =========================
   ENV CONFIG
========================= */
dotenv.config();

const app = express();

/* =========================
   CORS CONFIG (ENV BASED)
========================= */

// FRONTEND_URL can be:
// - http://localhost:3000
// - https://your-vercel-app.vercel.app
const FRONTEND_URL = process.env.FRONTEND_URL?.trim();

if (!FRONTEND_URL) {
  console.warn("⚠️ FRONTEND_URL is not defined in .env");
}

console.log("🌐 Allowed Frontend:", FRONTEND_URL);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server / postman requests
      if (!origin) return callback(null, true);

      if (origin === FRONTEND_URL) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
  })
);

/* =========================
   MIDDLEWARES
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =========================
   ROUTES
========================= */
app.use("/api/v1", userRoutes);
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


