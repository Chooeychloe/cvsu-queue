import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

// A single shared socket instance for the whole app.
export const socket = io(SOCKET_URL, { autoConnect: true });
