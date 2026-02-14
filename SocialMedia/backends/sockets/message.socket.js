import sendMessageService from "../services/message.service.js";
import Message from "../models/Messagemodel.js";
import Conversation from "../models/Conversationmodel.js";

const messageSocket = (io, socket) => {

  // ===================== SEND MESSAGE =====================
  socket.on("sendMessage", async ({ receiverId, text, conversationId }, callback) => {
    try {
      if (!receiverId || !text || !conversationId) {
        return callback?.({ error: "Invalid payload" });
      }

      // 1️⃣ Save message in DB
      const result = await sendMessageService({
        senderId: socket.userId,
        receiverId,
        text,
        conversationId,
      });

      const {
        message,
        receiverId: actualReceiverId,
        conversationId: convId,
        isNew,
      } = result;

      const payload = { message, conversationId: convId, isNew };

      // 2️⃣ Emit message to RECEIVER
      io.to(actualReceiverId.toString()).emit("newMessage", payload);

      // 3️⃣ Emit message to SENDER (self update)
      io.to(socket.userId.toString()).emit("newMessage", payload);

      callback?.(payload);
    } catch (err) {
      console.error("❌ sendMessage socket error:", err);
      callback?.({ error: err.message });
    }
  });

  // ===================== JOIN / LEAVE CONVERSATION =====================
  socket.on("joinConversation", (conversationId) => {
    if (!conversationId) return;
    socket.join(conversationId.toString());
  });

  socket.on("leaveConversation", (conversationId) => {
    if (!conversationId) return;
    socket.leave(conversationId.toString());
  });

  // ===================== MESSAGE DELIVERED (SINGLE TICK) =====================
  socket.on("messageDelivered", async ({ conversationId, messageIds }) => {
    if (!conversationId || !Array.isArray(messageIds) || !messageIds.length) return;

    try {
      // 1️⃣ Update delivered = true
      const result = await Message.updateMany(
        {
          _id: { $in: messageIds },
          receiverId: socket.userId,
          delivered: false,
        },
        { $set: { delivered: true } }
      );

      if (!result.modifiedCount) return;

      // 2️⃣ Notify sender (single tick)
      io.to(conversationId.toString()).emit("messageDelivered", {
        conversationId,
        messageIds,
        receiverId: socket.userId,
      });
    } catch (err) {
      console.error("❌ messageDelivered error:", err);
    }
  });

  // ===================== MESSAGE READ (DOUBLE TICK) =====================
  socket.on("markMessageRead", async ({ conversationId, messageIds }) => {
    if (!conversationId || !Array.isArray(messageIds) || !messageIds.length) return;

    try {
      // 1️⃣ Update read = true
      const result = await Message.updateMany(
        {
          _id: { $in: messageIds },
          receiverId: socket.userId,
          read: false,
        },
        { $set: { read: true } }
      );

      if (!result.modifiedCount) return;

      // 2️⃣ Notify both users (double tick)
      io.to(conversationId.toString()).emit("messageRead", {
        conversationId,
        messageIds,
        readerId: socket.userId,
      });

      // 3️⃣ Optional confirmation to reader
      socket.emit("messageReadConfirmed", {
        conversationId,
        messageIds,
      });
    } catch (err) {
      console.error("❌ markMessageRead error:", err);
    }
  });
};

export default messageSocket;


