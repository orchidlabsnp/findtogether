import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';

interface SafetyAlert {
  type: 'SAFETY_ALERT';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
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

class NotificationService {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      verifyClient: (info, cb) => {
        // Skip Vite HMR connections
        if (info.req.headers['sec-websocket-protocol'] === 'vite-hmr') {
          cb(false);
          return;
        }
        cb(true);
      }
    });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws) => {
      // Add new client
      this.clients.add(ws);

      // Remove client on disconnect
      ws.on('close', () => {
        this.clients.delete(ws);
      });

      // Send welcome message
      this.sendToClient(ws, {
        type: 'SAFETY_ALERT',
        title: 'Connected to Safety Alert System',
        message: 'You will receive real-time safety alerts and case updates.',
        severity: 'info',
        timestamp: new Date().toISOString(),
      });
    });
  }

  private sendToClient(client: WebSocket, notification: Notification) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(notification));
    }
  }

  public broadcast(notification: Notification) {
    this.clients.forEach(client => {
      this.sendToClient(client, notification);
    });
  }

  public broadcastSafetyAlert(
    title: string,
    message: string,
    severity: SafetyAlert['severity'],
    location?: string
  ) {
    this.broadcast({
      type: 'SAFETY_ALERT',
      title,
      message,
      severity,
      timestamp: new Date().toISOString(),
      location,
    });
  }

  public broadcastCaseUpdate(
    caseId: number,
    status: string,
    message: string
  ) {
    this.broadcast({
      type: 'CASE_UPDATE',
      caseId,
      status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}

let notificationService: NotificationService;

export function initializeNotificationService(server: Server) {
  notificationService = new NotificationService(server);
  return notificationService;
}

export function getNotificationService() {
  if (!notificationService) {
    throw new Error('Notification service not initialized');
  }
  return notificationService;
}
