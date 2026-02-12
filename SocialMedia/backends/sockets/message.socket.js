import sendMessageService from "../services/message.service.js";
import Message from "../models/Messagemodel.js";
import Conversation from "../models/Conversationmodel.js";
import mongoose from "mongoose";

const messageSocket = (io, socket) => {
  // ------------------- SEND MESSAGE -------------------
  socket.on(
    "sendMessage",
    async ({ receiverId, text, conversationId }, callback) => {
      try {
        if (!receiverId || !text) {
          return callback?.({ error: "Invalid payload" });
        }

        // SenderId from socket for security
        const result = await sendMessageService({
          senderId: socket.userId,
          receiverId,
          text,
          conversationId,
        });

        const { message, receiverId: actualReceiverId, conversationId: convId, isNew } = result;

        const payload = { message, conversationId: convId, isNew };

        // 1️⃣ Emit to receiver
        io.to(actualReceiverId.toString()).emit("newMessage", payload);

        // 2️⃣ Emit to sender (live update for self)
        io.to(socket.userId.toString()).emit("newMessage", payload);

        // 3️⃣ Optional ack
        callback?.(payload);
      } catch (err) {
        console.error("❌ sendMessage socket error:", err);
        callback?.({ error: err.message });
      }
    }
  );
// ------------------- MARK MESSAGE AS READ -------------------
socket.on("markMessageRead", async ({ conversationId, messageIds }) => {
  if (!conversationId || !Array.isArray(messageIds) || !messageIds.length) return;

  try {
    // 1️⃣ Update unread messages for current user
    const updateResult = await Message.updateMany(
      { _id: { $in: messageIds }, receiverId: socket.userId, read: false },
      { $set: { read: true } }
    );

    const readCount = updateResult.modifiedCount || 0;

    // 2️⃣ Get conversation members
    const conversation = await Conversation.findById(conversationId).select("members").lean();

    // 3️⃣ Emit "messageRead" to all members in conversation
    if (conversation) {
      io.to(conversationId.toString()).emit("messageRead", {
        conversationId,
        messageIds,
        readerId: socket.userId,
      });
    }

    // 4️⃣ Confirm to the reader
    socket.emit("messageReadConfirmed", { conversationId, messageIds, readCount });
  } catch (err) {
    console.error("❌ markMessageRead error:", err);
  }
});

};

export default messageSocket;


