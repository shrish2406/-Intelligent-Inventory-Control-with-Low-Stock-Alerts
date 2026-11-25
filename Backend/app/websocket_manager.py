"""Centralized WebSocket connection manager for real-time dashboard broadcasts."""

import asyncio
import logging
from typing import Any, Dict, Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    """
    Manages active WebSocket client connections and broadcasts JSON events.

    Note on horizontal scaling:
    In a multi-instance deployment, each backend worker holds only its local
    in-memory connections. To broadcast across instances, publish events to a
    Redis Pub/Sub channel and have each instance subscribe and forward to its
    connected WebSocket clients.
    """

    def __init__(self) -> None:
        self._connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        """Remove a disconnected WebSocket client."""
        async with self._lock:
            self._connections.discard(websocket)

    async def broadcast(self, event: str, data: Dict[str, Any]) -> None:
        """Broadcast a structured event payload to all connected clients."""
        async with self._lock:
            targets = list(self._connections)

        if not targets:
            return

        payload = {"event": event, "data": data}
        stale: list[WebSocket] = []

        for websocket in targets:
            try:
                await websocket.send_json(payload)
            except Exception as exc:
                logger.debug("Removing stale WebSocket connection: %s", exc)
                stale.append(websocket)

        if stale:
            async with self._lock:
                for websocket in stale:
                    self._connections.discard(websocket)

    @property
    def active_count(self) -> int:
        """Return the number of currently connected clients."""
        return len(self._connections)


ws_manager = WebSocketManager()
