"use client";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import socket from "../../utils/socket";
import { store } from "../../redux/store";

// Redux slices
import { addLocalNotification } from "../../redux/slices/notificationSlice";
import {
  acceptConversationSuccess,
  rejectConversationSuccess,
} from "../../redux/slices/conversationSlice";
import {
  userOnline,
  userOffline,
  userOnlineSnapshot,
  setTyping,
} from "../../redux/slices/realtimeSlice";

export default function GlobalSocketListener() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const userId = currentUser?._id || currentUser?.id;

  const typingTimeoutRef = useRef({});

  // ================= SOCKET CONNECT =================
  useEffect(() => {
    if (!userId) return;

    const handleConnect = () => {
      console.log("🟢 Socket connected:", socket.id);

      socket.emit("getUnreadMessages", {
        conversationIds: store
          .getState()
          .conversation.conversations?.map((c) => c._id)
          .filter(Boolean),
      });

      // ✅ FIX: yahi par hona chahiye (single source)
      socket.emit("markAllDelivered");
    };

    if (!socket.connected) {
      socket.auth = { userId };
      socket.connect();
    } else {
      handleConnect();
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", (reason) =>
      console.warn("🔴 Socket disconnected:", reason)
    );

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect");
    };
  }, [userId]);

  // ================= DELIVERY LISTENER (REAL-TIME) =================
  // ================= DELIVERY LISTENER =================
useEffect(() => {
  if (!userId) return;

  const handleNewMessage = ({ message, conversationId }) => {
    if (!message) return;

    const isReceiver = String(message.receiverId) === String(userId);
    if (!isReceiver) return;

    if (message.delivered) return;

    socket.emit("messageDelivered", {
      conversationId,
      messageIds: [message._id],
    });
  };

  socket.on("newMessage", handleNewMessage);

  return () => {
    socket.off("newMessage", handleNewMessage);
  };
}, [userId]);
  // ================= OTHER REALTIME EVENTS =================
  useEffect(() => {
    if (!userId) return;

    const handleRequestAccepted = ({ conversation }) => {
      dispatch(acceptConversationSuccess(conversation));
    };

    const handleRequestRejected = ({ conversationId }) => {
      dispatch(rejectConversationSuccess(conversationId));
    };

    const handleUserOnline = ({ userId }) => dispatch(userOnline(userId));

    const handleUserOffline = ({ userId, lastSeen }) =>
      dispatch(userOffline({ userId, lastSeen }));

    const handleTyping = ({ conversationId, senderId, isTyping }) => {
      if (!conversationId || !senderId) return;

      const key = `${conversationId}_${senderId}`;

      if (typingTimeoutRef.current[key]) {
        clearTimeout(typingTimeoutRef.current[key]);
      }

      dispatch(setTyping({ conversationId, senderId, isTyping }));

      dispatch(
        addLocalNotification({
          type: "typing",
          senderId,
          conversationId,
          isTyping,
        })
      );

      if (isTyping) {
        typingTimeoutRef.current[key] = setTimeout(() => {
          dispatch(setTyping({ conversationId, senderId, isTyping: false }));
        }, 1500);
      }
    };

    const handleOnlineSnapshot = ({ onlineUsers }) => {
      if (!Array.isArray(onlineUsers)) return;
      dispatch(userOnlineSnapshot({ onlineUsers }));
    };



    socket.on("requestAccepted", handleRequestAccepted);
    socket.on("requestRejected", handleRequestRejected);
    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);
    socket.on("typing", handleTyping);
    socket.on("onlineUsersSnapshot", handleOnlineSnapshot);

    return () => {
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
      typingTimeoutRef.current = {};

      socket.off("requestAccepted", handleRequestAccepted);
      socket.off("requestRejected", handleRequestRejected);
      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOffline);
      socket.off("typing", handleTyping);
      socket.off("onlineUsersSnapshot", handleOnlineSnapshot);
    };
  }, [userId, dispatch]);

  return null;
}