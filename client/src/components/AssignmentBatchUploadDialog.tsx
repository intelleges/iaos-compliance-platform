/**
 * Touchpoint Assignment Batch Upload Dialog
 * INT.DOC.64 Section 4 - Touchpoint Assignment Load
 * 
 * 3-step wizard for bulk partner-to-touchpoint assignments:
 * 1. Select File (drag-and-drop)
 * 2. Validate (preview errors/warnings)
 * 3. Import (show results)
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle, Send } from 'lucide-react';
import { toast } from 'sonner';

interface AssignmentBatchUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = 'select' | 'validate' | 'import';

export function AssignmentBatchUploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: AssignmentBatchUploadDialogProps) {
  const [step, setStep] = useState<Step>('select');
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateMutation = trpc.assignmentBatch.validate.useMutation();
  const uploadMutation = trpc.assignmentBatch.upload.useMutation();

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Please select an Excel file (.xlsx or .xls)');
      return;
    }

    setFile(selectedFile);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const base64Data = base64.split(',')[1] || base64;
      setFileBase64(base64Data);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleValidate = async () => {
    if (!fileBase64) {
      toast.error('Please select a file first');
      return;
    }

    try {
      const result = await validateMutation.mutateAsync({ fileBase64 });
      setValidationResult(result);
      setStep('validate');
    } catch (error: any) {
      toast.error(error.message || 'Validation failed');
    }
  };

  const handleImport = async () => {
    if (!fileBase64) {
      toast.error('Please select a file first');
      return;
    }

    try {
      const result = await uploadMutation.mutateAsync({ fileBase64 });
      setImportResult(result);
      setStep('import');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Import failed');
    }
  };

  const handleReset = () => {
    setStep('select');
    setFile(null);
    setFileBase64('');
    setValidationResult(null);
    setImportResult(null);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Touchpoint Assignments</DialogTitle>
          <DialogDescription>
            Bulk assign partners to touchpoints/questionnaires (INT.DOC.64 Section 4)
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select File */}
        {step === 'select' && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">
                {file ? file.name : 'Drop your Assignment Template here'}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                or click to browse for .xlsx file
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) handleFileSelect(selectedFile);
                }}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span>Choose File</span>
                </Button>
              </label>
            </div>

            {file && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">{file.name}</p>
                  <p className="text-sm text-blue-700">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setFile(null);
                    setFileBase64('');
                  }}
                  variant="ghost"
                  size="sm"
                >
                  Remove
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleValidate}
                disabled={!file || validateMutation.isPending}
              >
                {validateMutation.isPending ? 'Validating...' : 'Next: Validate'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Validation Results */}
        {step === 'validate' && validationResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">Total Rows</p>
                <p className="text-2xl font-bold text-blue-900">
                  {validationResult.summary.totalRows}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700">Valid</p>
                <p className="text-2xl font-bold text-green-900">
                  {validationResult.summary.validRows}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">Errors</p>
                <p className="text-2xl font-bold text-red-900">
                  {validationResult.summary.errorRows}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-700">Warnings</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {validationResult.summary.warningRows}
                </p>
              </div>
            </div>

            {/* Errors */}
            {validationResult.errors.length > 0 && (
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                  <h4 className="font-semibold text-red-900 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Validation Errors ({validationResult.errors.length})
                  </h4>
                </div>
                <div className="divide-y">
                  {validationResult.errors.map((error: any, idx: number) => (
                    <div key={idx} className="px-4 py-3">
                      <p className="font-medium text-red-900">
                        Row {error.rowNumber}: {error.code}
                      </p>
                      <p className="text-sm text-red-700">{error.message}</p>
                      {error.field && (
                        <p className="text-xs text-red-600 mt-1">Field: {error.field}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                <div className="bg-yellow-50 px-4 py-2 border-b border-yellow-200">
                  <h4 className="font-semibold text-yellow-900 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Warnings ({validationResult.warnings.length})
                  </h4>
                </div>
                <div className="divide-y">
                  {validationResult.warnings.map((warning: any, idx: number) => (
                    <div key={idx} className="px-4 py-3">
                      <p className="font-medium text-yellow-900">
                        Row {warning.rowNumber}: {warning.code}
                      </p>
                      <p className="text-sm text-yellow-700">{warning.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {validationResult.errors.length === 0 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">Validation Passed</p>
                    <p className="text-sm text-green-700">
                      All {validationResult.summary.validRows} assignments are ready to import
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleReset}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={validationResult.errors.length > 0 || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? 'Importing...' : 'Import Assignments'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Import Results */}
        {step === 'import' && importResult && (
          <div className="space-y-4">
            <div className="p-6 bg-green-50 rounded-lg border border-green-200 text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
              <h3 className="text-xl font-bold text-green-900 mb-2">Import Complete!</h3>
              <p className="text-green-700">
                Successfully processed {importResult.summary.totalProcessed} assignments
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">Assigned</p>
                <p className="text-2xl font-bold text-blue-900">
                  {importResult.summary.assigned}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-700">Re-assigned</p>
                <p className="text-2xl font-bold text-purple-900">
                  {importResult.summary.reassigned}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">Skipped</p>
                <p className="text-2xl font-bold text-gray-900">
                  {importResult.summary.skipped}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm text-green-700">Invitations Sent</p>
                  <p className="text-2xl font-bold text-green-900">
                    {importResult.summary.invitationsSent}
                  </p>
                </div>
                <Send className="h-6 w-6 text-green-600" />
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                  <h4 className="font-semibold text-red-900">
                    Import Errors ({importResult.errors.length})
                  </h4>
                </div>
                <div className="divide-y">
                  {importResult.errors.map((error: any, idx: number) => (
                    <div key={idx} className="px-4 py-3">
                      <p className="font-medium text-red-900">
                        Row {error.rowNumber}: {error.partnerInternalId} → {error.touchpointCode}
                      </p>
                      <p className="text-sm text-red-700">{error.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
