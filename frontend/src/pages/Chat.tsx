import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import socket from "../socket";
import "../style/chat.css";

interface Participant {
  _id: string;
  username: string;
  email: string;
}

interface Conversation {
  _id: string;
  participants: Participant[];
}

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    username: string;
  };
}

interface CurrentUser {
  id: string;
  username?: string;
}

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #1845ad, #23a2f6)",
  "linear-gradient(135deg, #ff512f, #f09819)",
  "linear-gradient(135deg, #7b2ff7, #f107a3)",
  "linear-gradient(135deg, #11998e, #38ef7d)",
];

function getAvatarGradient(seed: string) {
  const sum = seed
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length];
}

function getInitial(name?: string) {
  return name?.trim()?.[0]?.toUpperCase() || "?";
}

export default function Chat() {
  const navigate = useNavigate();
  const [currentUser] = useState<CurrentUser>(() =>
    JSON.parse(localStorage.getItem("user") || "{}")
  );

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Socket connection + user registration
  useEffect(() => {
    if (currentUser?.id) {
      socket.emit("register-user", currentUser.id);
    }
  }, [currentUser]);

  // Receive real-time messages
  useEffect(() => {
    const handleReceiveMessage = (message: Message) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
    };

    socket.on("receive-message", handleReceiveMessage);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
    };
  }, []);

  // Load conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoadingConversations(true);
        const res = await api.get("/conversations");
        setConversations(res.data);
      } catch (error) {
        console.error("Failed to load conversations:", error);
      } finally {
        setIsLoadingConversations(false);
      }
    };

    fetchConversations();
  }, []);

  // Keep the latest message in view
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async (conversation: Conversation) => {
    try {
      setSelectedConversation(conversation);
      setIsLoadingMessages(true);

      const res = await api.get(`/messages/${conversation._id}`);
      setMessages(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      const receiver = selectedConversation.participants.find(
        (p) => p._id !== currentUser.id
      );

      const res = await api.post("/messages", {
        conversationId: selectedConversation._id,
        content: newMessage,
      });

      setMessages((prev) => [...prev, res.data]);

      if (receiver) {
        socket.emit("send-message", {
          receiverId: receiver._id,
          message: res.data,
        });
      }

      setNewMessage("");
    } catch (error) {
      console.error(error);
    }
  };

  const handleComposerKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const getConversationLabel = (conversation: Conversation) => {
    const others = conversation.participants.filter(
      (p) => p._id !== currentUser.id
    );
    return others.map((p) => p.username).join(", ") || "Unknown";
  };

  return (
    <div className="chat-page">
      <div
        className={`chat-shell ${
          selectedConversation ? "chat-shell--conversation-open" : ""
        }`}
      >
        <aside className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h1>Messages</h1>
          </div>

          <div className="conversation-list">
            {isLoadingConversations ? (
              <p className="chat-state-message">Loading conversations…</p>
            ) : conversations.length === 0 ? (
              <p className="chat-state-message">
                Your conversations will appear here.
              </p>
            ) : (
              conversations.map((conversation) => {
                const label = getConversationLabel(conversation);
                const isActive =
                  selectedConversation?._id === conversation._id;

                return (
                  <div
                    key={conversation._id}
                    onClick={() => loadMessages(conversation)}
                    className={`conversation-item ${
                      isActive ? "conversation-item--active" : ""
                    }`}
                  >
                    <div
                      className="avatar"
                      style={{ background: getAvatarGradient(label) }}
                    >
                      {getInitial(label)}
                    </div>
                    <span className="conversation-name">{label}</span>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <main className="chat-main">
          <div className="chat-main-header">
            <h1>Chat</h1>
            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>

          {selectedConversation ? (
            <>
              <header className="chat-header">
                <button
                  type="button"
                  className="chat-back-button"
                  onClick={() => setSelectedConversation(null)}
                  aria-label="Back to conversations"
                >
                  ←
                </button>

                <div
                  className="avatar avatar--header"
                  style={{
                    background: getAvatarGradient(
                      getConversationLabel(selectedConversation)
                    ),
                  }}
                >
                  {getInitial(getConversationLabel(selectedConversation))}
                </div>

                <h2>{getConversationLabel(selectedConversation)}</h2>
              </header>

              <div className="chat-messages">
                {isLoadingMessages ? (
                  <p className="chat-state-message">Loading messages…</p>
                ) : messages.length === 0 ? (
                  <p className="chat-state-message">
                    No messages yet. Say hello to start the conversation.
                  </p>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.sender?._id === currentUser.id;

                    return (
                      <div
                        key={message._id}
                        className={`message-row ${
                          isOwn ? "message-row--own" : "message-row--other"
                        }`}
                      >
                        {!isOwn && (
                          <div
                            className="avatar avatar--small"
                            style={{
                              background: getAvatarGradient(
                                message.sender?.username || ""
                              ),
                            }}
                          >
                            {getInitial(message.sender?.username)}
                          </div>
                        )}

                        <div className="message-bubble">
                          {!isOwn && (
                            <p className="message-sender">
                              {message.sender?.username}
                            </p>
                          )}
                          <p>{message.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-composer">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Type a message"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  aria-label="Send message"
                >
                  ➤
                </button>
              </div>
            </>
          ) : (
            <div className="chat-empty-state">
              <p>Select a conversation to start chatting.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}