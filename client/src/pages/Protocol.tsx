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
import { Plus, Search, Edit, Archive, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Protocol() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    abbreviation: "",
    background: "",
    purpose: "",
    summary: "",
    enterpriseId: user?.enterpriseId || 0,
  });

  const utils = trpc.useUtils();
  
  // Fetch enterprises for dropdown (admin only)
  const { data: enterprises } = trpc.enterprises.list.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  
  const { data: protocols, isLoading } = trpc.protocols.list.useQuery(
    user?.role === "admin" ? {} : undefined
  );
  
  const createMutation = trpc.protocols.create.useMutation({
    onSuccess: () => {
      utils.protocols.list.invalidate();
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Protocol created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create protocol");
    },
  });
  
  const updateMutation = trpc.protocols.update.useMutation({
    onSuccess: () => {
      utils.protocols.list.invalidate();
      setIsEditDialogOpen(false);
      resetForm();
      toast.success("Protocol updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update protocol");
    },
  });
  
  const archiveMutation = trpc.protocols.archive.useMutation({
    onSuccess: () => {
      utils.protocols.list.invalidate();
      toast.success("Protocol archived successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to archive protocol");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      abbreviation: "",
      background: "",
      purpose: "",
      summary: "",
      enterpriseId: user?.enterpriseId || 0,
    });
    setSelectedProtocol(null);
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedProtocol) return;
    updateMutation.mutate({
      id: selectedProtocol.id,
      ...formData,
    });
  };

  const handleEdit = (protocol: any) => {
    setSelectedProtocol(protocol);
    setFormData({
      name: protocol.name || "",
      description: protocol.description || "",
      abbreviation: protocol.abbreviation || "",
      background: protocol.background || "",
      purpose: protocol.purpose || "",
      summary: protocol.summary || "",
      enterpriseId: protocol.enterpriseId,
    });
    setIsEditDialogOpen(true);
  };

  const handleArchive = (id: number) => {
    if (confirm("Are you sure you want to archive this protocol?")) {
      archiveMutation.mutate({ id });
    }
  };

  // Filter protocols by search term
  const filteredProtocols = protocols?.filter((protocol) =>
    protocol.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    protocol.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    protocol.abbreviation?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredProtocols.length / itemsPerPage);
  const paginatedProtocols = filteredProtocols.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Get enterprise name by ID
  const getEnterpriseName = (enterpriseId: number | null) => {
    if (!enterpriseId) return "—";
    const enterprise = enterprises?.find((e) => e.id === enterpriseId);
    return enterprise?.description || `Enterprise ${enterpriseId}`;
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Protocol</h1>
            <p className="text-gray-600 mt-1">Manage compliance protocols and campaigns</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Protocol
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search protocols by name, description, or abbreviation..."
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
                    <TableHead>Name</TableHead>
                    <TableHead>Abbreviation</TableHead>
                    <TableHead>Description</TableHead>
                    {user?.role === "admin" && <TableHead>Enterprise</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProtocols.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={user?.role === "admin" ? 7 : 6} className="text-center text-gray-500 py-8">
                        {searchTerm ? "No protocols found matching your search" : "No protocols yet"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProtocols.map((protocol) => (
                      <TableRow key={protocol.id}>
                        <TableCell className="font-medium">{protocol.id}</TableCell>
                        <TableCell className="font-medium">{protocol.name || "—"}</TableCell>
                        <TableCell>{protocol.abbreviation || "—"}</TableCell>
                        <TableCell className="max-w-md truncate">{protocol.description || "—"}</TableCell>
                        {user?.role === "admin" && (
                          <TableCell>{getEnterpriseName(protocol.enterpriseId)}</TableCell>
                        )}
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              protocol.active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {protocol.active ? "Active" : "Archived"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(protocol)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleArchive(protocol.id)}
                              disabled={!protocol.active}
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
                    {Math.min(page * itemsPerPage, filteredProtocols.length)} of{" "}
                    {filteredProtocols.length} results
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
              <DialogTitle>Add Protocol</DialogTitle>
              <DialogDescription>
                Create a new compliance protocol or campaign.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {user?.role === "admin" && (
                <div className="space-y-2">
                  <Label htmlFor="enterpriseId">Enterprise *</Label>
                  <Select
                    value={formData.enterpriseId.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, enterpriseId: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select enterprise" />
                    </SelectTrigger>
                    <SelectContent>
                      {enterprises?.map((enterprise) => (
                        <SelectItem key={enterprise.id} value={enterprise.id.toString()}>
                          {enterprise.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Protocol Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., FAR 52.219-9 Compliance 2025"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="abbreviation">Abbreviation</Label>
                <Input
                  id="abbreviation"
                  value={formData.abbreviation}
                  onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                  placeholder="e.g., FAR-219-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the protocol"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="background">Background</Label>
                <Textarea
                  id="background"
                  value={formData.background}
                  onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                  placeholder="Background information and context"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="Purpose and objectives of this protocol"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Executive summary"
                  rows={3}
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
                disabled={!formData.name || createMutation.isPending}
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
              <DialogTitle>Edit Protocol</DialogTitle>
              <DialogDescription>
                Update protocol information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {user?.role === "admin" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-enterpriseId">Enterprise *</Label>
                  <Select
                    value={formData.enterpriseId.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, enterpriseId: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select enterprise" />
                    </SelectTrigger>
                    <SelectContent>
                      {enterprises?.map((enterprise) => (
                        <SelectItem key={enterprise.id} value={enterprise.id.toString()}>
                          {enterprise.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-name">Protocol Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., FAR 52.219-9 Compliance 2025"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-abbreviation">Abbreviation</Label>
                <Input
                  id="edit-abbreviation"
                  value={formData.abbreviation}
                  onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                  placeholder="e.g., FAR-219-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the protocol"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-background">Background</Label>
                <Textarea
                  id="edit-background"
                  value={formData.background}
                  onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                  placeholder="Background information and context"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-purpose">Purpose</Label>
                <Textarea
                  id="edit-purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="Purpose and objectives of this protocol"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-summary">Summary</Label>
                <Textarea
                  id="edit-summary"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Executive summary"
                  rows={3}
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
                disabled={!formData.name || updateMutation.isPending}
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
