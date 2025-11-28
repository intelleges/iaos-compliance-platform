import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Partners() {
  const { user } = useAuth();
  const { data: partners, isLoading } = trpc.partners.list.useQuery();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Partners (Suppliers)</h1>
          <p className="text-muted-foreground">
            Manage supplier contacts and compliance data
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Partner
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading partners...</p>
        </div>
      ) : partners && partners.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Partner Directory</CardTitle>
            <CardDescription>
              {partners.length} supplier{partners.length !== 1 ? 's' : ''} registered
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {partners.map((partner) => (
                <div key={partner.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{partner.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {partner.email || 'No email'} • {partner.city || 'No location'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${partner.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {partner.active ? 'Active' : 'Archived'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No partners yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first supplier partner.
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Partner
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
