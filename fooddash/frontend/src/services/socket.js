import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinOrderRoom = (orderId) => {
  if (socket) socket.emit('join:order', orderId);
};

export const leaveOrderRoom = (orderId) => {
  if (socket) socket.emit('leave:order', orderId);
};

export const sendCourierLocation = (data) => {
  if (socket) socket.emit('courier:location', data);
};
