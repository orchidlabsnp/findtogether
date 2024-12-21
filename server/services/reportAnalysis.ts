import nodemailer from 'nodemailer';
import { getNotificationService } from './notifications';
import type { Case } from '@db/schema';

// Email transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'k1r03478.null@gmail.com',
    pass: process.env.EMAIL_APP_PASSWORD // Will need to be set up
  }
});

interface EmergencyContact {
  name: string;
  phone: string;
  service: string;
}

const emergencyContacts: EmergencyContact[] = [
  { name: 'Child Protection Services', phone: '1-800-422-4453', service: 'CPS' },
  { name: 'Police Emergency', phone: '911', service: 'Police' },
  { name: 'Child Help Hotline', phone: '1-800-422-4453', service: 'Support' }
];

export async function analyzeAndNotify(case_: Case) {
  const notificationService = getNotificationService();
  const isCritical = case_.caseType === 'child_labour' || case_.caseType === 'child_harassment';

  if (isCritical) {
    // Send immediate email notification
    await sendEmailAlert(case_);
    
    // Send emergency notifications
    notificationService.broadcastSafetyAlert(
      'Critical Case Alert',
      `Urgent attention needed for case #${case_.id}. Type: ${case_.caseType}`,
      'critical',
      case_.location
    );

    // Notify about emergency services
    const emergencyMessage = generateEmergencyContactsMessage(case_);
    notificationService.broadcastSafetyAlert(
      'Emergency Services Notification',
      emergencyMessage,
      'critical',
      case_.location
    );

    return {
      status: 'critical',
      message: 'Emergency services notified and email sent.',
      emergencyContacts
    };
  }

  return {
    status: 'normal',
    message: 'Case logged successfully.'
  };
}

async function sendEmailAlert(case_: Case) {
  const emailContent = `
    URGENT: Critical Child Safety Case Report
    
    Case Details:
    - Case ID: ${case_.id}
    - Type: ${case_.caseType}
    - Child's Name: ${case_.childName}
    - Age: ${case_.age}
    - Location: ${case_.location}
    - Description: ${case_.description}
    - Contact Information: ${case_.contactInfo}
    - Status: ${case_.status}
    - Reported: ${case_.createdAt}

    This case requires immediate attention and has been flagged for emergency response.
    Emergency services have been notified.

    Emergency Contacts:
    ${emergencyContacts.map(contact => 
      `- ${contact.service}: ${contact.phone}`
    ).join('\n')}

    Please take immediate action.
  `;

  await transporter.sendMail({
    from: 'k1r03478.null@gmail.com',
    to: 'k1r03478.null@gmail.com',
    subject: `URGENT: Critical Child Safety Case #${case_.id}`,
    text: emailContent
  });
}

function generateEmergencyContactsMessage(case_: Case): string {
  return `
    Critical case reported. Please contact emergency services immediately:
    ${emergencyContacts.map(contact => 
      `${contact.service}: ${contact.phone}`
    ).join('\n')}
    
    Case #${case_.id} - ${case_.caseType}
    Location: ${case_.location}
  `;
}
