import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { APP_LOGO } from "@/const";
import { Link, useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, Mail, Shield } from "lucide-react";
import { trpc } from "@/lib/trpc";

type Step = "access_code" | "email_verification" | "success";

export default function PartnerLogin() {
  const [step, setStep] = useState<Step>("access_code");
  const [accessCode, setAccessCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [error, setError] = useState("");

  const validateAccessCodeMutation = trpc.partner.validateAccessCode.useMutation({
    onSuccess: (data) => {
      setPartnerEmail(data.email);
      setError("");
      setStep("email_verification");
    },
    onError: (err) => {
      setError(err.message || "Invalid access code. Please check and try again.");
    },
  });

  const sendVerificationCodeMutation = trpc.partner.sendVerificationCode.useMutation({
    onError: (err) => {
      setError(err.message || "Failed to send verification code. Please try again.");
    },
  });

  const [, setLocation] = useLocation();

  const verifyEmailCodeMutation = trpc.partner.verifyEmailCode.useMutation({
    onSuccess: () => {
      setError("");
      setStep("success");
      // Redirect to partner dashboard with routing modal after 1.5 seconds
      setTimeout(() => {
        setLocation("/partner/dashboard?showRoutingModal=true");
      }, 1500);
    },
    onError: (err) => {
      setError(err.message || "Invalid verification code. Please try again.");
    },
  });

  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!accessCode.trim()) {
      setError("Please enter your access code");
      return;
    }

    validateAccessCodeMutation.mutate({ accessCode: accessCode.trim().toUpperCase() });
  };

  const handleEmailVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!verificationCode.trim()) {
      setError("Please enter the verification code");
      return;
    }

    verifyEmailCodeMutation.mutate({
      accessCode: accessCode.trim().toUpperCase(),
      verificationCode: verificationCode.trim(),
    });
  };

  const handleResendCode = () => {
    setError("");
    sendVerificationCodeMutation.mutate({ accessCode: accessCode.trim().toUpperCase() });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto flex items-center justify-between py-4">
          <Link href="/login">
            <a className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src={APP_LOGO} alt="Intelleges" className="h-10" />
            </a>
          </Link>
          <Link href="/login">
            <a className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </a>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {step === "access_code" && (
                <>
                  Partner <span className="text-[#EF4444]">Access Code</span>
                </>
              )}
              {step === "email_verification" && "Email Verification"}
              {step === "success" && "Access Granted"}
            </CardTitle>
            <CardDescription className="text-center">
              {step === "access_code" && "Enter your unique access code to begin"}
              {step === "email_verification" && `We sent a verification code to ${partnerEmail}`}
              {step === "success" && "Redirecting to your dashboard..."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Access Code Entry */}
            {step === "access_code" && (
              <form onSubmit={handleAccessCodeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accessCode">Access Code</Label>
                  <Input
                    id="accessCode"
                    type="text"
                    placeholder="Enter your access code (e.g., 3S1239SN)"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    className="text-center text-lg font-mono tracking-wider"
                    maxLength={20}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500">
                    Your access code was provided in the invitation email
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
                  size="lg"
                  disabled={validateAccessCodeMutation.isPending}
                >
                  {validateAccessCodeMutation.isPending ? "Validating..." : "Continue"}
                </Button>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-700">
                      <p className="font-medium text-blue-900">Secure Access</p>
                      <p>Your access code is unique and can only be used once to complete your questionnaire.</p>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Step 2: Email Verification */}
            {step === "email_verification" && (
              <form onSubmit={handleEmailVerificationSubmit} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-700">
                      <p className="font-medium text-blue-900">Check Your Email</p>
                      <p>A 6-digit verification code has been sent to <strong>{partnerEmail}</strong></p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    className="text-center text-2xl font-mono tracking-widest"
                    maxLength={6}
                    autoFocus
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={verifyEmailCodeMutation.isPending || verificationCode.length !== 6}
                >
                  {verifyEmailCodeMutation.isPending ? "Verifying..." : "Verify & Continue"}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleResendCode}
                    disabled={sendVerificationCodeMutation.isPending}
                    className="text-sm"
                  >
                    {sendVerificationCodeMutation.isPending ? "Sending..." : "Resend verification code"}
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep("access_code");
                    setVerificationCode("");
                    setError("");
                  }}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Use Different Access Code
                </Button>
              </form>
            )}

            {/* Step 3: Success */}
            {step === "success" && (
              <div className="text-center space-y-4 py-8">
                <div className="flex justify-center">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Verification Successful!</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    You will be redirected to your dashboard shortly...
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-auto">
        <div className="container mx-auto py-6 text-center text-sm text-gray-600">
          <p>© 2025 Intelleges. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
