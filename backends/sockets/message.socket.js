import sendMessageService from "../services/message.service.js";
import Message from "../models/Messagemodel.js";
import Conversation from "../models/Conversationmodel.js";
const messageSocket = (io, socket) => {

  socket.on(
    "sendMessage",
    async ({ receiverId, text, conversationId }, callback) => {
      try {
        if (!receiverId || !text || !conversationId) {
          return callback?.({ error: "Invalid payload" });
        }

        // 1️⃣ Save message in DB (source of truth)
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

        const payload = {
          message,
          conversationId: convId,
          isNew,
        };

        // 2️⃣ Send message to receiver (all devices)
        io.to(actualReceiverId.toString()).emit("newMessage", payload);

        // 3️⃣ Send message to sender (sync all devices)
        io.to(socket.userId.toString()).emit("newMessage", payload);

        // 🔥 4️⃣ UPDATE UNREAD COUNT (REAL-TIME BADGE FIX)
        const unreadCount = await Message.countDocuments({
          receiverId: actualReceiverId,
          read: false,
        });

        io.to(actualReceiverId.toString()).emit("unreadCount", {
          count: unreadCount,
        });

        callback?.(payload);
      } catch (err) {
        console.error("❌ sendMessage socket error:", err);
        callback?.({ error: err.message });
      }
    }
  );

  /* ======================================================
     JOIN / LEAVE CONVERSATION (UI helper only)
     ====================================================== */
  socket.on("joinConversation", (conversationId) => {
    if (!conversationId) return;
    socket.join(conversationId.toString());
  });

  socket.on("leaveConversation", (conversationId) => {
    if (!conversationId) return;
    socket.leave(conversationId.toString());
  });

  socket.on("messageDelivered", async ({ conversationId, messageIds }) => {
  if (!Array.isArray(messageIds) || !messageIds.length) return;

  try {
    // 1️⃣ Update
    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
        conversationId,
        receiverId: socket.userId,
        delivered: false,
      },
      { $set: { delivered: true } }
    );

    if (!result.modifiedCount) return;

    // 2️⃣ Get senderIds (unique)
    const messages = await Message.find({
      _id: { $in: messageIds },
    }).select("senderId");

    const senderIds = [...new Set(messages.map(m => m.senderId.toString()))];

    // 3️⃣ Notify all senders
    senderIds.forEach(senderId => {
      io.to(senderId).emit("messageDelivered", {
        conversationId,
        messageIds,
        receiverId: socket.userId,
      });
    });

  } catch (err) {
    console.error("❌ messageDelivered error:", err);
  }
});


socket.on("markAllDelivered", async () => {
  try {
    const messages = await Message.find({
      receiverId: socket.userId,
      delivered: false,
    }).select("_id senderId conversationId");

    if (!messages.length) return;

    const ids = messages.map(m => m._id);

    // ✅ DB update
    await Message.updateMany(
      { _id: { $in: ids } },
      { $set: { delivered: true } }
    );

    // ✅ notify senders
    const senderMap = {};

    messages.forEach(m => {
      const sender = m.senderId.toString();
      if (!senderMap[sender]) senderMap[sender] = [];
      senderMap[sender].push(m._id);
    });

    Object.entries(senderMap).forEach(([senderId, messageIds]) => {
      io.to(senderId).emit("messageDelivered", {
        conversationId: null,
        messageIds,
        receiverId: socket.userId,
      });
    });

  } catch (err) {
    console.error(err);
  }
});


socket.on("markMessageRead", async ({ conversationId, messageIds }) => {
  if (!Array.isArray(messageIds) || !messageIds.length) return;

  try {
    // 1️⃣ Mark as read
    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
        conversationId,
        receiverId: socket.userId,
        read: false,
      },
      { $set: { read: true } }
    );

    if (!result.modifiedCount) return;

    // 2️⃣ Get sender
    const firstMsg = await Message.findOne({
      _id: messageIds[0],
    })
      .select("senderId")
      .lean();

    if (!firstMsg) return;

    // 3️⃣ Notify sender (read receipt)
    io.to(firstMsg.senderId.toString()).emit("messageRead", {
      conversationId,
      messageIds,
      readerId: socket.userId,
    });

    // 🔥 4️⃣ PRO: no DB count
    io.to(socket.userId.toString()).emit("refreshUnreadCount");

    // 5️⃣ Optional confirm
    io.to(socket.userId.toString()).emit("messageReadConfirmed", {
      conversationId,
      messageIds,
    });

  } catch (err) {
    console.error("❌ markMessageRead error:", err);
  }
});
}

export default messageSocket;