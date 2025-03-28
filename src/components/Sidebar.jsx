import React, { useState, useEffect } from "react";
import {
  FaMoon,
  FaPlus,
  FaSearch,
  FaSignOutAlt,
  FaSun,
  FaUserFriends,
} from "react-icons/fa";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

function Sidebar({
  user,
  contacts,
  setContacts,
  activeChat,
  setActiveChat,
  onLogout,
  darkMode,
  toggleTheme,
  allUsers,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchRegisteredUsers, setSearchRegisteredUsers] = useState([]);

  // Filter contacts based on search term and online status
  useEffect(() => {
    const filtered = contacts.filter((contact) => {
      const matchesSearch = contact.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesOnlineFilter = showOnlineOnly
        ? contact.status === "online"
        : true;
      return matchesSearch && matchesOnlineFilter;
    });
    setFilteredContacts(filtered);
  }, [contacts, searchTerm, showOnlineOnly]);

  // Filter registered users based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchRegisteredUsers([]);
      return;
    }

    const filtered = allUsers.filter(
      (registeredUser) =>
        registeredUser.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        registeredUser.id !== user.id &&
        !contacts.some((contact) => contact.id === registeredUser.id)
    );
    setSearchRegisteredUsers(filtered);
  }, [allUsers, searchTerm, user.id, contacts]);

  // Format timestamp for last message
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    }
    return date.toLocaleDateString([], { weekday: "short" });
  };

  const startNewChat = async (userId) => {
    try {
      // Check if chat already exists
      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("participants", "array-contains", user.id)
      );

      const querySnapshot = await getDocs(q);
      let existingChat = null;

      querySnapshot.forEach((doc) => {
        const chatData = doc.data();
        if (chatData.participants.includes(userId)) {
          existingChat = { id: doc.id, ...chatData };
        }
      });

      // Fetch user details for the selected user
      const userDoc = await getDoc(doc(db, "users", userId));
      const userData = userDoc.data();

      if (!existingChat) {
        // Create new chat
        const newChatRef = doc(collection(db, "chats"));
        await setDoc(newChatRef, {
          participants: [user.id, userId],
          createdAt: new Date().toISOString(),
          lastMessage: null,
          unreadCount: { [user.id]: 0, [userId]: 0 },
        });

        // Add to contacts immediately for better UX
        const newContact = {
          id: userId,
          chatId: newChatRef.id,
          name: userData.name,
          avatar: userData.avatar,
          status: "online",
          lastMessage: "No messages yet",
          timestamp: new Date().toISOString(),
          unread: 0,
        };

        setContacts((prev) => {
          // Check if contact already exists to avoid duplicates
          const existingContactIndex = prev.findIndex((c) => c.id === userId);
          if (existingContactIndex > -1) {
            const updatedContacts = [...prev];
            updatedContacts[existingContactIndex] = newContact;
            return updatedContacts;
          }
          return [...prev, newContact];
        });

        // Set the new chat as active
        setActiveChat(userId);
      } else {
        // Chat exists, just set as active
        setActiveChat(userId);
      }
    } catch (error) {
      console.error("Error starting new chat:", error);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className={`p-6 rounded-lg shadow-xl ${
              darkMode ? "bg-[#2C2C2C] text-white" : "bg-white"
            }`}
          >
            <h3 className="text-lg font-semibold mb-4">Confirm Logout</h3>
            <p className="mb-6">Are you sure you want to log out?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className={`px-4 py-2 rounded ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User profile and settings */}
      <div
        className={`p-4 flex items-center justify-between border-b ${
          darkMode ? "border-gray-700" : "border-gray-300"
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <div className="font-semibold">{user.name || user.email}</div>
            <div className="text-xs text-green-500">Online</div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${
              darkMode ? "hover:bg-[#4C4C4C]" : "hover:bg-gray-200"
            }`}
          >
            {darkMode ? (
              <FaSun className="text-yellow-300" />
            ) : (
              <FaMoon className="text-gray-600" />
            )}
          </button>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`p-2 rounded-full ${
              darkMode ? "hover:bg-[#4C4C4C]" : "hover:bg-gray-200"
            }`}
          >
            <FaSignOutAlt
              className={darkMode ? "text-white" : "text-gray-600"}
            />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="p-4">
        <div
          className={`flex items-center rounded-lg px-3 ${
            darkMode ? "bg-[#4C4C4C]" : "bg-white"
          }`}
        >
          <FaSearch className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search conversations or users..."
            className={`flex-1 py-2 outline-none ${
              darkMode ? "bg-[#4C4C4C] text-white" : "bg-white"
            }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center mt-2">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={showOnlineOnly}
              onChange={() => setShowOnlineOnly(!showOnlineOnly)}
            />
            <div
              className={`w-9 h-5 ${
                darkMode ? "bg-gray-700" : "bg-gray-300"
              } rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#85C7F2] relative`}
            ></div>
            <span className="ml-2 text-sm">Online only</span>
          </label>
        </div>
      </div>

      {/* Contacts/Chats list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-500">
              {searchTerm ? "Search Results" : "Messages"}
            </h3>
            <button
              className={`p-1 rounded ${
                darkMode ? "hover:bg-[#4C4C4C]" : "hover:bg-gray-200"
              }`}
            >
              <FaPlus size={14} className="text-[#85C7F2]" />
            </button>
          </div>

          <div className="space-y-1">
            {/* Existing Contacts */}
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`flex items-center p-3 rounded-lg cursor-pointer ${
                    activeChat === contact.id
                      ? "bg-[#85C7F2] text-white"
                      : darkMode
                      ? "hover:bg-[#4C4C4C]"
                      : "hover:bg-gray-200"
                  }`}
                  onClick={() => setActiveChat(contact.id)}
                >
                  <div className="relative mr-3">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {contact.status === "online" && (
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 ${
                          activeChat === contact.id
                            ? "border-[#85C7F2]"
                            : "border-white"
                        }`}
                      ></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <h4 className="font-semibold truncate">{contact.name}</h4>
                      <span
                        className={`text-xs ${
                          activeChat === contact.id
                            ? "text-white"
                            : "text-gray-500"
                        }`}
                      >
                        {formatTime(contact.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm truncate ${
                          activeChat === contact.id
                            ? "text-white"
                            : darkMode
                            ? "text-gray-300"
                            : "text-gray-500"
                        }`}
                      >
                        {contact.lastMessage || "No messages yet"}
                      </p>
                      {contact.unread > 0 && (
                        <span
                          className={`ml-2 flex-shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full text-xs ${
                            activeChat === contact.id
                              ? "bg-white text-[#85C7F2]"
                              : "bg-[#85C7F2] text-white"
                          }`}
                        >
                          {contact.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : searchRegisteredUsers.length > 0 ? (
              // Registered Users Search Results
              searchRegisteredUsers.map((registeredUser) => (
                <div
                  key={registeredUser.id}
                  className={`flex items-center p-3 rounded-lg cursor-pointer ${
                    darkMode ? "hover:bg-[#4C4C4C]" : "hover:bg-gray-200"
                  }`}
                  onClick={() => startNewChat(registeredUser.id)}
                >
                  <div className="relative mr-3">
                    <img
                      src={registeredUser.avatar}
                      alt={registeredUser.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">
                      {registeredUser.name}
                    </h4>
                    <p
                      className={`text-sm truncate ${
                        darkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      {registeredUser.email}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No conversations or users found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
