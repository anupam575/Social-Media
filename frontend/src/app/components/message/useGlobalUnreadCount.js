"use client";

import { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import socket from "../../../utils/socket";
import { setUnreadCount } from "../../../redux/slices/unreadSlice";

export const useGlobalUnreadCount = () => {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const count = useSelector((state) => state.unread.count);

  const userId = user?._id || user?.id;

  // 🔌 Setup socket listeners
  useEffect(() => {
    if (!userId) return;

    // 📩 initial fetch
    socket.emit("getUnreadCount");

    const handleUnreadCount = ({ count }) => {
      if (typeof count === "number") {
        dispatch(setUnreadCount(count));
      }
    };

    // 🔥 refresh trigger
    const handleRefresh = () => {
      socket.emit("getUnreadCount");
    };

    socket.on("unreadCount", handleUnreadCount);
    socket.on("refreshUnreadCount", handleRefresh); // ✅ FIX

    return () => {
      socket.off("unreadCount", handleUnreadCount);
      socket.off("refreshUnreadCount", handleRefresh); // ✅ cleanup
    };
  }, [userId, dispatch]);

  // 🔥 RESET BADGE (optimized + safe)
  const resetBadge = useCallback((conversationId, messages = []) => {
    if (!conversationId || !userId || !Array.isArray(messages)) return;

    const unreadMessageIds = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];

      if (
        msg.conversationId?.toString() === conversationId?.toString() &&
        msg.receiverId?.toString() === userId?.toString() &&
        !msg.read
      ) {
        unreadMessageIds.push(msg._id);
      }
    }

    if (unreadMessageIds.length === 0) return;

    socket.emit("markMessageRead", {
      conversationId,
      messageIds: unreadMessageIds,
    });
  }, [userId]);

  return { unreadCount: count, resetBadge };
};