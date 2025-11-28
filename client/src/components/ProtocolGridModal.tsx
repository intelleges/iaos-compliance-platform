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

interface ProtocolGridModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProtocolGridModal({ isOpen, onClose }: ProtocolGridModalProps) {
  const [filters, setFilters] = useState({
    name: "",
    abbreviation: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    protocolId: number;
  } | null>(null);

  // Get first enterprise to pass to protocols.list
  const { data: enterprises = [] } = trpc.enterprises.list.useQuery(undefined, {
    enabled: isOpen,
  });
  
  const enterpriseId = enterprises[0]?.id || 1;

  const { data: protocols = [], isLoading } = trpc.protocols.list.useQuery(
    { enterpriseId },
    { enabled: isOpen && !!enterpriseId }
  );

  if (!isOpen) return null;

  // Apply filters
  const filteredProtocols = protocols.filter((protocol) => {
    const matchesName = !filters.name || 
      protocol.name?.toLowerCase().includes(filters.name.toLowerCase());
    
    const matchesAbbreviation = !filters.abbreviation || 
      protocol.abbreviation?.toLowerCase().includes(filters.abbreviation.toLowerCase());
    
    return matchesName && matchesAbbreviation;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProtocols.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProtocols = filteredProtocols.slice(startIndex, startIndex + itemsPerPage);

  const handleExportToExcel = () => {
    // Prepare data for export
    const exportData = filteredProtocols.map((protocol) => ({
      "ID": protocol.id,
      "Protocol Name": protocol.name || "",
      "Abbreviation": protocol.abbreviation || "",
      "Description": protocol.description || "",
      "Category": "General",
      "Status": protocol.active ? "Active" : "Inactive",
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 8 },  // ID
      { wch: 35 }, // Protocol Name
      { wch: 15 }, // Abbreviation
      { wch: 50 }, // Description
      { wch: 15 }, // Category
      { wch: 10 }, // Status
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Protocols");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Protocols_${timestamp}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
  };

  const handleFilterChange = (column: string, value: string) => {
    setFilters((prev) => ({ ...prev, [column]: value }));
    setCurrentPage(1);
  };

  const handleContextMenu = (e: React.MouseEvent, protocolId: number) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      protocolId,
    });
  };

  const handleEdit = (protocolId: number) => {
    toast.info(`Edit protocol ${protocolId}`);
  };

  const handleDelete = (protocolId: number) => {
    toast.error(`Delete protocol ${protocolId}`);
  };

  const handleArchive = (protocolId: number) => {
    toast.info(`Archive protocol ${protocolId}`);
  };

  const handleViewDetails = (protocolId: number) => {
    toast.info(`View details for protocol ${protocolId}`);
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
          className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Protocol View</h2>
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
                          <div>Protocol Name</div>
                          <Input
                            placeholder="Filter..."
                            value={filters.name}
                            onChange={(e) => handleFilterChange("name", e.target.value)}
                            className="h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="space-y-2">
                          <div>Abbreviation</div>
                          <Input
                            placeholder="Filter..."
                            value={filters.abbreviation}
                            onChange={(e) => handleFilterChange("abbreviation", e.target.value)}
                            className="h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="space-y-2">
                          <div>Description</div>
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
                          <div>Category</div>
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
                      <TableHead className="font-semibold">
                        <div className="space-y-2">
                          <div>Touchpoints</div>
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
                    {paginatedProtocols.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                          {filters.name || filters.abbreviation
                            ? "No protocols found matching your filters"
                            : "No protocols yet"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedProtocols.map((protocol) => (
                        <TableRow 
                          key={protocol.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onContextMenu={(e) => handleContextMenu(e, protocol.id)}
                        >
                          <TableCell className="font-medium">
                            {protocol.id}
                          </TableCell>
                          <TableCell className="font-medium">
                            {protocol.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              {protocol.abbreviation || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600 max-w-xs truncate">
                            {protocol.description || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              General
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={protocol.active ? "default" : "secondary"}>
                              {protocol.active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <button className="text-blue-600 hover:underline font-medium">
                              View
                            </button>
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
              Displaying items {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredProtocols.length)} of {filteredProtocols.length}
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
            () => handleEdit(contextMenu.protocolId),
            () => handleDelete(contextMenu.protocolId),
            () => handleArchive(contextMenu.protocolId),
            () => handleViewDetails(contextMenu.protocolId)
          )}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
