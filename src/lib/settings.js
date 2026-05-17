import { useState, useEffect } from "react";

const KEY = "intake_settings";
const DEFAULTS = { theme: "light", fontSize: "md", font: "serif" };

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
    catch { return DEFAULTS; }
  });

  const update = (key, value) => setSettings(prev => {
    const next = { ...prev, [key]: value };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  });

  return { settings, update };
}

export const ZOOM = { sm: 0.88, md: 1, lg: 1.15, xl: 1.3 };
