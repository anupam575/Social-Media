import Notification from "../models/notificationModel.js";
import sendNotification from "../utils/sendNotification.js";

// ✅ UNIVERSAL CREATE NOTIFICATION
const addNotification  = async (req, res) => {
  try {
    console.log("🔹 Universal Notification Body:", req.body);

    const {
      userId,
      title,
      message,
      type = "alert",
      orderId = null,
      productId = null,
    } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "userId, title and message are required",
      });
    }

    const io = req.app.get("io");

    const notification = await sendNotification({
      io,
      userId,
      title,
      message,
      type,
      orderId,
      productId,
    });

    res.status(201).json({
      success: true,
      notification,
    });
  } catch (err) {
    console.error("❌ createNotification Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ MARK AS READ
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await Notification.updateOne(
      { _id: notificationId },
      { read: true }
    );

    res.status(200).json({ success: true, message: "Marked as read", result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ DELETE NOTIFICATION
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await Notification.deleteOne({ _id: notificationId });

    res.status(200).json({
      success: true,
      message: "Notification deleted",
      result,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ GET USER NOTIFICATIONS
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({ success: true, notifications });
  } catch (err) {
    console.error("❌ getUserNotifications Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ CLEAR ALL USER NOTIFICATIONS
const clearUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Notification.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: "All notifications cleared",
      result,
    });
  } catch (err) {
    console.error("❌ clearUserNotifications Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ EXPORT DEFAULT (as per your preference)
export default {
  addNotification,
  markAsRead,
  deleteNotification,
  getUserNotifications,
  clearUserNotifications,
};
