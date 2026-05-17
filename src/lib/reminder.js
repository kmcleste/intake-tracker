import { useState } from "react";

export function useReminder(entries) {
  const [dismissed, setDismissed] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem("intake_notif") === "true");

  const todayLogged = entries.some(e => new Date(e.timestamp).toDateString() === new Date().toDateString());
  const showBanner = !todayLogged && !dismissed;

  const dismissBanner = () => setDismissed(true);

  const toggleNotif = async () => {
    if (!notifEnabled) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        localStorage.setItem("intake_notif", "true");
        setNotifEnabled(true);
      }
    } else {
      localStorage.removeItem("intake_notif");
      setNotifEnabled(false);
    }
  };

  return { showBanner, dismissBanner, notifEnabled, toggleNotif };
}
