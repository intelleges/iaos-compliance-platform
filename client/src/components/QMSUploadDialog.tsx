import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface QMSUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionnaireId: number;
  questionnaireName: string;
  onSuccess?: () => void;
}

export function QMSUploadDialog({
  open,
  onOpenChange,
  questionnaireId,
  questionnaireName,
  onSuccess
}: QMSUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'insert' | 'update'>('insert');
  const [fileData, setFileData] = useState<string>('');
  
  const uploadMutation = trpc.questionnaireBuilder.uploadQMS.useMutation({
    onSuccess: (result) => {
      toast.success('QMS Import Successful', {
        description: result.summary
      });
      onOpenChange(false);
      onSuccess?.();
      // Reset form
      setSelectedFile(null);
      setFileData('');
      setMode('insert');
    },
    onError: (error) => {
      toast.error('QMS Import Failed', {
        description: error.message
      });
    }
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Invalid File Type', {
        description: 'Please select an Excel file (.xlsx or .xls)'
      });
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File Too Large', {
        description: 'Maximum file size is 10MB'
      });
      return;
    }
    
    setSelectedFile(file);
    
    // Read file as base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      // Remove data URL prefix (data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,)
      const base64Data = base64.split(',')[1] || base64;
      setFileData(base64Data);
    };
    reader.readAsDataURL(file);
  };
  
  const handleUpload = () => {
    if (!selectedFile || !fileData) {
      toast.error('No File Selected', {
        description: 'Please select a QMS Excel template file'
      });
      return;
    }
    
    uploadMutation.mutate({
      questionnaireId,
      fileData,
      mode
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import QMS Excel Template
          </DialogTitle>
          <DialogDescription>
            Upload a QMS Excel template to import questions into <strong>{questionnaireName}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="qms-file">QMS Template File</Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => document.getElementById('qms-file')?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {selectedFile ? selectedFile.name : 'Choose Excel file...'}
              </Button>
              <input
                id="qms-file"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                File size: {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            )}
          </div>
          
          {/* Import Mode */}
          <div className="space-y-2">
            <Label>Import Mode</Label>
            <RadioGroup value={mode} onValueChange={(value) => setMode(value as 'insert' | 'update')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="insert" id="mode-insert" />
                <Label htmlFor="mode-insert" className="font-normal cursor-pointer">
                  <div>
                    <div className="font-medium">Insert New Questions</div>
                    <div className="text-sm text-muted-foreground">
                      Add questions from template to existing questionnaire
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="update" id="mode-update" />
                <Label htmlFor="mode-update" className="font-normal cursor-pointer">
                  <div>
                    <div className="font-medium">Update Existing Questions</div>
                    <div className="text-sm text-muted-foreground">
                      Replace existing questions with matching IDs from template
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The QMS template must follow the standard format with 27 columns:
              QID, Page, Surveyset, Survey, Question, Response, Title, Required, Length, titleLength,
              skipLogic, skipLogicAnswer, skipLogicJump, CommentBoxMessageText, UploadMessageText,
              CalendarMessageText, CommentType, yValue, nValue, naValue, otherValue, qWeight,
              spinOffQuestionnaire, spinoffid, emailalert, emailalertlist, accessLevel.
            </AlertDescription>
          </Alert>
          
          {/* Success/Error Display */}
          {uploadMutation.isSuccess && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {uploadMutation.data.summary}
                <div className="mt-2 text-sm">
                  Questions imported: {uploadMutation.data.questionsImported} | 
                  Questions updated: {uploadMutation.data.questionsUpdated}
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {uploadMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {uploadMutation.error.message}
                {uploadMutation.error.cause && Array.isArray(uploadMutation.error.cause) && (
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    <div className="text-sm font-medium">Validation Errors:</div>
                    <ul className="list-disc list-inside text-sm mt-1">
                      {uploadMutation.error.cause.slice(0, 10).map((err: any, i: number) => (
                        <li key={i}>
                          Row {err.row}: {err.message} ({err.code})
                        </li>
                      ))}
                      {uploadMutation.error.cause.length > 10 && (
                        <li className="text-muted-foreground">
                          ... and {uploadMutation.error.cause.length - 10} more errors
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploadMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
          >
            {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {uploadMutation.isPending ? 'Importing...' : 'Import Questions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
