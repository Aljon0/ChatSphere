/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { FaMoon, FaPlus, FaSearch, FaSignOutAlt, FaSun } from "react-icons/fa";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { Contact, SidebarProps, User } from "../types";

function Sidebar({
  user,
  contacts,

  activeChat,
  setActiveChat,
  onLogout,
  darkMode,
  toggleTheme,
  allUsers,
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchRegisteredUsers, setSearchRegisteredUsers] = useState<User[]>(
    []
  );
  const [onlineUsers, setOnlineUsers] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [lastSeen, setLastSeen] = useState<Record<string, any>>({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Enhanced online status tracking
  useEffect(() => {
    if (!user?.id) return;

    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const onlineUsersMap: { [key: string]: boolean } = {};
      const lastSeenMap: { [key: string]: any } = {};

      snapshot.docs.forEach((doc) => {
        const userData = doc.data();
        // More accurate online status detection
        const isOnline =
          userData.status === "online" &&
          userData.lastActive &&
          new Date().getTime() -
            new Date(userData.lastActive.toDate()).getTime() <
            300000; // 5 minutes threshold

        onlineUsersMap[doc.id] = isOnline;
        lastSeenMap[doc.id] = userData.lastActive;
      });

      setOnlineUsers(onlineUsersMap);
      setLastSeen(lastSeenMap);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Update current user's online status - FIXED
  useEffect(() => {
    if (!user?.id) return;

    // Create a variable to track if we're unmounting while still logged in
    let isLoggedInOnUnmount = true;

    const updateOnlineStatus = async (status: string) => {
      try {
        // Skip status update if we're already logging out
        if (isLoggingOut && status === "offline") return;

        const userRef = doc(db, "users", user.id);
        await updateDoc(userRef, {
          status: status,
          lastActive: serverTimestamp(),
        });
      } catch (error) {
        // Only log errors that aren't permission-related during logout
        if (
          status !== "offline" ||
          !(error instanceof Error) ||
          !error.message.includes("permission")
        ) {
          console.error("Error updating online status:", error);
        }
      }
    };

    const handleBeforeUnload = () => {
      // Use navigator.sendBeacon for more reliable offline status update
      try {
        const data = JSON.stringify({
          userId: user.id,
          status: "offline",
          timestamp: new Date().toISOString(),
        });
        navigator.sendBeacon("/api/update-status", data);
      } catch (e) {
        // Cannot log during unload
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Set user as online when component mounts
    updateOnlineStatus("online");

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Only try to update status if we're not logging out
      if (isLoggedInOnUnmount && !isLoggingOut) {
        updateOnlineStatus("offline").catch((err) => {
          // Silently fail if we can't update on unmount
        });
      }
    };
  }, [user?.id, isLoggingOut]);

  // Filter and sort contacts
  useEffect(() => {
    if (!contacts) return;

    const filtered = contacts
      .filter((contact) => {
        if (!contact) return false;

        // Handle both name and email for Google Authentication users
        const contactName = contact?.name || "";
        const contactEmail = contact?.email || "";

        const matchesSearch =
          contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contactEmail.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesOnlineFilter = showOnlineOnly
          ? onlineUsers[contact.id] === true
          : true;

        return matchesSearch && matchesOnlineFilter;
      })
      .sort((a, b) => {
        if (!a || !b) return 0;

        // Sort by online status then by last activity
        const isAOnline = onlineUsers[a.id] === true;
        const isBOnline = onlineUsers[b.id] === true;

        if (isAOnline && !isBOnline) return -1;
        if (!isAOnline && isBOnline) return 1;

        // If both online or both offline, sort by last activity
        const aLastSeen = lastSeen[a.id]?.toDate?.() || 0;
        const bLastSeen = lastSeen[b.id]?.toDate?.() || 0;
        return bLastSeen - aLastSeen;
      });

    setFilteredContacts(filtered);
  }, [contacts, searchTerm, showOnlineOnly, onlineUsers, lastSeen]);

  // Filter registered users
  useEffect(() => {
    if (!allUsers || searchTerm.trim() === "") {
      setSearchRegisteredUsers([]);
      return;
    }

    const filtered = allUsers.filter((registeredUser) => {
      if (!registeredUser) return false;

      // Improved search to handle Google Auth users with both name and email
      const userName = registeredUser?.name || "";
      const userEmail = registeredUser?.email || "";

      const isMatch =
        userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userEmail.toLowerCase().includes(searchTerm.toLowerCase());

      const isNotCurrentUser = registeredUser.id !== user?.id;
      const isNotInContacts = !contacts?.some(
        (contact) => contact?.id === registeredUser.id
      );
      const isOnline =
        !showOnlineOnly || onlineUsers[registeredUser.id] === true;

      return isMatch && isNotCurrentUser && isNotInContacts && isOnline;
    });
    setSearchRegisteredUsers(filtered);
  }, [allUsers, searchTerm, user?.id, contacts, showOnlineOnly, onlineUsers]);

  // Format timestamp for last message
  const formatTime = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

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

  const startNewChat = async (userId: string) => {
    if (!user?.id) return;

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
      if (!userDoc.exists()) {
        console.error("User not found");
        return;
      }

      const userData = userDoc.data();

      if (!existingChat) {
        // Create new chat
        const newChatRef = doc(collection(db, "chats"));
        const chatData = {
          participants: [user.id, userId],
          createdAt: new Date().toISOString(),
          lastMessage: null,
          unreadCount: { [user.id]: 0, [userId]: 0 },
        };

        await setDoc(newChatRef, chatData);

        // Add to contacts immediately for better UX
        const newContact = {
          id: userId,
          chatId: newChatRef.id,
          name: userData.name || "Unknown User",
          email: userData.email, // Store email for search
          avatar: userData.avatar,
          status: onlineUsers[userId]
            ? ("online" as const)
            : ("offline" as const),
          lastMessage: "No messages yet",
          timestamp: new Date().toISOString(),
          unread: 0,
        };

        // Update parent component contacts
        if (typeof contacts === "function") {
          setFilteredContacts((prev: Contact[] | null) => {
            if (!prev) return [newContact];

            // Check if contact already exists to avoid duplicates
            const existingContactIndex = prev.findIndex(
              (c: Contact | null) => c?.id === userId
            );
            if (existingContactIndex > -1) {
              const updatedContacts: Contact[] = [...prev];
              updatedContacts[existingContactIndex] = newContact;
              return updatedContacts;
            }
            return [...prev, newContact];
          });
        }

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

  // Helper function to check if user is online
  const isUserOnline = (userId: string) => {
    return onlineUsers[userId] === true;
  };

  // Fixed logout function to properly handle the offline status update
  const handleLogoutClick = async () => {
    setShowLogoutConfirm(false);
    setIsLoggingOut(true);

    try {
      // First update the offline status
      if (user?.id) {
        const userRef = doc(db, "users", user.id);
        await updateDoc(userRef, {
          status: "offline",
          lastActive: serverTimestamp(),
        });
      }
    } catch (error) {
      console.log(
        "Failed to update status during logout, continuing with logout"
      );
    } finally {
      // Then perform the actual logout
      onLogout();
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs bg-opacity-50">
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
                onClick={handleLogoutClick}
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
              src={user?.avatar || "https://via.placeholder.com/150"}
              alt={user?.name || "User"}
              className="w-10 h-10 rounded-full object-cover"
            />
            {/* Always show the current user as online since they're using the app */}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <div className="font-semibold">{user?.name || user?.email}</div>
            <div className="text-xs text-green-500">
              {/* Current user is always online when using the app */}
              Online
            </div>
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
            placeholder="Search by name or email..."
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
              className={`relative w-9 h-5 ${
                darkMode ? "bg-gray-700" : "bg-gray-300"
              } rounded-full peer-checked:bg-[#85C7F2] peer`}
            >
              <div
                className={`absolute top-0.5 left-[2px] bg-white rounded-full h-4 w-4 transition-all ${
                  showOnlineOnly ? "translate-x-full" : "translate-x-0"
                }`}
              ></div>
            </div>
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
                      src={
                        contact?.avatar.trim() ||
                        "https://via.placeholder.com/150"
                      }
                      alt={contact?.name || "User"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {isUserOnline(contact.id) && (
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
                      <h4 className="font-semibold truncate">
                        {contact?.name || contact?.email || "Unknown User"}
                      </h4>
                      <span
                        className={`text-xs ${
                          activeChat === contact.id
                            ? "text-white"
                            : "text-gray-500"
                        }`}
                      >
                        {formatTime(contact?.timestamp || "")}
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
                        {contact?.lastMessage || "No messages yet"}
                      </p>
                      {contact?.unread > 0 && (
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
                      src={
                        registeredUser?.avatar ||
                        "https://via.placeholder.com/150"
                      }
                      alt={registeredUser?.name || "User"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {isUserOnline(registeredUser.id) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">
                      {registeredUser?.name || "Unknown User"}
                    </h4>
                    <p
                      className={`text-sm truncate ${
                        darkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      {registeredUser?.email || "No email available"}
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
