import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck, Plus } from "lucide-react";

export default function Protocols() {
  const { data: protocols, isLoading } = trpc.protocols.list.useQuery();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Compliance Protocols</h1>
          <p className="text-muted-foreground">
            Manage FAR/DFARS/eSRS compliance campaigns and annual cycles
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Protocol
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading protocols...</p>
        </div>
      ) : protocols && protocols.length > 0 ? (
        <div className="grid gap-4">
          {protocols.map((protocol) => (
            <Card key={protocol.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{protocol.name}</CardTitle>
                      <CardDescription>
                        {protocol.abbreviation || 'No abbreviation'} • {protocol.description || 'No description'}
                      </CardDescription>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${protocol.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {protocol.active ? 'Active' : 'Archived'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Start Date:</span>
                    <p className="font-medium">
                      {protocol.startDate ? new Date(protocol.startDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">End Date:</span>
                    <p className="font-medium">
                      {protocol.endDate ? new Date(protocol.endDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                </div>
                {protocol.purpose && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">{protocol.purpose}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No protocols yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first compliance campaign to get started.
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Protocol
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
