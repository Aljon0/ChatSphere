import React from "react";
import {
  FaBars,
  FaEllipsisV,
  FaPhone,
  FaSearch,
  FaVideo,
} from "react-icons/fa";

function ChatHeader({ contact, toggleMobileMenu, darkMode }) {
  if (!contact) return null;

  return (
    <div
      className={`p-4 flex items-center justify-between border-b ${
        darkMode ? "border-gray-700" : "border-gray-300"
      }`}
    >
      <div className="flex items-center">
        <button
          className="md:hidden mr-3 p-1 rounded-full hover:bg-gray-200"
          onClick={toggleMobileMenu}
        >
          <FaBars />
        </button>

        <div className="relative mr-3">
          <img
            src={contact.avatar}
            alt={contact.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          {contact.status === "online" && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>

        <div>
          <div className="font-semibold">{contact.name}</div>
          <div className="text-xs text-green-500">
            {contact.status === "online" ? "Online" : "Offline"}
            {contact.isGroup && ` • ${contact.members.length} members`}
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          className={`p-2 rounded-full ${
            darkMode ? "hover:bg-[#636363]" : "hover:bg-gray-200"
          }`}
        >
          <FaSearch className={darkMode ? "text-gray-300" : "text-gray-600"} />
        </button>
        <button
          className={`p-2 rounded-full ${
            darkMode ? "hover:bg-[#636363]" : "hover:bg-gray-200"
          }`}
        >
          <FaPhone className={darkMode ? "text-gray-300" : "text-gray-600"} />
        </button>
        <button
          className={`p-2 rounded-full ${
            darkMode ? "hover:bg-[#636363]" : "hover:bg-gray-200"
          }`}
        >
          <FaVideo className={darkMode ? "text-gray-300" : "text-gray-600"} />
        </button>
        <button
          className={`p-2 rounded-full ${
            darkMode ? "hover:bg-[#636363]" : "hover:bg-gray-200"
          }`}
        >
          <FaEllipsisV
            className={darkMode ? "text-gray-300" : "text-gray-600"}
          />
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;
