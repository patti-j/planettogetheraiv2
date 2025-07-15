import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EmailManagerProps {
  trigger?: React.ReactNode;
  defaultTo?: string;
  defaultSubject?: string;
  defaultBody?: string;
}

export function EmailManager({ trigger, defaultTo = "", defaultSubject = "", defaultBody = "" }: EmailManagerProps) {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [htmlBody, setHtmlBody] = useState(defaultBody);
  const [textBody, setTextBody] = useState("");
  const [from, setFrom] = useState("");
  const { toast } = useToast();

  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: any) => {
      return await apiRequest("POST", "/api/email/send", emailData);
    },
    onSuccess: () => {
      toast({
        title: "Email sent successfully",
        description: "Your email has been delivered.",
      });
      setOpen(false);
      // Reset form
      setTo(defaultTo);
      setSubject(defaultSubject);
      setHtmlBody(defaultBody);
      setTextBody("");
      setFrom("");
    },
    onError: (error) => {
      toast({
        title: "Failed to send email",
        description: "There was an error sending your email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!to || !subject || (!htmlBody && !textBody)) {
      toast({
        title: "Missing required fields",
        description: "Please fill in recipient, subject, and message body.",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate({
      to,
      subject,
      htmlBody: htmlBody || undefined,
      textBody: textBody || undefined,
      from: from || undefined,
    });
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Mail className="h-4 w-4 mr-2" />
      Send Email
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="to">To *</Label>
              <Input
                id="to"
                type="email"
                placeholder="recipient@example.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="from">From (optional)</Label>
              <Input
                id="from"
                type="email"
                placeholder="sender@planettogether.com"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="htmlBody">Message Body (HTML) *</Label>
            <Textarea
              id="htmlBody"
              placeholder="Enter your message here..."
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              rows={10}
            />
          </div>
          
          <div>
            <Label htmlFor="textBody">Text Version (optional)</Label>
            <Textarea
              id="textBody"
              placeholder="Plain text version for email clients that don't support HTML"
              value={textBody}
              onChange={(e) => setTextBody(e.target.value)}
              rows={5}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSend}
              disabled={sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface QuickEmailButtonsProps {
  job?: any;
  operation?: any;
  resource?: any;
}

export function QuickEmailButtons({ job, operation, resource }: QuickEmailButtonsProps) {
  const { toast } = useToast();

  const orderConfirmationMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/email/order-confirmation", data);
    },
    onSuccess: () => {
      toast({
        title: "Order confirmation sent",
        description: "Customer has been notified about their order.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to send order confirmation",
        description: "Please try again or send manually.",
        variant: "destructive",
      });
    },
  });

  const productionUpdateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/email/production-update", data);
    },
    onSuccess: () => {
      toast({
        title: "Production update sent",
        description: "Customer has been notified about production status.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to send production update",
        description: "Please try again or send manually.",
        variant: "destructive",
      });
    },
  });

  const maintenanceAlertMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/email/maintenance-alert", data);
    },
    onSuccess: () => {
      toast({
        title: "Maintenance alert sent",
        description: "Maintenance team has been notified.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to send maintenance alert",
        description: "Please try again or send manually.",
        variant: "destructive",
      });
    },
  });

  const operationAlertMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/email/operation-alert", data);
    },
    onSuccess: () => {
      toast({
        title: "Operation alert sent",
        description: "Operator has been notified about the operation.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to send operation alert",
        description: "Please try again or send manually.",
        variant: "destructive",
      });
    },
  });

  const handleOrderConfirmation = () => {
    if (!job || !job.customer) {
      toast({
        title: "Missing information",
        description: "Customer information is required to send order confirmation.",
        variant: "destructive",
      });
      return;
    }

    const customerEmail = `${job.customer.toLowerCase().replace(/\s+/g, '')}@example.com`;
    orderConfirmationMutation.mutate({
      customerEmail,
      orderDetails: {
        ...job,
        customerName: job.customer,
        jobName: job.name,
      },
    });
  };

  const handleProductionUpdate = () => {
    if (!job || !job.customer) {
      toast({
        title: "Missing information",
        description: "Customer information is required to send production update.",
        variant: "destructive",
      });
      return;
    }

    const customerEmail = `${job.customer.toLowerCase().replace(/\s+/g, '')}@example.com`;
    productionUpdateMutation.mutate({
      customerEmail,
      jobDetails: job,
    });
  };

  const handleMaintenanceAlert = () => {
    if (!resource) {
      toast({
        title: "Missing information",
        description: "Resource information is required to send maintenance alert.",
        variant: "destructive",
      });
      return;
    }

    maintenanceAlertMutation.mutate({
      maintenanceTeamEmail: "maintenance@planettogether.com",
      resourceDetails: resource,
    });
  };

  const handleOperationAlert = () => {
    if (!operation) {
      toast({
        title: "Missing information",
        description: "Operation information is required to send operation alert.",
        variant: "destructive",
      });
      return;
    }

    operationAlertMutation.mutate({
      operatorEmail: "operator@planettogether.com",
      operationDetails: {
        ...operation,
        jobName: job?.name,
        resourceName: resource?.name,
      },
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {job && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOrderConfirmation}
            disabled={orderConfirmationMutation.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Order Confirmation
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleProductionUpdate}
            disabled={productionUpdateMutation.isPending}
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Production Update
          </Button>
        </>
      )}
      
      {resource && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleMaintenanceAlert}
          disabled={maintenanceAlertMutation.isPending}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Maintenance Alert
        </Button>
      )}
      
      {operation && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleOperationAlert}
          disabled={operationAlertMutation.isPending}
        >
          <Send className="h-4 w-4 mr-1" />
          Operation Alert
        </Button>
      )}
    </div>
  );
}

