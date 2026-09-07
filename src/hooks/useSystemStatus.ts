import { useState, useEffect } from 'react';

export interface SystemStatus {
  latencyMs: number;
  isOnline: boolean;
  activeRequestsCount: number;
  lastPingTime: number;
}

export function useSystemStatus() {
  const [latencyMs, setLatencyMs] = useState<number>(28);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [activeRequestsCount, setActiveRequestsCount] = useState<number>(0);
  const [lastPingTime, setLastPingTime] = useState<number>(Date.now());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simulated latency jitter calculation for realism
    const interval = setInterval(() => {
      const jitter = Math.floor(Math.random() * 14) - 7;
      setLatencyMs(prev => Math.max(12, Math.min(120, prev + jitter)));
      setLastPingTime(Date.now());
    }, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const trackRequestStart = () => setActiveRequestsCount(prev => prev + 1);
  const trackRequestEnd = () => setActiveRequestsCount(prev => Math.max(0, prev - 1));

  return {
    latencyMs,
    isOnline,
    isNetworkActive: activeRequestsCount > 0,
    activeRequestsCount,
    lastPingTime,
    trackRequestStart,
    trackRequestEnd
  };
}
