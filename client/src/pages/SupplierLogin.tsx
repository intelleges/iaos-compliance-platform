import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldCheck } from 'lucide-react';
import { APP_LOGO, APP_TITLE } from '@/const';

/**
 * Supplier Login Page
 * 
 * Allows suppliers to enter their 12-character access code to access assigned questionnaires.
 * 
 * Features:
 * - Access code validation (12 chars, A-HJ-NP-Z2-9)
 * - Session creation (8-hour max, 1-hour idle timeout)
 * - Error handling with user-friendly messages
 * - Redirect to questionnaire after successful login
 */
export default function SupplierLogin() {
  const [, setLocation] = useLocation();
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  
  const utils = trpc.useUtils();
  
  const validateAccessCodeMutation = trpc.supplier.validateAccessCode.useMutation({
    onSuccess: async (data) => {
      // Store session token in localStorage as backup to cookie
      if (data.sessionToken) {
        try {
          localStorage.setItem('supplier_session', data.sessionToken);
          console.log('[SupplierLogin] Session token stored in localStorage');
        } catch (error) {
          console.error('[SupplierLogin] Failed to store session in localStorage:', error);
        }
      }
      
      // Small delay to ensure localStorage write completes before navigation
      setTimeout(() => {
        console.log('[SupplierLogin] Navigating to company verification');
        setLocation('/supplier/verify-company');
      }, 100);
    },
    onError: (err) => {
      setError(err.message);
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Client-side validation
    const trimmedCode = accessCode.trim().toUpperCase();
    
    if (trimmedCode.length !== 12) {
      setError('Access code must be exactly 12 characters');
      return;
    }
    
    // Validate character set (A-HJ-NP-Z2-9, excludes O/0/I/1/L)
    const validChars = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{12}$/;
    if (!validChars.test(trimmedCode)) {
      setError('Access code contains invalid characters. Please check your invitation email.');
      return;
    }
    
    // Submit to backend
    validateAccessCodeMutation.mutate({ accessCode: trimmedCode });
  };
  
  const handleAccessCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-uppercase and limit to 12 characters
    const value = e.target.value.toUpperCase().slice(0, 12);
    setAccessCode(value);
    setError(''); // Clear error on input change
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {APP_LOGO && (
            <div className="flex justify-center mb-4">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-auto" />
            </div>
          )}
          <CardTitle className="text-2xl font-bold">Supplier Portal</CardTitle>
          <CardDescription>
            Enter your access code to view and complete your assigned questionnaire
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessCode">Access Code</Label>
              <Input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={handleAccessCodeChange}
                placeholder="Enter 12-character code"
                className="text-center text-lg tracking-widest font-mono"
                autoFocus
                disabled={validateAccessCodeMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Your access code was provided in your invitation email
              </p>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button
              type="submit"
              className="w-full"
              disabled={validateAccessCodeMutation.isPending || accessCode.length !== 12}
            >
              {validateAccessCodeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Access Questionnaire
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Security Notice</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Your session will expire after 8 hours</li>
              <li>• Idle timeout: 1 hour of inactivity</li>
              <li>• Access code is single-use and will be invalidated upon submission</li>
              <li>• Your responses are auto-saved every 30 seconds</li>
            </ul>
          </div>
          
          <div className="mt-4 text-center text-xs text-muted-foreground">
            <p>
              Need help? Contact your procurement team or email{' '}
              <a href="mailto:support@intelleges.com" className="text-primary hover:underline">
                support@intelleges.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
