// Notification.tsx
import React from "react";

interface NotificationProps {
  message: string;
  type: "error" | "success";
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-md ${
        type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"
      }`}
    >
      <p>{message}</p>
      <button
        onClick={onClose}
        className="absolute top-1 right-1 text-white font-bold"
      >
        X
      </button>
    </div>
  );
};

export default Notification;