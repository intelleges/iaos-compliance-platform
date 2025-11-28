import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Plus } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Enterprises() {
  const { user } = useAuth();
  const { data: enterprises, isLoading } = trpc.enterprises.list.useQuery(undefined, {
    enabled: user?.role === 'admin'
  });

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Only super administrators can manage enterprises.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Enterprises</h1>
          <p className="text-muted-foreground">
            Manage tenant organizations and their configurations
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Enterprise
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading enterprises...</p>
        </div>
      ) : enterprises && enterprises.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {enterprises.map((enterprise) => (
            <Card key={enterprise.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{enterprise.companyName || enterprise.description}</CardTitle>
                      <CardDescription className="text-sm">
                        {enterprise.instanceName || 'No instance name'}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={enterprise.active ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {enterprise.active ? "Active" : "Archived"}
                    </span>
                  </div>
                  {enterprise.userMax && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">User Limit:</span>
                      <span className="font-medium">{enterprise.userMax}</span>
                    </div>
                  )}
                  {enterprise.partnerMax && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Partner Limit:</span>
                      <span className="font-medium">{enterprise.partnerMax}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No enterprises yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first enterprise organization.
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Enterprise
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
