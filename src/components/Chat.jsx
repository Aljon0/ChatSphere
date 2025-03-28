/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import Sidebar from "./Sidebar";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { increment } from "firebase/firestore";

function Chat({ user, onLogout, darkMode, toggleTheme }) {
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [activeChatDetails, setActiveChatDetails] = useState(null);

  const checkUserExists = async (userId) => {
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
            (id) => id !== user.id
          );

          console.log("Other user ID:", otherUserId);

          const userDoc = await getDoc(doc(db, "users", otherUserId));
          const userData = userDoc.data();

          console.log("User data:", userData);

          return {
            id: otherUserId,
            chatId: chatDoc.id, // Use 'chatDoc' here
            name: userData.name,
            avatar: userData.avatar,
            status: "online",
            lastMessage: chatData.lastMessage?.content || "No messages yet",
            timestamp: chatData.lastMessage?.timestamp || chatData.createdAt,
            unread: chatData.unreadCount[user.id] || 0,
          };
        })
      );

      console.log("Processed chats:", chatsData);
      setContacts(chatsData);
    } catch (error) {
      console.error("Error fetching user chats:", error);
    }
  };

  useEffect(() => {
    if (!user.id) return;

    const fetchUserChats = async () => {
      try {
        const chatsRef = collection(db, "chats");
        const q = query(
          chatsRef,
          where("participants", "array-contains", user.id)
        );
        const querySnapshot = await getDocs(q);

        const chatsData = await Promise.all(
          querySnapshot.docs.map(async (chatDoc) => {
            // Renamed 'doc' to 'chatDoc'
            const chatData = chatDoc.data();
            const otherUserId = chatData.participants.find(
              (id) => id !== user.id
            );
            const userDoc = await getDoc(doc(db, "users", otherUserId));
            const userData = userDoc.data();

            return {
              id: otherUserId,
              chatId: chatDoc.id, // Use 'chatDoc' here
              name: userData.name,
              avatar: userData.avatar,
              status: "online", // You can implement real status later
              lastMessage: chatData.lastMessage?.content || "No messages yet",
              timestamp: chatData.lastMessage?.timestamp || chatData.createdAt,
              unread: chatData.unreadCount[user.id] || 0,
            };
          })
        );

        setContacts(chatsData);
      } catch (error) {
        console.error("Error fetching user chats:", error);
      }
    };

    fetchUserChats();
  }, [user.id]);

  // Fetch all registered users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const users = usersSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((u) => u.id !== user.id); // Exclude current user
        setRegisteredUsers(users);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [user.id]);

  // Fetch or create chat when activeChat changes
  useEffect(() => {
    if (!activeChat) return;

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
        setActiveChatDetails({
          id: activeChat,
          name: userData.name,
          avatar: userData.avatar,
          status: "online",
        });

        // Check if chat already exists between these users
        const chatsRef = collection(db, "chats");
        const q = query(
          chatsRef,
          where("participants", "array-contains", user.id)
        );

        const querySnapshot = await getDocs(q);
        let existingChat = null;

        querySnapshot.forEach((doc) => {
          const chatData = doc.data();
          if (chatData.participants.includes(activeChat)) {
            existingChat = { id: doc.id, ...chatData };
          }
        });

        if (!existingChat) {
          // Create new chat
          const newChatRef = doc(collection(db, "chats"));
          await setDoc(newChatRef, {
            participants: [user.id, activeChat],
            createdAt: new Date().toISOString(),
            lastMessage: null,
            unreadCount: { [user.id]: 0, [activeChat]: 0 },
          });

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

          setChatId(newChatRef.id);
          setupRealTimeMessages(newChatRef.id);
        } else {
          setChatId(existingChat.id);
          setupRealTimeMessages(existingChat.id);
        }
      } catch (error) {
        console.error("Error in fetchOrCreateChat:", error);
      }
    };

    fetchOrCreateChat();
  }, [activeChat, user.id]);

  // Setup real-time message listener
  const setupRealTimeMessages = (chatId) => {
    const messagesRef = collection(db, "chats", chatId, "messages");
    const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messagesData);

      // Mark messages as read when they are displayed
      markMessagesAsRead(chatId);
    });

    return unsubscribe;
  };

  // Mark messages as read
  const markMessagesAsRead = async (chatId) => {
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
  const sendMessage = async (content) => {
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

  // Fetch user chats (contacts)
  useEffect(() => {
    if (!user.id) return;

    const fetchUserChats = async () => {
      try {
        const chatsRef = collection(db, "chats");
        const q = query(
          chatsRef,
          where("participants", "array-contains", user.id)
        );
        const querySnapshot = await getDocs(q);

        const chatsData = await Promise.all(
          querySnapshot.docs.map(async (chatDoc) => {
            // Renamed 'doc' to 'chatDoc'
            const chatData = chatDoc.data();
            const otherUserId = chatData.participants.find(
              (id) => id !== user.id
            );
            const userDoc = await getDoc(doc(db, "users", otherUserId));
            const userData = userDoc.data();

            return {
              id: otherUserId,
              chatId: chatDoc.id, // Use 'chatDoc' here
              name: userData.name,
              avatar: userData.avatar,
              status: "online", // You can implement real status later
              lastMessage: chatData.lastMessage?.content || "No messages yet",
              timestamp: chatData.lastMessage?.timestamp || chatData.createdAt,
              unread: chatData.unreadCount[user.id] || 0,
            };
          })
        );

        setContacts(chatsData);
      } catch (error) {
        console.error("Error fetching user chats:", error);
      }
    };

    fetchUserChats();
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
            (id) => id !== user.id
          );

          const userDoc = await getDoc(doc(db, "users", otherUserId));
          const userData = userDoc.data();

          return {
            id: otherUserId,
            chatId: chatDoc.id,
            name: userData.name,
            avatar: userData.avatar,
            status: "online",
            lastMessage: chatData.lastMessage?.content || "No messages yet",
            timestamp: chatData.lastMessage?.timestamp || chatData.createdAt,
            unread: chatData.unreadCount[user.id] || 0,
          };
        })
      );

      setContacts(chatsData);
    });

    return () => unsubscribe();
  }, [user.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
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
          allUsers={registeredUsers}
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
              contact={
                activeChatDetails || {
                  id: activeChat,
                  name: activeChat,
                  avatar: "", // default avatar
                  status: "offline",
                }
              }
              toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              darkMode={darkMode}
            />

            <MessageList
              messages={messages}
              user={user}
              contact={
                activeChatDetails || contacts.find((c) => c.id === activeChat)
              }
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
