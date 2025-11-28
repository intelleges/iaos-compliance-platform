import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Building2, FileCheck, Mail, Shield, Users } from "lucide-react";
import { Link } from "wouter";

/**
 * Custom login page for Intelleges and Enterprise users
 * Uses Manus OAuth for authentication
 */
export default function Login() {
  const loginUrl = getLoginUrl();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <div className="flex items-center">
            <img src={APP_LOGO} alt="Intelleges Federal Compliance Management Platform" className="h-14" />
          </div>
          <Link href="/partner/login">
            <Button variant="ghost" size="sm">
              Partner Access
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left Panel - Information */}
          <div className="flex flex-col justify-center space-y-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                Federal Compliance
                <span className="block text-blue-600">Management Platform</span>
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Streamline your FAR/DFARS compliance reporting and supplier data collection with our
                enterprise-grade platform trusted by Fortune 500 companies.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Automated Compliance Campaigns</h3>
                  <p className="text-sm text-gray-600">
                    Manage annual Reps & Certs, Buy American Act, and C-TPAT reporting cycles
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Multi-Site Supplier Tracking</h3>
                  <p className="text-sm text-gray-600">
                    Track responses across 400+ locations and thousands of suppliers
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Automated Email Workflows</h3>
                  <p className="text-sm text-gray-600">
                    Invitations, reminders, and confirmations sent automatically
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Enterprise Security</h3>
                  <p className="text-sm text-gray-600">
                    Role-based access control and multi-tenant data isolation
                  </p>
                </div>
              </div>
            </div>

            {/* Credentials & Recognition */}
            <div className="border-t pt-6 space-y-4">
              <p className="text-sm font-medium text-gray-500">CREDENTIALS & RECOGNITION</p>
              
              {/* ISO 27001 Certification */}
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-100 p-2">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">ISO 27001 Certified</p>
                  <p className="text-sm text-gray-600">Information Security Management System</p>
                </div>
              </div>
              
              {/* Battelle Award */}
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-yellow-100 p-2">
                  <Building2 className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">2024 Battelle Supplier of the Year</p>
                  <p className="text-sm text-gray-600">Supplier Optimization and Streamlining Efforts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Login Card */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md shadow-xl">
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                <CardDescription>
                  Sign in to access your compliance management dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Main Login Button */}
                <Button
                  onClick={() => {
                    window.location.href = loginUrl;
                  }}
                  className="w-full"
                  size="lg"
                >
                  <Shield className="mr-2 h-5 w-5" />
                  Sign in with Manus
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                {/* Partner Access Link */}
                <Link href="/partner/login">
                  <Button variant="outline" className="w-full" size="lg">
                    Partner/Supplier Access
                  </Button>
                </Link>

                {/* Help Text */}
                <div className="rounded-lg bg-blue-50 p-4 text-sm">
                  <p className="font-medium text-blue-900">For Enterprise Users:</p>
                  <p className="mt-1 text-blue-700">
                    Use your company email to sign in. Your access will be automatically scoped to
                    your organization's data.
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4 text-sm">
                  <p className="font-medium text-gray-900">For Suppliers:</p>
                  <p className="mt-1 text-gray-600">
                    Click "Partner/Supplier Access" and enter the access code from your invitation
                    email.
                  </p>
                </div>

                {/* Footer */}
                <div className="border-t pt-4 text-center text-xs text-gray-500">
                  <p>
                    Powered by{" "}
                    <a
                      href="https://intelleges.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Intelleges®
                    </a>
                  </p>
                  <p className="mt-1">Data & Document Collection Experts</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-gray-600 sm:flex-row">
            <p>© {new Date().getFullYear()} Intelleges. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-blue-600">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-blue-600">
                Terms of Service
              </a>
              <a href="#" className="hover:text-blue-600">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
