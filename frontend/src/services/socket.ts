import { io } from "socket.io-client";

const API_URL = (import.meta as any).env?.VITE_API_URL || '';

export const socket = io(API_URL, {
  transports: ["websocket", "polling"],
  autoConnect: true,
});