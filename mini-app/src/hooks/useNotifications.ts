import { useEffect } from "react";
import { sdk } from "@farcaster/frame-sdk";

export const useNotifications = () => {
  useEffect(() => {
    // Request notification permissions when the app loads
    const requestNotificationPermission = async () => {
      try {
        // Check if we have access to Farcaster SDK
        if (sdk) {
          console.log("Farcaster SDK available, notifications setup");
        } else {
          console.log("Running outside Farcaster, using browser notifications");
        }
      } catch (error) {
        console.error("Failed to setup notifications:", error);
      }
    };

    requestNotificationPermission();
  }, []);

  const sendNotification = async (title: string, message: string) => {
    try {
      // Fallback for browser notifications
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body: message });
      } else if ("Notification" in window && Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          new Notification(title, { body: message });
        }
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  const scheduleReminderNotification = async (_address: string) => {
    try {
      const message = `Reminder: Check your token approvals on Revoke.cash to keep your wallet secure! Last scanned: ${new Date().toLocaleDateString()}`;
      
      // Schedule a reminder for 30 days from now
      setTimeout(() => {
        sendNotification("Wallet Security Reminder", message);
      }, 30 * 24 * 60 * 60 * 1000); // 30 days in milliseconds
      
    } catch (error) {
      console.error("Failed to schedule reminder:", error);
    }
  };

  return {
    sendNotification,
    scheduleReminderNotification,
  };
};