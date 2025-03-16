import React from "react";

function MessageList({ messages, user, contact, darkMode, messagesEndRef }) {
  // Format timestamp for messages
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div
      className={`flex-1 p-4 overflow-y-auto ${
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

          {groupedMessages[date].map((message) => {
            const isUserMessage = message.sender === user.id;

            return (
              <div
                key={message.id}
                className={`flex mb-4 ${
                  isUserMessage ? "justify-end" : "justify-start"
                }`}
              >
                {!isUserMessage && (
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-8 h-8 rounded-full mr-2 self-end"
                  />
                )}

                <div className="max-w-xs md:max-w-md">
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isUserMessage
                        ? "bg-[#85C7F2] text-white rounded-br-none"
                        : darkMode
                        ? "bg-[#636363] text-white rounded-bl-none"
                        : "bg-white text-gray-800 rounded-bl-none"
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

                {isUserMessage && (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full ml-2 self-end"
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;
