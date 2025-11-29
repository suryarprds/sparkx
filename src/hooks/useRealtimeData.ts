import { useEffect, useState } from "react";

/**
 * Hook to check API connection status
 */
export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    const checkConnection = async () => {
      const start = Date.now();
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          setIsConnected(true);
          setLatency(Date.now() - start);
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        setIsConnected(false);
        setLatency(0);
      }
    };

    // Check connection every 10 seconds
    checkConnection();
    const interval = setInterval(checkConnection, 10000);

    return () => clearInterval(interval);
  }, []);

  return { isConnected, latency };
}
