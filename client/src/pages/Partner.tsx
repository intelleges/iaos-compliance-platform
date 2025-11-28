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

export default function Partner() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    internalId: "",
    dunsNumber: "",
    firstName: "",
    lastName: "",
    phone: "",
    enterpriseId: user?.enterpriseId || 0,
  });

  const utils = trpc.useUtils();
  
  // Fetch enterprises for dropdown (admin only)
  const { data: enterprises } = trpc.enterprises.list.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  
  const { data: partners, isLoading } = trpc.partners.list.useQuery(
    user?.role === "admin" ? {} : undefined
  );
  
  const createMutation = trpc.partners.create.useMutation({
    onSuccess: () => {
      utils.partners.list.invalidate();
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Partner created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create partner");
    },
  });
  
  const updateMutation = trpc.partners.update.useMutation({
    onSuccess: () => {
      utils.partners.list.invalidate();
      setIsEditDialogOpen(false);
      resetForm();
      toast.success("Partner updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update partner");
    },
  });
  
  const archiveMutation = trpc.partners.archive.useMutation({
    onSuccess: () => {
      utils.partners.list.invalidate();
      toast.success("Partner archived successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to archive partner");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      internalId: "",
      dunsNumber: "",
      firstName: "",
      lastName: "",
      phone: "",
      enterpriseId: user?.enterpriseId || 0,
    });
    setSelectedPartner(null);
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedPartner) return;
    updateMutation.mutate({
      id: selectedPartner.id,
      ...formData,
    });
  };

  const handleEdit = (partner: any) => {
    setSelectedPartner(partner);
    setFormData({
      name: partner.name || "",
      email: partner.email || "",
      internalId: partner.internalId || "",
      dunsNumber: partner.dunsNumber || "",
      firstName: partner.firstName || "",
      lastName: partner.lastName || "",
      phone: partner.phone || "",
      enterpriseId: partner.enterpriseId,
    });
    setIsEditDialogOpen(true);
  };

  const handleArchive = (id: number) => {
    if (confirm("Are you sure you want to archive this partner?")) {
      archiveMutation.mutate({ id });
    }
  };

  // Filter partners by search term
  const filteredPartners = partners?.filter((partner) =>
    partner.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.internalId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.dunsNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage);
  const paginatedPartners = filteredPartners.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Get enterprise name by ID
  const getEnterpriseName = (enterpriseId: number) => {
    const enterprise = enterprises?.find((e) => e.id === enterpriseId);
    return enterprise?.description || `Enterprise ${enterpriseId}`;
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Partner</h1>
            <p className="text-gray-600 mt-1">Manage supplier and partner records</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Partner
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search partners by name, email, internal ID, or DUNS..."
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
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Internal ID</TableHead>
                    <TableHead>DUNS</TableHead>
                    {user?.role === "admin" && <TableHead>Enterprise</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPartners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={user?.role === "admin" ? 9 : 8} className="text-center text-gray-500 py-8">
                        {searchTerm ? "No partners found matching your search" : "No partners yet"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPartners.map((partner) => (
                      <TableRow key={partner.id}>
                        <TableCell className="font-medium">{partner.id}</TableCell>
                        <TableCell>{partner.name || "—"}</TableCell>
                        <TableCell>
                          {partner.firstName || partner.lastName
                            ? `${partner.firstName || ""} ${partner.lastName || ""}`.trim()
                            : "—"}
                        </TableCell>
                        <TableCell>{partner.email || "—"}</TableCell>
                        <TableCell>{partner.internalId || "—"}</TableCell>
                        <TableCell>{partner.dunsNumber || "—"}</TableCell>
                        {user?.role === "admin" && (
                          <TableCell>{getEnterpriseName(partner.enterpriseId)}</TableCell>
                        )}
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              partner.active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {partner.active ? "Active" : "Archived"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(partner)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleArchive(partner.id)}
                              disabled={!partner.active}
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
                    {Math.min(page * itemsPerPage, filteredPartners.length)} of{" "}
                    {filteredPartners.length} results
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Partner</DialogTitle>
              <DialogDescription>
                Create a new partner/supplier record.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              {user?.role === "admin" && (
                <div className="col-span-2 space-y-2">
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
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Contact first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Contact last name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="internalId">Internal ID</Label>
                <Input
                  id="internalId"
                  value={formData.internalId}
                  onChange={(e) => setFormData({ ...formData, internalId: e.target.value })}
                  placeholder="Your internal supplier ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dunsNumber">DUNS Number</Label>
                <Input
                  id="dunsNumber"
                  value={formData.dunsNumber}
                  onChange={(e) => setFormData({ ...formData, dunsNumber: e.target.value })}
                  placeholder="9-digit DUNS"
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Partner</DialogTitle>
              <DialogDescription>
                Update partner/supplier information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              {user?.role === "admin" && (
                <div className="col-span-2 space-y-2">
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
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-name">Company Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Contact first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Contact last name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-internalId">Internal ID</Label>
                <Input
                  id="edit-internalId"
                  value={formData.internalId}
                  onChange={(e) => setFormData({ ...formData, internalId: e.target.value })}
                  placeholder="Your internal supplier ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dunsNumber">DUNS Number</Label>
                <Input
                  id="edit-dunsNumber"
                  value={formData.dunsNumber}
                  onChange={(e) => setFormData({ ...formData, dunsNumber: e.target.value })}
                  placeholder="9-digit DUNS"
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
