import { formatUser } from "../utils/formatUser.js";

const sendToken = async (user, statusCode, res) => {
  // 🔐 Generate tokens
  const accessToken = user.getAccessToken();
  const refreshToken = user.getRefreshToken();

  // 💾 Save refresh token in DB
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const isProduction = process.env.NODE_ENV === "production";

  // 🍪 Cookie options (Render / Production SAFE)
  const cookieOptions = (expiresIn) => ({
    expires: new Date(Date.now() + expiresIn),
    httpOnly: true,
    secure: isProduction,          // ✅ FIXED (Render needs this)
    sameSite: isProduction ? "None" : "Lax",
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
};

export default sendToken;

