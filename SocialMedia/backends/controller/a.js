import Conversation from "../models/Conversationmodel.js";
import Message from "../models/Messagemodel.js";

const sendMessageService = async ({
  senderId,
  receiverId,
  text,
  conversationId,
}) => {
  if (!text) {
    throw new Error("Text is required");
  }

  let conversation;
  let isNew = false;

  // 1️⃣ Get or create conversation
  if (conversationId) {
    conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new Error("Conversation not found");
  } else {
    if (!receiverId) throw new Error("receiverId required");

    conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
        status: "pending",
        initiatedBy: senderId,
      });
      isNew = true;
    }
  }

  // 2️⃣ Security: sender must be member
  const isMember = conversation.members.some(
    (id) => id.toString() === senderId.toString()
  );
  if (!isMember) {
    throw new Error("Not allowed");
  }

  // 3️⃣ Resolve actual receiver
  const actualReceiverId = conversation.members.find(
    (id) => id.toString() !== senderId.toString()
  );
  if (!actualReceiverId) {
    throw new Error("Receiver not found");
  }

  // 4️⃣ Create message
  let message = await Message.create({
    conversationId: conversation._id,
    senderId,
    receiverId: actualReceiverId,
    text,
    read: false,
    delivered: false,
  });

  // 5️⃣ 🔥 Update conversation lastMessage (BEST PRACTICE)
  await Conversation.findByIdAndUpdate(conversation._id, {
    lastMessage: message._id,          // ✅ ObjectId
    lastMessageAt: message.createdAt,  // ✅ sorting ke liye
  });

  // 6️⃣ Populate message
  message = await Message.findById(message._id)
    .populate("senderId", "name avatar.url")
    .populate("receiverId", "name avatar.url");

  // 7️⃣ Populate conversation (socket + UI)
  const populatedConversation = await Conversation.findById(
    conversation._id
  )
    .populate("members", "name avatar.url")
    .populate({
      path: "lastMessage",
      populate: {
        path: "senderId",
        select: "name avatar.url",
      },
    });

  // 8️⃣ Socket-safe message
  const safeMessage = {
    ...message._doc,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt?.toISOString(),
  };

  return {
    message: safeMessage,
    conversation: populatedConversation,
    isNew,
    receiverId: actualReceiverId,
  };
};

export default sendMessageService;














import sendMessageService from "../services/message.service.js";

const messageSocket = (io, socket) => {
  socket.on(
    "sendMessage",
    async ({ senderId, receiverId, text, conversationId }, callback) => {
      try {
        if (senderId.toString() !== socket.userId.toString()) return;

        const result = await sendMessageService({
          senderId: socket.userId,
          receiverId,
          text,
          conversationId,
        });

        const { message, conversation, isNew, receiverId: actualReceiverId } =
          result;

        conversation.members.forEach((member) => {
          io.to(member._id.toString()).emit("newMessage", {
            message,
            conversation,
          });
        });

        if (isNew && conversation.status === "pending") {
          io.to(actualReceiverId.toString()).emit("newRequest", {
            conversation,
          });
        }

        callback?.(result);
      } catch (err) {
        callback?.({ error: err.message });
      }
    }
  );
};

export default messageSocket;
