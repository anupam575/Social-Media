import API from "../../../utils/axiosInstance";

export const getMessages = async ({ conversationId, setMessages, setLoading }) => {
  if (!conversationId) return;

  const controller = new AbortController();

  try {
    setLoading(true);

    const res = await API.get(`/messages/${conversationId}`, { signal: controller.signal });

    const msgs = Array.isArray(res.data.messages) ? res.data.messages : [];

    const serialized = msgs
      .map((m) => ({
        ...m,
        createdAt: new Date(m.createdAt).toISOString(),
        read: m.read ?? false,
      }))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    setMessages(serialized);

  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("❌ Fetch messages error:", err);
      // optional: show toast to user
    }
  } finally {
    setLoading(false);
  }

  return () => controller.abort(); // cleanup
};
