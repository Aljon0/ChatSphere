import React, { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import Sidebar from "./Sidebar";

function Chat({ user, onLogout, darkMode, toggleTheme }) {
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Generate some mock contacts on initial render
  useEffect(() => {
    const mockContacts = [
      {
        id: "1",
        name: "Sarah Johnson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
        status: "online",
        lastMessage: "Hey! How are you doing?",
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        unread: 1,
      },
      {
        id: "2",
        name: "Mike Chen",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
        status: "online",
        lastMessage: "Did you see the new design?",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        unread: 0,
      },
      {
        id: "3",
        name: "Alex Morgan",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
        status: "offline",
        lastMessage: "Let me know when you finish the project",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        unread: 0,
      },
      {
        id: "4",
        name: "Design Team",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=design",
        status: "online",
        lastMessage: "Meeting at 3pm",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        unread: 3,
        isGroup: true,
        members: ["Sarah Johnson", "Mike Chen", "You"],
      },
    ];

    // Initialize mock messages for each contact
    const mockMessages = {};
    mockContacts.forEach((contact) => {
      mockMessages[contact.id] = [
        {
          id: `msg1-${contact.id}`,
          sender: contact.id,
          content: contact.lastMessage,
          timestamp: contact.timestamp,
          status: "read",
        },
        {
          id: `msg2-${contact.id}`,
          sender: user.id,
          content: "Thanks for reaching out!",
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          status: "delivered",
        },
      ];
    });

    setContacts(mockContacts);
    setMessages(mockMessages);
    setActiveChat(mockContacts[0].id);
  }, [user.id]);

  const sendMessage = (content) => {
    if (!content.trim() || !activeChat) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: user.id,
      content,
      timestamp: new Date().toISOString(),
      status: "sent",
    };

    setMessages((prev) => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), newMessage],
    }));

    // Simulate a reply after 1-3 seconds
    setTimeout(() => {
      const contact = contacts.find((c) => c.id === activeChat);
      const replyMessage = {
        id: `reply-${Date.now()}`,
        sender: activeChat,
        content: `Thanks for your message about "${content.substring(0, 20)}${
          content.length > 20 ? "..." : ""
        }"`,
        timestamp: new Date().toISOString(),
        status: "delivered",
      };

      setMessages((prev) => ({
        ...prev,
        [activeChat]: [...(prev[activeChat] || []), replyMessage],
      }));
    }, 1000 + Math.random() * 2000);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  return (
    <div className="flex h-screen">
      {/* Sidebar - hidden on mobile unless menu is open */}
      <div
        className={`${
          isMobileMenuOpen ? "block" : "hidden"
        } md:block md:w-1/3 lg:w-1/4 ${
          darkMode ? "bg-[#636363]" : "bg-[#DBDBDB]"
        } border-r ${darkMode ? "border-gray-700" : "border-gray-300"}`}
      >
        <Sidebar
          user={user}
          contacts={contacts}
          activeChat={activeChat}
          setActiveChat={setActiveChat}
          onLogout={onLogout}
          darkMode={darkMode}
          toggleTheme={toggleTheme}
        />
      </div>

      {/* Main chat area */}
      <div
        className={`flex-1 flex flex-col ${
          darkMode ? "bg-[#4C4C4C]" : "bg-white"
        }`}
      >
        {activeChat ? (
          <>
            <ChatHeader
              contact={contacts.find((c) => c.id === activeChat)}
              toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              darkMode={darkMode}
            />

            <MessageList
              messages={messages[activeChat] || []}
              user={user}
              contact={contacts.find((c) => c.id === activeChat)}
              darkMode={darkMode}
              messagesEndRef={messagesEndRef}
            />

            <MessageInput onSendMessage={sendMessage} darkMode={darkMode} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">👋</div>
              <h2 className="text-2xl font-semibold mb-2">
                Welcome to ChatSphere
              </h2>
              <p className="text-gray-500">
                Select a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
