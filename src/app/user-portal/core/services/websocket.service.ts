import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private ws: WebSocket | null = null;
  private notificationSubject = new Subject<any>();
  private reconnectTimer: any;
  private userId = '';

  connect(userId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.userId = userId;
    this.tryConnect();
  }

  private tryConnect(): void {
    try {
      // Use native WebSocket with SockJS fallback endpoint
      const url = `ws://localhost:8080/ws/websocket`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[WS] Connected');
        // Subscribe to user notifications topic via STOMP-like frame
        const subscribeFrame =
          `SUBSCRIBE\ndestination:/topic/notifications/${this.userId}\nid:sub-0\n\n\0`;
        this.ws?.send(subscribeFrame);
      };

      this.ws.onmessage = (event) => {
        try {
          // Parse STOMP frame body
          const body = event.data;
          const jsonStart = body.indexOf('{');
          if (jsonStart !== -1) {
            const json = body.substring(jsonStart, body.lastIndexOf('}') + 1);
            const notif = JSON.parse(json);
            this.notificationSubject.next(notif);
          }
        } catch (e) {}
      };

      this.ws.onclose = () => {
        // Auto-reconnect after 5s
        this.reconnectTimer = setTimeout(() => this.tryConnect(), 5000);
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch (e) {
      console.warn('[WS] Connection failed, will retry');
      this.reconnectTimer = setTimeout(() => this.tryConnect(), 5000);
    }
  }

  disconnect(): void {
    clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  onNotification(): Observable<any> {
    return this.notificationSubject.asObservable();
  }
}
