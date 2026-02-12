import API from "../../../utils/axiosInstance";

/**
 * Marks unread messages as read for the current user in a conversation.
 * 
 * @param {Object[]} messages - List of message objects
 * @param {string} conversationId - Current conversation ID
 * @param {string} userId - Current user ID (receiver)
 * @returns {number} readCount - Number of messages marked as read
 */
export const handleMessageRead = async ({ messages, conversationId, userId }) => {
  if (!conversationId || !messages?.length || !userId) return 0;

  // 🔹 Sirf receiver ke unread messages filter karo
  const unreadMessageIds = messages
    .filter(msg => String(msg.receiverId?._id) === userId && !msg.read)
    .map(msg => String(msg._id));

  if (!unreadMessageIds.length) return 0;

  try {
    const response = await API.post("/messages/read", {
      conversationId,
      messageIds: unreadMessageIds,
    });

    // Optional: backend se readCount return ho sakta hai
    return response?.data?.readCount || unreadMessageIds.length;
  } catch (err) {
    console.error("❌ Failed to mark messages read:", err);
    return 0;
  }
};
