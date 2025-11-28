import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Plus, Search, Edit, Archive, Loader2, Calendar, Upload } from "lucide-react";
import { useState } from "react";
import { AssignmentBatchUploadDialog } from "@/components/AssignmentBatchUploadDialog";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Touchpoint() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTouchpoint, setSelectedTouchpoint] = useState<any>(null);
  const [showAssignmentUploadDialog, setShowAssignmentUploadDialog] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    abbreviation: "",
    purpose: "",
    protocolId: 0,
    startDate: "",
    endDate: "",
    target: 0,
    automaticReminder: false,
  });

  const utils = trpc.useUtils();
  
  // Fetch protocols for dropdown
  const { data: protocols } = trpc.protocols.list.useQuery(
    user?.role === "admin" ? {} : undefined
  );
  
  const { data: touchpoints, isLoading } = trpc.touchpoints.list.useQuery(
    user?.role === "admin" ? {} : undefined
  );
  
  const createMutation = trpc.touchpoints.create.useMutation({
    onSuccess: () => {
      utils.touchpoints.list.invalidate();
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Touchpoint created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create touchpoint");
    },
  });
  
  const updateMutation = trpc.touchpoints.update.useMutation({
    onSuccess: () => {
      utils.touchpoints.list.invalidate();
      setIsEditDialogOpen(false);
      resetForm();
      toast.success("Touchpoint updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update touchpoint");
    },
  });
  
  const archiveMutation = trpc.touchpoints.archive.useMutation({
    onSuccess: () => {
      utils.touchpoints.list.invalidate();
      toast.success("Touchpoint archived successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to archive touchpoint");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      abbreviation: "",
      purpose: "",
      protocolId: 0,
      startDate: "",
      endDate: "",
      target: 0,
      automaticReminder: false,
    });
    setSelectedTouchpoint(null);
  };

  const handleCreate = () => {
    const payload = {
      ...formData,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
    };
    createMutation.mutate(payload);
  };

  const handleUpdate = () => {
    if (!selectedTouchpoint) return;
    const payload = {
      id: selectedTouchpoint.id,
      ...formData,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
    };
    updateMutation.mutate(payload);
  };

  const handleEdit = (touchpoint: any) => {
    setSelectedTouchpoint(touchpoint);
    setFormData({
      title: touchpoint.title || "",
      description: touchpoint.description || "",
      abbreviation: touchpoint.abbreviation || "",
      purpose: touchpoint.purpose || "",
      protocolId: touchpoint.protocolId || 0,
      startDate: touchpoint.startDate ? new Date(touchpoint.startDate).toISOString().split('T')[0] : "",
      endDate: touchpoint.endDate ? new Date(touchpoint.endDate).toISOString().split('T')[0] : "",
      target: touchpoint.target || 0,
      automaticReminder: touchpoint.automaticReminder || false,
    });
    setIsEditDialogOpen(true);
  };

  const handleArchive = (id: number) => {
    if (confirm("Are you sure you want to archive this touchpoint?")) {
      archiveMutation.mutate({ id });
    }
  };

  // Filter touchpoints by search term
  const filteredTouchpoints = touchpoints?.filter((touchpoint) =>
    touchpoint.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    touchpoint.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    touchpoint.abbreviation?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredTouchpoints.length / itemsPerPage);
  const paginatedTouchpoints = filteredTouchpoints.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Get protocol name by ID
  const getProtocolName = (protocolId: number | null) => {
    if (!protocolId) return "—";
    const protocol = protocols?.find((p) => p.id === protocolId);
    return protocol?.name || `Protocol ${protocolId}`;
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Touchpoint</h1>
            <p className="text-gray-600 mt-1">Manage supplier interaction touchpoints and schedules</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowAssignmentUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import Assignments
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Touchpoint
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search touchpoints by title, description, or abbreviation..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Protocol</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTouchpoints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                        {searchTerm ? "No touchpoints found matching your search" : "No touchpoints yet"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTouchpoints.map((touchpoint) => (
                      <TableRow key={touchpoint.id}>
                        <TableCell className="font-medium">{touchpoint.id}</TableCell>
                        <TableCell className="font-medium">{touchpoint.title || "—"}</TableCell>
                        <TableCell>{getProtocolName(touchpoint.protocolId)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{formatDate(touchpoint.startDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{formatDate(touchpoint.endDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{touchpoint.target || "—"}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              touchpoint.active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {touchpoint.active ? "Active" : "Archived"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(touchpoint)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleArchive(touchpoint.id)}
                              disabled={!touchpoint.active}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {(page - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(page * itemsPerPage, filteredTouchpoints.length)} of{" "}
                    {filteredTouchpoints.length} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Touchpoint</DialogTitle>
              <DialogDescription>
                Create a new supplier interaction touchpoint with scheduling.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="protocolId">Protocol *</Label>
                <Select
                  value={formData.protocolId.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, protocolId: parseInt(value) })
                  }
                >
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
                <Label htmlFor="title">Touchpoint Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Q1 2025 Supplier Survey"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="abbreviation">Abbreviation</Label>
                <Input
                  id="abbreviation"
                  value={formData.abbreviation}
                  onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                  placeholder="e.g., Q1-2025"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this touchpoint"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="Purpose and objectives"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Target Response Count</Label>
                <Input
                  id="target"
                  type="number"
                  value={formData.target || ""}
                  onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) || 0 })}
                  placeholder="Expected number of responses"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.title || !formData.protocolId || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Touchpoint</DialogTitle>
              <DialogDescription>
                Update touchpoint information and schedule.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-protocolId">Protocol *</Label>
                <Select
                  value={formData.protocolId.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, protocolId: parseInt(value) })
                  }
                >
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
                <Label htmlFor="edit-title">Touchpoint Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Q1 2025 Supplier Survey"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-abbreviation">Abbreviation</Label>
                <Input
                  id="edit-abbreviation"
                  value={formData.abbreviation}
                  onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                  placeholder="e.g., Q1-2025"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this touchpoint"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-purpose">Purpose</Label>
                <Textarea
                  id="edit-purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="Purpose and objectives"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endDate">End Date</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-target">Target Response Count</Label>
                <Input
                  id="edit-target"
                  type="number"
                  value={formData.target || ""}
                  onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) || 0 })}
                  placeholder="Expected number of responses"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={!formData.title || !formData.protocolId || updateMutation.isPending}
              >
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assignment Batch Upload Dialog */}
        <AssignmentBatchUploadDialog
          open={showAssignmentUploadDialog}
          onOpenChange={setShowAssignmentUploadDialog}
          onSuccess={() => {
            toast.success('Assignments imported successfully');
            // Refresh touchpoints if needed
            utils.touchpoint.list.invalidate();
          }}
        />
      </div>
    </DashboardLayout>
  );
}
