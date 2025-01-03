import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';
import nodemailer from 'nodemailer';

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

interface EmailConfig {
  admins: string[];
  senderEmail: string;
  retryAttempts: number;
}

type Notification = SafetyAlert | CaseUpdate;

class NotificationService {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private emailConfig: EmailConfig = {
    admins: ['admin@childprotection.org'], // Default admin email
    senderEmail: 'childprotection@gmail.com',
    retryAttempts: 3
  };

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
      this.clients.add(ws);
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

  private async createEmailTransporter() {
    if (!process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Email configuration missing: GMAIL_APP_PASSWORD not set');
    }

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.emailConfig.senderEmail,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  private async sendEmailWithRetry(
    subject: string,
    htmlContent: string,
    attempt: number = 1
  ) {
    try {
      const transporter = await this.createEmailTransporter();
      await transporter.sendMail({
        from: `"Child Protection Alert System" <${this.emailConfig.senderEmail}>`,
        to: this.emailConfig.admins.join(', '),
        subject,
        html: htmlContent
      });
      console.log('Email alert sent successfully');
    } catch (error) {
      console.error(`Email attempt ${attempt} failed:`, error);
      if (attempt < this.emailConfig.retryAttempts) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // Exponential backoff, max 30s
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendEmailWithRetry(subject, htmlContent, attempt + 1);
      }
      throw error;
    }
  }

  private generateEmailTemplate(
    title: string,
    content: Record<string, string | number>,
    severity: 'high' | 'medium' | 'low' = 'high'
  ) {
    const colors = {
      high: '#d32f2f',
      medium: '#ed6c02',
      low: '#2e7d32'
    };

    const contentHtml = Object.entries(content)
      .map(([key, value]) => `
        <li>
          <strong>${key.replace(/([A-Z])/g, ' $1').trim()}:</strong> ${value}
        </li>
      `).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${colors[severity]}; margin-bottom: 20px;">${title}</h2>
        <div style="background-color: ${severity === 'high' ? '#fef2f2' : '#fff7ed'}; 
                    padding: 20px; border-radius: 8px; margin: 15px 0;">
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${contentHtml}
          </ul>
        </div>
        <p style="color: ${colors[severity]}; font-weight: bold; margin-top: 20px;">
          This case requires immediate attention.
        </p>
        <hr style="margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">
          This is an automated alert from the Child Protection System.
          Please do not reply to this email.
          <br>
          Sent at: ${new Date().toLocaleString()}
        </p>
      </div>
    `;
  }

  public async sendUrgentCaseAlert({
    childName,
    age,
    location,
    caseType,
    description,
    contactInfo
  }: {
    childName: string;
    age: number;
    location: string;
    caseType: string;
    description: string;
    contactInfo: string;
  }) {
    const title = `URGENT: New ${caseType.replace('_', ' ')} Case Reported`;
    const content = {
      'Case Type': caseType.replace('_', ' ').toUpperCase(),
      'Child Name': childName,
      'Age': age,
      'Location': location,
      'Description': description,
      'Contact Information': contactInfo
    };

    // Send WebSocket notification
    this.broadcast({
      type: 'SAFETY_ALERT',
      title,
      message: `New urgent case reported: ${caseType} in ${location}`,
      severity: 'critical',
      timestamp: new Date().toISOString(),
      location
    });

    // Send email notification
    if (process.env.GMAIL_APP_PASSWORD) {
      try {
        const htmlContent = this.generateEmailTemplate(title, content, 'high');
        await this.sendEmailWithRetry(title, htmlContent);
      } catch (error) {
        console.error('Failed to send email notification:', error);
        // Don't throw - we want the case submission to continue even if email fails
      }
    } else {
      console.log('Email notifications not configured - GMAIL_APP_PASSWORD not set');
    }

    // Log to console for monitoring
    console.log('\n=== URGENT CASE ALERT ===');
    Object.entries(content).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
    console.log('========================\n');
  }

  public setAdminEmails(emails: string[]) {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      throw new Error(`Invalid email format: ${invalidEmails.join(', ')}`);
    }
    this.emailConfig.admins = emails;
  }

  public setSenderEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid sender email format');
    }
    this.emailConfig.senderEmail = email;
  }

  public setRetryAttempts(attempts: number) {
    if (!Number.isInteger(attempts) || attempts < 1 || attempts > 10) {
      throw new Error('Retry attempts must be an integer between 1 and 10');
    }
    this.emailConfig.retryAttempts = attempts;
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