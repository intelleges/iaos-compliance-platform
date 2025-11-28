/**
 * UploadWidget Component
 * Conditional file upload field based on CommentType
 * Based on INT.DOC.08 Section 4.3
 */

import { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react';
import type { QuestionComponentProps } from './types';
import { CommentType } from './types';

type UploadWidgetProps = QuestionComponentProps & {
  show: boolean;
};

export function UploadWidget({ question, response, onChange, disabled, show }: UploadWidgetProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!show) return null;

  const hasFile = !!response.uploadUrl;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (25MB max)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 25MB');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/png',
      'image/jpeg',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // TODO: Implement actual file upload to S3
      // For now, create a mock URL
      const mockUrl = `https://storage.example.com/uploads/${Date.now()}-${file.name}`;
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onChange({ uploadUrl: mockUrl });
    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange({ uploadUrl: null });
    setError(null);
  };

  return (
    <div className="mt-4 space-y-3 border-l-4 border-primary/30 pl-4">
      <Label className="text-sm font-medium">
        Upload Supporting Document
        {question.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {!hasFile ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="file"
              onChange={handleFileChange}
              disabled={disabled || uploading}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              className="flex-1"
            />
            {uploading && (
              <div className="text-sm text-muted-foreground">Uploading...</div>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground">
            Accepted formats: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (Max 25MB)
          </p>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {response.uploadUrl?.split('/').pop() || 'Uploaded file'}
            </p>
            <p className="text-xs text-muted-foreground">File uploaded successfully</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Determine if upload widget should be shown based on CommentType and response
 */
export function shouldShowUpload(commentType: number | null, responseInt: number | null): boolean {
  if (!commentType) return false;

  switch (commentType) {
    case CommentType.YN_UPLOAD_Y:
      return responseInt === 1; // Show when Yes
    case CommentType.YN_UPLOAD_N:
      return responseInt === 0; // Show when No
    case CommentType.UPLOADONLY:
      return true; // Always show
    default:
      return false;
  }
}
