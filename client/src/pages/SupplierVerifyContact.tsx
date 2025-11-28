import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, CheckCircle, Edit, Mail } from 'lucide-react';
import { APP_TITLE } from '@/const';

/**
 * Step 4 of Supplier Workflow: Contact Information Verification
 * Per INT.DOC.17 Section 5
 */
export default function SupplierVerifyContact() {
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [contactData, setContactData] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    email: '',
    phone: '',
  });

  // Get session to load contact data
  const { data: session, isLoading, error } = trpc.supplier.getSession.useQuery();

  // Update contact mutation
  const updateContactMutation = trpc.supplier.updateContactInfo.useMutation({
    onSuccess: () => {
      // Proceed to questionnaire (Step 5)
      setLocation('/supplier/questionnaire');
    },
    onError: (error) => {
      alert(`Failed to update contact information: ${error.message}`);
    },
  });

  // Confirm without changes mutation
  const confirmMutation = trpc.supplier.confirmContactInfo.useMutation({
    onSuccess: () => {
      // Proceed to questionnaire (Step 5)
      setLocation('/supplier/questionnaire');
    },
    onError: (error) => {
      alert(`Failed to confirm contact information: ${error.message}`);
    },
  });

  useEffect(() => {
    if (session?.partner) {
      setContactData({
        firstName: session.partner.firstName || '',
        lastName: session.partner.lastName || '',
        jobTitle: session.partner.jobTitle || '',
        email: session.partner.email || '',
        phone: session.partner.phone || '',
      });
    }
  }, [session]);

  const handleConfirm = () => {
    confirmMutation.mutate();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    updateContactMutation.mutate(contactData);
  };

  const handleCancel = () => {
    // Reset to original data
    if (session?.partner) {
      setContactData({
        firstName: session.partner.firstName || '',
        lastName: session.partner.lastName || '',
        jobTitle: session.partner.jobTitle || '',
        email: session.partner.email || '',
        phone: session.partner.phone || '',
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Loading contact information...</p>
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
              <User className="h-6 w-6 text-blue-600" />
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
            <span className="text-sm font-medium text-slate-700">Step 3 of 6</span>
            <span className="text-sm text-slate-600">Contact Verification</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '67%' }}></div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Verify Contact Information
            </CardTitle>
            <CardDescription>
              Please review your contact information below. If any details are incorrect, click "Edit" to make changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isEditing ? (
              // Display Mode
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-600">First Name</Label>
                    <p className="font-medium mt-1">{contactData.firstName || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600">Last Name</Label>
                    <p className="font-medium mt-1">{contactData.lastName || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-600">Job Title</Label>
                  <p className="font-medium mt-1">{contactData.jobTitle || 'N/A'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-600">Email Address</Label>
                    <p className="font-medium mt-1 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      {contactData.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-600">Phone Number</Label>
                    <p className="font-medium mt-1">{contactData.phone || 'N/A'}</p>
                  </div>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    If this information is correct, click "Confirm" to proceed to the questionnaire. Otherwise, click "Edit" to make changes.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={handleEdit}
                    className="flex-1"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Information
                  </Button>
                  <Button 
                    onClick={handleConfirm}
                    disabled={confirmMutation.isPending}
                    className="flex-1"
                  >
                    {confirmMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirm & Continue
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              // Edit Mode
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={contactData.firstName}
                      onChange={(e) => setContactData({ ...contactData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={contactData.lastName}
                      onChange={(e) => setContactData({ ...contactData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    value={contactData.jobTitle}
                    onChange={(e) => setContactData({ ...contactData, jobTitle: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactData.email}
                    onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={contactData.phone}
                    onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={updateContactMutation.isPending}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={updateContactMutation.isPending || !contactData.firstName || !contactData.lastName || !contactData.email}
                    className="flex-1"
                  >
                    {updateContactMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save & Continue'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
