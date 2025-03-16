import React, { useState } from "react";
import Chat from "./components/Chat";
import Login from "./components/Login";

function App() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogin = (userData) => {
    // Simulate login without backend
    setUser({
      id: Math.random().toString(36).substring(2, 9),
      name: userData.name || userData.email.split("@")[0],
      email: userData.email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
      status: "online",
    });
  };

  const handleLogout = () => {
    setUser(null);
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-[#4C4C4C] text-white" : "bg-[#D1D1D1] text-gray-800"
      }`}
    >
      {!user ? (
        <Login
          onLogin={handleLogin}
          darkMode={darkMode}
          toggleTheme={toggleTheme}
        />
      ) : (
        <Chat
          user={user}
          onLogout={handleLogout}
          darkMode={darkMode}
          toggleTheme={toggleTheme}
        />
      )}
    </div>
  );
}

export default App;
