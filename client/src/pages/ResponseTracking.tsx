import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";

/**
 * Response Tracking Dashboard
 * 
 * 8-Status Partner Lifecycle:
 * - G (Goal): Target number of partners to invite
 * - U (Unconfirmed): Duplicates or missing data
 * - R (Reviewing): Under review
 * - C (Confirmed): Ready to be invited
 * - N/R (No Response): Invited but no response
 * - R/I (Responded/Incomplete): Partial responses
 * - R/C (Responded/Complete): Fully completed
 * - T (Total): Total partners sent invitations
 */

type PartnerStatus = "G" | "U" | "R" | "C" | "N/R" | "R/I" | "R/C" | "T";

interface StatusCellData {
  status: PartnerStatus;
  count: number;
  percentage?: number;
}

interface GridRow {
  groupName: string;
  partnerType: string;
  statuses: Record<PartnerStatus, number>;
  total: number;
}

const STATUS_CONFIG: Record<PartnerStatus, { label: string; color: string; bgColor: string; description: string }> = {
  "G": {
    label: "Goal",
    color: "text-blue-700",
    bgColor: "bg-blue-50 hover:bg-blue-100",
    description: "Target number of partners to invite"
  },
  "U": {
    label: "Unconfirmed",
    color: "text-amber-700",
    bgColor: "bg-amber-50 hover:bg-amber-100",
    description: "Duplicates or missing data"
  },
  "R": {
    label: "Reviewing",
    color: "text-purple-700",
    bgColor: "bg-purple-50 hover:bg-purple-100",
    description: "Under review"
  },
  "C": {
    label: "Confirmed",
    color: "text-green-700",
    bgColor: "bg-green-50 hover:bg-green-100",
    description: "Ready to be invited"
  },
  "N/R": {
    label: "No Response",
    color: "text-red-700",
    bgColor: "bg-red-50 hover:bg-red-100",
    description: "Invited but no response"
  },
  "R/I": {
    label: "Incomplete",
    color: "text-orange-700",
    bgColor: "bg-orange-50 hover:bg-orange-100",
    description: "Partial responses"
  },
  "R/C": {
    label: "Complete",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 hover:bg-emerald-100",
    description: "Fully completed"
  },
  "T": {
    label: "Total Sent",
    color: "text-gray-700",
    bgColor: "bg-gray-50 hover:bg-gray-100",
    description: "Total partners sent invitations"
  }
};

export default function ResponseTracking() {
  const [selectedProtocol, setSelectedProtocol] = useState<string>("");
  const [selectedTouchpoint, setSelectedTouchpoint] = useState<string>("");

  // Fetch protocols for filter
  const { data: protocols } = trpc.protocols.list.useQuery({ enterpriseId: undefined });
  
  // Fetch touchpoints based on selected protocol
  const { data: touchpoints } = trpc.touchpoints.listByProtocol.useQuery(
    { protocolId: Number(selectedProtocol) },
    { enabled: !!selectedProtocol }
  );

  // Fetch response tracking data
  const { data: trackingData, isLoading, refetch } = trpc.responseTracking.getGrid.useQuery(
    {
      protocolId: selectedProtocol ? Number(selectedProtocol) : undefined,
      touchpointId: selectedTouchpoint ? Number(selectedTouchpoint) : undefined,
    },
    { enabled: !!selectedProtocol && !!selectedTouchpoint }
  );

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log("Exporting data...");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Response Tracking Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor compliance campaign progress across sites and partner types
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Select protocol and touchpoint to view response tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Protocol</label>
              <Select value={selectedProtocol} onValueChange={setSelectedProtocol}>
                <SelectTrigger>
                  <SelectValue placeholder="Select protocol" />
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
              <label className="text-sm font-medium">Touchpoint (Year)</label>
              <Select 
                value={selectedTouchpoint} 
                onValueChange={setSelectedTouchpoint}
                disabled={!selectedProtocol}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select touchpoint" />
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

            <div className="flex items-end gap-2">
              <Button onClick={() => refetch()} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleExport} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.keys(STATUS_CONFIG) as PartnerStatus[]).map((status) => (
              <div key={status} className="flex items-center gap-2">
                <Badge className={`${STATUS_CONFIG[status].bgColor} ${STATUS_CONFIG[status].color} border-0`}>
                  {status}
                </Badge>
                <div className="text-sm">
                  <div className="font-medium">{STATUS_CONFIG[status].label}</div>
                  <div className="text-xs text-muted-foreground">{STATUS_CONFIG[status].description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Response Tracking Grid */}
      {selectedProtocol && selectedTouchpoint && (
        <Card>
          <CardHeader>
            <CardTitle>Response Status by Site & Partner Type</CardTitle>
            <CardDescription>
              Click any cell to view partner details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : trackingData && trackingData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold bg-gray-50">Site/Group</th>
                      <th className="text-left p-3 font-semibold bg-gray-50">Partner Type</th>
                      {(Object.keys(STATUS_CONFIG) as PartnerStatus[]).map((status) => (
                        <th key={status} className="text-center p-3 font-semibold bg-gray-50 min-w-[80px]">
                          {status}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trackingData.map((row: GridRow, idx: number) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{row.groupName}</td>
                        <td className="p-3 text-muted-foreground">{row.partnerType}</td>
                        {(Object.keys(STATUS_CONFIG) as PartnerStatus[]).map((status) => {
                          const count = row.statuses[status] || 0;
                          const percentage = row.total > 0 ? Math.round((count / row.total) * 100) : 0;
                          
                          return (
                            <td
                              key={status}
                              className={`p-3 text-center cursor-pointer transition-colors ${STATUS_CONFIG[status].bgColor}`}
                              title={`${STATUS_CONFIG[status].label}: ${count} (${percentage}%)`}
                            >
                              <div className="font-semibold">{count}</div>
                              {count > 0 && (
                                <div className="text-xs text-muted-foreground">{percentage}%</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 bg-gray-100 font-semibold">
                      <td className="p-3" colSpan={2}>Total</td>
                      {(Object.keys(STATUS_CONFIG) as PartnerStatus[]).map((status) => {
                        const total = trackingData.reduce((sum: number, row: GridRow) => sum + (row.statuses[status] || 0), 0);
                        return (
                          <td key={status} className="p-3 text-center">
                            {total}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No data available for the selected protocol and touchpoint.</p>
                <p className="text-sm mt-2">Try selecting a different combination or add partners to this campaign.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedProtocol && !selectedTouchpoint && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select Protocol and Touchpoint</p>
              <p className="text-sm mt-2">Choose a protocol and touchpoint from the filters above to view the response tracking dashboard.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
