import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import SimpleQuestionnaireUpload from '../../components/SimpleQuestionnaireUpload';

export default function QuestionnaireAdd() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open && !dialogOpen) {
      // If closing without ever opening, go back
      navigate('/questionnaires');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold mb-4">Add Questionnaire</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Upload an Excel file containing questionnaire data to import questions and configuration.
          </p>
          
          <div className="flex gap-4">
            <Button onClick={() => setDialogOpen(true)} size="lg">
              Upload Questionnaire File
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/questionnaires')}
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>

      <SimpleQuestionnaireUpload 
        open={dialogOpen} 
        onOpenChange={handleOpenChange}
      />
    </div>
  );
}
