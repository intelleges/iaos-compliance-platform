import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderTree, Plus } from "lucide-react";

export default function Groups() {
  const { data: groups, isLoading } = trpc.groups.list.useQuery();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Groups</h1>
          <p className="text-muted-foreground">
            Organize partners and users by sites, divisions, or projects
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading groups...</p>
        </div>
      ) : groups && groups.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FolderTree className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {group.description || 'No description'}
                      </CardDescription>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${group.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {group.active ? 'Active' : 'Archived'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {group.email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium truncate ml-2">{group.email}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">
                      {new Date(group.createdAt).toLocaleDateString()}
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
            <FolderTree className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
            <p className="text-muted-foreground mb-4">
              Create groups to organize partners and track responses by location or division.
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
