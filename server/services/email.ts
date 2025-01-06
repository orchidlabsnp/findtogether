import { Resend } from 'resend';

interface EmailData {
  caseId: number;
  childName: string;
  caseType: string;
  location: string;
  description: string;
  contactInfo: string;
}

const EMERGENCY_EMAILS = ['testbug3478@gmail.com', 'testbug2734@gmail.com'];

const getEmailSubject = (caseType: string, childName: string) => {
  switch (caseType) {
    case 'child_labour':
      return `🚨 URGENT: Child Labor Case Reported - ${childName}`;
    case 'child_harassment':
      return `🚨 URGENT: Child Harassment Case Reported - ${childName}`;
    default:
      return `New Case Report - ${childName}`;
  }
};

const getEmailTemplate = (data: EmailData) => {
  const urgencyNote = data.caseType !== 'child_missing' 
    ? '\n⚠️ This is a high-priority case requiring immediate attention.' 
    : '';

  return `
New Child Protection Case Report${urgencyNote}

Case Details:
------------
Case ID: ${data.caseId}
Child's Name: ${data.childName}
Case Type: ${data.caseType.replace('_', ' ').toUpperCase()}
Location: ${data.location}

Description:
${data.description}

Contact Information:
${data.contactInfo}

Please take immediate action on this case.

This is an automated message from the Child Protection Platform.
`;
};

export const sendCaseNotification = async (data: EmailData) => {
  console.log('Starting email notification process for case:', data.caseId);

  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('Email notifications disabled: RESEND_API_KEY not set');
      return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    console.log('Initialized Resend client');

    // Send notification for urgent cases to both emergency emails
    if (data.caseType === 'child_labour' || data.caseType === 'child_harassment') {
      console.log('Urgent case detected, sending notifications to emergency contacts:', EMERGENCY_EMAILS);

      const emailPromises = EMERGENCY_EMAILS.map(async (email) => {
        try {
          const response = await resend.emails.send({
            from: 'Child Protection Platform <notifications@childprotection.org>',
            to: email,
            subject: getEmailSubject(data.caseType, data.childName),
            text: getEmailTemplate(data),
          });

          console.log(`Email sent successfully to ${email}:`, response);
          return response;
        } catch (emailError: any) {
          console.error(`Failed to send email to ${email}:`, {
            error: emailError.message,
            code: emailError.statusCode,
            details: emailError.details
          });
          throw emailError; // Re-throw to be caught by the Promise.all
        }
      });

      try {
        await Promise.all(emailPromises);
        console.log(`Email notifications sent successfully for case ${data.caseId}`);
      } catch (batchError) {
        console.error(`Some email notifications failed for case ${data.caseId}:`, batchError);
        // Don't throw here to prevent blocking case submission
      }
    } else {
      console.log('Non-urgent case, skipping emergency notifications');
    }
  } catch (error: any) {
    console.error('Error in email notification process:', {
      caseId: data.caseId,
      error: error.message,
      stack: error.stack
    });
    // Log error but don't throw to prevent blocking case submission
  }
};