import React, { useState } from "react";
import {
  FaMoon,
  FaPlus,
  FaSearch,
  FaSignOutAlt,
  FaSun,
  FaUserFriends,
} from "react-icons/fa";

function Sidebar({
  user,
  contacts,
  activeChat,
  setActiveChat,
  onLogout,
  darkMode,
  toggleTheme,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  // Filter contacts based on search term and online status filter
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = contact.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesOnlineFilter = showOnlineOnly
      ? contact.status === "online"
      : true;
    return matchesSearch && matchesOnlineFilter;
  });

  // Format timestamp for last message
  const formatTime = (timestamp) => {
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

  return (
    <div className="flex flex-col h-full">
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
            <div className="font-semibold">{user.name}</div>
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
            onClick={onLogout}
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
            placeholder="Search conversations..."
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
              Messages
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
                    {contact.isGroup && (
                      <div
                        className={`absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                          activeChat === contact.id
                            ? "bg-white text-[#85C7F2]"
                            : "bg-[#85C7F2] text-white"
                        }`}
                      >
                        <FaUserFriends size={10} />
                      </div>
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
                        {contact.lastMessage}
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
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No conversations found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
