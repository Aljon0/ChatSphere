import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import Chat from "./components/Chat";
import Auth from "./components/Auth";

function App() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    // Default to dark mode if no preference saved (or use false for light mode default)
    return savedTheme ? savedTheme === "dark" : false;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Apply dark mode class to body element for better global styling
    if (darkMode) {
      document.body.classList.add("dark");
      document.body.classList.remove("light");
    } else {
      document.body.classList.add("light");
      document.body.classList.remove("dark");
    }

    // Save to localStorage whenever darkMode changes
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser({
          id: currentUser.uid,
          name: currentUser.displayName || currentUser.email.split("@")[0],
          email: currentUser.email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`,
          status: "online",
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const handleLogin = (userData) => {
    setUser({
      id: auth.currentUser.uid,
      name: userData.name || userData.email.split("@")[0],
      email: userData.email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
      status: "online",
    });
  };

  const handleLogout = () => {
    auth.signOut();
    setUser(null);
  };

  const toggleTheme = () => {
    setDarkMode((prevMode) => {
      const newMode = !prevMode;
      // Save immediately to localStorage
      localStorage.setItem("theme", newMode ? "dark" : "light");
      return newMode;
    });
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode ? "bg-[#4C4C4C] text-white" : "bg-[#D1D1D1] text-gray-800"
        }`}
      >
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-[#4C4C4C] text-white" : "bg-[#D1D1D1] text-gray-800"
      }`}
    >
      {!user ? (
        <Auth
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
