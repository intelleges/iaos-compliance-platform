import { useState } from "react";
import * as XLSX from "xlsx";
import ContextMenu, { getStandardContextMenuItems } from "./ContextMenu";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TouchpointGridModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TouchpointGridModal({ isOpen, onClose }: TouchpointGridModalProps) {
  const [filters, setFilters] = useState({
    title: "",
    protocol: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    touchpointId: number;
  } | null>(null);

  const { data: touchpoints = [], isLoading } = trpc.touchpoints.list.useQuery(undefined, {
    enabled: isOpen,
  });

  if (!isOpen) return null;

  // Apply filters
  const filteredTouchpoints = touchpoints.filter((touchpoint) => {
    const matchesTitle = !filters.title || 
      touchpoint.title?.toLowerCase().includes(filters.title.toLowerCase());
    
    const matchesProtocol = !filters.protocol || 
      touchpoint.protocolId?.toString().includes(filters.protocol);
    
    return matchesTitle && matchesProtocol;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTouchpoints.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTouchpoints = filteredTouchpoints.slice(startIndex, startIndex + itemsPerPage);

  const handleExportToExcel = () => {
    // Prepare data for export
    const exportData = filteredTouchpoints.map((touchpoint) => ({
      "ID": touchpoint.id,
      "Title": touchpoint.title || "",
      "Protocol": touchpoint.protocolId ? `Protocol ${touchpoint.protocolId}` : "",
      "Start Date": touchpoint.startDate ? new Date(touchpoint.startDate).toLocaleDateString() : "",
      "End Date": touchpoint.endDate ? new Date(touchpoint.endDate).toLocaleDateString() : "",
      "Target": touchpoint.target || 0,
      "Reminders": touchpoint.automaticReminder ? "Enabled" : "Disabled",
      "Status": touchpoint.active ? "Active" : "Inactive",
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 8 },  // ID
      { wch: 35 }, // Title
      { wch: 25 }, // Protocol
      { wch: 12 }, // Start Date
      { wch: 12 }, // End Date
      { wch: 10 }, // Target
      { wch: 12 }, // Reminders
      { wch: 10 }, // Status
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Touchpoints");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Touchpoints_${timestamp}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
  };

  const handleFilterChange = (column: string, value: string) => {
    setFilters((prev) => ({ ...prev, [column]: value }));
    setCurrentPage(1);
  };

  const handleContextMenu = (e: React.MouseEvent, touchpointId: number) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      touchpointId,
    });
  };

  const handleEdit = (touchpointId: number) => {
    toast.info(`Edit touchpoint ${touchpointId}`);
  };

  const handleDelete = (touchpointId: number) => {
    toast.error(`Delete touchpoint ${touchpointId}`);
  };

  const handleArchive = (touchpointId: number) => {
    toast.info(`Archive touchpoint ${touchpointId}`);
  };

  const handleViewDetails = (touchpointId: number) => {
    toast.info(`View details for touchpoint ${touchpointId}`);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  };

  return (
    <>
      {/* Dark Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Touchpoint View</h2>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleExportToExcel}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export to Excel
              </Button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Grid Content */}
          <div className="flex-1 overflow-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">
                        <div className="space-y-2">
                          <div>ID</div>
                          <Input
                            placeholder="Filter..."
                            className="h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                            disabled
                          />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="space-y-2">
                          <div>Title</div>
                          <Input
                            placeholder="Filter..."
                            value={filters.title}
                            onChange={(e) => handleFilterChange("title", e.target.value)}
                            className="h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="space-y-2">
                          <div>Protocol</div>
                          <Input
                            placeholder="Filter..."
                            value={filters.protocol}
                            onChange={(e) => handleFilterChange("protocol", e.target.value)}
                            className="h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="space-y-2">
                          <div>Start Date</div>
                          <Input
                            placeholder="Filter..."
                            className="h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                            disabled
                          />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="space-y-2">
                          <div>End Date</div>
                          <Input
                            placeholder="Filter..."
                            className="h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                            disabled
                          />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="space-y-2">
                          <div>Target</div>
                          <Input
                            placeholder="Filter..."
                            className="h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                            disabled
                          />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="space-y-2">
                          <div>Reminders</div>
                          <Input
                            placeholder="Filter..."
                            className="h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                            disabled
                          />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="space-y-2">
                          <div>Status</div>
                          <Input
                            placeholder="Filter..."
                            className="h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                            disabled
                          />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTouchpoints.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                          {filters.title || filters.protocol
                            ? "No touchpoints found matching your filters"
                            : "No touchpoints yet"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedTouchpoints.map((touchpoint) => (
                        <TableRow 
                          key={touchpoint.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onContextMenu={(e) => handleContextMenu(e, touchpoint.id)}
                        >
                          <TableCell className="font-medium">
                            {touchpoint.id}
                          </TableCell>
                          <TableCell className="font-medium">
                            {touchpoint.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              Protocol {touchpoint.protocolId}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {formatDate(touchpoint.startDate)}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {formatDate(touchpoint.endDate)}
                          </TableCell>
                          <TableCell>
                            <button className="text-blue-600 hover:underline font-medium">
                              {touchpoint.target || 0}
                            </button>
                          </TableCell>
                          <TableCell>
                            <Badge variant={touchpoint.automaticReminder ? "default" : "secondary"}>
                              {touchpoint.automaticReminder ? "Enabled" : "Disabled"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={touchpoint.active ? "default" : "secondary"}>
                              {touchpoint.active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Footer with Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Displaying items {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredTouchpoints.length)} of {filteredTouchpoints.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="First page"
              >
                ««
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                title="Previous page"
              >
                «
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="min-w-[2.5rem]"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                title="Next page"
              >
                »
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                title="Last page"
              >
                »»
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getStandardContextMenuItems(
            () => handleEdit(contextMenu.touchpointId),
            () => handleDelete(contextMenu.touchpointId),
            () => handleArchive(contextMenu.touchpointId),
            () => handleViewDetails(contextMenu.touchpointId)
          )}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
