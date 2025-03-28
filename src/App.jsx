import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import Chat from "./components/Chat";
import Auth from "./components/Auth";

function App() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

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
    setDarkMode(!darkMode);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div
      className={`min-h-screen ${
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
