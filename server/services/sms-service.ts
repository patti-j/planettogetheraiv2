import twilio from 'twilio';

interface SMSOptions {
  to: string;
  message: string;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class SMSService {
  private client: twilio.Twilio | null = null;
  private fromNumber: string | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !phoneNumber) {
        console.warn('🔶 SMS Service: Twilio credentials not configured');
        console.warn('Account SID exists:', !!accountSid);
        console.warn('Auth Token exists:', !!authToken);
        console.warn('Phone Number exists:', !!phoneNumber);
        return;
      }

      // Log partial credentials for debugging (first 10 chars only for security)
      console.log('📱 Initializing SMS Service with Twilio...');
      console.log('Account SID starts with:', accountSid.substring(0, 10) + '...');
      console.log('Phone Number:', phoneNumber);

      this.client = twilio(accountSid, authToken);
      this.fromNumber = phoneNumber;
      console.log('✅ SMS Service initialized with Twilio');
    } catch (error) {
      console.error('❌ Failed to initialize SMS Service:', error);
    }
  }

  async sendSMS(options: SMSOptions): Promise<SMSResult> {
    if (!this.client || !this.fromNumber) {
      return {
        success: false,
        error: 'SMS service not properly configured'
      };
    }

    try {
      // Validate phone number format
      const cleanPhone = this.formatPhoneNumber(options.to);
      if (!cleanPhone) {
        return {
          success: false,
          error: 'Invalid phone number format'
        };
      }

      const message = await this.client.messages.create({
        body: options.message,
        from: this.fromNumber,
        to: cleanPhone
      });

      console.log(`📱 SMS sent successfully to ${cleanPhone}, SID: ${message.sid}`);
      
      return {
        success: true,
        messageId: message.sid
      };
    } catch (error: any) {
      console.error('❌ Failed to send SMS:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS'
      };
    }
  }

  private formatPhoneNumber(phone: string): string | null {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid US number (10 digits) or international (11+ digits)
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    } else if (cleaned.length > 10) {
      return `+${cleaned}`;
    }
    
    return null;
  }

  // Common SMS templates for manufacturing alerts
  async sendProductionAlert(to: string, message: string): Promise<SMSResult> {
    const formattedMessage = `🏭 PRODUCTION ALERT: ${message}`;
    return this.sendSMS({ to, message: formattedMessage });
  }

  async sendQualityAlert(to: string, message: string): Promise<SMSResult> {
    const formattedMessage = `⚠️ QUALITY ALERT: ${message}`;
    return this.sendSMS({ to, message: formattedMessage });
  }

  async sendInventoryAlert(to: string, message: string): Promise<SMSResult> {
    const formattedMessage = `📦 INVENTORY ALERT: ${message}`;
    return this.sendSMS({ to, message: formattedMessage });
  }

  async sendMaintenanceAlert(to: string, message: string): Promise<SMSResult> {
    const formattedMessage = `🔧 MAINTENANCE ALERT: ${message}`;
    return this.sendSMS({ to, message: formattedMessage });
  }

  async sendNotification(to: string, title: string, message: string): Promise<SMSResult> {
    const formattedMessage = `${title}: ${message}`;
    return this.sendSMS({ to, message: formattedMessage });
  }

  // Utility method to check if SMS service is available
  isConfigured(): boolean {
    return this.client !== null && this.fromNumber !== null;
  }
}

// Export singleton instance
export const smsService = new SMSService();
export default smsService;