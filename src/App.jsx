import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import Chat from "./components/Chat";
import Auth from "./components/Auth";

function App() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme === "dark" : false;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  // Update user status when auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // User is signed in
        const userData = {
          id: currentUser.uid,
          name: currentUser.displayName || currentUser.email.split("@")[0],
          email: currentUser.email,
          avatar:
            currentUser.photoURL ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`,
          status: "online",
        };

        setUser(userData);

        try {
          // Update user status in Firestore
          const userRef = doc(db, "users", currentUser.uid);
          await setDoc(
            userRef,
            {
              status: "online",
              lastActive: serverTimestamp(),
              name: userData.name,
              email: userData.email,
              avatar: userData.avatar,
            },
            { merge: true }
          );
        } catch (error) {
          console.error("Error updating user status:", error);
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const handleLogin = async (userData) => {
    if (auth.currentUser) {
      const userInfo = {
        id: auth.currentUser.uid,
        name: userData.name || userData.email.split("@")[0],
        email: userData.email,
        avatar:
          auth.currentUser.photoURL ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
        status: "online",
      };

      setUser(userInfo);

      try {
        // Update user in Firestore after login
        const userRef = doc(db, "users", auth.currentUser.uid);
        await setDoc(
          userRef,
          {
            name: userInfo.name,
            email: userInfo.email,
            avatar: userInfo.avatar,
            status: "online",
            lastActive: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Error updating user after login:", error);
      }
    }
  };

  // Modified logout handler to update status before logout
  const handleLogout = async () => {
    try {
      if (user?.id) {
        // Set user as offline before signing out
        const userRef = doc(db, "users", user.id);
        await setDoc(
          userRef,
          {
            status: "offline",
            lastActive: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (error) {
      console.error("Error updating status before logout:", error);
    } finally {
      // Continue with logout regardless of status update success
      auth.signOut();
    }
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
