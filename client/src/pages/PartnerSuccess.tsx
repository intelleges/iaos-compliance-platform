import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO } from "@/const";
import { CheckCircle2 } from "lucide-react";

export default function PartnerSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto flex items-center justify-center py-4">
          <img src={APP_LOGO} alt="Intelleges" className="h-10" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
        <Card className="w-full max-w-md shadow-xl text-center">
          <CardHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Questionnaire Submitted Successfully
            </CardTitle>
            <CardDescription className="text-base">
              Thank you for completing the Federal Compliance Questionnaire. Your responses have been recorded.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-left">
              <h3 className="font-semibold mb-2">What happens next?</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Your responses will be reviewed by our compliance team</li>
                <li>• You will receive a confirmation email within 24 hours</li>
                <li>• If additional information is needed, we will contact you</li>
                <li>• Final compliance status will be communicated within 5 business days</li>
              </ul>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                If you have any questions or need to update your responses, please contact your compliance administrator.
              </p>
            </div>

            <Button
              onClick={() => window.close()}
              variant="outline"
              className="w-full"
            >
              Close Window
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="text-center text-sm text-muted-foreground py-8">
        © 2025 Intelleges. All rights reserved.
      </footer>
    </div>
  );
}
