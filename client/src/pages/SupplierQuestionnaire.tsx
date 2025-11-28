import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, LogOut, Clock, Calendar, CheckCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { APP_TITLE } from '@/const';
import { useEnhancedAutoSave } from '@/hooks/useEnhancedAutoSave';
import { AutoSaveIndicator } from '@/components/AutoSaveIndicator';
import { SessionTimeoutWarning } from '@/components/SessionTimeoutWarning';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * Question Renderer Component
 * Renders different question types based on question.type
 * Type 1: Y/N (Radio)
 * Type 2: Text (Textarea)
 * Type 3: Date (Date input)
 * Type 4: Dropdown (Select with response options)
 * Type 6: Checkbox/List (Multiple checkboxes with response options)
 * Type 9: Unknown (Text fallback)
 */
interface QuestionRendererProps {
  question: any;
  index: number;
  value: any;
  onChange: (value: any) => void;
}

function QuestionRenderer({ question, index, value, onChange }: QuestionRendererProps) {
  const renderQuestionInput = () => {
    switch (question.responseType) {
      case 1: // Y/N Radio
        return (
          <RadioGroup value={value || ''} onValueChange={onChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Y" id={`q${question.id}-yes`} />
              <Label htmlFor={`q${question.id}-yes`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="N" id={`q${question.id}-no`} />
              <Label htmlFor={`q${question.id}-no`}>No</Label>
            </div>
          </RadioGroup>
        );
      
      case 2: // Text
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your response..."
            rows={4}
          />
        );
      
      case 5: // Date (Type 5)
      case 9: // Date (Type 9 - alternative)
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      
      case 4: // Dropdown
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {question.responseOptions?.map((option: any) => (
                <SelectItem key={option.id} value={String(option.zcode)}>
                  {option.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 6: // Checkbox/List
        const selectedValues = value || [];
        return (
          <div className="space-y-2">
            {question.responseOptions?.map((option: any) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`q${question.id}-opt${option.id}`}
                  checked={selectedValues.includes(String(option.zcode))}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedValues, String(option.zcode)]);
                    } else {
                      onChange(selectedValues.filter((v: string) => v !== String(option.zcode)));
                    }
                  }}
                />
                <Label htmlFor={`q${question.id}-opt${option.id}`}>
                  {option.description}
                </Label>
              </div>
            ))}
          </div>
        );
      
      default: // Fallback to text input
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your response..."
          />
        );
    }
  };
  
  return (
    <div className="border-b pb-6 last:border-0">
      <div className="mb-3">
        <Label className="text-base font-medium">
          {index + 1}. {question.title || question.question}
          {question.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {question.hintText && (
          <p className="text-sm text-muted-foreground mt-1">{question.hintText}</p>
        )}
      </div>
      {renderQuestionInput()}
    </div>
  );
}

/**
 * Supplier Questionnaire Viewer
 * 
 * Displays assigned questionnaire for authenticated supplier.
 * 
 * Features:
 * - Session validation
 * - Auto-save (500ms debouncing)
 * - Progress tracking
 * - Skip logic evaluation
 * - Logout functionality
 */
