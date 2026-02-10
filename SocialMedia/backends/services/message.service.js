import Conversation from "../models/Conversationmodel.js";
import Message from "../models/Messagemodel.js";

const sendMessageService = async ({ senderId, receiverId, text, conversationId }) => {
  if (!text) throw new Error("Text is required");

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
  const isMember = conversation.members.some(id => id.toString() === senderId.toString());
  if (!isMember) throw new Error("Not allowed");

  const actualReceiverId = conversation.members.find(id => id.toString() !== senderId.toString());
  if (!actualReceiverId) throw new Error("Receiver not found");

  // 3️⃣ Create message
  let message = await Message.create({
    conversationId: conversation._id,
    senderId,
    receiverId: actualReceiverId,
    text,
    read: false,
    delivered: false,
  });

  // 4️⃣ Update conversation lastMessage (for inbox sorting)
  await Conversation.findByIdAndUpdate(conversation._id, {
    lastMessage: message._id,
    lastMessageAt: message.createdAt,
  });

  // 5️⃣ Populate message sender + receiver info for frontend
  message = await Message.findById(message._id)
    .populate("senderId", "name avatar.url")
    .populate("receiverId", "name avatar.url");

  return {
    message,                    // ✅ populated message
    isNew,
    conversation,
    conversationId: conversation._id, // ✅ conversation reference
    receiverId: actualReceiverId,
  };
};

export default sendMessageService;
