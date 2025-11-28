import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, CheckCircle, Edit } from 'lucide-react';
import { APP_TITLE } from '@/const';

/**
 * Step 3 of Supplier Workflow: Company Information Verification
 * Per INT.DOC.17 Section 4
 */
export default function SupplierVerifyCompany() {
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [companyData, setCompanyData] = useState({
    companyName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  // Get session to load company data
  const { data: session, isLoading, error } = trpc.supplier.getSession.useQuery();

  // Update company mutation
  const updateCompanyMutation = trpc.supplier.updateCompanyInfo.useMutation({
    onSuccess: () => {
      // Proceed to contact verification (Step 4)
      setLocation('/supplier/verify-contact');
    },
    onError: (error) => {
      alert(`Failed to update company information: ${error.message}`);
    },
  });

  // Confirm without changes mutation
  const confirmMutation = trpc.supplier.confirmCompanyInfo.useMutation({
    onSuccess: () => {
      // Proceed to contact verification (Step 4)
      setLocation('/supplier/verify-contact');
    },
    onError: (error) => {
      alert(`Failed to confirm company information: ${error.message}`);
    },
  });

  useEffect(() => {
    if (session?.partner) {
      setCompanyData({
        companyName: session.partner.companyName || '',
        addressLine1: session.partner.addressLine1 || '',
        addressLine2: session.partner.addressLine2 || '',
        city: session.partner.city || '',
        state: session.partner.state || '',
        postalCode: session.partner.postalCode || '',
        country: session.partner.country || '',
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
    updateCompanyMutation.mutate(companyData);
  };

  const handleCancel = () => {
    // Reset to original data
    if (session?.partner) {
      setCompanyData({
        companyName: session.partner.companyName || '',
        addressLine1: session.partner.addressLine1 || '',
        addressLine2: session.partner.addressLine2 || '',
        city: session.partner.city || '',
        state: session.partner.state || '',
        postalCode: session.partner.postalCode || '',
        country: session.partner.country || '',
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Loading company information...</p>
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
              <Building2 className="h-6 w-6 text-blue-600" />
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
            <span className="text-sm font-medium text-slate-700">Step 2 of 6</span>
            <span className="text-sm text-slate-600">Company Verification</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '50%' }}></div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Verify Company Information
            </CardTitle>
            <CardDescription>
              Please review your company information below. If any details are incorrect, click "Edit" to make changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isEditing ? (
              // Display Mode
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-600">Company Name</Label>
                    <p className="font-medium mt-1">{companyData.companyName || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600">Country</Label>
                    <p className="font-medium mt-1">{companyData.country || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-600">Address Line 1</Label>
                  <p className="font-medium mt-1">{companyData.addressLine1 || 'N/A'}</p>
                </div>

                {companyData.addressLine2 && (
                  <div>
                    <Label className="text-slate-600">Address Line 2</Label>
                    <p className="font-medium mt-1">{companyData.addressLine2}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-slate-600">City</Label>
                    <p className="font-medium mt-1">{companyData.city || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600">State/Province</Label>
                    <p className="font-medium mt-1">{companyData.state || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600">Postal Code</Label>
                    <p className="font-medium mt-1">{companyData.postalCode || 'N/A'}</p>
                  </div>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    If this information is correct, click "Confirm" to proceed. Otherwise, click "Edit" to make changes.
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
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={companyData.companyName}
                    onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    value={companyData.addressLine1}
                    onChange={(e) => setCompanyData({ ...companyData, addressLine1: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    value={companyData.addressLine2}
                    onChange={(e) => setCompanyData({ ...companyData, addressLine2: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={companyData.city}
                      onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province *</Label>
                    <Input
                      id="state"
                      value={companyData.state}
                      onChange={(e) => setCompanyData({ ...companyData, state: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      value={companyData.postalCode}
                      onChange={(e) => setCompanyData({ ...companyData, postalCode: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={companyData.country}
                      onChange={(e) => setCompanyData({ ...companyData, country: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={updateCompanyMutation.isPending}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={updateCompanyMutation.isPending || !companyData.companyName || !companyData.addressLine1}
                    className="flex-1"
                  >
                    {updateCompanyMutation.isPending ? (
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
