import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { notificationManager } from "@/lib/notifications";
import { Info, AlertTriangle, AlertOctagon } from "lucide-react";

export default function NotificationToast() {
  const { toast } = useToast();

  useEffect(() => {
    // Connect to WebSocket when component mounts
    notificationManager.connect();

    // Subscribe to notifications
    const unsubscribe = notificationManager.subscribe((notification) => {
      if (notification.type === 'SAFETY_ALERT') {
        const icon = {
          info: <Info className="h-5 w-5" />,
          warning: <AlertTriangle className="h-5 w-5" />,
          critical: <AlertOctagon className="h-5 w-5" />
        }[notification.severity];

        toast({
          title: notification.title,
          icon: icon,
          description: (
            <div className="flex flex-col gap-1">
              <p>{notification.message}</p>
              {notification.location && (
                <p className="text-sm text-muted-foreground">
                  Location: {notification.location}
                </p>
              )}
            </div>
          ),
          variant: notification.severity === 'critical' ? 'destructive' : 'default'
        });
      } else if (notification.type === 'CASE_UPDATE') {
        toast({
          title: 'Case Update',
          description: notification.message,
          variant: 'default',
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [toast]);

  return null;
}
