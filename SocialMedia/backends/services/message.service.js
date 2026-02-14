import Conversation from "../models/Conversationmodel.js";
import Message from "../models/Messagemodel.js";

const sendMessageService = async ({
  senderId,
  receiverId,
  text,
  conversationId,
}) => {
  if (!text) throw new Error("Text is required");

  let conversation;
  let isNew = false;

  // ===============================
  // 1️⃣ Get or create conversation
  // ===============================
  if (conversationId) {
    conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }
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

  // ===============================
  // 2️⃣ Security check
  // ===============================
  const isMember = conversation.members.some(
    (id) => id.toString() === senderId.toString(),
  );

  if (!isMember) throw new Error("Not allowed");

  const actualReceiverId = conversation.members.find(
    (id) => id.toString() !== senderId.toString(),
  );

  if (!actualReceiverId) throw new Error("Receiver not found");

  // ===============================
  // 3️⃣ Create message (DB SAVE ✅)
  // ===============================
  const message = await Message.create({
    conversationId: conversation._id,
    senderId,
    receiverId: actualReceiverId,
    text,
    read: false,
    delivered: false,
  });

 
  await Conversation.findByIdAndUpdate(conversation._id, {
    lastMessage: message._id,
    lastMessageAt: message.createdAt,
  });

  // ===============================
  // 5️⃣ Return clean response
  // ===============================
  return {
    message, // ✅ DB-saved message only
    conversationId: conversation._id,
    receiverId: actualReceiverId,
    isNew,
  };
};

export default sendMessageService;



