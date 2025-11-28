import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle } from 'lucide-react';

interface SessionTimeoutWarningProps {
  /** Session timeout in milliseconds (default: 1 hour) */
  sessionTimeout?: number;
  /** Warning time before timeout in milliseconds (default: 5 minutes) */
  warningTime?: number;
  /** Callback when session expires */
  onTimeout?: () => void;
  /** Callback when user extends session */
  onExtend?: () => void;
}

/**
 * Session Timeout Warning Component
 * 
 * Shows a warning modal 5 minutes before the 1-hour idle timeout
 * Includes countdown timer and option to extend session
 */
export function SessionTimeoutWarning({
  sessionTimeout = 60 * 60 * 1000, // 1 hour
  warningTime = 5 * 60 * 1000, // 5 minutes
  onTimeout,
  onExtend,
}: SessionTimeoutWarningProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
      setShowWarning(false);
    };

    // Listen for user activity events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  // Check for timeout and show warning
  useEffect(() => {
    const checkTimeout = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivity;
      const remaining = sessionTimeout - timeSinceActivity;

      if (remaining <= 0) {
        // Session expired
        setShowWarning(false);
        if (onTimeout) {
          onTimeout();
        }
      } else if (remaining <= warningTime && !showWarning) {
        // Show warning
        setShowWarning(true);
        setTimeRemaining(remaining);
      } else if (showWarning) {
        // Update countdown
        setTimeRemaining(remaining);
      }
    }, 1000); // Check every second

    return () => clearInterval(checkTimeout);
  }, [lastActivity, sessionTimeout, warningTime, showWarning, onTimeout]);

  const handleExtendSession = () => {
    setLastActivity(Date.now());
    setShowWarning(false);
    if (onExtend) {
      onExtend();
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-full">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <DialogTitle>Session Timeout Warning</DialogTitle>
          </div>
          <DialogDescription>
            Your session will expire soon due to inactivity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="bg-amber-50 border-amber-200">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium text-amber-900">
                  Time remaining: <span className="text-2xl font-bold">{formatTime(timeRemaining)}</span>
                </p>
                <p className="text-sm text-amber-700">
                  Your session will automatically expire if there is no activity. Any unsaved changes may be lost.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          <div className="text-sm text-slate-600 space-y-1">
            <p><strong>To keep your session active:</strong></p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Click "Continue Working" below</li>
              <li>Or interact with the page (click, type, scroll)</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleExtendSession}
            className="w-full"
          >
            Continue Working
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
