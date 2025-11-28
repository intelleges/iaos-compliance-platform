import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface SaveAndExitDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog is closed */
  onClose: () => void;
  /** The access code to display */
  accessCode: string;
  /** Callback when user confirms exit */
  onConfirmExit: () => void;
}

/**
 * Save and Exit Dialog Component
 * 
 * Displays the resume link (access code) and instructions for returning later
 * Follows the CMS-driven multi-language architecture (keys defined in IntellegesQMS.tsx)
 * 
 * TODO: Integrate with CMS context when supplier portal is internationalized
 * CMS Keys: SAVE_EXIT_DIALOG_TITLE, SAVE_EXIT_DIALOG_MESSAGE, SAVE_EXIT_RESUME_LABEL,
 *           SAVE_EXIT_COPY_BUTTON, SAVE_EXIT_INSTRUCTIONS, SAVE_EXIT_CLOSE_BUTTON
 */
export function SaveAndExitDialog({
  open,
  onClose,
  accessCode,
  onConfirmExit,
}: SaveAndExitDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAccessCode = async () => {
    try {
      await navigator.clipboard.writeText(accessCode);
      setCopied(true);
      toast.success('Access code copied to clipboard!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy access code');
    }
  };

  const handleExit = () => {
    onConfirmExit();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Info className="h-6 w-6 text-blue-600" />
            </div>
            <DialogTitle>Save Progress & Exit</DialogTitle>
          </div>
          <DialogDescription>
            Your progress has been automatically saved. You can resume this questionnaire anytime using your access code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Access Code Display */}
          <div className="space-y-2">
            <Label htmlFor="access-code">Your Access Code:</Label>
            <div className="flex gap-2">
              <Input
                id="access-code"
                value={accessCode}
                readOnly
                className="font-mono text-lg font-semibold"
              />
              <Button
                onClick={handleCopyAccessCode}
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <p className="text-sm text-blue-900">
                To resume later, simply return to the login page and enter this access code. 
                All your responses will be preserved.
              </p>
            </AlertDescription>
          </Alert>

          {/* Additional Information */}
          <div className="text-sm text-slate-600 space-y-1">
            <p><strong>What happens next:</strong></p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Your session will be closed</li>
              <li>All answers are saved automatically</li>
              <li>You can resume anytime before the deadline</li>
              <li>Your progress percentage will be maintained</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExit}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Close & Exit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
