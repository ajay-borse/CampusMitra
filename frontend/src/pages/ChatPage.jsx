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
  Zap,
  RefreshCw,
  X,
  Dices,
  HelpCircle,
  Check,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { chatApi } from '../api/chatApi';
import { vibeApi } from '../api/vibeApi';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { ChatListSkeleton } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

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

  // Vibe Connect State
  const [vibeData, setVibeData] = useState(null);
  const [vibeLoading, setVibeLoading] = useState(false);
  const [vibeOffset, setVibeOffset] = useState(0);
  const [vibeDrawerOpen, setVibeDrawerOpen] = useState(false);
  const [activeGameTab, setActiveGameTab] = useState('wouldYouRather'); // 'wouldYouRather', 'thisOrThat', 'quickQuestions'
  const [gameIndex, setGameIndex] = useState(0);

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
          setActiveConvId(res.data[0]._id || res.data[0].id);
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

  // Load messages & Vibe Connect data for active conversation
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

    const fetchVibe = async () => {
      try {
        setVibeLoading(true);
        const res = await vibeApi.getConversationVibe(activeConvId, 0);
        if (isMounted && res?.success) {
          setVibeData(res.data);
          setVibeOffset(0);
          setGameIndex(0);
        }
      } catch {
        // Silently handle vibe loading errors
      } finally {
        if (isMounted) setVibeLoading(false);
      }
    };

    fetchMessages();
    fetchVibe();
    setSearchParams({ conv: activeConvId });

    return () => {
      isMounted = false;
    };
  }, [activeConvId, joinConversation, setSearchParams, showToast]);

  // Shuffle smart icebreakers
  const handleShuffleIcebreakers = async () => {
    if (!activeConvId) return;
    try {
      const nextOffset = vibeOffset + 4;
      setVibeOffset(nextOffset);
      const res = await vibeApi.getConversationVibe(activeConvId, nextOffset);
      if (res?.success && res.data) {
        setVibeData((prev) => ({
          ...prev,
          icebreakers: res.data.icebreakers,
        }));
      }
    } catch {
      showToast('Could not refresh icebreakers.', 'error');
    }
  };

  // Select an icebreaker prompt into the input field
  const handleSelectPrompt = (promptText) => {
    setInputText(promptText);
    setVibeDrawerOpen(false);
  };

  // Send Conversation Game Prompt
  const handleSendGamePrompt = async (gameItem) => {
    if (!activeConvId || !gameItem) return;
    try {
      const res = await vibeApi.sendGamePrompt(activeConvId, {
        gameType: activeGameTab,
        question: gameItem.question,
        options: gameItem.options || [],
      });
      if (res?.success) {
        showToast('Activity shared in conversation! 🎲', 'success');
        setVibeDrawerOpen(false);
        // Socket broadcasts or optimistic append
        if (!isConnected && res.data) {
          setMessages((prev) => [...prev, res.data]);
          setTimeout(scrollToBottom, 50);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send activity.', 'error');
    }
  };

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
          (c._id === conversationId || c.id === conversationId)
            ? { ...c, lastMessage: message }
            : c
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
    if (conv?.peer) return conv.peer;
    if (!conv?.participants) return null;
    return conv.participants.find(
      (p) => (p._id || p.id)?.toString() !== (user?.id || user?._id)?.toString()
    );
  };

  const activeConversation = conversations.find(
    (c) => c._id === activeConvId || c.id === activeConvId
  );
  const activePartner = getPartner(activeConversation);

  // Active game list based on selected tab
  const activeGameList = vibeData?.games?.[activeGameTab] || [];
  const currentGameItem = activeGameList[gameIndex % Math.max(1, activeGameList.length)];

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
                const name = (partner?.name || `${partner?.firstName || ''} ${partner?.lastName || ''}`).toLowerCase();
                return name.includes(searchQuery.toLowerCase());
              })
              .map((conv) => {
                const partner = getPartner(conv);
                const isActive = (conv._id || conv.id) === activeConvId;
                const photo = partner?.avatar || partner?.profile?.photos?.[0];

                return (
                  <div
                    key={conv._id || conv.id}
                    className={`conversation-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveConvId(conv._id || conv.id)}
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
                          {partner?.name || `${partner?.firstName} ${partner?.lastName}`}
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
                  {activePartner?.avatar || activePartner?.profile?.photos?.[0] ? (
                    <img
                      src={activePartner.avatar || activePartner.profile.photos[0]}
                      alt={activePartner.firstName}
                    />
                  ) : (
                    <span>{activePartner.firstName?.[0] || 'U'}</span>
                  )}
                </div>
                <div>
                  <h4 className="thread-name">
                    {activePartner.name || `${activePartner.firstName} ${activePartner.lastName}`}
                  </h4>
                  <div className="thread-sub text-xs text-muted flex items-center gap-1">
                    <GraduationCap size={13} />
                    {activePartner.program || activePartner.profile?.program || 'MIT-WPU Student'}
                  </div>
                </div>
              </div>

              {/* Vibe Connect Trigger Button in Header */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="vibe-connect-btn"
                  onClick={() => setVibeDrawerOpen(true)}
                  title="Open Vibe Connect: Shared Interests, Smart Icebreakers & Games"
                >
                  <Zap size={14} className="text-violet" />
                  <span>Vibe Connect ✨</span>
                </button>
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
                  <div className="empty-thread-emoji">✨</div>
                  <h4 className="text-lg font-bold">Start the Conversation!</h4>
                  <p className="text-xs text-muted max-w-sm mb-3">
                    You and {activePartner.firstName} matched on campus! Check your shared vibe or pick a tailored icebreaker below.
                  </p>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setVibeDrawerOpen(true)}
                  >
                    <Zap size={14} /> Open Vibe Connect
                  </button>
                </div>
              ) : (
                messages.map((msg) => {
                  const senderId =
                    typeof msg.sender === 'object' ? msg.sender?._id : msg.sender;
                  const isMine =
                    senderId?.toString() === (user?.id || user?._id)?.toString();
                  const isGame = msg.text?.startsWith('🎲 [');

                  return (
                    <div
                      key={msg._id}
                      className={`message-bubble-row ${isMine ? 'mine' : 'theirs'}`}
                    >
                      <div
                        className={`message-bubble ${isMine ? 'mine' : 'theirs'} ${
                          isGame ? 'game-message-bubble' : ''
                        }`}
                      >
                        <div className="message-text whitespace-pre-wrap">{msg.text}</div>
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

            {/* Smart Icebreakers Quick Bar */}
            <div className="quick-prompts-bar">
              <span className="icebreaker-label flex items-center gap-1">
                <Sparkles size={12} className="text-violet" /> Icebreakers:
              </span>

              {vibeData?.icebreakers?.prompts?.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  className="prompt-chip"
                  onClick={() => handleSelectPrompt(prompt)}
                  title="Click to insert prompt into input box"
                >
                  {prompt}
                </button>
              ))}

              <button
                type="button"
                className="prompt-shuffle-btn"
                onClick={handleShuffleIcebreakers}
                title="Shuffle prompts for fresh ideas"
              >
                <RefreshCw size={12} />
              </button>
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

      {/* ======================================================== */}
      {/* VIBE CONNECT DRAWER / MODAL                             */}
      {/* ======================================================== */}
      {vibeDrawerOpen && activePartner && (
        <div className="modal-overlay" onClick={() => setVibeDrawerOpen(false)}>
          <div
            className="modal-content vibe-drawer-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Zap size={20} className="text-violet" />
                <h2 className="modal-title font-bold">
                  Vibe Connect with {activePartner.firstName}
                </h2>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setVibeDrawerOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="vibe-drawer-body">
              {/* SECTION 1: SHARED INTEREST EXPLANATIONS */}
              <div className="vibe-section-box">
                <h4 className="vibe-section-title">
                  <Sparkles size={16} className="text-secondary" /> Why You Two Matched
                </h4>
                <div className="shared-vibe-list mt-2">
                  {vibeData?.sharedVibe?.explanations?.map((exp, idx) => (
                    <div key={idx} className="shared-vibe-item">
                      <Check size={15} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{exp}</span>
                    </div>
                  ))}
                </div>

                {vibeData?.sharedVibe?.sharedInterests?.length > 0 && (
                  <div className="shared-tags-row mt-3">
                    <span className="text-xs text-muted">Shared Interests:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {vibeData.sharedVibe.sharedInterests.map((interest, i) => (
                        <span key={i} className="chip chip-sm">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: SMART ICEBREAKERS */}
              <div className="vibe-section-box">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="vibe-section-title">
                    <MessageSquare size={16} className="text-violet" /> Smart Icebreakers
                  </h4>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost text-xs flex items-center gap-1"
                    onClick={handleShuffleIcebreakers}
                  >
                    <RefreshCw size={12} /> Shuffle
                  </button>
                </div>
                <p className="text-xs text-muted mb-3">
                  Tailored to your common interests. Click any suggestion to insert into your chat message box.
                </p>

                <div className="vibe-prompts-list">
                  {vibeData?.icebreakers?.prompts?.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="vibe-prompt-card"
                      onClick={() => handleSelectPrompt(prompt)}
                    >
                      <span className="text-sm font-medium">{prompt}</span>
                      <ArrowRight size={14} className="text-muted flex-shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 3: CONVERSATION GAMES */}
              <div className="vibe-section-box">
                <h4 className="vibe-section-title">
                  <Dices size={16} className="text-pink" /> Conversation Games
                </h4>
                <p className="text-xs text-muted mb-3">
                  Lightweight voluntary activities to spark playful discussion in your chat.
                </p>

                {/* Game Tabs */}
                <div className="game-tabs-row mb-3">
                  <button
                    type="button"
                    className={`game-tab-btn ${activeGameTab === 'wouldYouRather' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveGameTab('wouldYouRather');
                      setGameIndex(0);
                    }}
                  >
                    Would You Rather?
                  </button>
                  <button
                    type="button"
                    className={`game-tab-btn ${activeGameTab === 'thisOrThat' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveGameTab('thisOrThat');
                      setGameIndex(0);
                    }}
                  >
                    This or That?
                  </button>
                  <button
                    type="button"
                    className={`game-tab-btn ${activeGameTab === 'quickQuestions' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveGameTab('quickQuestions');
                      setGameIndex(0);
                    }}
                  >
                    Quick Questions
                  </button>
                </div>

                {/* Active Game Item Card */}
                {currentGameItem && (
                  <div className="game-display-card">
                    <h5 className="font-semibold text-sm mb-2">{currentGameItem.question}</h5>

                    {currentGameItem.options && (
                      <div className="game-options-preview">
                        {currentGameItem.options.map((opt, oIdx) => (
                          <div key={oIdx} className="game-opt-pill">
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-subtle">
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost text-xs"
                        onClick={() => setGameIndex((prev) => prev + 1)}
                      >
                        Next Question ↻
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary btn-sm flex items-center gap-1.5"
                        onClick={() => handleSendGamePrompt(currentGameItem)}
                      >
                        <Send size={13} /> Send to Chat
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
