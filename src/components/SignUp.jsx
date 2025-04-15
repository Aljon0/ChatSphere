import React, { useState, useEffect } from "react";
import { FaGoogle, FaMoon, FaSun } from "react-icons/fa";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {
  auth,
  createUserWithEmailAndPassword,
  googleProvider,
  signInWithRedirect,
  getRedirectResult,
  db,
} from "../firebase";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Toast from "./Toast";

function SignUp({ onLogin, darkMode, toggleTheme, switchToSignIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [toast, setToast] = useState(null);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle redirect result on component mount
  useEffect(() => {
    async function checkRedirectResult() {
      try {
        const result = await getRedirectResult(auth);

        if (result && result.user) {
          const user = result.user;

          // Create user document in Firestore
          await createUserDocument(user);

          // Important: Call onLogin to update auth state in parent component
          onLogin({
            id: user.uid,
            email: user.email,
            name: user.displayName || user.email.split("@")[0],
          });

          // No need to display success message or switch to sign in
          // since onLogin will handle navigation
        }
      } catch (err) {
        console.error("Google redirect error:", err);
        setToast({
          type: "error",
          message: "Failed to sign up with Google. Please try again.",
        });
      } finally {
        setIsProcessingRedirect(false);
      }
    }

    checkRedirectResult();
  }, [onLogin]);

  // Function to create user document in Firestore
  const createUserDocument = async (user, additionalData = {}) => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    // Only create document if it doesn't already exist
    if (!userSnapshot.exists()) {
      const { displayName, email, photoURL } = user;
      const createdAt = new Date();

      try {
        await setDoc(userRef, {
          id: user.uid,
          name: displayName || additionalData.name || "",
          email: email || "",
          avatar:
            photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              displayName || additionalData.name || "User"
            )}`,
          createdAt,
          status: "online",
          ...additionalData,
        });
      } catch (error) {
        console.error("Error creating user document", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password match
    if (password !== confirmPassword) {
      setToast({
        type: "error",
        message: "Passwords do not match. Please confirm your password.",
      });
      return;
    }

    // Basic password strength check
    if (password.length < 6) {
      setToast({
        type: "error",
        message: "Password must be at least 6 characters long.",
      });
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update user profile with display name
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // Create user document in Firestore
      await createUserDocument(userCredential.user, { name });

      // Show success toast and switch to login
      setToast({
        type: "success",
        message: "Account created successfully! Please log in.",
      });

      // Reset form and switch to login after a short delay
      setTimeout(() => {
        switchToSignIn();
      }, 2000);
    } catch (err) {
      console.error("Signup error:", err);

      // Comprehensive error mapping
      const errorMap = {
        "auth/email-already-in-use":
          "Email is already registered. Try logging in or use a different email.",
        "auth/invalid-email":
          "Invalid email address. Please enter a valid email.",
        "auth/operation-not-allowed":
          "Email/password accounts are not enabled.",
        "auth/weak-password":
          "Password is too weak. Use a stronger password with mix of characters.",
        default:
          "An unexpected error occurred during signup. Please try again.",
      };

      const errorMessage = errorMap[err.code] || errorMap["default"];

      setToast({
        type: "error",
        message: errorMessage,
      });
    }
  };

  const handleGoogleSignUp = () => {
    // Use redirect instead of popup
    signInWithRedirect(auth, googleProvider).catch((err) => {
      console.error("Google redirect initiation error:", err);
      setToast({
        type: "error",
        message: "Failed to start Google sign-up process. Please try again.",
      });
    });
  };

  // Show a loading state while checking redirect result
  if (isProcessingRedirect) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

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

        <h3 className="text-xl font-semibold mb-6">Create an Account</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? "bg-[#4C4C4C] border-gray-600"
                  : "bg-[#DBDBDB] border-gray-300"
              }`}
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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

          <div className="mb-4 relative">
            <label
              className="block text-sm font-medium mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode
                    ? "bg-[#4C4C4C] border-gray-600"
                    : "bg-[#DBDBDB] border-gray-300"
                }`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FaEyeSlash className="text-gray-500" />
                ) : (
                  <FaEye className="text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <div className="mb-6 relative">
            <label
              className="block text-sm font-medium mb-2"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode
                    ? "bg-[#4C4C4C] border-gray-600"
                    : "bg-[#DBDBDB] border-gray-300"
                }`}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <FaEyeSlash className="text-gray-500" />
                ) : (
                  <FaEye className="text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#85C7F2] hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors mb-4"
          >
            Sign Up
          </button>
        </form>

        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-400"></div>
          <span className="px-4 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-400"></div>
        </div>

        <button
          onClick={handleGoogleSignUp}
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
            onClick={switchToSignIn}
            className="text-[#85C7F2] hover:underline"
          >
            Already have an account? Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
