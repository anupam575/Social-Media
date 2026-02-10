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

        const { message, receiverId: actualReceiverId } = result;

        // Emit to receiver
        io.to(actualReceiverId.toString()).emit("newMessage", { message });

        // Emit to sender
        io.to(senderId.toString()).emit("newMessage", { message });

        io.to(actualReceiverId.toString()).emit("newMessage", {
          message,
          conversation, // poora object send
        });

        io.to(senderId.toString()).emit("newMessage", {
          message,
          conversation,
        });

        callback?.(result);
      } catch (err) {
        callback?.({ error: err.message });
      }
    },
  );
};

export default messageSocket;
