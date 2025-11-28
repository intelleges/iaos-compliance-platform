import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EntityActionPageProps {
  entity: string;
  action: string;
  description?: string;
}

export default function EntityActionPage({ entity, action, description }: EntityActionPageProps) {
  const defaultDescription = `${action} ${entity.toLowerCase()} records in the system.`;
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{action} {entity}</h1>
        <p className="text-muted-foreground">
          {description || defaultDescription}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{action} {entity}</CardTitle>
          <CardDescription>
            This page is under construction. Functionality will be added soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p>Coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
