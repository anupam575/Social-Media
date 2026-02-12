import { createSlice } from "@reduxjs/toolkit";

// ================= STATE =================
const initialState = {
  conversations: [],
  pendingRequests: [],
  selectedConversationId: null,
  messagesByConversation: {},
};

const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    // ================= CONVERSATIONS =================
    addConversationIfNotExists: (state, action) => {
      const convo = action.payload;
      if (!convo?._id) return;

      // sirf accepted conversations
      if (convo.status !== "accepted") return;

      // duplicate check
      const exists = state.conversations.find((c) => c._id === convo._id);
      if (exists) return;

      // directly add (no spread, no force, no cleanup)
      state.conversations.unshift(convo);
    },

    setSelectedConversationId: (state, action) => {
      state.selectedConversationId = action.payload;
      console.log("📌 Selected conversation:", action.payload);
    },

    addIncomingMessage: (state, action) => {
      const message = action.payload;
      const conversationId = message?.conversationId;

      if (!conversationId || !message?._id) return;

      if (!state.messagesByConversation[conversationId]) {
        state.messagesByConversation[conversationId] = [];
      }

      const exists = state.messagesByConversation[conversationId].some(
        (m) => m._id === message._id,
      );

      if (exists) return;

      state.messagesByConversation[conversationId].push(message);
    },

    setConversationMessages: (state, action) => {
      const { conversationId, messages } = action.payload;
      if (!conversationId || !Array.isArray(messages)) return;

      // direct replace
      state.messagesByConversation[conversationId] = messages;
    },

   

    acceptConversationSuccess: (state, action) => {
      const convo = action.payload;
      if (!convo?._id) return;

      // pending se remove
      state.pendingRequests = state.pendingRequests.filter(
        (r) => r._id !== convo._id,
      );

      // conversations me add (agar pehle se nahi hai)
      const exists = state.conversations.find((c) => c._id === convo._id);
      if (exists) return;

      convo.status = "accepted";
      state.conversations.unshift(convo);
    },

    deleteMessages: (state, action) => {
    const { conversationId, messageIds } = action.payload;
    if (!state.messagesByConversation[conversationId]) return;
    state.messagesByConversation[conversationId] = state.messagesByConversation[conversationId].filter(
      (msg) => !messageIds.includes(msg._id)
    );
  },

    rejectConversationSuccess: (state, action) => {
      const conversationId = action.payload;
      if (!conversationId) return;

      state.pendingRequests = state.pendingRequests.filter(
        (r) => r._id !== conversationId,
      );
    },

    // ================= 🔥 RESET (LOGOUT FIX) =================
    resetConversationState: () => initialState,
  },
});

export const {
  addConversationIfNotExists,
  setSelectedConversationId,
deleteMessages,
  addIncomingMessage,
  setConversationMessages,
  addRequest,
  acceptConversationSuccess,
  rejectConversationSuccess,
  resetConversationState,
} = conversationSlice.actions;

export default conversationSlice.reducer;


