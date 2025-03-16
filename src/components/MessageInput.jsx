import React, { useState } from "react";
import {
  FaImage,
  FaMicrophone,
  FaPaperPlane,
  FaPaperclip,
  FaSmile,
} from "react-icons/fa";

function MessageInput({ onSendMessage, darkMode }) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const emojis = ["😊", "😂", "❤️", "👍", "🎉", "🔥", "😎", "🤔"];

  return (
    <div
      className={`p-4 border-t ${
        darkMode ? "border-gray-700 bg-[#4C4C4C]" : "border-gray-300"
      }`}
    >
      {showEmojiPicker && (
        <div
          className={`p-2 mb-2 rounded-lg flex flex-wrap gap-2 ${
            darkMode ? "bg-[#636363]" : "bg-white"
          }`}
        >
          {emojis.map((emoji) => (
            <button
              key={emoji}
              className="text-xl hover:bg-gray-200 w-8 h-8 rounded flex items-center justify-center"
              onClick={() => {
                setMessage(message + emoji);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <div className="flex space-x-2">
          <button
            type="button"
            className={`p-2 rounded-full ${
              darkMode
                ? "hover:bg-[#636363] text-gray-300"
                : "hover:bg-gray-200 text-gray-600"
            }`}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <FaSmile />
          </button>
          <button
            type="button"
            className={`p-2 rounded-full ${
              darkMode
                ? "hover:bg-[#636363] text-gray-300"
                : "hover:bg-gray-200 text-gray-600"
            }`}
          >
            <FaPaperclip />
          </button>
          <button
            type="button"
            className={`p-2 rounded-full ${
              darkMode
                ? "hover:bg-[#636363] text-gray-300"
                : "hover:bg-gray-200 text-gray-600"
            }`}
          >
            <FaImage />
          </button>
        </div>

        <input
          type="text"
          placeholder="Type your message..."
          className={`flex-1 py-2 px-4 rounded-full outline-none ${
            darkMode
              ? "bg-[#636363] text-white placeholder-gray-400"
              : "bg-white text-gray-800"
          }`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {message.trim() ? (
          <button
            type="submit"
            className="p-2 rounded-full bg-[#85C7F2] text-white hover:bg-blue-500"
          >
            <FaPaperPlane />
          </button>
        ) : (
          <button
            type="button"
            className={`p-2 rounded-full ${
              darkMode
                ? "hover:bg-[#636363] text-gray-300"
                : "hover:bg-gray-200 text-gray-600"
            }`}
          >
            <FaMicrophone />
          </button>
        )}
      </form>
    </div>
  );
}

export default MessageInput;
