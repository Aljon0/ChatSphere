import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { db } from "../firebase";
import { ChatProps, Contact, ExistingChatProps, Message, User } from "../types";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import Sidebar from "./Sidebar";

function Chat({ user, onLogout, darkMode, toggleTheme }: ChatProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true); // Default to open on mobile
  const messagesEndRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [activeChatDetails, setActiveChatDetails] = useState<Contact | null>(
    null
  );
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});

  const searchMessages = async (searchQuery: string) => {
    if (!searchQuery.trim() || !chatId) return;

    setIsSearching(true);
    try {
      const messagesRef = collection(db, "chats", chatId, "messages");
      const q = query(
        messagesRef,
        where("content", ">=", searchQuery),
        where("content", "<=", searchQuery + "\uf8ff")
      );

      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSearchResults(results as Message[]);
      console.log(searchResults);

      // Scroll to first result if any
      if (results.length > 0) {
        const messageElement = document.getElementById(
          `message-${results[0].id}`
        );
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: "smooth" });
          messageElement.classList.add("bg-yellow-100");
          setTimeout(() => {
            messageElement.classList.remove("bg-yellow-100");
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Error searching messages:", error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const onlineUsersMap: Record<string, boolean> = {};

      snapshot.docs.forEach((doc) => {
        const userData = doc.data();
        // User is online if status is online and last active within 5 minutes
        const isOnline =
          userData.status === "online" &&
          userData.lastActive &&
          new Date().getTime() -
            new Date(userData.lastActive.toDate()).getTime() <
            300000;

        onlineUsersMap[doc.id] = isOnline;
      });

      setOnlineUsers(onlineUsersMap);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Add this function to delete a conversation
  const deleteConversation = async () => {
    if (!chatId) return;

    try {
      // First delete all messages in the chat
      const messagesRef = collection(db, "chats", chatId, "messages");
      const messagesSnapshot = await getDocs(messagesRef);

      const batch = writeBatch(db);
      messagesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete the chat document
      const chatRef = doc(db, "chats", chatId);
      batch.delete(chatRef);

      await batch.commit();

      // Reset states
      setActiveChat(null);
      setChatId(null);
      setMessages([]);
      setActiveChatDetails(null);

      // Refresh contacts list
      fetchUserChats();

      // Make sure sidebar is visible on mobile after deletion
      setIsMobileMenuOpen(true);
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const checkUserExists = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      return userDoc.exists();
    } catch (error) {
      console.error("Error checking user existence:", error);
      return false;
    }
  };

  const fetchUserChats = async () => {
    try {
      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("participants", "array-contains", user.id)
      );
      const querySnapshot = await getDocs(q);

      console.log("Found chats:", querySnapshot.docs.length);

      const chatsData = await Promise.all(
        querySnapshot.docs.map(async (chatDoc) => {
          // Renamed 'doc' to 'chatDoc'
          const chatData = chatDoc.data();
          const otherUserId = chatData.participants.find(
            (id: string) => id !== user.id
          );

          console.log("Other user ID:", otherUserId);

          const userDoc = await getDoc(doc(db, "users", otherUserId));
          const userData = userDoc.data();

          console.log("User data:", userData);

          return {
            id: otherUserId,
            chatId: chatDoc.id, // Use 'chatDoc' here
            name: userData?.name,
            avatar: userData?.avatar,
            status: "online",
            lastMessage: chatData.lastMessage?.content || "No messages yet",
            timestamp: chatData.lastMessage?.timestamp || chatData.createdAt,
            unread: chatData.unreadCount[user.id] || 0,
          };
        })
      );

      console.log("Processed chats:", chatsData);
      setContacts(chatsData as Contact[]);
    } catch (error) {
      console.error("Error fetching user chats:", error);
    }
  };

  useEffect(() => {
    if (!user.id) return;

    fetchUserChats();
  }, [user.id]);

  // Fetch or create chat when activeChat changes
  useEffect(() => {
    if (!activeChat) return;

    // Hide sidebar when chat is selected on mobile
    setIsMobileMenuOpen(false);

    const fetchOrCreateChat = async () => {
      try {
        // First check if the other user exists
        const userExists = await checkUserExists(activeChat);
        if (!userExists) {
          console.error("User does not exist:", activeChat);
          return;
        }

        // Get the other user's details
        const userDoc = await getDoc(doc(db, "users", activeChat));
        const userData = userDoc.data();

        // Set active chat details
        if (userData) {
          setActiveChatDetails({
            id: activeChat,
            chatId: chatId || "", // Provide a fallback if chatId is null
            name: userData.name,
            avatar: userData.avatar,
            status: "online",
            unread: 0, // Default unread count
          });
        } else {
          console.error("User data is undefined for activeChat:", activeChat);
        }

        // Check if chat already exists between these users
        const chatsRef = collection(db, "chats");
        const q = query(
          chatsRef,
          where("participants", "array-contains", user.id)
        );

        const querySnapshot = await getDocs(q);
        let existingChat: ExistingChatProps = {
          id: "",
          participants: [],
          createdAt: "",
          lastMessage: "",
          unreadCount: "",
        };

        querySnapshot.forEach((doc) => {
          const chatData = doc.data();
          if (chatData.participants.includes(activeChat)) {
            existingChat = {
              id: doc.id,
              ...chatData,
            } as ExistingChatProps;
          }
        });

        if (!existingChat.id) {
          // Create new chat
          const newChatRef = doc(collection(db, "chats"));
          await setDoc(newChatRef, {
            participants: [user.id, activeChat],
            createdAt: new Date().toISOString(),
            lastMessage: null,
            unreadCount: { [user.id]: 0, [activeChat]: 0 },
          });

          if (userData) {
            // Add to contacts immediately for better UX
            setContacts((prev) => [
              ...prev,
              {
                id: activeChat,
                chatId: newChatRef.id,
                name: userData.name,
                avatar: userData.avatar,
                status: "online",
                lastMessage: "No messages yet",
                timestamp: new Date().toISOString(),
                unread: 0,
              },
            ]);
          }

          setChatId(newChatRef.id);
          setupRealTimeMessages(newChatRef.id);
        } else {
          if (existingChat.id) {
            setChatId(existingChat.id);
            setupRealTimeMessages(existingChat.id);
          } else {
            console.error("Chat ID is undefined for existingChat.");
          }
        }
      } catch (error) {
        console.error("Error in fetchOrCreateChat:", error);
      }
    };

    fetchOrCreateChat();
  }, [activeChat, user.id]);

  // Setup real-time message listener
  const setupRealTimeMessages = (chatId: string) => {
    const messagesRef = collection(db, "chats", chatId, "messages");
    const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          sender: data.sender || "unknown",
          content: data.content || "",
          timestamp: data.timestamp || new Date().toISOString(),
          ...data,
        };
      });
      setMessages(messagesData as Message[]);

      // Mark messages as read when they are displayed
      markMessagesAsRead(chatId);
    });

    return unsubscribe;
  };

  // Mark messages as read
  const markMessagesAsRead = async (chatId: string) => {
    try {
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        [`unreadCount.${user.id}`]: 0,
      });

      // Optionally, you can update the local contacts state to reflect read messages
      setContacts((prevContacts) =>
        prevContacts.map((contact) =>
          contact.id === activeChat ? { ...contact, unread: 0 } : contact
        )
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Send message function
  const sendMessage = async (content: string) => {
    if (!content.trim() || !activeChat || !chatId) return;

    try {
      const messagesRef = collection(db, "chats", chatId, "messages");
      const newMessageRef = doc(messagesRef);

      const newMessage = {
        id: newMessageRef.id,
        sender: user.id,
        content,
        timestamp: new Date().toISOString(),
        status: "sent",
      };

      await setDoc(newMessageRef, newMessage);

      // Update chat last message and unread count
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        lastMessage: {
          content,
          timestamp: new Date().toISOString(),
          sender: user.id,
        },
        [`unreadCount.${activeChat}`]: increment(1),
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Fetch all registered users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const users = usersSnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || "Unknown", // Ensure name is provided
              email: data.email || "Unknown", // Ensure email is provided
              ...data,
            };
          })
          .filter((u) => u.id !== user.id); // Exclude current user
        setRegisteredUsers(users);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [user.id]);

  useEffect(() => {
    if (!user.id) return;

    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("participants", "array-contains", user.id));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const chatsData = await Promise.all(
        querySnapshot.docs.map(async (chatDoc) => {
          const chatData = chatDoc.data();
          const otherUserId = chatData.participants.find(
            (id: string) => id !== user.id
          );

          const userDoc = await getDoc(doc(db, "users", otherUserId));
          const userData = userDoc.data();

          return {
            id: otherUserId,
            chatId: chatDoc.id,
            name: userData?.name,
            avatar: userData?.avatar,
            status: "online",
            lastMessage: chatData.lastMessage?.content || "No messages yet",
            timestamp: chatData.lastMessage?.timestamp || chatData.createdAt,
            unread: chatData.unreadCount[user.id] || 0,
          };
        })
      );

      setContacts(chatsData as Contact[]);
    });

    return () => unsubscribe();
  }, [user.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle mobile menu button click
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar - always visible on desktop, conditionally on mobile */}
      <div
        className={`${
          isMobileMenuOpen ? "block" : "hidden"
        } md:block fixed md:static inset-0 z-30 md:z-auto md:w-1/3 lg:w-1/4 ${
          darkMode ? "bg-[#636363]" : "bg-[#DBDBDB]"
        } border-r ${darkMode ? "border-gray-700" : "border-gray-300"}`}
        style={{ height: "100vh", overflowY: "auto" }}
      >
        <Sidebar
          user={user}
          contacts={contacts}
          activeChat={activeChat}
          setActiveChat={setActiveChat}
          onLogout={onLogout}
          darkMode={darkMode}
          toggleTheme={toggleTheme}
          allUsers={registeredUsers}
        />
      </div>

      {/* Main chat area */}
      <div
        className={`flex-1 flex flex-col ${
          darkMode ? "bg-[#4C4C4C]" : "bg-white"
        } ${isMobileMenuOpen ? "hidden md:flex" : "flex"}`}
      >
        {activeChat ? (
          <>
            <ChatHeader
              onlineUsers={onlineUsers}
              contact={
                activeChatDetails || {
                  id: activeChat,
                  chatId: "",
                  name: activeChat,
                  avatar: "",
                  status: "offline",
                  unread: 0,
                }
              }
              toggleMobileMenu={toggleMobileMenu}
              darkMode={darkMode}
              onSearchMessage={searchMessages}
              isSearching={isSearching}
              searchResults={searchResults}
              onDeleteConversation={deleteConversation}
            />

            <MessageList
              messages={messages}
              user={user}
              contact={
                activeChatDetails ||
                contacts.find((c) => c.id === activeChat) ||
                null
              }
              darkMode={darkMode}
              messagesEndRef={messagesEndRef}
            />

            <MessageInput onSendMessage={sendMessage} darkMode={darkMode} />
          </>
        ) : (
          <>
            {/* Mobile welcome screen with visible sidebar toggle */}
            <div className="md:hidden p-4 flex items-center border-b">
              <button
                className="p-2 rounded-full hover:bg-gray-200"
                onClick={toggleMobileMenu}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              <h1 className="ml-4 font-semibold text-xl">ChatSphere</h1>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">👋</div>
                <h2 className="text-2xl font-semibold mb-2">
                  Welcome to ChatSphere
                </h2>
                <p
                  className={`${darkMode ? "text-gray-300" : "text-gray-500"}`}
                >
                  Select a conversation to start messaging
                </p>
                {/* Mobile-only button to show sidebar */}
                <button
                  className="md:hidden mt-6 px-6 py-2 bg-blue-500 text-white rounded-full"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  View Contacts
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Chat;
