import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Plus, Search, Edit, Archive, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Enterprise() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEnterprise, setSelectedEnterprise] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    description: "",
    companyName: "",
    instanceName: "",
  });

  const utils = trpc.useUtils();
  const { data: enterprises, isLoading } = trpc.enterprises.list.useQuery();
  
  const createMutation = trpc.enterprises.create.useMutation({
    onSuccess: () => {
      utils.enterprises.list.invalidate();
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Enterprise created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create enterprise");
    },
  });
  
  const updateMutation = trpc.enterprises.update.useMutation({
    onSuccess: () => {
      utils.enterprises.list.invalidate();
      setIsEditDialogOpen(false);
      resetForm();
      toast.success("Enterprise updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update enterprise");
    },
  });
  
  const archiveMutation = trpc.enterprises.archive.useMutation({
    onSuccess: () => {
      utils.enterprises.list.invalidate();
      toast.success("Enterprise archived successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to archive enterprise");
    },
  });

  const resetForm = () => {
    setFormData({
      description: "",
      companyName: "",
      instanceName: "",
    });
    setSelectedEnterprise(null);
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedEnterprise) return;
    updateMutation.mutate({
      id: selectedEnterprise.id,
      ...formData,
    });
  };

  const handleEdit = (enterprise: any) => {
    setSelectedEnterprise(enterprise);
    setFormData({
      description: enterprise.description || "",
      companyName: enterprise.companyName || "",
      instanceName: enterprise.instanceName || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleArchive = (id: number) => {
    if (confirm("Are you sure you want to archive this enterprise?")) {
      archiveMutation.mutate({ id });
    }
  };

  // Filter enterprises by search term
  const filteredEnterprises = enterprises?.filter((enterprise) =>
    enterprise.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enterprise.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enterprise.instanceName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredEnterprises.length / itemsPerPage);
  const paginatedEnterprises = filteredEnterprises.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enterprise</h1>
            <p className="text-gray-600 mt-1">Manage enterprise records and settings</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Enterprise
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search enterprises..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // Reset to first page on search
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
                    <TableHead>Description</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Instance Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEnterprises.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        {searchTerm ? "No enterprises found matching your search" : "No enterprises yet"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedEnterprises.map((enterprise) => (
                      <TableRow key={enterprise.id}>
                        <TableCell className="font-medium">{enterprise.id}</TableCell>
                        <TableCell>{enterprise.description}</TableCell>
                        <TableCell>{enterprise.companyName || "—"}</TableCell>
                        <TableCell>{enterprise.instanceName || "—"}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              enterprise.active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {enterprise.active ? "Active" : "Archived"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(enterprise)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleArchive(enterprise.id)}
                              disabled={!enterprise.active}
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
                    {Math.min(page * itemsPerPage, filteredEnterprises.length)} of{" "}
                    {filteredEnterprises.length} results
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
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      ))}
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Enterprise</DialogTitle>
              <DialogDescription>
                Create a new enterprise record. All fields are required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instanceName">Instance Name</Label>
                <Input
                  id="instanceName"
                  value={formData.instanceName}
                  onChange={(e) => setFormData({ ...formData, instanceName: e.target.value })}
                  placeholder="Enter instance name"
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
                disabled={!formData.description || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Enterprise</DialogTitle>
              <DialogDescription>
                Update enterprise information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-companyName">Company Name</Label>
                <Input
                  id="edit-companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-instanceName">Instance Name</Label>
                <Input
                  id="edit-instanceName"
                  value={formData.instanceName}
                  onChange={(e) => setFormData({ ...formData, instanceName: e.target.value })}
                  placeholder="Enter instance name"
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
                disabled={!formData.description || updateMutation.isPending}
              >
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
