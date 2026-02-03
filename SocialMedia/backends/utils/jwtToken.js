import { formatUser } from "../utils/formatUser.js";

/**
 * Send access + refresh tokens to client and set cookies.
 * Production-ready: secure cookies + cross-domain safe
 */
const sendToken = async (user, statusCode, res) => {
  try {
    // 🔐 Generate tokens
    const accessToken = user.getAccessToken();
    const refreshToken = user.getRefreshToken();

    // 💾 Save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const isProduction = process.env.NODE_ENV === "production";

    // 🍪 Cookie options (production-safe)
    const cookieOptions = (expiresIn) => ({
      expires: new Date(Date.now() + expiresIn),
      httpOnly: true,            // client-side JS cannot access
      secure: isProduction,      // must in production (HTTPS)
      sameSite: isProduction ? "None" : "Lax", // cross-domain safe
      path: "/",
    });

    // 🚀 Send response + set cookies
    res
      .status(statusCode)
      .cookie("accessToken", accessToken, cookieOptions(15 * 60 * 1000)) // 15 min
      .cookie("refreshToken", refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000)) // 7 days
      .json({
        success: true,
        user: formatUser(user),
        accessToken,
        refreshToken,
      });

    console.log(`✅ Tokens sent for user: ${user.email}`);
  } catch (err) {
    console.error("💥 sendToken error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error while sending tokens",
    });
  }
};

export default sendToken;


