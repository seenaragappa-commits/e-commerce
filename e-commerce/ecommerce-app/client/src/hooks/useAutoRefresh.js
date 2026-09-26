import { useEffect, useEffectEvent } from 'react';

/**
 * Calls `refresh` every `interval` milliseconds while the browser tab is visible,
 * and immediately when the user returns to the tab. The order tracking pages use it,
 * so a status change made by an admin appears without reloading the page.
 *
 *   useAutoRefresh(() => refreshOrder(), { enabled: !isFinal, interval: 15000 });
 */
export default function useAutoRefresh(refresh, { enabled = true, interval = 15000 } = {}) {
  // Always calls the latest `refresh` without restarting the timer on every render.
  const onRefresh = useEffectEvent(refresh);

  useEffect(() => {
    if (!enabled) return undefined;

    let lastRun = Date.now();
    const run = () => {
      // Skip hidden tabs, and avoid a double request when "focus" and "visibilitychange" fire together.
      if (document.visibilityState !== 'visible' || Date.now() - lastRun < 2000) return;
      lastRun = Date.now();
      onRefresh();
    };

    const timer = window.setInterval(run, interval);
    document.addEventListener('visibilitychange', run);
    window.addEventListener('focus', run);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', run);
      window.removeEventListener('focus', run);
    };
  }, [enabled, interval]);
}
