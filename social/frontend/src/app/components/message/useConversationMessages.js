import { useEffect, useRef, useState, useCallback } from "react";
import socket from "../../../utils/socket";
import { getMessages } from "./getMessagesLogic";

export const useConversationMessages = (conversationId, userId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [otherUserState, setOtherUserState] = useState(null);

  const messagesContainerRef = useRef(null);
  const isUserAtBottomRef = useRef(true);

  // -------------------- FETCH INITIAL MESSAGES --------------------
  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);

    const fetchMessages = async () => {
      try {
        const data = await getMessages({ conversationId });
        if (!data) return;

        setMessages(data.messages || []);

        const other = data.conversation.members.find(
          (m) => String(m._id) !== userId
        );
        if (other) setOtherUserState(other);

      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId, userId]);

  // -------------------- SOCKET JOIN/LEAVE --------------------
  useEffect(() => {
    if (!conversationId) return;

    socket.emit("joinConversation", conversationId);
    return () => socket.emit("leaveConversation", conversationId);
  }, [conversationId]);

  // -------------------- SOCKET EVENTS --------------------
  useEffect(() => {
    if (!conversationId || !userId) return;

    // MESSAGE DELIVERED
    const handleDelivered = ({ conversationId: convId, messageIds }) => {
      if (convId !== conversationId || !messageIds?.length) return;

      setMessages((prev) =>
        prev.map((m) =>
          String(m.senderId) === String(userId) && messageIds.includes(m._id)
            ? { ...m, delivered: true }
            : m
        )
      );
    };

    // MESSAGE READ
    const handleRead = ({ conversationId: convId, messageIds, readerId }) => {
      if (convId !== conversationId || String(readerId) === String(userId))
        return;

      setMessages((prev) =>
        prev.map((m) =>
          String(m.senderId) === String(userId) && messageIds.includes(m._id)
            ? { ...m, read: true }
            : m
        )
      );
    };

    // NEW MESSAGE
    const handleNewMessage = ({ message, conversationId: convId }) => {
      if (convId !== conversationId) return;

      setMessages((prev) => {
        const map = new Map(prev.map((m) => [m._id, m]));
        const existing = map.get(message._id);
        map.set(message._id, { ...existing, ...message });
        return Array.from(map.values());
      });

      // DELIVERED
      if (String(message.receiverId) === String(userId)) {
        socket.emit("messageDelivered", {
          conversationId: convId,
          messageIds: [message._id],
        });

        // READ
        if (!message.read) {
          socket.emit("markMessageRead", {
            conversationId: convId,
            messageIds: [message._id],
          });

          setMessages((prev) =>
            prev.map((m) =>
              m._id === message._id ? { ...m, delivered: true, read: true } : m
            )
          );
        }
      }
    };

    // MESSAGE DELETED
    const handleDeleted = ({ conversationId: convId, messageIds }) => {
      if (convId !== conversationId) return;
      setMessages((prev) =>
        prev.filter((m) => !messageIds.map(String).includes(String(m._id)))
      );
    };

    // UNREAD MESSAGES
    const handleUnread = ({ messages: incomingMessages }) => {
      if (!Array.isArray(incomingMessages) || !incomingMessages.length) return;

      const filtered = incomingMessages.filter(
        (m) => String(m.receiverId?._id || m.receiverId) === String(userId)
      );
      if (!filtered.length) return;

      const messageIds = filtered.map((m) => m._id);

      setMessages((prev) => {
        const map = new Map(prev.map((m) => [m._id, m]));
        filtered.forEach((m) => map.set(m._id, { ...m, delivered: true, read: true }));
        return Array.from(map.values()).sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      });

      socket.emit("messageDelivered", { conversationId, messageIds });
      socket.emit("markMessageRead", { conversationId, messageIds });
    };

    socket.on("messageDelivered", handleDelivered);
    socket.on("messageRead", handleRead);
    socket.on("newMessage", handleNewMessage);
    socket.on("messageDeleted", handleDeleted);
    socket.on("unreadMessages", handleUnread);

    // Request unread messages on mount
    socket.emit("getUnreadMessages", { conversationIds: [conversationId] });

    return () => {
      socket.off("messageDelivered", handleDelivered);
      socket.off("messageRead", handleRead);
      socket.off("newMessage", handleNewMessage);
      socket.off("messageDeleted", handleDeleted);
      socket.off("unreadMessages", handleUnread);
    };
  }, [conversationId, userId]);

  // -------------------- SCROLL LOGIC --------------------
  const scrollToBottom = useCallback((smooth = true) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const threshold = 80;
          const distanceFromBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight;
          isUserAtBottomRef.current = distanceFromBottom < threshold;
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto scroll on new messages
  useEffect(() => {
    if (isUserAtBottomRef.current) scrollToBottom(true);
  }, [messages, scrollToBottom]);

  // Scroll to bottom on conversation open
  useEffect(() => {
    requestAnimationFrame(() => scrollToBottom(false));
  }, [conversationId, scrollToBottom]);

  return {
    messages,
    setMessages,
    loading,
    otherUserState,
    messagesContainerRef,
    scrollToBottom,
  };
};