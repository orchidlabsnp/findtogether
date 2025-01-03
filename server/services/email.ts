import nodemailer from 'nodemailer';

interface EmailAlert {
  childName: string;
  age: number;
  location: string;
  caseType: string;
  description: string;
  contactInfo: string;
}

const ADMIN_EMAIL = 'admin@childprotection.org'; // Replace with actual admin email

function logUrgentCase(caseDetails: EmailAlert) {
  console.log('\n=== URGENT CASE ALERT ===');
  console.log(`Type: ${caseDetails.caseType.replace('_', ' ').toUpperCase()}`);
  console.log(`Child: ${caseDetails.childName}, Age: ${caseDetails.age}`);
  console.log(`Location: ${caseDetails.location}`);
  console.log(`Description: ${caseDetails.description}`);
  console.log(`Contact: ${caseDetails.contactInfo}`);
  console.log('========================\n');
}

export async function sendUrgentCaseAlert(caseDetails: EmailAlert) {
  // Always log to console for urgent cases
  logUrgentCase(caseDetails);

  // If email is not configured, just return after logging
  if (!process.env.GMAIL_APP_PASSWORD) {
    console.log('Email notifications not configured - GMAIL_APP_PASSWORD not set');
    return;
  }

  const subject = `URGENT: New ${caseDetails.caseType.replace('_', ' ')} Case Reported`;

  const htmlContent = `
    <h2 style="color: #d32f2f;">Urgent Case Alert</h2>
    <p>A new case requiring immediate attention has been reported:</p>
    <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 10px 0;">
      <ul style="list-style: none; padding: 0; margin: 0;">
        <li><strong>Case Type:</strong> ${caseDetails.caseType.replace('_', ' ').toUpperCase()}</li>
        <li><strong>Child's Name:</strong> ${caseDetails.childName}</li>
        <li><strong>Age:</strong> ${caseDetails.age}</li>
        <li><strong>Location:</strong> ${caseDetails.location}</li>
        <li><strong>Description:</strong> ${caseDetails.description}</li>
        <li><strong>Contact Information:</strong> ${caseDetails.contactInfo}</li>
      </ul>
    </div>
    <p style="color: #d32f2f; font-weight: bold;">Please take immediate action on this case.</p>
    <hr>
    <p style="font-size: 12px; color: #666;">
      This is an automated alert from the Child Protection System.
      Please do not reply to this email.
    </p>
  `;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'childprotection@gmail.com', // Replace with actual email
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    await transporter.sendMail({
      from: '"Child Protection Alert System" <childprotection@gmail.com>',
      to: ADMIN_EMAIL,
      subject,
      html: htmlContent
    });

    console.log('Urgent case alert email sent successfully');
  } catch (error) {
    console.error('Error sending urgent case alert email:', error);
    // Don't throw error - we want the case submission to continue even if email fails
    console.log('Continuing with case submission despite email failure');
  }
}