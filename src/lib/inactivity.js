import { useEffect, useRef, useState } from "react";

export function useInactivityTimeout(enabled, timeoutMs = 30 * 60 * 1000, onTimeout) {
  const [warnVisible, setWarnVisible] = useState(false);
  const timer = useRef(null);
  const warnTimer = useRef(null);
  const warnMs = 2 * 60 * 1000;

  useEffect(() => {
    if (!enabled) { setWarnVisible(false); return; }

    const reset = () => {
      setWarnVisible(false);
      clearTimeout(timer.current);
      clearTimeout(warnTimer.current);
      warnTimer.current = setTimeout(() => setWarnVisible(true), timeoutMs - warnMs);
      timer.current = setTimeout(() => { setWarnVisible(false); onTimeout(); }, timeoutMs);
    };

    const events = ["mousemove", "keydown", "touchstart", "scroll"];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      clearTimeout(timer.current);
      clearTimeout(warnTimer.current);
    };
  }, [enabled, timeoutMs, onTimeout]);

  return { warnVisible };
}
