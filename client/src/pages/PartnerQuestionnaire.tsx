import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { APP_LOGO } from "@/const";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { SignaturePad } from "@/components/SignaturePad";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { 
  QuestionFactory, 
  useAutoSave, 
  evaluateSkipLogic, 
  validateResponse,
  calculateProgress,
  type QuestionData,
  type QuestionResponse,
} from "@/components/questionnaire";

type QuestionnaireData = {
  id: number;
  title: string;
  description: string;
  footer: string | null;
  questions: QuestionData[];
  partnerName: string;
};

export default function PartnerQuestionnaire() {
  const [, setLocation] = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Map<number, QuestionResponse>>(new Map());
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [eSignature, setESignature] = useState<string | null>(null);

  // Get access code from URL or session storage
  const accessCode = new URLSearchParams(window.location.search).get("code") || 
                     sessionStorage.getItem("partnerAccessCode") || "";

  // Load questionnaire data
  const { data: questionnaire, isLoading } = trpc.partner.getQuestionnaire.useQuery(
    { accessCode },
    { enabled: !!accessCode }
  );

  // Save draft mutation
  const saveDraftMutation = trpc.partner.saveDraft.useMutation();

  // Submit questionnaire mutation
  const submitMutation = trpc.partner.submitQuestionnaire.useMutation({
    onSuccess: () => {
      setLocation("/partner/success");
    },
    onError: (err: any) => {
      setError(err.message || "Failed to submit questionnaire");
      setIsSubmitting(false);
    },
  });

  // Auto-save with debouncing (500ms)
  const autoSave = useAutoSave(async (data) => {
    if (!questionnaire || responses.size === 0) return;
    
    // Convert Map to plain object for tRPC
    const answersObj: Record<number, any> = {};
    responses.forEach((response, questionId) => {
      answersObj[questionId] = response;
    });

    await saveDraftMutation.mutateAsync({
      accessCode,
      answers: answersObj,
    });
  }, 500);

  // Trigger auto-save when responses change
  useEffect(() => {
    if (responses.size > 0) {
      autoSave(responses);
    }
  }, [responses, autoSave]);

  if (!accessCode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No access code provided. Please use the link from your invitation email.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Invalid or expired access code. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentQuestion = questionnaire.questions[currentQuestionIndex];
  const totalQuestions = questionnaire.questions.length;
  const progress = calculateProgress(questionnaire.questions, responses);
  const answeredCount = responses.size;

  // Handle response change
  const handleResponseChange = (questionId: number, partialResponse: Partial<QuestionResponse>) => {
    setResponses(prev => {
      const newResponses = new Map(prev);
      const existing = newResponses.get(questionId) || {};
      newResponses.set(questionId, { ...existing, ...partialResponse });
      return newResponses;
    });
    setError("");
  };

  // Handle next button
  const handleNext = () => {
    const currentResponse = responses.get(currentQuestion.id) || {};
    
    // Validate current question if required
    const validationError = validateResponse(currentQuestion, currentResponse);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check skip logic
    const skipTarget = evaluateSkipLogic(currentQuestion, currentResponse);
    if (skipTarget) {
      // Find question with matching tag
      const targetIndex = questionnaire.questions.findIndex(q => q.tag === skipTarget);
      if (targetIndex !== -1) {
        setCurrentQuestionIndex(targetIndex);
        return;
      }
    }

    // Normal navigation
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Handle previous button
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setError("");
    }
  };

  // Handle submit button click - open signature dialog
  const handleSubmitClick = () => {
    // Validate all required questions
    const unansweredRequired = questionnaire.questions.filter(q => {
      if (!q.required) return false;
      const response = responses.get(q.id) || {};
      return validateResponse(q, response) !== null;
    });

    if (unansweredRequired.length > 0) {
      setError(`Please answer all required questions (${unansweredRequired.length} remaining)`);
      return;
    }

    setError("");
    setShowSignatureDialog(true);
  };

  // Handle signature save
  const handleSignatureSave = (signatureDataUrl: string) => {
    setESignature(signatureDataUrl);
  };

  // Handle final submission with signature
  const handleFinalSubmit = () => {
    if (!eSignature) {
      setError("Please provide your signature before submitting");
      return;
    }

    setIsSubmitting(true);
    setShowSignatureDialog(false);

    // Note: Answers are auto-saved via useAutoSave hook
    // Submission validates and marks as complete with e-signature
    submitMutation.mutate({
      accessCode,
      eSignature,
    });
  };

  if (!currentQuestion) {
    return null;
  }

  const currentResponse = responses.get(currentQuestion.id) || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt="Intelleges" className="h-10" />
            <div>
              <h1 className="font-semibold">{questionnaire.title}</h1>
              <p className="text-xs text-muted-foreground">{questionnaire.partnerName}</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="container mx-auto py-4">
        <div className="flex items-center gap-4">
          <Progress value={progress} className="flex-1" />
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {answeredCount} of {totalQuestions} questions answered
          {saveDraftMutation.isPending && " • Saving..."}
          {saveDraftMutation.isSuccess && " • Draft saved"}
        </p>
      </div>

      {/* Main Content */}
      <main className="container mx-auto py-8 max-w-3xl">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">
              {currentQuestion.title}
              {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
            </CardTitle>
            {currentQuestion.hintText && (
              <Alert className="mt-4">
                <AlertDescription>{currentQuestion.hintText}</AlertDescription>
              </Alert>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* QuestionFactory renders the appropriate question component */}
            <QuestionFactory
              question={currentQuestion}
              response={currentResponse}
              onChange={(partialResponse) => handleResponseChange(currentQuestion.id, partialResponse)}
              disabled={isSubmitting}
            />

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0 || isSubmitting}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <Button onClick={handleNext} disabled={isSubmitting}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmitClick}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Submit Questionnaire
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        {questionnaire.footer && (
          <p className="text-center text-sm text-muted-foreground mt-8">
            {questionnaire.footer}
          </p>
        )}
      </main>

      {/* E-Signature Dialog */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sign and Submit Questionnaire</DialogTitle>
            <DialogDescription>
              Please provide your electronic signature to certify that the information provided is accurate and complete.
              This signature is legally binding.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <SignaturePad
              onSave={handleSignatureSave}
              onClear={() => setESignature(null)}
              width={700}
              height={200}
            />

            {eSignature && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Signature Preview:</p>
                <div className="border rounded-md p-2 bg-muted">
                  <img src={eSignature} alt="Your signature" className="max-w-full h-auto" />
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSignatureDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFinalSubmit}
              disabled={!eSignature || isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Submitting..." : "Submit Questionnaire"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
