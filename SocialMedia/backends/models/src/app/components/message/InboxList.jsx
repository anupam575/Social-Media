"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import API from "../../../utils/axiosInstance";

import {
  setSelectedConversationId,
  addConversationIfNotExists,
  resetConversationState,
} from "../../../redux/slices/conversationSlice";

export default function InboxList({ onSelectChat }) {
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.auth?.user);
  const userId = String(currentUser?._id || currentUser?.id);

  const { conversations, selectedConversationId } = useSelector(
    (state) => state.conversation
  );

  const typingUsers = useSelector((state) => state.realtime.typingUsers);

  // 🔥 FETCH INBOX (ONLY ACCEPTED CONVERSATIONS)
  useEffect(() => {
    if (!userId) return;

    dispatch(resetConversationState());

    const fetchInbox = async () => {
      try {
        const { data } = await API.get(`/conversations/${userId}`);

        (data?.conversations || []).forEach((c) =>
          dispatch(addConversationIfNotExists(c))
        );
      } catch (err) {
        console.error("❌ Failed to fetch conversations:", err);
      }
    };

    fetchInbox();
  }, [userId, dispatch]);

  // ✅ ONLY ACCEPTED CONVERSATIONS
  const inboxConversations = conversations.filter(
    (c) => c.status === "accepted"
  );

  if (!inboxConversations.length) {
    return (
      <div className="p-4 text-sm text-gray-400">
        No conversations yet
      </div>
    );
  }

  // ⏰ WhatsApp-style time
  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      {inboxConversations.map((conv) => {
        const otherUser = conv.members?.find(
          (m) => String(m._id) !== userId
        );
        if (!otherUser) return null;

        const isActive = conv._id === selectedConversationId;

        const isTyping =
          typingUsers?.[conv._id]?.[String(otherUser._id)];

        const lastMsg = conv.lastMessage?.text || "Start conversation";
        const lastTime = formatTime(conv.lastMessageAt);

        return (
          <div key={conv._id} className="border-b border-black/20">
            <div
              onClick={() => {
                dispatch(setSelectedConversationId(conv._id));
                onSelectChat?.();
              }}
              className={`flex items-center gap-3 px-3 sm:px-4 py-3 cursor-pointer transition ${
                isActive ? "bg-[#202c33]" : "hover:bg-[#1f2c34]"
              }`}
            >
              {/* 🖼️ AVATAR */}
              <img
                src={otherUser.avatar?.url || "/default-avatar.png"}
                alt={otherUser.name}
                className="w-11 h-11 rounded-full object-cover shrink-0"
              />

              {/* 📄 TEXT AREA */}
              <div className="flex-1 min-w-0">
                {/* NAME + TIME (TOP ROW) */}
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-white truncate">
                    {otherUser.name}
                  </p>

                  <span className="text-[11px] text-gray-400 shrink-0">
                    {lastTime}
                  </span>
                </div>

                {/* LAST MESSAGE (BOTTOM ROW) */}
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {isTyping ? (
                    <span className="text-[#00a884]">typing…</span>
                  ) : (
                    lastMsg
                  )}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
