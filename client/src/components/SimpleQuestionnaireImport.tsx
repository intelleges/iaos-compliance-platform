import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';

interface SimpleQuestionnaireImportProps {
  onSuccess?: () => void;
}

export function SimpleQuestionnaireImport({ onSuccess }: SimpleQuestionnaireImportProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createQuestionnaireMutation = trpc.questionnaireBuilder.create.useMutation();
  const uploadQMSMutation = trpc.questionnaireBuilder.uploadQMS.useMutation();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Step 1: Create questionnaire with default values
      const questionnaire = await createQuestionnaireMutation.mutateAsync({
        title: `Imported Questionnaire - ${file.name}`,
        description: `Imported from Excel file: ${file.name}`,
        partnerTypeId: 1, // Default to Domestic
        levelType: 1, // Default to Company Level
      });

      // Step 2: Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Data = event.target?.result as string;
          const base64Content = base64Data.split(',')[1];

          // Step 3: Upload QMS data
          const result = await uploadQMSMutation.mutateAsync({
            questionnaireId: questionnaire.id,
            fileData: base64Content,
            mode: 'insert',
          });

          toast.success(`Successfully imported ${result.questionsImported} questions from ${file.name}`);
          
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          
          onSuccess?.();
        } catch (error: any) {
          console.error('[Import Error]', error);
          toast.error(error.message || 'Failed to import questionnaire');
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error('Failed to read file');
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('[Create Questionnaire Error]', error);
      toast.error(error.message || 'Failed to create questionnaire');
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="inline-block">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
      <Button
        onClick={handleButtonClick}
        disabled={isUploading}
        variant="outline"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Import from Excel
          </>
        )}
      </Button>
    </div>
  );
}
