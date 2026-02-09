import { Server } from "socket.io";
import Conversation from "../models/Conversationmodel.js";
import Message from "../models/Messagemodel.js";
import User from "../models/userModel.js";
import sendMessageService from "../services/message.service.js";
import messageSocket from "../sockets/message.socket.js";

// Map to track online users & their multiple tabs
const onlineUsers = new Map();

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  // Middleware to set socket.userId from auth
  io.use((socket, next) => {
    const { userId } = socket.handshake.auth;
    if (!userId) return next(new Error("Invalid user"));
    socket.userId = userId;
    next();
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    messageSocket(io, socket);

    console.log("⚡ Socket connected:", socket.id, "userId:", userId);

    socket.join(userId.toString()); // personal room

    // ===============================
    // 🟢 ONLINE USER (MULTI TAB SAFE)
    // ===============================
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, { sockets: new Set() });

      io.emit("userOnline", { userId });

      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: null,
      });
    }

    onlineUsers.get(userId).sockets.add(socket.id);

    socket.emit("onlineUsersSnapshot", {
      onlineUsers: Array.from(onlineUsers.keys()),
    });



    socket.on("getUnreadMessages", async ({ conversationIds }) => {
      try {
        const messages = await Message.find({
          conversationId: { $in: conversationIds },
          receiverId: socket.userId,
          read: false,
        })
          .populate("senderId", "name avatar.url")
          .populate("receiverId", "name avatar.url");

        const conversations = await Conversation.find({
          _id: { $in: conversationIds },
        }).populate("members", "name avatar.url");

        socket.emit("unreadMessages", {
          messages,
          conversations,
        });
      } catch (err) {
        console.error("❌ getUnreadMessages error:", err);
      }
    });

    


    socket.on("typing", async ({ conversationId, senderId, isTyping }) => {
      try {
        if (!conversationId || !senderId) return;

        // 1️⃣ Fetch only members (minimal query)
        const conversation = await Conversation.findById(conversationId)
          .select("members")
          .lean();

        if (!conversation) return;

        // 2️⃣ Security: sender must be part of conversation
        const isMember = conversation.members.some(
          (id) => id.toString() === senderId.toString(),
        );
        if (!isMember) return;

        // 3️⃣ Emit typing to OTHER members only
        conversation.members.forEach((memberId) => {
          if (memberId.toString() !== senderId.toString()) {
            io.to(memberId.toString()).emit("typing", {
              conversationId: conversationId.toString(),
              senderId: senderId.toString(),
              isTyping: Boolean(isTyping),
            });
          }
        });
      } catch (err) {
        console.error("❌ typing event error:", err);
      }
    });

    socket.on("disconnect", () => {
      if (!onlineUsers.has(userId)) return;

      const data = onlineUsers.get(userId);
      data.sockets.delete(socket.id);

      setTimeout(async () => {
        if (data.sockets.size === 0) {
          const lastSeen = new Date();
          onlineUsers.delete(userId);
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
          io.emit("userOffline", { userId, lastSeen });
        }
      }, 2000);
    });
  });

  return io;
};

export default initSocket;
