/* eslint-disable no-unused-vars */
import { useEffect } from "react";
import { Message, MessageListProps } from "../types";

function MessageList({
  messages,
  user,
  contact,
  darkMode,
  messagesEndRef,
}: MessageListProps) {
  // Format timestamp for messages
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Sort messages by timestamp
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Group sorted messages by date
  const groupedMessages = sortedMessages.reduce(
    (groups: Record<string, Message[]>, message) => {
      const date = new Date(message.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    },
    {}
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div
      className={`flex-1 p-4 overflow-y-auto relative ${
        darkMode ? "bg-[#4C4C4C]" : "bg-[#D1D1D1]"
      }`}
    >
      {Object.keys(groupedMessages).map((date) => (
        <div key={date}>
          <div className="flex justify-center my-4">
            <div
              className={`px-4 py-1 rounded-full text-xs ${
                darkMode
                  ? "bg-[#636363] text-gray-300"
                  : "bg-white text-gray-500"
              }`}
            >
              {date === new Date().toLocaleDateString() ? "Today" : date}
            </div>
          </div>

          {groupedMessages[date].map((message, index, array) => {
            const isUserMessage = message.sender === user.id;
            const prevMessage = index > 0 ? array[index - 1] : null;
            const nextMessage =
              index < array.length - 1 ? array[index + 1] : null;

            // Determine if we should show the avatar based on message sequence
            const showAvatar =
              !prevMessage ||
              prevMessage.sender !== message.sender ||
              // Show avatar if there's a significant time gap
              new Date(message.timestamp).getTime() -
                new Date(prevMessage.timestamp).getTime() >
                5 * 60 * 1000;

            return (
              <div
                key={message.id}
                className={`flex mb-4 ${
                  isUserMessage ? "justify-end" : "justify-start"
                }`}
              >
                {!isUserMessage && showAvatar && (
                  <img
                    src={
                      contact?.avatar ||
                      "https://dummyimage.com/150x150/cccccc/000000&text=150x150"
                    }
                    alt={contact?.name}
                    className="w-8 h-8 rounded-full mr-2 self-end"
                  />
                )}

                {!isUserMessage && !showAvatar && (
                  <div className="w-8 mr-2"></div>
                )}

                <div className="max-w-xs md:max-w-md">
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isUserMessage
                        ? "bg-[#85C7F2] text-white rounded-br-none"
                        : darkMode
                        ? "bg-[#636363] text-white rounded-bl-none"
                        : "bg-white text-gray-800 rounded-bl-none"
                    } ${
                      // Adjust rounded corners based on message sequence
                      !prevMessage || prevMessage.sender !== message.sender
                        ? isUserMessage
                          ? "rounded-br-none"
                          : "rounded-bl-none"
                        : ""
                    }`}
                  >
                    {message.content}
                  </div>

                  <div
                    className={`text-xs mt-1 flex items-center ${
                      isUserMessage ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span
                      className={darkMode ? "text-gray-400" : "text-gray-500"}
                    >
                      {formatMessageTime(message.timestamp)}
                    </span>

                    {isUserMessage && (
                      <span className="ml-1 text-blue-500">
                        {message.status === "sent" && "✓"}
                        {message.status === "delivered" && "✓✓"}
                        {message.status === "read" && (
                          <span className="text-blue-500">✓✓</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {isUserMessage && showAvatar && (
                  <img
                    src={
                      user.avatar ||
                      "https://dummyimage.com/150x150/cccccc/000000&text=150x150"
                    }
                    alt={user.name}
                    className="w-8 h-8 rounded-full ml-2 self-end"
                  />
                )}

                {isUserMessage && !showAvatar && (
                  <div className="w-8 ml-2"></div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      <div ref={messagesEndRef} className="h-0" />
    </div>
  );
}

export default MessageList;
