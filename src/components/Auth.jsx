// Auth.js
import React, { useState } from "react";
import Login from "./Login";
import SignUp from "./SignUp";

function Auth({ onLogin, darkMode, toggleTheme }) {
  const [isRegistering, setIsRegistering] = useState(false);

  return isRegistering ? (
    <SignUp
      onLogin={onLogin}
      darkMode={darkMode}
      toggleTheme={toggleTheme}
      switchToSignIn={() => setIsRegistering(false)}
    />
  ) : (
    <Login
      onLogin={onLogin}
      darkMode={darkMode}
      toggleTheme={toggleTheme}
      switchToSignUp={() => setIsRegistering(true)}
    />
  );
}

export default Auth;
