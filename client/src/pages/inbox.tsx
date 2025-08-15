import { NotificationsInbox } from "@/components/inbox/notifications-inbox";
import { useLocation } from "wouter";

export default function InboxPage() {
  const [, setLocation] = useLocation();

  const handleNotificationClick = (notification: any) => {
    if (notification.actionUrl) {
      // Navigate to the appropriate page based on the action URL
      setLocation(notification.actionUrl);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <NotificationsInbox 
        showHeader={true}
        maxHeight="calc(100vh - 200px)"
        onNotificationClick={handleNotificationClick}
      />
    </div>
  );
}