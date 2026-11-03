import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { GraduationCap, MessageCircle } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [isConnected, setIsConnected] = useState(false);
  const [matchModalData, setMatchModalData] = useState(null);
  const socketRef = useRef(null);

  // Trigger confetti effect
  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d7ad6a', '#c99a3f', '#a9683f', '#9c4b36', '#3d5545', '#f0e4c9'],
      });
    } catch (e) {
      // Confetti fallback
    }
  }, []);

  useEffect(() => {
    const activeToken = token || localStorage.getItem('campusmitra_token') || localStorage.getItem('token');

    if (!isAuthenticated || !activeToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const socket = io(socketUrl, {
      auth: { token: activeToken },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, reconnect manually
        socket.connect();
      }
    });

    socket.on('connect_error', (err) => {
      setIsConnected(false);
      console.warn('Socket connection notice:', err?.message || err);
    });

    // Real-time mutual match celebration
    socket.on('match_celebration', (data) => {
      triggerConfetti();
      setMatchModalData(data);
      showToast(`Mutual Match with ${data.matchedUser?.name || 'a fellow student'}!`, 'success');
      window.dispatchEvent(new CustomEvent('campusmitra_notification', { detail: data }));
    });

    // Real-time in-app notification handler (interest, message, plan, etc.)
    socket.on('new_notification', (data) => {
      if (data && data.title) {
        showToast(`${data.title}: ${data.message}`, 'info');
      }
      window.dispatchEvent(new CustomEvent('campusmitra_notification', { detail: data }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, token, showToast, triggerConfetti]);

  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_conversation', conversationId);
    }
  }, [isConnected]);

  const sendTyping = useCallback((conversationId, isTyping) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing', { conversationId, isTyping });
    }
  }, [isConnected]);

  const emitSendMessage = useCallback((conversationId, text, callback) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send_message', { conversationId, text }, callback);
    } else if (callback) {
      callback({ error: 'Socket is not currently connected' });
    }
  }, [isConnected]);

  const closeMatchModal = () => setMatchModalData(null);

  const value = {
    socket: socketRef.current,
    isConnected,
    joinConversation,
    sendTyping,
    emitSendMessage,
    triggerConfetti,
    matchModalData,
    closeMatchModal,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
      {/* Global Mutual Match Celebration Modal */}
      {matchModalData && (
        <div className="modal-backdrop" onClick={closeMatchModal}>
          <div className="match-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="match-badge">MUTUAL MATCH</div>
            <div className="match-avatar-ring">
              <span className="match-icon" aria-hidden="true">
                <GraduationCap size={30} strokeWidth={1.9} />
              </span>
            </div>
            <h2 className="match-title">You and {matchModalData.matchedUser?.name} Connected!</h2>
            <p className="match-subtitle">
              Both of you expressed interest in each other's academic vibe and interests!
            </p>
            <div className="match-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  closeMatchModal();
                  window.location.href = `/chat?conv=${matchModalData.conversationId}`;
                }}
              >
                <MessageCircle size={16} /> Say Hello in Chat
              </button>
              <button className="btn btn-secondary" onClick={closeMatchModal}>
                Keep Exploring
              </button>
            </div>
          </div>
        </div>
      )}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
