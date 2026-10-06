import { useState, useRef, useEffect, useCallback } from 'react';
import { getSocket } from '../services/socket';
import { chatApi } from '../services/campusApi';

/**
 * ChatView Component
 * Real-time campus messenger connected to MongoDB and Socket.IO.
 * Supports active conversation selection, live messages, typing indicators,
 * quick campus prompts, and empty states.
 */
export default function ChatView({
  conversations = [],
  activeChatUser,
  currentUser,
  onNavigate,
  onRefreshConversations,
}) {
  const [selectedConvId, setSelectedConvId] = useState(
    conversations[0]?.id || null
  );
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // If activeChatUser was passed from MatchModal or ConnectionsView, select or open that conversation
  useEffect(() => {
    if (activeChatUser && conversations.length > 0) {
      const existing = conversations.find(
        (c) =>
          c.peer?.id === activeChatUser.userId ||
          c.peer?.id === activeChatUser.id ||
          c.peer?.name?.toLowerCase() === activeChatUser.name?.toLowerCase()
      );
      if (existing) {
        setSelectedConvId(existing.id);
      }
    } else if (!selectedConvId && conversations.length > 0) {
      setSelectedConvId(conversations[0].id);
    }
  }, [activeChatUser, conversations, selectedConvId]);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (convId) => {
    if (!convId) return;
    setIsLoadingMessages(true);
    try {
      const res = await chatApi.getMessages(convId);
      if (res.success) {
        setMessages(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConvId) {
      loadMessages(selectedConvId);

      // Join socket conversation room
      const socket = getSocket();
      if (socket) {
        socket.emit('join_conversation', selectedConvId);
      }
    }
  }, [selectedConvId, loadMessages]);

  // Listen to incoming Socket.IO messages & typing events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (payload) => {
      if (payload.conversationId === selectedConvId) {
        setMessages((prev) => {
          // Avoid duplicate messages
          if (prev.some((m) => m._id === payload.message._id)) return prev;
          return [...prev, payload.message];
        });
      }
      onRefreshConversations?.();
    };

    const handlePeerTyping = ({ conversationId }) => {
      if (conversationId === selectedConvId) {
        setIsPeerTyping(true);
      }
    };

    const handlePeerStopTyping = ({ conversationId }) => {
      if (conversationId === selectedConvId) {
        setIsPeerTyping(false);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handlePeerTyping);
    socket.on('user_stop_typing', handlePeerStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handlePeerTyping);
      socket.off('user_stop_typing', handlePeerStopTyping);
    };
  }, [selectedConvId, onRefreshConversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPeerTyping]);

  const activeConversation = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    // Emit typing indicator to socket
    const socket = getSocket();
    if (socket && selectedConvId) {
      socket.emit('typing', { conversationId: selectedConvId });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { conversationId: selectedConvId });
      }, 1500);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!messageInput.trim() || !selectedConvId) return;

    const text = messageInput.trim();
    setMessageInput('');

    // Stop typing indicator
    const socket = getSocket();
    if (socket) {
      socket.emit('stop_typing', { conversationId: selectedConvId });
    }

    try {
      const res = await chatApi.sendMessage(selectedConvId, text);
      if (res.success && res.data) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.data._id)) return prev;
          return [...prev, res.data];
        });
        onRefreshConversations?.();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleQuickPrompt = (promptText) => {
    setMessageInput(promptText);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="page-view chat-view animate-fade-in">
      <div className="chat-layout-card">
        {/* Conversations Sidebar */}
        <aside className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h2 className="sidebar-title">💬 Messages</h2>
            <span className="badge badge-info">{conversations.length} Active</span>
          </div>

          <div className="conversations-list">
            {conversations.length > 0 ? (
              conversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                const peerAvatar =
                  conv.peer?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

                return (
                  <div
                    key={conv.id}
                    className={`conversation-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedConvId(conv.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="conv-avatar-box">
                      <img src={peerAvatar} alt={conv.peer?.name || 'Peer'} className="conv-avatar" />
                      <span className="status-online-dot" />
                    </div>

                    <div className="conv-content">
                      <div className="conv-row-top">
                        <span className="conv-user-name">{conv.peer?.name || 'Peer'}</span>
                        <span className="conv-time">
                          {formatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                        </span>
                      </div>
                      <p className="conv-last-msg">
                        {conv.lastMessage?.text || 'Connected on CampusMitra'}
                      </p>
                    </div>

                    {conv.unreadCount > 0 && !isSelected && (
                      <span className="conv-unread-pill">{conv.unreadCount}</span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="empty-chat-sidebar-state">
                <p>No active conversations yet.</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigate?.('discover')}
                >
                  Explore Discover ✨
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Active Chat Conversation Area */}
        <main className="chat-main-area">
          {activeConversation ? (
            <>
              {/* Header */}
              <div className="chat-header">
                <div className="chat-header-user">
                  <div className="header-avatar-wrap">
                    <img
                      src={
                        activeConversation.peer?.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={activeConversation.peer?.name || 'Peer'}
                      className="header-avatar"
                    />
                    <span className="header-status-dot" />
                  </div>
                  <div>
                    <h3 className="header-name">{activeConversation.peer?.name || 'Peer'}</h3>
                    <p className="header-program">
                      {activeConversation.peer?.program || 'Student'} &bull;{' '}
                      <span className="text-online">Active on Campus</span>
                    </p>
                  </div>
                </div>

                <div className="chat-header-actions">
                  <span className="campus-verified-pill" title="Campus Identity Verified">
                    🛡️ MIT-WPU Verified
                  </span>
                </div>
              </div>

              {/* Message History */}
              <div className="messages-scroller">
                <div className="chat-encryption-notice">
                  <span>🔒 End-to-end campus student chat on CampusMitra</span>
                </div>

                {isLoadingMessages ? (
                  <div className="state-container loading-state">
                    <div className="spinner" />
                    <p>Loading messages...</p>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => {
                    const isYou =
                      (msg.sender?._id || msg.sender) === currentUser?._id ||
                      (msg.sender?._id || msg.sender) === currentUser?.id;

                    return (
                      <div
                        key={msg._id || msg.id}
                        className={`message-bubble-row ${isYou ? 'bubble-you' : 'bubble-them'} animate-bubble-in`}
                      >
                        <div className="message-bubble">
                          <p className="message-text">{msg.text}</p>
                          <span className="message-timestamp">{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-message-history">
                    <span className="wave-icon">👋</span>
                    <p>Start your conversation! Say hi or plan a study session.</p>
                  </div>
                )}

                {/* Animated Typing Indicator */}
                {isPeerTyping && (
                  <div className="message-bubble-row bubble-them animate-bubble-in">
                    <div className="message-bubble typing-bubble">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Prompts */}
              <div className="quick-prompts-bar">
                <button
                  type="button"
                  className="quick-chip"
                  onClick={() => handleQuickPrompt('Hey! Free for a chai break? ☕')}
                >
                  ☕ Chai Break?
                </button>
                <button
                  type="button"
                  className="quick-chip"
                  onClick={() => handleQuickPrompt('Are you joining the hackathon this weekend? 🚀')}
                >
                  🚀 Hackathon Prep
                </button>
                <button
                  type="button"
                  className="quick-chip"
                  onClick={() => handleQuickPrompt('Let’s study at the library 📚')}
                >
                  📚 Library Study
                </button>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSend} className="chat-input-bar">
                <input
                  type="text"
                  className="chat-input-field"
                  placeholder={`Message ${activeConversation.peer?.firstName || 'classmate'}...`}
                  value={messageInput}
                  onChange={handleInputChange}
                  autoComplete="off"
                  id="chat-message-input"
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-chat-send"
                  disabled={!messageInput.trim()}
                  id="chat-send-btn"
                >
                  <span>Send 🚀</span>
                </button>
              </form>
            </>
          ) : (
            <div className="empty-chat-state animate-scale-in">
              <span className="empty-chat-icon">💬</span>
              <h3>No conversations yet</h3>
              <p>Find someone who matches your vibe in the Discover tab or send interest!</p>
              <button
                type="button"
                className="btn btn-primary btn-glow"
                onClick={() => onNavigate?.('discover')}
                style={{ marginTop: '1rem' }}
              >
                <span>✨ Explore Discover Deck</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
