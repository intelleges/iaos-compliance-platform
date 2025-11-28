import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Plus } from "lucide-react";
import { SimpleQuestionnaireImport } from "@/components/SimpleQuestionnaireImport";

export default function Questionnaires() {
  const { data: questionnaires, isLoading, refetch } = trpc.questionnaires.list.useQuery();

  const handleImportSuccess = () => {
    refetch();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Questionnaires</h1>
          <p className="text-muted-foreground">
            Build and manage compliance forms with validation logic
          </p>
        </div>
        <div className="flex gap-2">
          <SimpleQuestionnaireImport onSuccess={handleImportSuccess} />
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Questionnaire
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading questionnaires...</p>
        </div>
      ) : questionnaires && questionnaires.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {questionnaires.map((questionnaire) => (
            <Card key={questionnaire.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{questionnaire.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {questionnaire.description || 'No description'}
                      </CardDescription>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${questionnaire.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {questionnaire.active ? 'Active' : 'Archived'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {questionnaire.locked && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <span className="font-medium">🔒 Locked</span>
                      <span className="text-muted-foreground">• Responses exist</span>
                    </div>
                  )}
                  {questionnaire.multiLanguage && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">🌐 Multi-language</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">
                      {new Date(questionnaire.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No questionnaires yet</h3>
            <p className="text-muted-foreground mb-4">
              Import a questionnaire from Excel or create a new one.
            </p>
            <div className="flex gap-2 justify-center">
              <SimpleQuestionnaireImport onSuccess={handleImportSuccess} />
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Questionnaire
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