export function EmailStatusPanel() {
  const [testEmail, setTestEmail] = useState("");
  const { toast } = useToast();

  const testEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("POST", "/api/email/send", {
        to: email,
        subject: "Test Email from PlanetTogether",
        htmlBody: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Test Email - PlanetTogether</h2>
                <p>This is a test email from your PlanetTogether manufacturing system.</p>
                <p>If you received this email, your AWS SES integration is working correctly!</p>
                <p>Sent at: ${new Date().toLocaleString()}</p>
                <p>Best regards,<br>PlanetTogether Team</p>
              </div>
            </body>
          </html>
        `,
        textBody: `
Test Email - PlanetTogether

This is a test email from your PlanetTogether manufacturing system.
If you received this email, your AWS SES integration is working correctly!

Sent at: ${new Date().toLocaleString()}

Best regards,
PlanetTogether Team
        `,
      });
    },
    onSuccess: () => {
      toast({
        title: "Test email sent",
        description: "Check your inbox to verify AWS SES is working.",
      });
      setTestEmail("");
    },
    onError: () => {
      toast({
        title: "Test email failed",
        description: "Check your AWS SES configuration and credentials.",
        variant: "destructive",
      });
    },
  });

  const handleTestEmail = () => {
    if (!testEmail) {
      toast({
        title: "Email required",
        description: "Please enter an email address to test.",
        variant: "destructive",
      });
      return;
    }
    testEmailMutation.mutate(testEmail);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">AWS SES Status</h4>
          <Badge variant="outline">
            {process.env.AWS_ACCESS_KEY_ID ? "Configured" : "Not Configured"}
          </Badge>
        </div>
        
        <div>
          <Label htmlFor="testEmail">Test Email Configuration</Label>
          <div className="flex gap-2">
            <Input
              id="testEmail"
              type="email"
              placeholder="your-email@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <Button 
              onClick={handleTestEmail}
              disabled={testEmailMutation.isPending}
            >
              {testEmailMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                "Test"
              )}
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          <p>Configure these environment variables to enable email:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>AWS_ACCESS_KEY_ID</li>
            <li>AWS_SECRET_ACCESS_KEY</li>
            <li>AWS_REGION (optional, defaults to us-east-1)</li>
            <li>DEFAULT_FROM_EMAIL (optional)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}