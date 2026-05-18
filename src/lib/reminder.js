import { useState, useEffect } from "react";

const GRACE_MS = 2 * 60 * 1000; // wait 2 min before showing the banner

export function useReminder(entries) {
  const [dismissed, setDismissed] = useState(false);
  const [graceElapsed, setGraceElapsed] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem("intake_notif") === "true");

  const todayLogged = entries.some(e => new Date(e.timestamp).toDateString() === new Date().toDateString());

  // Opening the app implies intent to log — give the user a grace period before
  // showing the reminder. If they log within that window the timer clears.
  useEffect(() => {
    if (todayLogged) return;
    const id = setTimeout(() => setGraceElapsed(true), GRACE_MS);
    return () => clearTimeout(id);
  }, [todayLogged]);

  const showBanner = !todayLogged && !dismissed && graceElapsed;

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
