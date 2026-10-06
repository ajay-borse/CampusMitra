import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send,
  MessageSquare,
  Search,
  User,
  GraduationCap,
  Sparkles,
  Circle,
  Clock,
} from 'lucide-react';
import { chatApi } from '../api/chatApi';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { ChatListSkeleton } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

const QUICK_PROMPTS = [
  'Hey! Saw we matched, how are campus classes going? 🎓',
  'Chai or coffee break near the fountain later? ☕',
  'Working on any cool hackathon or class projects? 💻',
  'Down for a game of Valorant / FIFA later? 🎮',
];

export default function ChatPage() {
  const { user } = useAuth();
  const { socket, isConnected, joinConversation, sendTyping, emitSendMessage } = useSocket();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(searchParams.get('conv') || null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUser, setTypingUser] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch all user conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConvs(true);
      const res = await chatApi.getConversations();
      if (res?.success) {
        setConversations(res.data || []);
        // If no active conversation set, pick the first one
        if (!activeConvId && res.data?.length > 0) {
          setActiveConvId(res.data[0]._id);
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch conversations', 'error');
    } finally {
      setLoadingConvs(false);
    }
  }, [activeConvId, showToast]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConvId) return;

    let isMounted = true;
    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        const res = await chatApi.getMessages(activeConvId);
        if (isMounted && res?.success) {
          setMessages(res.data || []);
          joinConversation(activeConvId);
        }
      } catch (err) {
        showToast(err.message || 'Failed to load conversation history', 'error');
      } finally {
        if (isMounted) {
          setLoadingMessages(false);
          setTimeout(scrollToBottom, 100);
        }
      }
    };

    fetchMessages();
    setSearchParams({ conv: activeConvId });

    return () => {
      isMounted = false;
    };
  }, [activeConvId, joinConversation, setSearchParams, showToast]);

  // Listen to Socket.IO real-time message & typing events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = ({ conversationId, message }) => {
      if (conversationId === activeConvId) {
        setMessages((prev) => {
          // Avoid duplicate messages
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        setTimeout(scrollToBottom, 50);
      }

      // Update last message snippet in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId ? { ...c, lastMessage: message } : c
        )
      );
    };

    const handleUserTyping = ({ conversationId, userName, isTyping }) => {
      if (conversationId === activeConvId) {
        if (isTyping) {
          setTypingUser(userName);
        } else {
          setTypingUser(null);
        }
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, activeConvId]);

  // Handle typing input changes
  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);

    if (activeConvId) {
      sendTyping(activeConvId, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(activeConvId, false);
      }, 1500);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConvId) return;

    const messageText = inputText.trim();
    setInputText('');
    sendTyping(activeConvId, false);

    try {
      // Send via Socket if connected, otherwise fallback to REST API
      if (isConnected) {
        emitSendMessage(activeConvId, messageText, (res) => {
          if (res?.error) {
            showToast(res.error, 'error');
          }
        });
      } else {
        const res = await chatApi.sendMessage(activeConvId, messageText);
        if (res?.success && res.data) {
          setMessages((prev) => [...prev, res.data]);
          setTimeout(scrollToBottom, 50);
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to deliver message', 'error');
    }
  };

  // Find partner for an active conversation
  const getPartner = (conv) => {
    if (!conv?.participants) return null;
    return conv.participants.find(
      (p) => (p._id || p.id)?.toString() !== (user?.id || user?._id)?.toString()
    );
  };

  const activeConversation = conversations.find((c) => c._id === activeConvId);
  const activePartner = getPartner(activeConversation);

  // Quick message chips
  const quickPrompts = [
    'Chai break? ☕',
    'Hackathon prep 🚀',
    'Library study session 📚',
    'Are you free today?',
  ];

  return (
    <div className="chat-layout-wrapper">
      {/* Left Pane: Conversations List */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <div className="flex items-center justify-between mb-3">
            <h3 className="chat-heading flex items-center gap-2">
              <MessageSquare size={18} className="text-primary" /> Messenger
            </h3>
            <span
              className={`status-indicator ${isConnected ? 'online' : 'offline'}`}
              title={isConnected ? 'Live Socket Connected' : 'Connecting to Socket...'}
            >
              <Circle size={10} fill="currentColor" />
            </span>
          </div>

          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="conversations-list">
          {loadingConvs ? (
            <ChatListSkeleton />
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-muted text-sm">
              No conversations yet. Connect with students in Discovery to start chatting!
            </div>
          ) : (
            conversations
              .filter((c) => {
                const partner = getPartner(c);
                const name = `${partner?.firstName || ''} ${partner?.lastName || ''}`.toLowerCase();
                return name.includes(searchQuery.toLowerCase());
              })
              .map((conv) => {
                const partner = getPartner(conv);
                const isActive = conv._id === activeConvId;
                const photo = partner?.profile?.photos?.[0];

                return (
                  <div
                    key={conv._id}
                    className={`conversation-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveConvId(conv._id)}
                  >
                    <div className="conversation-avatar">
                      {photo ? (
                        <img src={photo} alt={partner?.firstName} />
                      ) : (
                        <span>{partner?.firstName?.[0] || 'U'}</span>
                      )}
                    </div>
                    <div className="conversation-meta">
                      <div className="conversation-name-row">
                        <span className="conversation-name">
                          {partner?.firstName} {partner?.lastName}
                        </span>
                        {conv.lastMessage?.createdAt && (
                          <span className="conversation-time">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <p className="conversation-preview">
                        {conv.lastMessage?.text || 'Mutual match connected! Say hello 👋'}
                      </p>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Right Pane: Active Message Thread */}
      <div className="chat-thread-container">
        {activeConvId && activePartner ? (
          <>
            {/* Thread Header */}
            <div className="chat-thread-header">
              <div className="thread-partner-info">
                <div className="thread-avatar">
                  {activePartner?.profile?.photos?.[0] ? (
                    <img
                      src={activePartner.profile.photos[0]}
                      alt={activePartner.firstName}
                    />
                  ) : (
                    <span>{activePartner.firstName?.[0] || 'U'}</span>
                  )}
                </div>
                <div>
                  <h4 className="thread-name">
                    {activePartner.firstName} {activePartner.lastName}
                  </h4>
                  <div className="thread-sub text-xs text-muted flex items-center gap-1">
                    <GraduationCap size={13} />
                    {activePartner.profile?.program || 'MIT-WPU Student'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="badge badge-sm badge-success flex items-center gap-1">
                  <Sparkles size={12} /> Connected Peer
                </span>
              </div>
            </div>

            {/* Messages Body */}
            <div className="chat-messages-body">
              {loadingMessages ? (
                <div className="text-center py-8 text-muted">
                  Loading message history...
                </div>
              ) : messages.length === 0 ? (
                <div className="empty-thread">
                  <div className="empty-thread-emoji">👋</div>
                  <h4>Start the Conversation!</h4>
                  <p className="text-xs text-muted">
                    You and {activePartner.firstName} matched! Break the ice with a prompt below.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const senderId =
                    typeof msg.sender === 'object' ? msg.sender?._id : msg.sender;
                  const isMine =
                    senderId?.toString() === (user?.id || user?._id)?.toString();

                  return (
                    <div
                      key={msg._id}
                      className={`message-bubble-row ${isMine ? 'mine' : 'theirs'}`}
                    >
                      <div className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
                        <div className="message-text">{msg.text}</div>
                        <div className="message-timestamp">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {typingUser && (
                <div className="typing-indicator-pill">
                  <span className="dot dot-1" />
                  <span className="dot dot-2" />
                  <span className="dot dot-3" />
                  <span className="text-xs text-muted ml-2">{typingUser} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="quick-prompts-bar">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  className="prompt-chip"
                  onClick={() => setInputText(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Message Input Footer */}
            <form onSubmit={handleSendMessage} className="chat-input-bar">
              <input
                type="text"
                className="form-control chat-input-field"
                placeholder={`Message ${activePartner.firstName}...`}
                value={inputText}
                onChange={handleInputChange}
                autoFocus
              />
              <button
                type="submit"
                className="btn btn-primary btn-send"
                disabled={!inputText.trim()}
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="chat-thread-placeholder">
            <EmptyState
              icon="💬"
              title="Select a Conversation"
              description="Choose a conversation from the left to start messaging your campus peers."
            />
          </div>
        )}
      </div>
    </div>
  );
}
