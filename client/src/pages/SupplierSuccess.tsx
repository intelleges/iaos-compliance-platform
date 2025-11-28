import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { APP_TITLE } from '@/const';

/**
 * Supplier Success Page
 * 
 * Displayed after successful questionnaire submission
 */
export default function SupplierSuccess() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Questionnaire Submitted Successfully!</CardTitle>
          <CardDescription>
            Thank you for completing your compliance questionnaire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-slate-50 border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg">What happens next?</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-bold text-primary">1.</span>
                <span>Your responses have been securely submitted and saved.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">2.</span>
                <span>Our compliance team will review your submission.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">3.</span>
                <span>You will receive a confirmation email shortly with your submission details.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">4.</span>
                <span>If any additional information is needed, we will contact you directly.</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Need to make changes?</strong> If you need to update your responses, please contact your procurement representative directly.
            </p>
          </div>
          
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              You can now safely close this window.
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/supplier/login'}
            >
              Return to Login
            </Button>
          </div>
          
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            {APP_TITLE}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
