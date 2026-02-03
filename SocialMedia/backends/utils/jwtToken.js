import { formatUser } from "../utils/formatUser.js";

const sendToken = async (user, statusCode, res) => {
  try {
    // 🔐 Generate tokens
    const accessToken = user.getAccessToken();
    const refreshToken = user.getRefreshToken();

    // 💾 Save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const isProduction = process.env.NODE_ENV === "production";

    // 🍪 Cookie options (Production SAFE → force None)
    const cookieOptions = (expiresIn) => ({
      expires: new Date(Date.now() + expiresIn),
      httpOnly: true,
      secure: isProduction,   // ✅ HTTPS only in production
      sameSite: "None",       // ✅ force None for cross-domain
      path: "/",
    });

    // 🚀 Send response + set cookies
    res
      .status(statusCode)
      .cookie("accessToken", accessToken, cookieOptions(15 * 60 * 1000)) // 15 min
      .cookie(
        "refreshToken",
        refreshToken,
        cookieOptions(7 * 24 * 60 * 60 * 1000) // 7 days
      )
      .json({
        success: true,
        user: formatUser(user),
      });

    // 📝 Debugging logs only in production
    if (isProduction) {
      console.log("✅ Tokens sent for user:", user.email);
      console.log("🔐 Access Token (cookie):", accessToken);
      console.log("🔐 Refresh Token (cookie):", refreshToken);
      console.log("🍪 Cookie Options (Access):", cookieOptions(15 * 60 * 1000));
      console.log("🍪 Cookie Options (Refresh):", cookieOptions(7 * 24 * 60 * 60 * 1000));
    }
  } catch (err) {
    console.error("💥 sendToken error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error while sending tokens",
    });
  }
};

export default sendToken;


