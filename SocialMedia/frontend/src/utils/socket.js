import { io } from "socket.io-client";

const socket = io(
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000",
  {
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: false, // ⭐ IMPORTANT (prevents auto connect)
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 500,
  }
);

export default socket;
