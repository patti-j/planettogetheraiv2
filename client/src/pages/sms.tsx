import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  MessageCircle, 
  Factory, 
  AlertTriangle, 
  Package, 
  Wrench, 
  CheckCircle, 
  X, 
  Send,
  Phone,
  MessageSquare,
  Sparkles,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SMSFormData {
  to: string;
  message: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  message?: string;
}

interface SMSStatus {
  configured: boolean;
  service: string;
  status: string;
}

export default function SMSPage() {
  const { toast } = useToast();
  
  // Form states for different types of SMS
  const [generalSMS, setGeneralSMS] = useState<SMSFormData>({ to: '', message: '' });
  const [productionAlert, setProductionAlert] = useState<SMSFormData>({ to: '', message: '' });
  const [qualityAlert, setQualityAlert] = useState<SMSFormData>({ to: '', message: '' });
  const [inventoryAlert, setInventoryAlert] = useState<SMSFormData>({ to: '', message: '' });
  const [maintenanceAlert, setMaintenanceAlert] = useState<SMSFormData>({ to: '', message: '' });
  
  // Track sent messages
  const [sentMessages, setSentMessages] = useState<Array<{
    id: string;
    type: string;
    to: string;
    message: string;
    timestamp: Date;
    success: boolean;
    messageId?: string;
  }>>([]);

  // Fetch SMS service status
  const { data: smsStatus, isLoading: statusLoading } = useQuery<SMSStatus>({
    queryKey: ['/api/sms/status'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Helper function to add sent message to history
  const addToHistory = (type: string, data: SMSFormData, response: SMSResponse) => {
    const newMessage = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      to: data.to,
      message: data.message,
      timestamp: new Date(),
      success: response.success,
      messageId: response.messageId
    };
    setSentMessages(prev => [newMessage, ...prev.slice(0, 9)]); // Keep last 10 messages
  };

  // Mutation for general SMS
  const sendGeneralSMS = useMutation({
    mutationFn: async (data: SMSFormData): Promise<SMSResponse> => {
      const response = await apiRequest('POST', '/api/sms/send', data);
      return await response.json();
    },
    onSuccess: (response: SMSResponse) => {
      if (response.success) {
        toast({
          title: "SMS Sent",
          description: "Your message was sent successfully.",
        });
        addToHistory('General', generalSMS, response);
        setGeneralSMS({ to: '', message: '' });
      } else {
        toast({
          title: "Failed to Send SMS",
          description: response.error || "An error occurred while sending the message.",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "SMS Error",
        description: "Failed to send SMS. Please check your connection and try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation for production alerts
  const sendProductionAlert = useMutation({
    mutationFn: async (data: SMSFormData): Promise<SMSResponse> => {
      const response = await apiRequest('POST', '/api/sms/send-production-alert', data);
      return await response.json();
    },
    onSuccess: (response: SMSResponse) => {
      if (response.success) {
        toast({
          title: "Production Alert Sent",
          description: "Production alert was sent successfully.",
        });
        addToHistory('Production Alert', productionAlert, response);
        setProductionAlert({ to: '', message: '' });
      } else {
        toast({
          title: "Failed to Send Alert",
          description: response.error || "An error occurred while sending the alert.",
          variant: "destructive"
        });
      }
    }
  });

  // Mutation for quality alerts
  const sendQualityAlert = useMutation({
    mutationFn: async (data: SMSFormData): Promise<SMSResponse> => {
      const response = await apiRequest('POST', '/api/sms/send-quality-alert', data);
      return await response.json();
    },
    onSuccess: (response: SMSResponse) => {
      if (response.success) {
        toast({
          title: "Quality Alert Sent",
          description: "Quality alert was sent successfully.",
        });
        addToHistory('Quality Alert', qualityAlert, response);
        setQualityAlert({ to: '', message: '' });
      } else {
        toast({
          title: "Failed to Send Alert",
          description: response.error || "An error occurred while sending the alert.",
          variant: "destructive"
        });
      }
    }
  });

  // Mutation for inventory alerts
  const sendInventoryAlert = useMutation({
    mutationFn: async (data: SMSFormData): Promise<SMSResponse> => {
      const response = await apiRequest('POST', '/api/sms/send-inventory-alert', data);
      return await response.json();
    },
    onSuccess: (response: SMSResponse) => {
      if (response.success) {
        toast({
          title: "Inventory Alert Sent",
          description: "Inventory alert was sent successfully.",
        });
        addToHistory('Inventory Alert', inventoryAlert, response);
        setInventoryAlert({ to: '', message: '' });
      } else {
        toast({
          title: "Failed to Send Alert",
          description: response.error || "An error occurred while sending the alert.",
          variant: "destructive"
        });
      }
    }
  });

  // Mutation for maintenance alerts
  const sendMaintenanceAlert = useMutation({
    mutationFn: async (data: SMSFormData): Promise<SMSResponse> => {
      const response = await apiRequest('POST', '/api/sms/send-maintenance-alert', data);
      return await response.json();
    },
    onSuccess: (response: SMSResponse) => {
      if (response.success) {
        toast({
          title: "Maintenance Alert Sent",
          description: "Maintenance alert was sent successfully.",
        });
        addToHistory('Maintenance Alert', maintenanceAlert, response);
        setMaintenanceAlert({ to: '', message: '' });
      } else {
        toast({
          title: "Failed to Send Alert",
          description: response.error || "An error occurred while sending the alert.",
          variant: "destructive"
        });
      }
    }
  });

  // Validation helper
  const isValidForm = (data: SMSFormData) => {
    return data.to.trim() !== '' && data.message.trim() !== '';
  };

  // Phone number formatter
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const SMSForm = ({ 
    data, 
    setData, 
    onSubmit, 
    isLoading, 
    title, 
    description, 
    icon: Icon,
    placeholder,
    buttonColor = "default"
  }: {
    data: SMSFormData;
    setData: React.Dispatch<React.SetStateAction<SMSFormData>>;
    onSubmit: () => void;
    isLoading: boolean;
    title: string;
    description: string;
    icon: any;
    placeholder: string;
    buttonColor?: string;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`phone-${title}`}>Phone Number</Label>
          <Input
            id={`phone-${title}`}
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={data.to}
            onChange={(e) => {
              const newValue = e.target.value;
              setData(prev => ({ ...prev, to: newValue }));
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`message-${title}`}>Message</Label>
          <Textarea
            id={`message-${title}`}
            placeholder={placeholder}
            value={data.message}
            onChange={(e) => {
              const newValue = e.target.value;
              setData(prev => ({ ...prev, message: newValue }));
            }}
            rows={3}
          />
        </div>
        <Button 
          onClick={onSubmit}
          disabled={!isValidForm(data) || isLoading}
          className="w-full"
          variant={buttonColor === "destructive" ? "destructive" : "default"}
        >
          {isLoading ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send {title}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SMS Notifications</h1>
          <p className="text-muted-foreground">
            Send SMS alerts and notifications for manufacturing operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          {statusLoading ? (
            <Badge variant="secondary">Checking...</Badge>
          ) : smsStatus?.configured ? (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="mr-1 h-3 w-3" />
              {smsStatus.status}
            </Badge>
          ) : (
            <Badge variant="destructive">
              <X className="mr-1 h-3 w-3" />
              Not Configured
            </Badge>
          )}
        </div>
      </div>

      {/* Service Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            SMS Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {smsStatus?.configured ? "✅" : "❌"}
              </div>
              <div className="text-sm text-muted-foreground">Configuration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{smsStatus?.service || "Unknown"}</div>
              <div className="text-sm text-muted-foreground">Provider</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sentMessages.length}</div>
              <div className="text-sm text-muted-foreground">Messages Sent</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General SMS</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <SMSForm
            data={generalSMS}
            setData={setGeneralSMS}
            onSubmit={() => sendGeneralSMS.mutate(generalSMS)}
            isLoading={sendGeneralSMS.isPending}
            title="General SMS"
            description="Send custom SMS messages to any phone number"
            icon={MessageCircle}
            placeholder="Enter your custom message..."
          />
        </TabsContent>

        <TabsContent value="production">
          <SMSForm
            data={productionAlert}
            setData={setProductionAlert}
            onSubmit={() => sendProductionAlert.mutate(productionAlert)}
            isLoading={sendProductionAlert.isPending}
            title="Production Alert"
            description="Send production-related alerts with 🏭 emoji prefix"
            icon={Factory}
            placeholder="Production line B2 has stopped unexpectedly. Please investigate immediately."
            buttonColor="destructive"
          />
        </TabsContent>

        <TabsContent value="quality">
          <SMSForm
            data={qualityAlert}
            setData={setQualityAlert}
            onSubmit={() => sendQualityAlert.mutate(qualityAlert)}
            isLoading={sendQualityAlert.isPending}
            title="Quality Alert"
            description="Send quality control alerts with ⚠️ emoji prefix"
            icon={AlertTriangle}
            placeholder="Quality check failed for Batch #2024-001. Immediate review required."
            buttonColor="destructive"
          />
        </TabsContent>

        <TabsContent value="inventory">
          <SMSForm
            data={inventoryAlert}
            setData={setInventoryAlert}
            onSubmit={() => sendInventoryAlert.mutate(inventoryAlert)}
            isLoading={sendInventoryAlert.isPending}
            title="Inventory Alert"
            description="Send inventory-related alerts with 📦 emoji prefix"
            icon={Package}
            placeholder="Raw material stock for Item XYZ is below minimum threshold (5 units remaining)."
          />
        </TabsContent>

        <TabsContent value="maintenance">
          <SMSForm
            data={maintenanceAlert}
            setData={setMaintenanceAlert}
            onSubmit={() => sendMaintenanceAlert.mutate(maintenanceAlert)}
            isLoading={sendMaintenanceAlert.isPending}
            title="Maintenance Alert"
            description="Send maintenance alerts with 🔧 emoji prefix"
            icon={Wrench}
            placeholder="Equipment maintenance required for Reactor Unit 3. Schedule downtime immediately."
          />
        </TabsContent>
      </Tabs>

      {/* Message History */}
      {sentMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Messages
            </CardTitle>
            <CardDescription>Last 10 SMS messages sent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sentMessages.map((msg) => (
                <div key={msg.id} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={msg.success ? "default" : "destructive"}>
                        {msg.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">to {msg.to}</span>
                    </div>
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(msg.timestamp, 'MMM dd, yyyy at h:mm a')}
                      {msg.messageId && ` • ID: ${msg.messageId.slice(-8)}`}
                    </p>
                  </div>
                  <div className="ml-3">
                    {msg.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}