// Auth.js
import { useState } from "react";
import Login from "./Login";
import SignUp from "./SignUp";
import { AuthProps } from "../types";

function Auth({ onLogin, darkMode, toggleTheme }: AuthProps) {
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
