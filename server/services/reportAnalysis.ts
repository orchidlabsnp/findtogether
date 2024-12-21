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
  priority: 'immediate' | 'high' | 'medium';
  description: string;
}

const emergencyContacts: EmergencyContact[] = [
  { 
    name: 'Child Protection Services',
    phone: '1-800-422-4453',
    service: 'CPS',
    priority: 'immediate',
    description: 'Primary contact for immediate child protection intervention'
  },
  { 
    name: 'Police Emergency',
    phone: '911',
    service: 'Police',
    priority: 'immediate',
    description: 'For immediate emergency response and intervention'
  },
  { 
    name: 'Child Help Hotline',
    phone: '1-800-422-4453',
    service: 'Support',
    priority: 'high',
    description: '24/7 counseling and support services'
  },
  {
    name: 'National Child Abuse Hotline',
    phone: '1-800-4-A-CHILD',
    service: 'Support',
    priority: 'high',
    description: 'Professional crisis counselors available 24/7'
  },
  {
    name: 'Local Child Advocacy Center',
    phone: '1-800-424-5323',
    service: 'Support',
    priority: 'medium',
    description: 'Local support and resources for affected children'
  },
  {
    name: 'Child Labor Task Force',
    phone: '1-866-487-2365',
    service: 'Labor',
    priority: 'high',
    description: 'Department of Labor Wage and Hour Division for child labor cases'
  },
  {
    name: 'Human Trafficking Hotline',
    phone: '1-888-373-7888',
    service: 'Trafficking',
    priority: 'immediate',
    description: 'National Human Trafficking Hotline for suspected trafficking cases'
  },
  {
    name: 'Crisis Text Line',
    phone: '741741',
    service: 'Crisis',
    priority: 'high',
    description: '24/7 crisis support via text message'
  }
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
  const priorityServices = case_.caseType === 'child_labour' 
    ? ['Labor', 'Police', 'CPS']
    : ['Police', 'CPS', 'Support'];

  const relevantContacts = emergencyContacts
    .filter(contact => priorityServices.includes(contact.service))
    .sort((a, b) => {
      if (a.priority === 'immediate' && b.priority !== 'immediate') return -1;
      if (b.priority === 'immediate' && a.priority !== 'immediate') return 1;
      return 0;
    });

  const aiCharacteristics = case_.aiCharacteristics 
    ? JSON.parse(case_.aiCharacteristics)
    : null;

  const emailContent = `
    ⚠️ URGENT: Critical Child Safety Case Report ⚠️
    
    IMMEDIATE ACTION REQUIRED
    
    Case Details:
    =============
    Case ID: #${case_.id}
    Type: ${case_.caseType.toUpperCase()}
    Child's Name: ${case_.childName}
    Age: ${case_.age}
    Location: ${case_.location}
    Status: ${case_.status.toUpperCase()}
    Reported: ${new Date(case_.createdAt).toLocaleString()}

    Detailed Description:
    ====================
    ${case_.description}

    Contact Information:
    ===================
    ${case_.contactInfo}

    ${aiCharacteristics ? `
    AI Analysis:
    ===========
    ${Object.entries(aiCharacteristics)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')}
    ` : ''}

    Priority Emergency Contacts:
    ==========================
    ${relevantContacts.map(contact => 
      `${contact.service.toUpperCase()} - ${contact.name}
       📞 ${contact.phone}
       Priority: ${contact.priority.toUpperCase()}
       Role: ${contact.description}
      `
    ).join('\n\n')}

    Additional Support Services:
    ==========================
    ${emergencyContacts
      .filter(contact => !priorityServices.includes(contact.service))
      .map(contact => `${contact.service}: ${contact.phone}`)
      .join('\n')}

    Action Items:
    ============
    1. Contact primary emergency services immediately
    2. Document all communications and responses
    3. Follow up within 1 hour to ensure action has been taken
    4. Coordinate with local authorities if needed

    REMINDER: This is a time-sensitive case requiring immediate attention.
    Document all actions taken and maintain strict confidentiality.
  `;

  await transporter.sendMail({
    from: 'k1r03478.null@gmail.com',
    to: 'k1r03478.null@gmail.com',
    subject: `🚨 URGENT: Critical Child Safety Case #${case_.id} - ${case_.caseType.toUpperCase()}`,
    text: emailContent,
    priority: 'high'
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
