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

interface EnterpriseGridModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnterpriseGridModal({ isOpen, onClose }: EnterpriseGridModalProps) {
  const [filters, setFilters] = useState({
    name: "",
    country: "",
    license: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    enterpriseId: number;
  } | null>(null);

  const { data: enterprises = [], isLoading } = trpc.enterprises.list.useQuery(undefined, {
    enabled: isOpen,
  });

  if (!isOpen) return null;

  // Apply filters
  const filteredEnterprises = enterprises.filter((enterprise) => {
    const matchesName = !filters.name || 
      enterprise.companyName?.toLowerCase().includes(filters.name.toLowerCase()) ||
      enterprise.instanceName?.toLowerCase().includes(filters.name.toLowerCase());
    
    // For now, we don't have country/license in the data, so we'll skip those filters
    return matchesName;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEnterprises.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEnterprises = filteredEnterprises.slice(startIndex, startIndex + itemsPerPage);

  const handleExportToExcel = () => {
    // Prepare data for export
    const exportData = filteredEnterprises.map((enterprise) => ({
      "ID": enterprise.id,
      "Enterprise Name": enterprise.companyName || enterprise.instanceName || "",
      "Description": enterprise.description || "",
      "License": enterprise.subscriptionType === 1 ? "Paid" : "Trial",
      "Partner Max": enterprise.partnerMax || 0,
      "Start Date": enterprise.licenseStartDate ? new Date(enterprise.licenseStartDate).toLocaleDateString() : "",
      "End Date": enterprise.licenseEndDate ? new Date(enterprise.licenseEndDate).toLocaleDateString() : "",
      "Users": enterprise.userMax || 0,
      "Status": enterprise.active ? "Active" : "Inactive",
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 8 },  // ID
      { wch: 30 }, // Enterprise Name
      { wch: 30 }, // Description
      { wch: 10 }, // License
      { wch: 12 }, // Partner Max
      { wch: 12 }, // Start Date
      { wch: 12 }, // End Date
      { wch: 8 },  // Users
      { wch: 10 }, // Status
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Enterprises");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Enterprises_${timestamp}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
  };

  const handleFilterChange = (column: string, value: string) => {
    setFilters((prev) => ({ ...prev, [column]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleContextMenu = (e: React.MouseEvent, enterpriseId: number) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      enterpriseId,
    });
  };

  const handleEdit = (enterpriseId: number) => {
    toast.info(`Edit enterprise ${enterpriseId}`);
    // TODO: Open edit dialog
  };

  const handleDelete = (enterpriseId: number) => {
    toast.error(`Delete enterprise ${enterpriseId}`);
    // TODO: Implement delete with confirmation
  };

  const handleArchive = (enterpriseId: number) => {
    toast.info(`Archive enterprise ${enterpriseId}`);
    // TODO: Implement archive
  };

  const handleViewDetails = (enterpriseId: number) => {
    toast.info(`View details for enterprise ${enterpriseId}`);
    // TODO: Open details view
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
            <h2 className="text-xl font-semibold text-gray-900">Enterprise View</h2>
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
                          <div>Enterprise Name</div>
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
                          <div>Country</div>
                          <Input
                            placeholder="Filter..."
                            value={filters.country}
                            onChange={(e) => handleFilterChange("country", e.target.value)}
                            className="h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="space-y-2">
                          <div>License</div>
                          <Input
                            placeholder="Filter..."
                            value={filters.license}
                            onChange={(e) => handleFilterChange("license", e.target.value)}
                            className="h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">Partner Max</TableHead>
                      <TableHead className="font-semibold">Start Date</TableHead>
                      <TableHead className="font-semibold">End Date</TableHead>
                      <TableHead className="font-semibold">Users</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEnterprises.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                          {filters.name || filters.country || filters.license
                            ? "No enterprises found matching your filters"
                            : "No enterprises yet"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedEnterprises.map((enterprise) => (
                        <TableRow 
                          key={enterprise.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onContextMenu={(e) => handleContextMenu(e, enterprise.id)}
                        >
                          <TableCell className="font-medium">
                            {enterprise.companyName || enterprise.instanceName}
                          </TableCell>
                          <TableCell>
                            <span className="text-gray-600">US</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Paid
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <button className="text-blue-600 hover:underline font-medium">
                              500
                            </button>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            2024-01-01
                          </TableCell>
                          <TableCell className="text-gray-600">
                            2029-01-01
                          </TableCell>
                          <TableCell>
                            <button className="text-blue-600 hover:underline font-medium">
                              25
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
              Displaying items {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredEnterprises.length)} of {filteredEnterprises.length}
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
            () => handleEdit(contextMenu.enterpriseId),
            () => handleDelete(contextMenu.enterpriseId),
            () => handleArchive(contextMenu.enterpriseId),
            () => handleViewDetails(contextMenu.enterpriseId)
          )}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
