import { useState } from "react";
import * as XLSX from "xlsx";
import ContextMenu, { getStandardContextMenuItems } from "./ContextMenu";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Download, Upload } from "lucide-react";
import { PartnerBatchUploadDialog } from "./PartnerBatchUploadDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface PartnerGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilters?: {
    group?: string;
    partnerType?: string;
    status?: string;
  };
}

export default function PartnerGridModal({ isOpen, onClose, initialFilters }: PartnerGridModalProps) {
  const [filters, setFilters] = useState({
    name: "",
    type: initialFilters?.partnerType || "",
    group: initialFilters?.group || "",
  });

  // Update filters when modal opens with initialFilters
  useState(() => {
    if (isOpen && initialFilters) {
      setFilters({
        name: "",
        type: initialFilters.partnerType || "",
        group: initialFilters.group || "",
      });
    }
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    partnerId: number;
  } | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const utils = trpc.useUtils();

  const { data: partners = [], isLoading } = trpc.partners.list.useQuery(undefined, {
    enabled: isOpen,
  });

  if (!isOpen) return null;

  // Apply filters
  const filteredPartners = partners.filter((partner) => {
    const matchesName = !filters.name || 
      partner.name?.toLowerCase().includes(filters.name.toLowerCase());
    
    const matchesType = !filters.type || 
      partner.partnerTypeId?.toString().includes(filters.type);
    
    // Group filter - partners don't have groupId, skip for now
    const matchesGroup = !filters.group;
    
    return matchesName && matchesType && matchesGroup;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPartners = filteredPartners.slice(startIndex, startIndex + itemsPerPage);

  const handleExportToExcel = () => {
    // Prepare data for export
    const exportData = filteredPartners.map((partner) => ({
      "ID": partner.id,
      "Partner Name": partner.name || "",
      "CAGE Code": partner.cageCode || "",
      "DUNS Number": partner.dunsNumber || "",
      "Federal ID": partner.federalId || "",
      "Partner Type": partner.partnerTypeId ? `Type ${partner.partnerTypeId}` : "",
      "City": partner.city || "",
      "State": partner.state || "",
      "Zipcode": partner.zipcode || "",
      "Contact Name": `${partner.firstName || ""} ${partner.lastName || ""}`.trim(),
      "Email": partner.email || "",
      "Phone": partner.phone || "",
      "Status": partner.active ? "Active" : "Inactive",
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 8 },  // ID
      { wch: 30 }, // Partner Name
      { wch: 12 }, // CAGE Code
      { wch: 15 }, // DUNS Number
      { wch: 15 }, // Federal ID
      { wch: 15 }, // Partner Type
      { wch: 15 }, // City
      { wch: 10 }, // State
      { wch: 10 }, // Zipcode
      { wch: 25 }, // Contact Name
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 10 }, // Status
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Partners");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Partners_${timestamp}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
  };

  const handleFilterChange = (column: string, value: string) => {
    setFilters((prev) => ({ ...prev, [column]: value }));
    setCurrentPage(1);
  };

  const handleContextMenu = (e: React.MouseEvent, partnerId: number) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      partnerId,
    });
  };

  const handleEdit = (partnerId: number) => {
    toast.info(`Edit partner ${partnerId}`);
  };

  const handleDelete = (partnerId: number) => {
    toast.error(`Delete partner ${partnerId}`);
  };

  const handleArchive = (partnerId: number) => {
    toast.info(`Archive partner ${partnerId}`);
  };

  const handleViewDetails = (partnerId: number) => {
    toast.info(`View details for partner ${partnerId}`);
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
            <h2 className="text-xl font-semibold text-gray-900">Partner View</h2>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowUploadDialog(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Partners
              </Button>
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
                          <div>Partner Name</div>
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
                          <div>CAGE Code</div>
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
                          <div>Partner Type</div>
                          <Input
                            placeholder="Filter..."
                            value={filters.type}
                            onChange={(e) => handleFilterChange("type", e.target.value)}
                            className="h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="space-y-2">
                          <div>Group</div>
                          <Input
                            placeholder="Filter..."
                            value={filters.group}
                            onChange={(e) => handleFilterChange("group", e.target.value)}
                            className="h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
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
                          <div>Contact</div>
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
                    {paginatedPartners.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                          {filters.name || filters.type || filters.group
                            ? "No partners found matching your filters"
                            : "No partners yet"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedPartners.map((partner) => (
                        <TableRow 
                          key={partner.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onContextMenu={(e) => handleContextMenu(e, partner.id)}
                        >
                          <TableCell className="font-medium">
                            {partner.id}
                          </TableCell>
                          <TableCell className="font-medium">
                            {partner.name}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {partner.cageCode || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {partner.partnerTypeId ? `Type ${partner.partnerTypeId}` : "—"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              —
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={partner.active ? "default" : "secondary"}>
                              {partner.active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            <button className="text-blue-600 hover:underline">
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
              Displaying items {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredPartners.length)} of {filteredPartners.length}
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
            () => handleEdit(contextMenu.partnerId),
            () => handleDelete(contextMenu.partnerId),
            () => handleArchive(contextMenu.partnerId),
            () => handleViewDetails(contextMenu.partnerId)
          )}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Partner Batch Upload Dialog */}
      <PartnerBatchUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSuccess={() => {
          utils.partners.list.invalidate();
          toast.success('Partners imported successfully');
        }}
      />
    </>
  );
}
