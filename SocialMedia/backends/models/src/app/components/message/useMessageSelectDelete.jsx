"use client";

import { useState, useCallback } from "react";
import API from "../../../utils/axiosInstance";

export default function useMessageSelectDelete({ conversationId, messages, setMessages }) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // ✅ toggle select mode
  const toggleSelect = useCallback((id) => {
    setSelectMode(true);
    setSelectedMessages((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }, []);

  // ❌ exit select mode
  const resetSelect = () => {
    setSelectMode(false);
    setSelectedMessages([]);
    setShowModal(false);
  };

  // 🗑 delete for me
  const deleteForMe = async () => {
    if (!selectedMessages.length || !conversationId) return;

    try {
      const { data } = await API.delete("/messages/delete-selected", {
        data: {
          conversationId,
          messageIds: selectedMessages,
        },
      });

      // 🔹 Update local state directly
      setMessages((prev) =>
        prev.filter((msg) => !selectedMessages.includes(msg._id))
      );

    } catch (err) {
      console.error(
        "❌ Delete for me failed:",
        err.response?.data || err.message
      );
    }

    resetSelect();
  };

  // 🌍 delete for everyone
  const deleteForEveryone = async () => {
    if (!selectedMessages.length || !conversationId) return;

    try {
      const { data } = await API.delete("/messages/delete-for-everyone", {
        data: {
          conversationId,
          messageIds: selectedMessages,
        },
      });

      // 🔹 Update local state directly
      setMessages((prev) =>
        prev.filter((msg) => !selectedMessages.includes(msg._id))
      );

    } catch (err) {
      console.error(
        "❌ Delete for everyone failed:",
        err.response?.data || err.message
      );
    }

    resetSelect();
  };

  // ✅ select all messages
  const selectAllMessages = () => {
    const allIds = messages.map((msg) => msg._id);
    setSelectMode(true);
    setSelectedMessages(allIds);
  };

  return {
    // state
    selectMode,
    selectedMessages,
    showModal,

    // setters
    setShowModal,

    // actions
    toggleSelect,
    resetSelect,
    deleteForMe,
    deleteForEveryone,
    selectAllMessages,
  };
}
