import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw, ChevronLeft, ChevronRight, Shield, User, Activity, Database } from "lucide-react";
import { toast } from "sonner";

export default function AuditLogViewer() {
  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Filter state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedAction, setSelectedAction] = useState<string | undefined>();
  const [selectedEntityType, setSelectedEntityType] = useState<string | undefined>();
  const [cuiFilter, setCuiFilter] = useState<boolean | undefined>();
  const [ipSearch, setIpSearch] = useState("");

  // Expanded row state
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Queries
  const { data: logsData, isLoading, refetch } = trpc.audit.getLogs.useQuery({
    limit: pageSize,
    offset: page * pageSize,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    actions: selectedAction ? [selectedAction] : undefined,
    entityType: selectedEntityType || undefined,
    isCUIAccess: cuiFilter,
    ipAddress: ipSearch || undefined,
  });

  const { data: stats } = trpc.audit.getStats.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const exportMutation = trpc.audit.exportLogs.useMutation({
    onSuccess: (data) => {
      // Create download link
      const blob = new Blob([data.data], { 
        type: data.format === "csv" ? "text/csv" : "application/json" 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${logsData?.total || 0} audit logs`);
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  const handleExport = (format: "csv" | "json") => {
    exportMutation.mutate({
      format,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      actions: selectedAction ? [selectedAction] : undefined,
      isCUIAccess: cuiFilter,
    });
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Audit logs refreshed");
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedAction(undefined);
    setSelectedEntityType(undefined);
    setCuiFilter(undefined);
    setIpSearch("");
    setPage(0);
  };

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes("FAILED") || action.includes("REJECTED") || action.includes("DELETED")) {
      return "destructive";
    }
    if (action.includes("SUCCESS") || action.includes("APPROVED") || action.includes("CREATED")) {
      return "default";
    }
    if (action.includes("CUI")) {
      return "secondary";
    }
    return "outline";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Log Viewer</h1>
            <p className="text-gray-600 mt-1">
              Compliance audit trail per INT.DOC.25 (10-year retention)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => handleExport("csv")}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport("json")}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold">{stats.totalEvents.toLocaleString()}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">CUI Access</p>
                  <p className="text-2xl font-bold">{stats.cuiEvents.toLocaleString()}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Unique Users</p>
                  <p className="text-2xl font-bold">{stats.uniqueUsers.toLocaleString()}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Database className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Auth Events</p>
                  <p className="text-2xl font-bold">{stats.authEvents.toLocaleString()}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Action</label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All actions</SelectItem>
                  <SelectItem value="LOGIN_SUCCESS">Login Success</SelectItem>
                  <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
                  <SelectItem value="PARTNER_CREATED">Partner Created</SelectItem>
                  <SelectItem value="TOUCHPOINT_UPDATED">Touchpoint Updated</SelectItem>
                  <SelectItem value="SUBMISSION_APPROVED">Submission Approved</SelectItem>
                  <SelectItem value="SUBMISSION_REJECTED">Submission Rejected</SelectItem>
                  <SelectItem value="CUI_ACCESSED">CUI Accessed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Entity Type</label>
              <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All types</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="touchpoint">Touchpoint</SelectItem>
                  <SelectItem value="questionnaire">Questionnaire</SelectItem>
                  <SelectItem value="approval">Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">CUI Access</label>
              <Select 
                value={cuiFilter === undefined ? "__all__" : cuiFilter ? "true" : "false"} 
                onValueChange={(val) => setCuiFilter(val === "__all__" ? undefined : val === "true")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All</SelectItem>
                  <SelectItem value="true">CUI Only</SelectItem>
                  <SelectItem value="false">Non-CUI Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">IP Address</label>
              <Input
                type="text"
                placeholder="Search IP..."
                value={ipSearch}
                onChange={(e) => setIpSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>CUI</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Loading audit logs...
                    </TableCell>
                  </TableRow>
                ) : logsData?.logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logsData?.logs.map((log) => (
                    <>
                      <TableRow 
                        key={log.id} 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                      >
                        <TableCell className="font-mono text-sm">
                          {formatTimestamp(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeColor(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{log.entityType}</div>
                            <div className="text-gray-500">ID: {log.entityId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{log.actorType || "N/A"}</div>
                            {log.actorId && <div className="text-gray-500">ID: {log.actorId}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.ipAddress || "N/A"}
                        </TableCell>
                        <TableCell>
                          {log.isCUIAccess ? (
                            <Badge variant="secondary">
                              <Shield className="h-3 w-3 mr-1" />
                              CUI
                            </Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            {expandedRow === log.id ? "Hide" : "Show"}
                          </Button>
                        </TableCell>
                      </TableRow>
                      
                      {expandedRow === log.id && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-gray-50">
                            <div className="p-4 space-y-2">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Enterprise ID</p>
                                  <p className="text-sm text-gray-900">{log.enterpriseId || "N/A"}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">User Agent</p>
                                  <p className="text-sm text-gray-900 truncate">{log.userAgent || "N/A"}</p>
                                </div>
                              </div>
                              {log.metadata && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-1">Metadata</p>
                                  <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                                    {JSON.stringify(JSON.parse(log.metadata), null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="border-t p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, logsData?.total || 0)} of{" "}
                {logsData?.total || 0} results
              </div>
              <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setPage(0); }}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="text-sm text-gray-600">
                Page {page + 1} of {Math.ceil((logsData?.total || 0) / pageSize)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={!logsData?.hasMore}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
