import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Initialize AWS SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

interface EmailOptions {
  to: string | string[];
  subject: string;
  htmlBody?: string;
  textBody?: string;
  from?: string;
}

export class EmailService {
  private defaultFrom: string;

  constructor(defaultFrom?: string) {
    this.defaultFrom = defaultFrom || process.env.DEFAULT_FROM_EMAIL || "noreply@planettogether.com";
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Ensure we have either HTML or text body
      if (!options.htmlBody && !options.textBody) {
        throw new Error("Either htmlBody or textBody must be provided");
      }

      // Convert single recipient to array
      const recipients = Array.isArray(options.to) ? options.to : [options.to];

      const params = {
        Source: options.from || this.defaultFrom,
        Destination: {
          ToAddresses: recipients,
        },
        Message: {
          Subject: {
            Data: options.subject,
            Charset: "UTF-8",
          },
          Body: {
            ...(options.htmlBody && {
              Html: {
                Data: options.htmlBody,
                Charset: "UTF-8",
              },
            }),
            ...(options.textBody && {
              Text: {
                Data: options.textBody,
                Charset: "UTF-8",
              },
            }),
          },
        },
      };

      const command = new SendEmailCommand(params);
      const response = await sesClient.send(command);
      
      console.log("Email sent successfully:", response.MessageId);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  // Manufacturing-specific email templates
  async sendOrderConfirmation(customerEmail: string, orderDetails: any): Promise<boolean> {
    const htmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Order Confirmation - PlanetTogether</h2>
            <p>Dear ${orderDetails.customerName},</p>
            <p>We're pleased to confirm that we've received your order and it's now in our production queue.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Order Details</h3>
              <p><strong>Job Name:</strong> ${orderDetails.jobName}</p>
              <p><strong>Order Number:</strong> ${orderDetails.id}</p>
              <p><strong>Due Date:</strong> ${new Date(orderDetails.dueDate).toLocaleDateString()}</p>
              <p><strong>Priority:</strong> ${orderDetails.priority}</p>
              <p><strong>Status:</strong> ${orderDetails.status}</p>
            </div>
            
            <p>We'll keep you updated on the progress of your order. You can also check the status anytime by contacting our customer service team.</p>
            
            <p>Thank you for choosing PlanetTogether!</p>
            <p>Best regards,<br>The PlanetTogether Team</p>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Order Confirmation - PlanetTogether

Dear ${orderDetails.customerName},

We're pleased to confirm that we've received your order and it's now in our production queue.

Order Details:
- Job Name: ${orderDetails.jobName}
- Order Number: ${orderDetails.id}
- Due Date: ${new Date(orderDetails.dueDate).toLocaleDateString()}
- Priority: ${orderDetails.priority}
- Status: ${orderDetails.status}

We'll keep you updated on the progress of your order. You can also check the status anytime by contacting our customer service team.

Thank you for choosing PlanetTogether!

Best regards,
The PlanetTogether Team
    `;

    return this.sendEmail({
      to: customerEmail,
      subject: `Order Confirmation - ${orderDetails.jobName}`,
      htmlBody,
      textBody,
    });
  }

  async sendProductionStatusUpdate(customerEmail: string, jobDetails: any): Promise<boolean> {
    const htmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Production Update - PlanetTogether</h2>
            <p>Dear ${jobDetails.customer},</p>
            <p>We wanted to update you on the progress of your order.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Current Status</h3>
              <p><strong>Job:</strong> ${jobDetails.name}</p>
              <p><strong>Status:</strong> ${jobDetails.status}</p>
              <p><strong>Progress:</strong> ${jobDetails.progress || 0}% Complete</p>
              <p><strong>Expected Completion:</strong> ${new Date(jobDetails.dueDate).toLocaleDateString()}</p>
            </div>
            
            <p>We'll continue to keep you informed as your order progresses through our production system.</p>
            
            <p>Best regards,<br>The PlanetTogether Team</p>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Production Update - PlanetTogether

Dear ${jobDetails.customer},

We wanted to update you on the progress of your order.

Current Status:
- Job: ${jobDetails.name}
- Status: ${jobDetails.status}
- Progress: ${jobDetails.progress || 0}% Complete
- Expected Completion: ${new Date(jobDetails.dueDate).toLocaleDateString()}

We'll continue to keep you informed as your order progresses through our production system.

Best regards,
The PlanetTogether Team
    `;

    return this.sendEmail({
      to: customerEmail,
      subject: `Production Update - ${jobDetails.name}`,
      htmlBody,
      textBody,
    });
  }

  async sendMaintenanceAlert(maintenanceTeamEmail: string, resourceDetails: any): Promise<boolean> {
    const htmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc2626;">Maintenance Alert - PlanetTogether</h2>
            <p>A maintenance alert has been triggered for one of our production resources.</p>
            
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h3 style="margin-top: 0; color: #dc2626;">Resource Details</h3>
              <p><strong>Resource:</strong> ${resourceDetails.name}</p>
              <p><strong>Type:</strong> ${resourceDetails.type}</p>
              <p><strong>Status:</strong> ${resourceDetails.status}</p>
              <p><strong>Alert Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <p>Please investigate and take appropriate action as soon as possible.</p>
            
            <p>Best regards,<br>PlanetTogether Monitoring System</p>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Maintenance Alert - PlanetTogether

A maintenance alert has been triggered for one of our production resources.

Resource Details:
- Resource: ${resourceDetails.name}
- Type: ${resourceDetails.type}
- Status: ${resourceDetails.status}
- Alert Time: ${new Date().toLocaleString()}

Please investigate and take appropriate action as soon as possible.

Best regards,
PlanetTogether Monitoring System
    `;

    return this.sendEmail({
      to: maintenanceTeamEmail,
      subject: `Maintenance Alert - ${resourceDetails.name}`,
      htmlBody,
      textBody,
    });
  }

  async sendOperationAlert(operatorEmail: string, operationDetails: any): Promise<boolean> {
    const htmlBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #f59e0b;">Operation Alert - PlanetTogether</h2>
            <p>You have a new operation assignment or update.</p>
            
            <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="margin-top: 0; color: #f59e0b;">Operation Details</h3>
              <p><strong>Operation:</strong> ${operationDetails.name}</p>
              <p><strong>Job:</strong> ${operationDetails.jobName}</p>
              <p><strong>Resource:</strong> ${operationDetails.resourceName}</p>
              <p><strong>Start Time:</strong> ${new Date(operationDetails.startTime).toLocaleString()}</p>
              <p><strong>Duration:</strong> ${operationDetails.duration} hours</p>
              <p><strong>Priority:</strong> ${operationDetails.priority}</p>
            </div>
            
            <p>Please review your schedule and prepare accordingly.</p>
            
            <p>Best regards,<br>PlanetTogether Production Team</p>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Operation Alert - PlanetTogether

You have a new operation assignment or update.

Operation Details:
- Operation: ${operationDetails.name}
- Job: ${operationDetails.jobName}
- Resource: ${operationDetails.resourceName}
- Start Time: ${new Date(operationDetails.startTime).toLocaleString()}
- Duration: ${operationDetails.duration} hours
- Priority: ${operationDetails.priority}

Please review your schedule and prepare accordingly.

Best regards,
PlanetTogether Production Team
    `;

    return this.sendEmail({
      to: operatorEmail,
      subject: `Operation Alert - ${operationDetails.name}`,
      htmlBody,
      textBody,
    });
  }
}

// Export a singleton instance
export const emailService = new EmailService();