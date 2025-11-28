import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';

interface QuestionnaireImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Helper function to convert level string to number
function getLevelTypeNumber(level: string): number {
  const levelMap: Record<string, number> = {
    'company': 1,
    'part': 2,
    'site': 3,
    'contract': 4,
    'product': 5,
  };
  return levelMap[level] || 1;
}

export function QuestionnaireImportDialog({ 
  open, 
  onOpenChange,
  onSuccess 
}: QuestionnaireImportDialogProps) {
  const [protocolId, setProtocolId] = useState<string>('');
  const [touchpointId, setTouchpointId] = useState<string>('');
  const [partnertypeId, setPartnertypeId] = useState<string>('');
  const [level, setLevel] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch protocols
  const { data: protocols } = trpc.protocols.list.useQuery();
  
  // Fetch touchpoints based on selected protocol
  const { data: touchpoints } = trpc.touchpoint.list.useQuery(
    { protocolId: parseInt(protocolId) },
    { enabled: !!protocolId }
  );

  // Fetch partnertypes
  // TODO: Add partnertype router - for now using hardcoded values
  const partnertypes = [
    { id: 1, name: 'Domestic', description: 'U.S.-based suppliers' },
    { id: 2, name: 'International', description: 'Non-U.S. suppliers' },
    { id: 3, name: 'Small Business', description: 'Small business suppliers' },
  ];

  const createQuestionnaireMutation = trpc.questionnaireBuilder.create.useMutation();
  const uploadQMSMutation = trpc.questionnaireBuilder.uploadQMS.useMutation();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleChooseFile = () => {
    if (areSelectionsComplete && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async () => {
    if (!protocolId || !touchpointId || !partnertypeId || !level || !file) {
      toast.error('Please complete all required fields and select a file');
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Create questionnaire
      const questionnaire = await createQuestionnaireMutation.mutateAsync({
        title: `QMS Import - ${file.name}`,
        description: `Imported from QMS Excel template for ${touchpoints?.find(t => t.id.toString() === touchpointId)?.title || 'touchpoint'}`,
        partnerTypeId: parseInt(partnertypeId),
        levelType: getLevelTypeNumber(level),
      });

      // Step 2: Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Data = event.target?.result as string;
          const base64Content = base64Data.split(',')[1]; // Remove data:... prefix

          // Step 3: Upload QMS data
          const result = await uploadQMSMutation.mutateAsync({
            questionnaireId: questionnaire.id,
            fileData: base64Content,
            mode: 'insert',
          });

          toast.success(`Successfully imported ${result.imported} questions`);
          
          // Reset form
          setProtocolId('');
          setTouchpointId('');
          setPartnertypeId('');
          setLevel('');
          setFile(null);
          
          onOpenChange(false);
          onSuccess?.();
        } catch (error: any) {
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
      toast.error(error.message || 'Failed to create questionnaire');
      setIsUploading(false);
    }
  };

  const areSelectionsComplete = protocolId && touchpointId && partnertypeId && level;
  const isFormValid = areSelectionsComplete && file;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Questionnaire</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Configure the questionnaire context by selecting Protocol, Touchpoint, Partnertype, and Level.
              Then upload the questionnaire spreadsheet.
            </p>
          </div>

          {/* Step 1: Select Protocol & Touchpoint */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-semibold">
                1
              </div>
              <h3 className="font-semibold">Select Protocol & Touchpoint</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 ml-8">
              <div className="space-y-2">
                <Label htmlFor="protocol">Protocol *</Label>
                <Select value={protocolId} onValueChange={setProtocolId}>
                  <SelectTrigger id="protocol">
                    <SelectValue placeholder="Select Protocol..." />
                  </SelectTrigger>
                  <SelectContent>
                    {protocols?.map((protocol) => (
                      <SelectItem key={protocol.id} value={protocol.id.toString()}>
                        {protocol.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="touchpoint">Touchpoint *</Label>
                <Select 
                  value={touchpointId} 
                  onValueChange={setTouchpointId}
                  disabled={!protocolId}
                >
                  <SelectTrigger id="touchpoint">
                    <SelectValue placeholder="Select Touchpoint..." />
                  </SelectTrigger>
                  <SelectContent>
                    {touchpoints?.map((touchpoint) => (
                      <SelectItem key={touchpoint.id} value={touchpoint.id.toString()}>
                        {touchpoint.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Step 2: Select Partnertype & Level */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-semibold">
                2
              </div>
              <h3 className="font-semibold">Select Partnertype & Level</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 ml-8">
              <div className="space-y-2">
                <Label htmlFor="partnertype">Partnertype *</Label>
                <Select value={partnertypeId} onValueChange={setPartnertypeId}>
                  <SelectTrigger id="partnertype">
                    <SelectValue placeholder="Select Partnertype..." />
                  </SelectTrigger>
                  <SelectContent>
                    {partnertypes?.map((partnertype) => (
                      <SelectItem key={partnertype.id} value={partnertype.id.toString()}>
                        {partnertype.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {partnertypeId && (
                  <p className="text-xs text-muted-foreground">
                    {partnertypes?.find(p => p.id.toString() === partnertypeId)?.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Level / Cardinality *</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Select Level..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Company Level</SelectItem>
                    <SelectItem value="part">Part Number Level</SelectItem>
                    <SelectItem value="site">Site Level</SelectItem>
                    <SelectItem value="contract">Contract Level</SelectItem>
                    <SelectItem value="product">Product Line Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Step 3: Upload Questionnaire Spreadsheet */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-semibold">
                3
              </div>
              <h3 className="font-semibold">Upload Questionnaire Spreadsheet</h3>
            </div>

            <div className="ml-8">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                {file ? (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-green-500" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={!areSelectionsComplete || isUploading}
                      />
                      <button
                        type="button"
                        onClick={handleChooseFile}
                        disabled={!areSelectionsComplete || isUploading}
                        className={`text-blue-600 hover:text-blue-700 font-medium ${
                          !areSelectionsComplete || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        Choose file
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {areSelectionsComplete 
                        ? 'Upload Excel questionnaire template (.xlsx, .xls)'
                        : 'Complete the selections above to enable upload'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                'Load Questionnaire'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