export default function SupplierQuestionnaire() {
  const [, setLocation] = useLocation();
  const [responses, setResponses] = useState<Record<string, any>>({});
  
  // Get current session
  const { data: session, isLoading: sessionLoading, error: sessionError } = trpc.supplier.getSession.useQuery();
  
  // Get questionnaire data
  const { data: questionnaireData, isLoading: questionnaireLoading } = trpc.supplier.getQuestionnaire.useQuery(
    undefined,
    { enabled: !!session?.authenticated }
  );

  // Save response mutation
  const saveResponseMutation = trpc.supplier.saveResponse.useMutation();
  
  // Enhanced auto-save with visual feedback
  const autoSave = useEnhancedAutoSave({
    onSave: async (data) => {
      console.log('[AutoSave] onSave called with data:', data);
      console.log('[AutoSave] Number of responses to save:', Object.keys(data).length);
      
      // Save each response sequentially to avoid race conditions
      for (const [questionId, value] of Object.entries(data)) {
        console.log(`[AutoSave] Saving question ${questionId} with value:`, value);
        try {
          const result = await saveResponseMutation.mutateAsync({
            questionId: parseInt(questionId),
            value,
          });
          console.log(`[AutoSave] Question ${questionId} saved successfully:`, result);
        } catch (error: any) {
          console.error(`[AutoSave] Failed to save question ${questionId}`);
          console.error('[AutoSave] Error object:', error);
          console.error('[AutoSave] Error type:', typeof error);
          console.error('[AutoSave] Error keys:', Object.keys(error || {}));
          console.error('[AutoSave] Error message:', error?.message);
          console.error('[AutoSave] Error data:', error?.data);
          console.error('[AutoSave] Error shape:', error?.shape);
          throw new Error(error?.message || 'Save failed');
        }
      }
      
      console.log('[AutoSave] All saves completed successfully');
    },
    delay: 500,
    localStorageKey: `supplier-questionnaire-backup-${session?.assignment?.id || 'temp'}`,
    onError: (error) => {
      console.error('[AutoSave] Save failed:', error);
      console.error('[AutoSave] Error name:', error.name);
      console.error('[AutoSave] Error message:', error.message);
      console.error('[AutoSave] Error stack:', error.stack);
      if (error instanceof Error && 'cause' in error) {
        console.error('[AutoSave] Error cause:', error.cause);
      }
    },
  });

  // Load saved responses from backend on mount
  useEffect(() => {
    if (questionnaireData?.savedResponses) {
      const restoredResponses: Record<string, any> = {};
      
      // Convert Map to object and restore values
      questionnaireData.savedResponses.forEach((response: any, questionId: number) => {
        if (response.comment) {
          // Check if it's a comma-separated list (checkbox)
          if (response.comment.includes(',')) {
            restoredResponses[questionId] = response.comment.split(',');
          } else {
            restoredResponses[questionId] = response.comment;
          }
        } else if (response.value !== null) {
          restoredResponses[questionId] = response.value;
        } else if (response.responseId !== null) {
          restoredResponses[questionId] = response.responseId;
        }
      });
      
      setResponses(restoredResponses);
    } else {
      // Fallback to localStorage backup if no saved responses
      const backup = autoSave.getBackup();
      if (backup) {
        setResponses(backup);
      }
    }
  }, [questionnaireData]);

  // Calculate progress based on answered questions
  const calculateProgress = () => {
    if (!questionnaireData?.questions || questionnaireData.questions.length === 0) {
      return 0;
    }
    
    const totalQuestions = questionnaireData.questions.length;
    const answeredQuestions = Object.keys(responses).filter(questionId => {
      const value = responses[questionId];
      // Check if question has a meaningful answer
      if (value === null || value === undefined || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }).length;
    
    return Math.round((answeredQuestions / totalQuestions) * 100);
  };
  
  const currentProgress = calculateProgress();
  
  // Trigger auto-save when responses change
  const handleResponseChange = (questionId: string, value: any) => {
    const newResponses = { ...responses, [questionId]: value };
    setResponses(newResponses);
    autoSave.save(newResponses);
  };
  
  // Submit confirmation dialog state
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  
  // Submit mutation
  const submitMutation = trpc.supplier.submitQuestionnaire.useMutation({
    onSuccess: () => {
      // Clear auto-save backup
      autoSave.clearBackup();
      // Redirect to success page or show success message
      setLocation('/supplier/success');
    },
    onError: (error) => {
      alert(`Failed to submit questionnaire: ${error.message}`);
    },
  });
  
  // Logout mutation
  const logoutMutation = trpc.supplier.logout.useMutation({
    onSuccess: () => {
      setLocation('/supplier/login');
    },
  });
  
  // Redirect to login if not authenticated
  useEffect(() => {
    console.log('[SupplierQuestionnaire] Session check:', { sessionLoading, authenticated: session?.authenticated, session });
    if (!sessionLoading && !session?.authenticated) {
      console.log('[SupplierQuestionnaire] Not authenticated, redirecting to login');
      setLocation('/supplier/login');
    }
  }, [session, sessionLoading, setLocation]);
  
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (sessionError || !session?.authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            {sessionError?.message || 'Session expired. Please log in again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const assignment = session?.assignment;
  
  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            No questionnaire assignment found. Please contact your procurement team.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const handleLogout = () => {
    if (confirm('Are you sure you want to log out? Your progress has been saved.')) {
      logoutMutation.mutate();
    }
  };
  
  const handleSubmit = () => {
    // Redirect to e-signature page instead of submitting directly
    setLocation('/supplier/e-signature');
  };
  
  const confirmSubmit = () => {
    // Redirect to e-signature page
    setLocation('/supplier/e-signature');
    setShowSubmitDialog(false);
  };
  
  const isComplete = currentProgress === 100;
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Session Timeout Warning */}
      <SessionTimeoutWarning
        onTimeout={() => {
          toast.error('Your session has expired due to inactivity. Please log in again.');
          setTimeout(() => setLocation('/supplier/login'), 2000);
        }}
        onExtend={() => {
          toast.success('Session extended successfully!');
        }}
      />
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold">{APP_TITLE}</h1>
              <p className="text-sm text-muted-foreground">{assignment.partnerName}</p>
            </div>
            <AutoSaveIndicator
              status={autoSave.status}
              lastSaved={autoSave.lastSaved}
              error={autoSave.error}
              queuedChanges={autoSave.queuedChanges}
              onRetry={autoSave.retry}
              className="mr-4"
            />
            <Button variant="outline" onClick={handleLogout} disabled={logoutMutation.isPending}>
              {logoutMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </>
              )}
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Assignment Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{assignment.questionnaireName}</CardTitle>
            <CardDescription>{assignment.touchpointName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progress</span>
                <span className="text-muted-foreground">
                  {Object.keys(responses).filter(qId => {
                    const value = responses[qId];
                    if (value === null || value === undefined || value === '') return false;
                    if (Array.isArray(value) && value.length === 0) return false;
                    return true;
                  }).length} of {questionnaireData?.questions?.length || 0} questions answered ({currentProgress}%)
                </span>
              </div>
              <Progress value={currentProgress} className="h-2" />
            </div>
            
            {/* Due Date */}
            {assignment.dueDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Due: {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
            
            {/* Auto-save Notice */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Your responses are automatically saved</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Questionnaire Content */}
        <Card>
          <CardHeader>
            <CardTitle>Questionnaire</CardTitle>
            <CardDescription>
              Please complete all required fields. You can save and return at any time using your access code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {questionnaireLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : questionnaireData?.questions && questionnaireData.questions.length > 0 ? (
              <div className="space-y-6">
                {questionnaireData.questions.map((question, index) => (
                  <QuestionRenderer
                    key={question.id}
                    question={question}
                    index={index}
                    value={responses[question.id]}
                    onChange={(value) => handleResponseChange(String(question.id), value)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium mb-2">No questions found</p>
                <p className="text-sm">
                  Please contact your procurement team if you believe this is an error.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Submit Button */}
        <div className="mt-6 flex justify-end gap-4">
          {isComplete && (
            <Alert className="flex-1">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                All questions answered! You can now submit your questionnaire.
              </AlertDescription>
            </Alert>
          )}
          <Button 
            size="lg" 
            disabled={!isComplete || submitMutation.isPending}
            onClick={handleSubmit}
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Questionnaire'
            )}
          </Button>
        </div>
        
        {/* Submit Confirmation Dialog */}
        <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit Questionnaire?</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to submit your completed questionnaire. Once submitted, you will not be able to make changes.
                <br /><br />
                <strong>Progress: {Object.keys(responses).filter(qId => {
                  const value = responses[qId];
                  if (value === null || value === undefined || value === '') return false;
                  if (Array.isArray(value) && value.length === 0) return false;
                  return true;
                }).length} of {questionnaireData?.questions?.length || 0} questions answered</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmSubmit}>
                Confirm Submit
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
