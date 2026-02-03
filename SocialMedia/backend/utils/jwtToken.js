import { formatUser } from "../utils/formatUser.js";

const sendToken = async (user, statusCode, res) => {
  // ✅ user से token generate करो
  const accessToken = user.getAccessToken();
  const refreshToken = user.getRefreshToken();

  // ✅ refresh token DB में save करो
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const isProduction = process.env.NODE_ENV === "production";

  // ✅ cookie options
  const cookieOptions = (expiresIn) => ({
    expires: new Date(Date.now() + expiresIn),
    httpOnly: true, // client-side JS access नहीं कर सकता
    secure: isProduction && process.env.USE_HTTPS === "true", // production + HTTPS required
    sameSite: isProduction ? "None" : "Lax", // cross-site cookies safe
    path: "/",
  });

  // ✅ response भेजो और cookies set करो
  res
    .status(statusCode)
    .cookie("accessToken", accessToken, cookieOptions(15 * 60 * 1000)) // 15 min
    .cookie("refreshToken", refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000)) // 7 days
    .json({
      success: true,
      accessToken,
      refreshToken,
      user: formatUser(user),
    });
};

export default sendToken;
