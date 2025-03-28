import React, { useState } from "react";
import { FaGoogle, FaMoon, FaSun } from "react-icons/fa";
import {
  auth,
  signInWithEmailAndPassword,
  googleProvider,
  signInWithPopup,
} from "../firebase";
import Toast from "./Toast";

function Login({ onLogin, darkMode, toggleTheme, switchToSignUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      onLogin({
        email: user.email,
        name: user.displayName || user.email.split("@")[0],
      });
    } catch (err) {
      console.error("Login error:", err);

      // Comprehensive error mapping
      const errorMap = {
        "auth/invalid-credential":
          "Invalid email or password. Please check and try again.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password. Please try again.",
        "auth/invalid-email": "Invalid email address format.",
        "auth/user-disabled": "This account has been disabled.",
        "auth/too-many-requests":
          "Too many login attempts. Please try again later.",
        default: "An unexpected error occurred. Please try again.",
      };

      // Prioritize specific error codes, fallback to default
      const errorMessage = errorMap[err.code] || errorMap["default"];

      setToast({
        type: "error",
        message: errorMessage,
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      onLogin({
        email: user.email,
        name: user.displayName || user.email.split("@")[0],
      });
    } catch (err) {
      console.error("Google login error:", err);

      // Google Sign-In specific error mapping
      const errorMap = {
        "auth/account-exists-with-different-credential":
          "An account already exists with a different login method.",
        "auth/popup-blocked":
          "Login popup was blocked. Please allow popups and try again.",
        "auth/popup-closed-by-user":
          "Login popup was closed before completion.",
        default: "Google sign-in failed. Please try again.",
      };

      const errorMessage = errorMap[err.code] || errorMap["default"];

      setToast({
        type: "error",
        message: errorMessage,
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      {/* Toast notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div
        className={`w-full max-w-md p-8 rounded-lg shadow-lg ${
          darkMode ? "bg-[#636363]" : "bg-white"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <span className="text-[#85C7F2] mr-2">Chat</span>Sphere
          </h2>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-[#DBDBDB] dark:hover:bg-[#4C4C4C] transition-colors"
          >
            {darkMode ? (
              <FaSun className="text-yellow-300" />
            ) : (
              <FaMoon className="text-gray-600" />
            )}
          </button>
        </div>

        <h3 className="text-xl font-semibold mb-6">Welcome Back</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? "bg-[#4C4C4C] border-gray-600"
                  : "bg-[#DBDBDB] border-gray-300"
              }`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label
              className="block text-sm font-medium mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? "bg-[#4C4C4C] border-gray-600"
                  : "bg-[#DBDBDB] border-gray-300"
              }`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#85C7F2] hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors mb-4"
          >
            Sign In
          </button>
        </form>

        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-400"></div>
          <span className="px-4 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-400"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border ${
            darkMode
              ? "border-gray-600 hover:bg-[#4C4C4C]"
              : "border-gray-300 hover:bg-gray-100"
          } transition-colors`}
        >
          <FaGoogle className="text-red-500" />
          <span>Continue with Google</span>
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={switchToSignUp}
            className="text-[#85C7F2] hover:underline"
          >
            Don't have an account? Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
