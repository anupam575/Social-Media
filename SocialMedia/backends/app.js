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
   CORS CONFIG (FINAL)
========================= */

const allowedOrigins = [
  process.env.FRONTEND_URL?.trim(),
  "http://localhost:3000", // local dev
];

console.log("🌐 Allowed Origins:", allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    // allow Postman / server / health-check / preflight
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error("❌ CORS BLOCKED:", origin);
    return callback(null, false); // ❗ never throw error
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
  optionsSuccessStatus: 204,
};

// ✅ Apply CORS ONCE
app.use(cors(corsOptions));

// ✅ Preflight (MOST IMPORTANT)
app.options("*", cors(corsOptions));

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




