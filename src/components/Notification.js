"use client";

import { createContext, useContext, useState } from "react";
import { CheckCircle, AlertCircle, Info, XCircle, X } from "lucide-react";

const NotificationContext = createContext(undefined);

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = "info", duration = 3000) => {
    const id = Date.now();
    setNotification({ message, type, id });

    setTimeout(() => {
      setNotification((current) => (current?.id === id ? null : current));
    }, duration);
  };

  const hideNotification = () => {
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <div className="toast toast-top toast-center z-[100]">
          <div className={`alert ${getAlertClass(notification.type)} shadow-lg rounded-lg min-w-[300px]`}>
            <div className="flex items-start">
              {getIcon(notification.type)}
              <span className="flex-1">{notification.message}</span>
              <button
                onClick={hideNotification}
                className="btn btn-ghost btn-xs p-0 ml-2"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

function getAlertClass(type) {
  switch (type) {
    case "success":
      return "alert-success bg-green-100 border-green-300 text-green-800";
    case "error":
      return "alert-error bg-red-100 border-red-300 text-red-800";
    case "warning":
      return "alert-warning bg-yellow-100 border-yellow-300 text-yellow-800";
    case "info":
    default:
      return "alert-info bg-blue-100 border-blue-300 text-blue-800";
  }
}

function getIcon(type) {
  switch (type) {
    case "success":
      return <CheckCircle className="w-5 h-5 text-green-600 mr-2" />;
    case "error":
      return <XCircle className="w-5 h-5 text-red-600 mr-2" />;
    case "warning":
      return <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />;
    case "info":
    default:
      return <Info className="w-5 h-5 text-blue-600 mr-2" />;
  }
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
}
