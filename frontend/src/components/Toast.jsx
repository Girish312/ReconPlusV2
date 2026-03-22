import { useEffect } from "react";

export default function Toast({ message, type = "error", duration = 3000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    error: "bg-red-600",
    success: "bg-green-600",
    warning: "bg-yellow-600",
    info: "bg-blue-600",
  }[type] || "bg-red-600";

  return (
    <div
      className={`fixed top-4 right-4 max-w-sm ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-[9999] animate-fade-in`}
    >
      {message}
    </div>
  );
}
