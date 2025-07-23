import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmailManager, EmailStatusPanel } from "@/components/email-manager";
import { Mail, Settings, CheckCircle, AlertTriangle, Info } from "lucide-react";

export default function EmailSettings() {
  const [isMaximized, setIsMaximized] = useState(false);

  const awsSetupSteps = [
    {
      step: 1,
      title: "Create AWS Account",
      description: "Sign up for an AWS account at aws.amazon.com if you don't have one.",
    },
    {
      step: 2,
      title: "Access AWS SES",
      description: "Navigate to AWS SES (Simple Email Service) in the AWS Console.",
    },
    {
      step: 3,
      title: "Verify Email Domain/Address",
      description: "Verify the email address or domain you want to send from.",
    },
    {
      step: 4,
      title: "Create IAM User",
      description: "Create an IAM user with SES permissions (AmazonSESFullAccess policy).",
    },
    {
      step: 5,
      title: "Generate Access Keys",
      description: "Generate Access Key ID and Secret Access Key for the IAM user.",
    },
    {
      step: 6,
      title: "Add to Replit Secrets",
      description: "Add the credentials to your Replit secrets (see below).",
    },
  ];

  const requiredSecrets = [
    {
      name: "AWS_ACCESS_KEY_ID",
      description: "Your AWS IAM user's access key ID",
      required: true,
    },
    {
      name: "AWS_SECRET_ACCESS_KEY",
      description: "Your AWS IAM user's secret access key",
      required: true,
    },
    {
      name: "AWS_REGION",
      description: "AWS region (e.g., us-east-1, us-west-2)",
      required: false,
      default: "us-east-1",
    },
    {
      name: "DEFAULT_FROM_EMAIL",
      description: "Default sender email address",
      required: false,
      default: "noreply@planettogether.com",
    },
  ];

  const PageContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              AWS SES Setup Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {awsSetupSteps.map((step) => (
                <div key={step.step} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium">
                    {step.step}
                  </div>
                  <div>
                    <h4 className="font-medium">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <EmailStatusPanel />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Required Environment Variables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Add these environment variables to your Replit secrets to enable email functionality.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              {requiredSecrets.map((secret) => (
                <div key={secret.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {secret.name}
                      </code>
                      {secret.required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                      {!secret.required && (
                        <Badge variant="outline" className="text-xs">Optional</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{secret.description}</p>
                    {secret.default && (
                      <p className="text-xs text-gray-500 mt-1">Default: {secret.default}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Templates & Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">Available Email Templates</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Order Confirmation
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Production Status Update
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Maintenance Alert
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Operation Alert
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Send Test Email</h4>
                <EmailManager 
                  trigger={
                    <Button variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      Compose Email
                    </Button>
                  }
                  defaultSubject="Test Email from PlanetTogether"
                  defaultBody="<p>This is a test email from your PlanetTogether manufacturing system.</p>"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Email Integration Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Automatic Notifications</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Order confirmations sent when jobs are created</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Production updates when job status changes</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Maintenance alerts for resource issues</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Operation alerts for operators</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Email Features</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>HTML and text email support</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Professional email templates</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Branded company emails</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Reliable AWS SES delivery</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isMaximized) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-2xl font-semibold text-gray-800 md:ml-0 ml-12">Email Settings</h1>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsMaximized(false)}
          >
            ↙
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <PageContent />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="md:ml-0 ml-12">
          <h1 className="text-2xl font-semibold text-gray-800">Email Settings</h1>
          <p className="text-gray-600">Configure AWS SES for email notifications</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsMaximized(true)}
        >
          ↗
        </Button>
      </div>
      <PageContent />
    </div>
  );
}