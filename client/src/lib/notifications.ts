type NotificationSeverity = 'info' | 'warning' | 'critical';

interface SafetyAlert {
  type: 'SAFETY_ALERT';
  title: string;
  message: string;
  severity: NotificationSeverity;
  timestamp: string;
  location?: string;
}

interface CaseUpdate {
  type: 'CASE_UPDATE';
  caseId: number;
  status: string;
  message: string;
  timestamp: string;
}

type Notification = SafetyAlert | CaseUpdate;

class NotificationManager {
  private ws: WebSocket | null = null;
  private listeners: ((notification: Notification) => void)[] = [];

  connect() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data) as Notification;
          this.notifyListeners(notification);
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.reconnect();
      };

      this.ws.onclose = () => {
        this.reconnect();
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.reconnect();
    }
  }

  private reconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    // Attempt to reconnect after 5 seconds
    setTimeout(() => this.connect(), 5000);
  }

  subscribe(listener: (notification: Notification) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(notification: Notification) {
    this.listeners.forEach(listener => listener(notification));
  }
}

export const notificationManager = new NotificationManager();
