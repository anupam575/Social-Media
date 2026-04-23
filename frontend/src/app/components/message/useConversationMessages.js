"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import socket from "../../../utils/socket";
import { getMessages } from "./getMessagesLogic";

export const useConversationMessages = (conversationId, userId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const [otherUserState, setOtherUserState] = useState(null);

  const messagesMapRef = useRef(new Map());
  const messagesContainerRef = useRef(null);
  const isUserAtBottomRef = useRef(true);
  const scrollTimeoutRef = useRef(null);

  const updateMessagesMap = useCallback((updater) => {
    const newMap = new Map(messagesMapRef.current);

    updater(newMap);

    messagesMapRef.current = newMap;

    const arr = [...newMap.values()].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    );

    setMessages(arr);
  }, []);
  // -------------------- FETCH INITIAL --------------------

  useEffect(() => {
    if (!conversationId) return;

    setLoading(true);

    const fetchMessages = async () => {
      try {
        const data = await getMessages({ conversationId });
        if (!data) return;

        const map = new Map();
        (data.messages || []).forEach((m) => {
          map.set(String(m._id), m);
        });

        messagesMapRef.current = map;
        updateMessagesMap(() => map);

        const other = data.conversation.members.find(
          (m) => String(m._id) !== String(userId),
        );

        if (other) setOtherUserState(other);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId, userId, updateMessagesMap]);

  // -------------------- SOCKET JOIN --------------------

  useEffect(() => {
    if (!conversationId) return;

    socket.emit("joinConversation", conversationId);
    return () => socket.emit("leaveConversation", conversationId);
  }, [conversationId]);

  // -------------------- SOCKET EVENTS --------------------

  useEffect(() => {
    if (!conversationId || !userId) return;

    socket.off("messageDelivered");
    socket.off("messageRead");
    socket.off("newMessage");
    socket.off("messageDeleted");
    socket.off("unreadMessages");

    const handleDelivered = ({ conversationId: convId, messageIds }) => {
  // ✅ allow global delivery (convId = null)
  if (convId && String(convId) !== String(conversationId)) return;

  updateMessagesMap((map) => {
    messageIds.forEach((id) => {
      const msg = map.get(String(id));

      // ✅ only sender messages update
      if (msg && String(msg.senderId) === String(userId)) {
        map.set(String(id), {
          ...msg,
          delivered: true,
        });
      }
    });
  });
};
    // ✅ READ
    const handleRead = ({ conversationId: convId, messageIds, readerId }) => {
      if (
        String(convId) !== String(conversationId) ||
        String(readerId) === String(userId)
      )
        return;

      updateMessagesMap((map) => {
        messageIds.forEach((id) => {
          const msg = map.get(String(id));
          if (msg && String(msg.senderId) === String(userId)) {
            map.set(String(id), { ...msg, read: true });
          }
        });
      });
    };

    const handleNewMessage = ({ message, conversationId: convId }) => {
  if (String(convId) !== String(conversationId)) return;

  updateMessagesMap((map) => {
    map.set(String(message._id), {
      ...message,
      delivered: message.delivered || false,
      read: message.read || false,
    });
  });

  // ❌ NO DELIVERY EMIT HERE
};



const handleUnread = ({ messages: incomingMessages }) => {
  if (!Array.isArray(incomingMessages) || !incomingMessages.length) return;

  const filtered = incomingMessages.filter(
    (m) => String(m.receiverId?._id || m.receiverId) === String(userId)
  );

  if (!filtered.length) return;

  updateMessagesMap((map) => {
    filtered.forEach((m) => {
      map.set(String(m._id), {
        ...m,
        delivered: m.delivered || false,
        read: false,
      });
    });
  });

  // ❌ NO DELIVERY EMIT HERE
};



    // ✅ DELETE
    const handleDeleted = ({ conversationId: convId, messageIds }) => {
      if (String(convId) !== String(conversationId)) return;

      updateMessagesMap((map) => {
        messageIds.forEach((id) => map.delete(String(id)));
      });
    };

    socket.on("messageDelivered", handleDelivered);
    socket.on("messageRead", handleRead);
    socket.on("newMessage", handleNewMessage);
    socket.on("messageDeleted", handleDeleted);
    socket.on("unreadMessages", handleUnread);

    socket.emit("getUnreadMessages", { conversationIds: [conversationId] });

    return () => {
      socket.off("messageDelivered", handleDelivered);
      socket.off("messageRead", handleRead);
      socket.off("newMessage", handleNewMessage);
      socket.off("messageDeleted", handleDeleted);
      socket.off("unreadMessages", handleUnread);
    };
  }, [conversationId, userId, updateMessagesMap]);

// -------------------- READ ON SCROLL (REAL WHATSAPP) --------------------
  useEffect(() => {
    if (!isUserAtBottomRef.current) return;

    const unreadIds = [];

    messagesMapRef.current.forEach((msg) => {
      if (String(msg.receiverId) === String(userId) && !msg.read) {
        unreadIds.push(msg._id);
      }
    });

    if (unreadIds.length === 0) return; // ✅ IMPORTANT FIX

    socket.emit("markMessageRead", {
      conversationId,
      messageIds: unreadIds,
    });

    updateMessagesMap((map) => {
      unreadIds.forEach((id) => {
        const msg = map.get(String(id));
        if (msg && !msg.read) {
          map.set(String(id), { ...msg, read: true });
        }
      });
    });
  }, [messages, conversationId, userId]);

  
  const prevConversationRef = useRef(null);
const didInitialScrollRef = useRef(false);

useEffect(() => {
  const container = messagesContainerRef.current;
  if (!container || !conversationId) return;

  const isConversationChange =
    prevConversationRef.current !== conversationId;

  prevConversationRef.current = conversationId;

  if (!isConversationChange) return;

  didInitialScrollRef.current = false;

  requestAnimationFrame(() => {
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "auto",
    });

    didInitialScrollRef.current = true;
  });
}, [conversationId]);


const prevMsgCountRef = useRef(0);

useEffect(() => {
  const container = messagesContainerRef.current;
  if (!container) return;

  const isNewMessage = messages.length > prevMsgCountRef.current;
  prevMsgCountRef.current = messages.length;

  if (!isNewMessage) return;
  if (!didInitialScrollRef.current) return;
  if (!isUserAtBottomRef.current) return;

  requestAnimationFrame(() => {
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  });
}, [messages]);

useEffect(() => {
  const container = messagesContainerRef.current;
  if (!container) return;

  const handleScroll = () => {
    const threshold = 80;

    const isBottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight <
      threshold;

    isUserAtBottomRef.current = isBottom;
  };

  container.addEventListener("scroll", handleScroll);

  return () => container.removeEventListener("scroll", handleScroll);
}, []);
  return {
    messages,
    setMessages,
    loading,
    otherUserState,
    messagesContainerRef,
  };
};