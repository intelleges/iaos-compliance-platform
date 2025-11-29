/**
 * Partner Batch Upload Dialog
 * 
 * UI for uploading partner batch files per INT.DOC.64
 * Features:
 * - File upload with drag-drop support
 * - Validation preview with error reporting
 * - Import summary (created/updated/skipped counts)
 */

import { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface PartnerBatchUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PartnerBatchUploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: PartnerBatchUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileBuffer, setFileBuffer] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [step, setStep] = useState<'select' | 'validate' | 'upload' | 'complete'>('select');

  const validateMutation = trpc.partnerBatch.validate.useMutation();
  const uploadMutation = trpc.partnerBatch.upload.useMutation();

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast.error('Please select an Excel file (.xlsx or .xls)');
      return;
    }

    setFile(selectedFile);
    
    // Read file as base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const base64Data = base64.split(',')[1]; // Remove data URL prefix
      setFileBuffer(base64Data!);
      setStep('validate');
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleValidate = async () => {
    if (!fileBuffer) return;

    try {
      const result = await validateMutation.mutateAsync({ fileBuffer });
      setValidationResult(result);
      
      if (result.success) {
        toast.success(`Validation passed: ${result.validRows} valid rows`);
      } else {
        toast.error(`Validation failed: ${result.invalidRows} invalid rows`);
      }
    } catch (error) {
      toast.error('Validation failed');
      console.error(error);
    }
  };

  const handleUpload = async () => {
    if (!fileBuffer) return;

    try {
      const result = await uploadMutation.mutateAsync({ fileBuffer });
      setUploadResult(result);
      setStep('complete');
      
      if (result.success) {
        toast.success(`Upload complete: ${result.created} created, ${result.updated} updated`);
        onSuccess?.();
      } else {
        toast.error('Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed');
      console.error(error);
    }
  };

  const handleClose = () => {
    setFile(null);
    setFileBuffer(null);
    setValidationResult(null);
    setUploadResult(null);
    setStep('select');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Partner Batch Upload</DialogTitle>
          <DialogDescription>
            Upload Excel file to import multiple partners at once
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: File Selection */}
        {step === 'select' && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your Excel file here, or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Supports .xlsx and .xls files
              </p>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) handleFileSelect(selectedFile);
                }}
              />
            </div>

            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription>
                <div className="mb-3 space-y-2">
                  <div className="font-semibold text-gray-700">📥 Download Template:</div>
                  <div className="flex gap-4">
                    <a 
                      href="/templates/Partner_Import_Template_Blank.xlsx" 
                      download
                      className="text-blue-600 hover:text-blue-800 font-semibold underline"
                    >
                      📄 Blank Template
                    </a>
                    <span className="text-gray-400">|</span>
                    <a 
                      href="/templates/Partner_Import_Template_Sample.xlsx" 
                      download
                      className="text-green-600 hover:text-green-800 font-semibold underline"
                    >
                      📊 Template with Sample Data
                    </a>
                  </div>
                </div>
                <strong>Template Columns:</strong>
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>Company Name, Internal ID, DBA Name, DUNS Number, CAGE Code, UEI, Tax ID</li>
                  <li>Address Line 1, Address Line 2, City, State, ZIP Code, Country</li>
                  <li>Contact First Name, Contact Last Name, Contact Email, Contact Phone, Contact Title</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Step 2: Validation */}
        {step === 'validate' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <FileSpreadsheet className="h-8 w-8 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium">{file?.name}</p>
                <p className="text-sm text-gray-600">
                  {(file?.size || 0 / 1024).toFixed(2)} KB
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setFileBuffer(null);
                  setStep('select');
                }}
              >
                Change File
              </Button>
            </div>

            {!validationResult && (
              <Button
                onClick={handleValidate}
                disabled={validateMutation.isPending}
                className="w-full"
              >
                {validateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Validate File
              </Button>
            )}

            {validationResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Rows</p>
                    <p className="text-2xl font-bold text-blue-600">{validationResult.totalRows}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Valid Rows</p>
                    <p className="text-2xl font-bold text-green-600">{validationResult.validRows}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Invalid Rows</p>
                    <p className="text-2xl font-bold text-red-600">{validationResult.invalidRows}</p>
                  </div>
                </div>

                {validationResult.invalidRows > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Validation Errors Found</strong>
                      <div className="mt-2 max-h-40 overflow-y-auto">
                        {validationResult.validationResults
                          .filter((r: any) => !r.isValid)
                          .slice(0, 10)
                          .map((r: any, idx: number) => (
                            <div key={idx} className="text-sm mb-1">
                              Row {r.rowNumber}: {r.errors.map((e: any) => e.message).join(', ')}
                            </div>
                          ))}
                        {validationResult.invalidRows > 10 && (
                          <p className="text-sm mt-2">
                            ...and {validationResult.invalidRows - 10} more errors
                          </p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {validationResult.success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      All rows passed validation. Ready to import.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setValidationResult(null);
                      setFile(null);
                      setFileBuffer(null);
                      setStep('select');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!validationResult.success || uploadMutation.isPending}
                    className="flex-1"
                  >
                    {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Import Partners
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Upload Complete */}
        {step === 'complete' && uploadResult && (
          <div className="space-y-4">
            {uploadResult.success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Upload Successful</strong>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Upload Failed</strong>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-2xl font-bold text-green-600">{uploadResult.created || 0}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Updated</p>
                <p className="text-2xl font-bold text-blue-600">{uploadResult.updated || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Skipped</p>
                <p className="text-2xl font-bold text-gray-600">{uploadResult.skipped || 0}</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-gray-600">Reactivated</p>
                <p className="text-2xl font-bold text-amber-600">{uploadResult.reactivated || 0}</p>
              </div>
            </div>

            {uploadResult.loadErrors && uploadResult.loadErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Some rows failed to import:</strong>
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    {uploadResult.loadErrors.slice(0, 10).map((err: any, idx: number) => (
                      <div key={idx} className="text-sm mb-1">
                        Row {err.rowNumber} ({err.partnerInternalId}): {err.error}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
