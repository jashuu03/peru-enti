import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Send, AlertOctagon, UserX, AlertTriangle, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Client-side profanity detection ─────────────────────────────
const harmfulWords = [
  'abuse','attack','bastard','bitch','bloody','crap','damn',
  'dick','dumb','fool','freak','hate','hell','idiot','jerk',
  'kill','loser','moron','racist','scam','shit','slut','spam',
  'stupid','suck','threat','trash','ugly','violence','whore',
  'ass','fuck','nigger','retard','cunt','faggot'
];
const containsProfanity = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return harmfulWords.some(w => new RegExp(`\\b${w}\\b`, 'i').test(lower));
};
// ─────────────────────────────────────────────────────────────────

const Messages = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(false);
  
  // Real-time states
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Blocked state helper
  const [isBlocked, setIsBlocked] = useState(false);

  // Popups for block/report on harmful content detection
  const [showPopupButtons, setShowPopupButtons] = useState(false);
  const [popupMessageId, setPopupMessageId] = useState(null);
  const [popupSenderName, setPopupSenderName] = useState('');

  // Real-time typing profanity warning
  const inputHasProfanity = containsProfanity(inputText);

  const messagesEndRef = useRef(null);

  // Extract selected user from URL query param (?userId=xxx)
  const getQueryUserId = () => {
    const params = new URLSearchParams(location.search);
    return params.get('userId');
  };

  const loadConversations = async (selectUserId = null) => {
    setLoadingConv(true);
    try {
      const convList = await api.messages.getConversations();
      setConversations(convList);

      const targetId = selectUserId || getQueryUserId();
      
      if (targetId) {
        // Find if user already has conversation
        const existing = convList.find(c => c.user._id === targetId);
        if (existing) {
          handleSelectUser(existing.user);
        } else {
          // New conversation initialization
          const newUserProfile = await api.users.getProfile(targetId);
          setActiveUser(newUserProfile);
          setMessages([]);
        }
      } else if (convList.length > 0 && !activeUser) {
        // Auto-select first conversation
        handleSelectUser(convList[0].user);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load conversations');
    } finally {
      setLoadingConv(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [location.search]);

  // Socket event listeners for real-time chat
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (newMessage) => {
      // If message is from current active conversation, append it
      if (activeUser && (newMessage.sender._id === activeUser._id || newMessage.sender === activeUser._id)) {
        setMessages(prev => [...prev, newMessage]);
        // Mark as read in backend
        api.messages.getHistory(activeUser._id); // triggers mark as read

        // If the received message is flagged (harmful), trigger security modal
        if (newMessage.flagged && (newMessage.sender._id !== user._id && newMessage.sender !== user._id)) {
          setPopupMessageId(newMessage._id);
          setShowPopupButtons(true);
        }
      }
      
      // Update conversations list (latest message)
      loadConversations(activeUser?._id);
    };

    const handleTypingStatus = ({ senderId, isTyping }) => {
      if (activeUser && senderId === activeUser._id) {
        setIsPartnerTyping(isTyping);
      }
    };

    socket.on('receive_message', handleMessageReceived);
    socket.on('typing_status', handleTypingStatus);

    return () => {
      socket.off('receive_message', handleMessageReceived);
      socket.off('typing_status', handleTypingStatus);
    };
  }, [socket, activeUser]);

  // Auto-scroll messages list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  const handleSelectUser = async (targetUser) => {
    setActiveUser(targetUser);
    setLoadingMsg(true);
    setIsBlocked(user.blockedUsers?.includes(targetUser._id) || targetUser.blockedUsers?.includes(user._id));
    
    try {
      const history = await api.messages.getHistory(targetUser._id);
      setMessages(history);
      
      // Check block status from profile
      const latestProfile = await api.users.getProfile(targetUser._id);
      const amIBlocked = latestProfile.blockedUsers?.includes(user._id);
      const isHeBlocked = user.blockedUsers?.includes(targetUser._id);
      setIsBlocked(amIBlocked || isHeBlocked);
    } catch (err) {
      toast.error('Failed to load message history');
    } finally {
      setLoadingMsg(false);
    }
  };

  const handleTyping = () => {
    if (!socket || !activeUser) return;

    socket.emit('typing', { receiverId: activeUser._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { receiverId: activeUser._id });
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeUser || isBlocked) return;

    const textToSend = inputText;
    setInputText('');

    if (socket) {
      socket.emit('stop_typing', { receiverId: activeUser._id });
    }

    try {
      const response = await api.messages.send({
        receiverId: activeUser._id,
        content: textToSend
      });

      setMessages(prev => [...prev, response]);
      
      if (response.profanityDetected) {
        toast.error('Warning: Message flagged for potentially inappropriate content.');
        setPopupMessageId(response._id);
        setShowPopupButtons(true);
      }

      // Refresh list to show last message
      loadConversations(activeUser._id);
    } catch (err) {
      toast.error(err.message || 'Failed to send message');
    }
  };

  const handleBlockUser = async () => {
    if (!activeUser) return;
    try {
      await api.users.block(activeUser._id);
      toast.success(`Blocked ${activeUser.name}`);
      setIsBlocked(true);
      
      // Update user context state locally
      user.blockedUsers = [...(user.blockedUsers || []), activeUser._id];
    } catch (err) {
      toast.error(err.message || 'Failed to block user');
    }
  };

  const handleReportUser = async (msgId = null) => {
    if (!activeUser) return;
    const reason = prompt('Please specify the reason for reporting this user:');
    if (!reason) return;

    try {
      await api.messages.report({
        reportedUserId: activeUser._id,
        messageId: msgId,
        reason
      });
      toast.success('Report submitted successfully. Admins will review.');
    } catch (err) {
      toast.error(err.message || 'Failed to submit report');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <div className="glass-panel rounded-2xl overflow-hidden h-[75vh] flex">
        
        {/* Left Sidebar: Conversations list */}
        <div className="w-1/3 border-r border-white/10 flex flex-col bg-[#0b0f19]/30">
          <div className="p-4 border-b border-white/10 font-bold text-lg text-white">
            Chats
          </div>
          
          {loadingConv ? (
            <div className="flex justify-center items-center flex-1">
              <Spinner size="md" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500 p-4 text-center">
              No conversations started yet. Connect with users to chat.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {conversations.map((conv) => {
                const isSelected = activeUser?._id === conv.user._id;
                return (
                  <div
                    key={conv.user._id}
                    onClick={() => handleSelectUser(conv.user)}
                    className={`p-4 flex items-center gap-3 cursor-pointer transition ${
                      isSelected ? 'bg-indigo-500/10 border-l-4 border-indigo-500' : 'hover:bg-white/5'
                    }`}
                  >
                    {/* User Avatar */}
                    <div className="relative shrink-0">
                      {conv.user.profilePicture ? (
                        <img
                          src={conv.user.profilePicture}
                          alt={conv.user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                          {conv.user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {conv.user.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-teal-500 border-2 border-dark-bg rounded-full" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline">
                        <h4 className="text-sm font-bold text-white truncate">{conv.user.name}</h4>
                        {conv.unreadCount > 0 && (
                          <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-1">
                        {conv.lastMessage?.flagged ? '[Flagged message]' : conv.lastMessage?.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Main Chat Window */}
        <div className="flex-1 flex flex-col bg-[#0b0f19]/10">
          {activeUser ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0b0f19]/40">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {activeUser.profilePicture ? (
                      <img
                        src={activeUser.profilePicture}
                        alt={activeUser.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                        {activeUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {activeUser.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-teal-500 border-2 border-dark-bg rounded-full" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{activeUser.name}</h4>
                    <span className="text-[10px] text-gray-400 font-medium uppercase">
                      {activeUser.profession || 'Attendee'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleReportUser()}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-rose-400 hover:text-white transition text-xs flex items-center gap-1 font-bold"
                    title="Report User"
                  >
                    <AlertTriangle size={14} />
                    <span className="hidden sm:inline">Report</span>
                  </button>
                  <button
                    onClick={handleBlockUser}
                    className="p-2 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 rounded-lg text-gray-400 hover:text-rose-400 transition text-xs flex items-center gap-1 font-bold"
                    title="Block User"
                    disabled={isBlocked}
                  >
                    <UserX size={14} />
                    <span className="hidden sm:inline">{isBlocked ? 'Blocked' : 'Block'}</span>
                  </button>
                </div>
              </div>

              {/* Message History area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMsg ? (
                  <div className="flex justify-center items-center h-full">
                    <Spinner size="md" />
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender._id === user._id || msg.sender === user._id;
                    const isFlagged = msg.flagged || (!isMe && containsProfanity(msg.content));
                    const senderName = typeof msg.sender === 'object' ? msg.sender.name : activeUser?.name;
                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col max-w-[75%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <div
                          className={`p-3.5 rounded-2xl text-sm ${
                            isFlagged
                              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                              : isMe
                              ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10'
                              : 'bg-white/5 border border-white/5 text-gray-200 rounded-tl-none'
                          }`}
                        >
                          {isFlagged && !isMe ? (
                            <div 
                              className="space-y-2 cursor-pointer group" 
                              onClick={() => {
                                setPopupMessageId(msg._id);
                                setPopupSenderName(senderName);
                                setShowPopupButtons(true);
                              }}
                              title="Click to view block & report options"
                            >
                              <p className="flex items-center gap-1 text-xs text-rose-400 font-semibold uppercase tracking-wider">
                                <ShieldAlert size={14} className="group-hover:animate-bounce" />
                                <span>⚠ Harmful Content Detected</span>
                              </p>
                              <p className="italic text-gray-400 text-xs">This message contains abusive or inappropriate language.</p>
                              <div className="flex gap-2 justify-end pt-1">
                                <span className="text-[10px] font-bold text-rose-400 underline group-hover:text-rose-300">
                                  Block or Report {senderName || 'User'}
                                </span>
                              </div>
                            </div>
                          ) : isFlagged && isMe ? (
                            <div>
                              <p className="text-rose-300">{msg.content}</p>
                              <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                                <ShieldAlert size={10} /> Your message was flagged
                              </p>
                            </div>
                          ) : (
                            <p>{msg.content}</p>
                          )}
                        </div>
                        <span className="text-[9px] text-gray-500 mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}

                {/* Typing Indicator */}
                {isPartnerTyping && (
                  <div className="flex items-center gap-1 mr-auto text-xs text-gray-400 italic bg-white/5 border border-white/5 rounded-full px-3 py-1.5 animate-pulse-subtle">
                    <span>{activeUser.name} is typing</span>
                    <span className="flex gap-0.5 ml-1">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Controls */}
              <div className="p-4 border-t border-white/10 bg-[#0b0f19]/30">
                {isBlocked ? (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-center rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                    <AlertOctagon size={16} />
                    <span>Messaging is blocked for this user connection.</span>
                  </div>
                ) : (
                  <div>
                    {/* Real-time typing profanity warning */}
                    {inputHasProfanity && (
                      <div className="mb-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 animate-fade-in">
                        <ShieldAlert size={16} className="text-rose-400 shrink-0 animate-pulse" />
                        <p className="text-[11px] text-rose-300 font-medium">
                          ⚠ Your message contains harmful or abusive words. Sending this may result in your message being flagged.
                        </p>
                      </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={(e) => {
                          setInputText(e.target.value);
                          handleTyping();
                        }}
                        className={`glass-input flex-1 px-4 py-2.5 rounded-xl text-sm transition-all ${
                          inputHasProfanity ? 'border-rose-500/40 ring-1 ring-rose-500/20' : ''
                        }`}
                      />
                      <Button type="submit" className="px-4 py-2.5">
                        <Send size={16} />
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Select a conversation to start messaging.
            </div>
          )}
        </div>
      </div>

      {/* Security / Profanity Alert Popup Modal */}
      {showPopupButtons && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-rose-500/30 shadow-2xl shadow-rose-950/20 text-center scale-up">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
              <ShieldAlert size={32} className="animate-pulse" />
            </div>
            
            <h3 className="text-xl font-extrabold text-white mb-2">⚠ Harmful Content Detected</h3>
            
            <p className="text-gray-300 text-sm mb-1 leading-relaxed">
              A message{popupSenderName ? ` from <strong class="text-white">${popupSenderName}</strong>` : ''} contains language flagged as abusive, harmful, or inappropriate.
            </p>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              To ensure our Peru Enti community remains safe, you can instantly block this user or report them to admins.
            </p>
            
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  handleBlockUser();
                  setShowPopupButtons(false);
                }}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-rose-600/20"
              >
                <UserX size={16} />
                <span>Block User</span>
              </button>
              
              <button
                onClick={() => {
                  handleReportUser(popupMessageId);
                  setShowPopupButtons(false);
                }}
                className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:text-amber-300 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm"
              >
                <AlertTriangle size={16} />
                <span>Report User</span>
              </button>
              
              <button
                onClick={() => setShowPopupButtons(false)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl font-semibold transition text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
