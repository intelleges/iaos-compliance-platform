import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, PenTool, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { APP_TITLE } from '@/const';

/**
 * Step 6 of Supplier Workflow: E-Signature and Attestation
 * Per INT.DOC.17 Section 7
 */
export default function SupplierESignature() {
  const [, setLocation] = useLocation();
  const [signatureData, setSignatureData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    acknowledged: false,
  });

  // Get session to pre-fill data
  const { data: session, isLoading, error } = trpc.supplier.getSession.useQuery();

  // Submit with e-signature mutation
  const submitMutation = trpc.supplier.submitWithSignature.useMutation({
    onSuccess: (data) => {
      // Proceed to confirmation page (Step 7)
      setLocation(`/supplier/confirmation?confirmation=${data.confirmationNumber}`);
    },
    onError: (error) => {
      alert(`Failed to submit questionnaire: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signatureData.acknowledged) {
      alert('You must acknowledge the attestation statement to continue.');
      return;
    }
    
    submitMutation.mutate(signatureData);
  };

  // Pre-fill from session when available
  React.useEffect(() => {
    if (session?.partner) {
      setSignatureData(prev => ({
        ...prev,
        firstName: session.partner.firstName || '',
        lastName: session.partner.lastName || '',
        email: session.partner.email || '',
      }));
    }
  }, [session]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Loading signature page...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Session Error</CardTitle>
            <CardDescription>
              Your session has expired or is invalid. Please log in again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/supplier/login')} className="w-full">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PenTool className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold">{APP_TITLE}</h1>
                <p className="text-sm text-slate-600">{session.partner?.companyName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Step 5 of 6</span>
            <span className="text-sm text-slate-600">Electronic Signature</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5 text-blue-600" />
              Electronic Signature & Attestation
            </CardTitle>
            <CardDescription>
              By signing below, you certify that all information provided in this questionnaire is true, accurate, and complete to the best of your knowledge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Attestation Statement */}
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  <strong>Attestation Statement:</strong>
                  <p className="mt-2">
                    I hereby certify that I am an authorized representative of {session.partner?.companyName || 'my company'} and that the information provided in this questionnaire is true, accurate, and complete to the best of my knowledge. I understand that providing false information may result in disqualification from doing business with the requesting organization and may have legal consequences.
                  </p>
                  <p className="mt-2">
                    I acknowledge that this electronic signature has the same legal effect as a handwritten signature.
                  </p>
                </AlertDescription>
              </Alert>

              {/* Signature Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={signatureData.firstName}
                      onChange={(e) => setSignatureData({ ...signatureData, firstName: e.target.value })}
                      required
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={signatureData.lastName}
                      onChange={(e) => setSignatureData({ ...signatureData, lastName: e.target.value })}
                      required
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={signatureData.email}
                    onChange={(e) => setSignatureData({ ...signatureData, email: e.target.value })}
                    required
                    placeholder="Enter your email address"
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    A confirmation email will be sent to this address.
                  </p>
                </div>
              </div>

              {/* Acknowledgment Checkbox */}
              <div className="flex items-start space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox
                  id="acknowledged"
                  checked={signatureData.acknowledged}
                  onCheckedChange={(checked) => 
                    setSignatureData({ ...signatureData, acknowledged: checked as boolean })
                  }
                />
                <div className="flex-1">
                  <Label 
                    htmlFor="acknowledged" 
                    className="text-sm font-medium text-blue-900 cursor-pointer"
                  >
                    I have read and agree to the attestation statement above *
                  </Label>
                  <p className="text-xs text-blue-700 mt-1">
                    This checkbox is required to submit your questionnaire.
                  </p>
                </div>
              </div>

              {/* Signature Metadata Info */}
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-slate-700">
                  <strong>E-Signature Record:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Your name and email will be recorded</li>
                    <li>• Timestamp: {new Date().toLocaleString()}</li>
                    <li>• IP address will be logged for verification</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setLocation('/supplier/questionnaire')}
                  disabled={submitMutation.isPending}
                  className="flex-1"
                >
                  Back to Questionnaire
                </Button>
                <Button 
                  type="submit"
                  disabled={
                    submitMutation.isPending || 
                    !signatureData.firstName || 
                    !signatureData.lastName || 
                    !signatureData.email || 
                    !signatureData.acknowledged
                  }
                  className="flex-1"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <PenTool className="mr-2 h-4 w-4" />
                      Sign & Submit Questionnaire
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
