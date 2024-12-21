import nodemailer from 'nodemailer';
import { getNotificationService } from './notifications';
import type { Case } from '@db/schema';

// Configure nodemailer with TLS
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: 'k1r03478.null@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // For development
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
interface RiskAssessment {
  level: 'EXTREME' | 'HIGH' | 'MEDIUM' | 'LOW';
  severity: string;
  urgency: string;
  responseType: string;
  recommendations: string[];
}

function calculateRiskLevel(case_: Case, aiAnalysis: any | null): RiskAssessment {
  // Default to high risk for these case types
  const baseRisk: RiskAssessment = {
    level: 'HIGH',
    severity: 'Critical',
    urgency: 'Immediate Response Required',
    responseType: 'Emergency Intervention',
    recommendations: []
  };

  // Elevate risk based on case type
  if (case_.caseType === 'child_labour') {
    baseRisk.recommendations = [
      'Contact Department of Labor immediately',
      'Notify local law enforcement for site inspection',
      'Document workplace conditions and evidence',
      'Coordinate with child protective services',
      'Arrange immediate removal from dangerous conditions'
    ];
  } else if (case_.caseType === 'child_harassment') {
    baseRisk.recommendations = [
      'Immediate police notification required',
      'Activate child protection response team',
      'Secure safe environment for the child',
      'Document all reported incidents',
      'Arrange emergency counseling support'
    ];
  }

  // Adjust risk level based on AI analysis if available
  if (aiAnalysis) {
    // Elevate to EXTREME if AI detects severe conditions
    if (
      aiAnalysis.dangerLevel === 'high' ||
      aiAnalysis.immediateRisk === true ||
      aiAnalysis.threatLevel === 'severe'
    ) {
      baseRisk.level = 'EXTREME';
      baseRisk.severity = 'Critical - Immediate Danger';
      baseRisk.urgency = 'Emergency Response Required';
      baseRisk.recommendations.unshift('IMMEDIATE RESCUE OPERATION REQUIRED');
    }

    // Add AI-specific recommendations
    if (aiAnalysis.recommendations) {
      baseRisk.recommendations = [
        ...baseRisk.recommendations,
        ...aiAnalysis.recommendations
      ];
    }
  }

  // Add age-based recommendations
  if (case_.age < 12) {
    baseRisk.level = 'EXTREME';
    baseRisk.recommendations.push(
      'Special child trauma counselor required',
      'Coordinate with pediatric care services'
    );
  }

  return baseRisk;
}


export async function analyzeAndNotify(case_: Case) {
  const notificationService = getNotificationService();
  // Determine if the case is critical based on type and AI analysis
  const isCritical = case_.caseType === 'child_labour' || case_.caseType === 'child_harassment';
  
  // Enhanced analysis for critical cases
  if (isCritical) {
    try {
      // Parse AI characteristics if available
      const aiAnalysis = case_.aiCharacteristics ? JSON.parse(case_.aiCharacteristics) : null;
      
      // Calculate risk level based on case type and AI analysis
      const riskLevel = calculateRiskLevel(case_, aiAnalysis);
      
      // Send immediate email notification with enhanced details
      await sendEmailAlert(case_);
      
      // Send emergency notifications with detailed analysis
      notificationService.broadcastSafetyAlert(
        '🚨 CRITICAL SAFETY ALERT 🚨',
        `IMMEDIATE ACTION REQUIRED: Case #${case_.id}
         Type: ${case_.caseType.toUpperCase()}
         Location: ${case_.location}
         Age: ${case_.age}
         Risk Level: ${riskLevel.level}
         
         Analysis Summary:
         - Severity: ${riskLevel.severity}
         - Urgency: ${riskLevel.urgency}
         - Required Response: ${riskLevel.responseType}
         
         ${riskLevel.recommendations.join('\n')}
         
         Emergency services have been notified and are being dispatched.`,
        'critical',
        case_.location
      );

      // Send detailed emergency services notification
      const emergencyMessage = generateEmergencyContactsMessage(case_);
      notificationService.broadcastSafetyAlert(
        'Emergency Response Required',
        emergencyMessage,
        'critical',
        case_.location
      );

      // Send case update notification
      notificationService.broadcastCaseUpdate(
        case_.id,
        'URGENT_RESPONSE_REQUIRED',
        `Case escalated to emergency services. Priority response required.
         Type: ${case_.caseType}
         Location: ${case_.location}
         Status: Active Emergency Response`
      );

      return {
        status: 'critical',
        severity: 'high',
        message: 'Emergency protocols activated. Services notified.',
        aiAnalysis: case_.aiCharacteristics ? JSON.parse(case_.aiCharacteristics) : null,
        responseActions: [
          'Emergency services notified',
          'Email alert sent',
          'Case escalated to high priority',
          'Real-time monitoring activated'
        ],
        emergencyContacts: emergencyContacts.filter(contact => 
          ['Police', 'CPS', case_.caseType === 'child_labour' ? 'Labor' : 'Support']
          .includes(contact.service)
        )
      };
    } catch (error) {
      console.error('Error in emergency notification process:', error);
      throw new Error('Failed to process emergency notifications');
    }
  }

  return {
    status: 'normal',
    message: 'Case logged successfully.',
    severity: 'standard'
  };
}

async function sendEmailAlert(case_: Case) {
  try {
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
      Type: ${case_.caseType?.toUpperCase()}
      Child's Name: ${case_.childName}
      Age: ${case_.age}
      Location: ${case_.location}
      Status: ${case_.status?.toUpperCase()}
      Reported: ${new Date().toLocaleString()}

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
      subject: `🚨 URGENT: Critical Child Safety Case #${case_.id} - ${case_.caseType?.toUpperCase()}`,
      text: emailContent,
      priority: 'high'
    });

    console.log(`Email alert sent successfully for case #${case_.id}`);
  } catch (error) {
    console.error('Failed to send email alert:', error);
    // Don't throw the error, just log it
    // This allows the case creation to continue even if email fails
  }
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