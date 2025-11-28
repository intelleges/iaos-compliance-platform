import { useEffect, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Download, Mail, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { APP_TITLE } from '@/const';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

/**
 * Step 7 of Supplier Workflow: Confirmation and Receipt
 * Per INT.DOC.17 Section 8
 */
export default function SupplierConfirmation() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const confirmationNumber = searchParams.get('confirmation');
  const [submittedAt] = useState(new Date());
  const [isDownloading, setIsDownloading] = useState(false);
  
  const getReceiptMutation = trpc.supplier.getSubmissionReceipt.useMutation();

  useEffect(() => {
    // If no confirmation number, redirect to login
    if (!confirmationNumber) {
      setLocation('/supplier/login');
    }
  }, [confirmationNumber, setLocation]);

  const handleDownloadPDF = async () => {
    if (!confirmationNumber) return;
    
    setIsDownloading(true);
    try {
      // Extract assignment ID from confirmation number (format: assignmentId-timestamp)
      const assignmentId = parseInt(confirmationNumber.split('-')[0]);
      
      const result = await getReceiptMutation.mutateAsync({ assignmentId });
      
      if (result.success && result.pdf) {
        // Convert base64 to blob and trigger download
        const byteCharacters = atob(result.pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename || 'submission-receipt.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('PDF receipt downloaded successfully!');
      }
    } catch (error) {
      console.error('Failed to download PDF:', error);
      toast.error('Failed to download PDF receipt. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExit = () => {
    // Clear any session data and redirect to login
    setLocation('/supplier/login');
  };

  if (!confirmationNumber) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <h1 className="text-xl font-semibold">{APP_TITLE}</h1>
              <p className="text-sm text-slate-600">Submission Confirmed</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Success Card */}
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-2xl text-green-900">
                  Questionnaire Submitted Successfully!
                </CardTitle>
                <CardDescription className="text-green-700 mt-1">
                  Thank you for completing your compliance questionnaire.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Confirmation Details */}
            <Alert className="bg-blue-50 border-blue-200">
              <FileText className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-900">Confirmation Number:</span>
                    <span className="font-mono text-lg text-blue-700">{confirmationNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-900">Submitted:</span>
                    <span className="text-blue-700">{submittedAt.toLocaleString()}</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* What Happens Next */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                What Happens Next?
              </h3>
              <div className="space-y-2 text-slate-700">
                <div className="flex gap-3">
                  <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p>
                    <strong>Confirmation Email:</strong> You will receive a confirmation email with a PDF copy of your submission within the next few minutes.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <p>
                    <strong>Procurement Review:</strong> The requesting organization's procurement team has been notified and will review your responses.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <p>
                    <strong>Follow-up:</strong> If additional information is needed, you will be contacted via email.
                  </p>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <Alert>
              <AlertDescription className="text-slate-700">
                <strong>Important Notes:</strong>
                <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                  <li>Save your confirmation number ({confirmationNumber}) for your records</li>
                  <li>Check your spam folder if you don't receive the confirmation email</li>
                  <li>You may receive additional follow-up questionnaires based on your responses</li>
                  <li>To make changes after submission, contact the procurement team directly</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex-1"
              >
                {isDownloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {isDownloading ? 'Generating PDF...' : 'Download PDF Receipt'}
              </Button>
              <Button 
                onClick={handleExit}
                className="flex-1"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Exit Portal
              </Button>
            </div>

            {/* Support Contact */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-slate-600">
                Questions or need assistance? Contact your procurement representative or email{' '}
                <a href="mailto:support@intelleges.com" className="text-blue-600 hover:underline">
                  support@intelleges.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
