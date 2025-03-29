import React, { useEffect, useRef, useState } from "react";
import {
  FaBars,
  FaEllipsisV,
  FaPhone,
  FaSearch,
  FaTimes,
  FaTrash,
  FaVideo,
} from "react-icons/fa";

function ChatHeader({
  contact,
  toggleMobileMenu,
  darkMode,
  onSearchMessage,
  onDeleteConversation,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input when search bar is shown
  useEffect(() => {
    if (showSearchBar && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearchBar]);

  // Add more robust checking
  if (!contact) {
    console.warn("No contact information available");
    return null;
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearchMessage) {
      onSearchMessage(searchQuery);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setShowDropdown(false);
  };

  const confirmDelete = () => {
    if (onDeleteConversation) {
      onDeleteConversation();
    }
    setShowDeleteConfirm(false);
  };

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
            alt={contact.name || "User"}
            className="w-10 h-10 rounded-full object-cover"
          />
          {contact.status === "online" && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>

        <div>
          <div className="font-semibold">
            {contact.name || "Unknown Contact"}
          </div>
          <div className="text-xs text-green-500">
            {contact.status === "online" ? "Online" : "Offline"}
            {contact.isGroup && ` • ${contact.members?.length || 0} members`}
          </div>
        </div>
      </div>

      {showSearchBar ? (
        <form onSubmit={handleSearchSubmit} className="flex-1 mx-4">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search in conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-2 px-10 rounded-full ${
                darkMode
                  ? "bg-[#636363] text-white placeholder-gray-300"
                  : "bg-gray-100 text-gray-800 placeholder-gray-500"
              }`}
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <button
              type="button"
              onClick={() => {
                setShowSearchBar(false);
                setSearchQuery("");
              }}
              className="absolute right-3 top-2"
            >
              <FaTimes
                className={darkMode ? "text-gray-300" : "text-gray-600"}
              />
            </button>
          </div>
        </form>
      ) : (
        <div className="flex space-x-3">
          <button
            className={`p-2 rounded-full ${
              darkMode ? "hover:bg-[#636363]" : "hover:bg-gray-200"
            }`}
            onClick={() => setShowSearchBar(true)}
          >
            <FaSearch
              className={darkMode ? "text-gray-300" : "text-gray-600"}
            />
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
          <div className="relative" ref={dropdownRef}>
            <button
              className={`p-2 rounded-full ${
                darkMode ? "hover:bg-[#636363]" : "hover:bg-gray-200"
              }`}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <FaEllipsisV
                className={darkMode ? "text-gray-300" : "text-gray-600"}
              />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div
                className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 ${
                  darkMode
                    ? "bg-[#636363] text-white"
                    : "bg-white text-gray-800"
                }`}
              >
                <div className="py-1">
                  <button
                    onClick={handleDeleteClick}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                      darkMode ? "hover:bg-[#4C4C4C]" : "hover:bg-gray-100"
                    }`}
                  >
                    <FaTrash className="mr-2 text-red-500" />
                    Delete conversation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`rounded-lg p-6 max-w-sm mx-auto ${
              darkMode ? "bg-[#4C4C4C] text-white" : "bg-white text-gray-800"
            }`}
          >
            <h3 className="text-lg font-medium mb-4">Delete Conversation</h3>
            <p className="mb-4">
              Are you sure you want to delete this conversation? This action
              cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-4 py-2 rounded ${
                  darkMode
                    ? "bg-[#636363] hover:bg-[#585858]"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatHeader;
