import { useEffect, useRef, useState } from "react";

const DEFAULT_WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";

/**
 * Manages a resilient WebSocket connection with automatic exponential-backoff reconnection
 * and periodic keepalive pings.
 */
export function useWebSocket(onEvent) {
  const [status, setStatus] = useState("connecting");
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;
    let pingTimer = null;
    let attempt = 0;
    let unmounted = false;

    function connect() {
      if (unmounted) return;
      setStatus("connecting");
      ws = new WebSocket(DEFAULT_WS_URL);

      ws.onopen = () => {
        if (unmounted) return;
        attempt = 0;
        setStatus("connected");
        pingTimer = window.setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send("ping");
          }
        }, 25000);
      };

      ws.onmessage = (message) => {
        try {
          const parsed = JSON.parse(message.data);
          if (parsed?.event && parsed.event !== "pong") {
            onEventRef.current?.(parsed);
          }
        } catch {
          // Ignore malformed frames
        }
      };

      ws.onclose = () => {
        if (pingTimer) window.clearInterval(pingTimer);
        if (unmounted) return;
        setStatus("disconnected");
        const delayMs = Math.min(1000 * 2 ** attempt, 15000);
        attempt += 1;
        reconnectTimer = window.setTimeout(connect, delayMs);
      };

      ws.onerror = () => {
        ws?.close();
      };
    }

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (pingTimer) window.clearInterval(pingTimer);
      ws?.close();
    };
  }, []);

  return { status };
}
