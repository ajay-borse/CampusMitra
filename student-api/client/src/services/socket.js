import { io } from 'socket.io-client';

let socket = null;

export const initSocketClient = () => {
  const token = localStorage.getItem('campusmitra_token');
  if (!token) return null;

  if (!socket) {
    socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      // Socket connected to backend
    });

    socket.on('connect_error', () => {
      // Graceful error handling
    });
  }

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocketClient();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
