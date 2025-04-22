import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { ToastMessage } from "../types";

const Toast = ({ type, message, onClose }: ToastMessage) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        onClose();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  const toastStyles = {
    success: {
      bg: "bg-green-100",
      border: "border-green-400",
      text: "text-green-700",
      icon: <CheckCircle className="text-green-500 mr-2" />,
    },
    error: {
      bg: "bg-red-100",
      border: "border-red-400",
      text: "text-red-700",
      icon: <XCircle className="text-red-500 mr-2" />,
    },
    warning: {
      bg: "bg-yellow-100",
      border: "border-yellow-400",
      text: "text-yellow-700",
      icon: <AlertTriangle className="text-yellow-500 mr-2" />,
    },
    info: {
      bg: "bg-blue-100",
      border: "border-blue-400",
      text: "text-blue-700",
      icon: <Info className="text-blue-500 mr-2" />,
    },
  };

  const { bg, border, text, icon } = toastStyles[type] || toastStyles.info;

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${bg} ${border} border-l-4 p-4 rounded-lg shadow-lg flex items-center animate-slide-in`}
    >
      {icon}
      <div className={`${text} font-medium`}>{message}</div>
      <button
        onClick={() => setIsVisible(false)}
        className={`ml-4 ${text} hover:opacity-75 transition-opacity`}
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;
