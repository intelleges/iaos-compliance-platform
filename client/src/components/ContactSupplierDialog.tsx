import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MessageSquare, Mail, Phone } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ContactSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  };
  touchpoint?: {
    id: number;
    title: string;
  };
  missingDocuments?: string[];
  poNumber?: string;
  deadline?: Date;
}

export function ContactSupplierDialog({
  open,
  onOpenChange,
  supplier,
  touchpoint,
  missingDocuments = [],
  poNumber,
  deadline,
}: ContactSupplierDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<"whatsapp" | "sms" | "email">("whatsapp");
  const [customMessage, setCustomMessage] = useState("");
  const [accessCodeUrl, setAccessCodeUrl] = useState("");

  const sendWhatsAppMutation = trpc.communication.sendWhatsAppMessage.useMutation({
    onSuccess: () => {
      toast.success("WhatsApp message sent successfully!");
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to send WhatsApp: ${error.message}`);
    },
  });

  const sendSMSMutation = trpc.communication.sendSMSMessage.useMutation({
    onSuccess: () => {
      toast.success("SMS sent successfully!");
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to send SMS: ${error.message}`);
    },
  });

  const sendEmailMutation = trpc.communication.sendEmailReminder.useMutation({
    onSuccess: () => {
      toast.success("Email sent successfully!");
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to send email: ${error.message}`);
    },
  });

  const resetForm = () => {
    setCustomMessage("");
    setAccessCodeUrl("");
    setSelectedMethod("whatsapp");
  };

  const handleSend = () => {
    const supplierName = supplier.firstName && supplier.lastName 
      ? `${supplier.firstName} ${supplier.lastName}`
      : supplier.name;

    // Default deadline to 7 days from now if not provided
    const defaultDeadline = deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const basePayload = {
      partnerId: supplier.id,
      supplierName,
      companyName: supplier.name,
      missingDocuments,
      deadline: defaultDeadline,
      accessCodeUrl: accessCodeUrl || `https://compliance.example.com/partner/login?partner=${supplier.id}`,
      poNumber: poNumber || undefined,
      customMessage: customMessage || undefined,
    };

    if (selectedMethod === "whatsapp") {
      if (!supplier.phone) {
        toast.error("Supplier phone number not available");
        return;
      }
      sendWhatsAppMutation.mutate({
        partnerId: supplier.id,
        supplierPhone: supplier.phone,
        supplierName,
        companyName: supplier.name,
        missingDocuments,
        accessCodeUrl: accessCodeUrl || `https://compliance.example.com/partner/login?partner=${supplier.id}`,
        poNumber,
      });
    } else if (selectedMethod === "sms") {
      if (!supplier.phone) {
        toast.error("Supplier phone number not available");
        return;
      }
      sendSMSMutation.mutate({
        partnerId: supplier.id,
        supplierPhone: supplier.phone,
        supplierName,
        companyName: supplier.name,
        deadline: defaultDeadline,
        accessCodeUrl: accessCodeUrl || `https://compliance.example.com/partner/login?partner=${supplier.id}`,
      });
    } else if (selectedMethod === "email") {
      if (!supplier.email) {
        toast.error("Supplier email not available");
        return;
      }
      sendEmailMutation.mutate({
        partnerId: supplier.id,
        supplierEmail: supplier.email,
        supplierName,
        companyName: supplier.name,
        deadline: defaultDeadline,
        missingDocuments,
        accessCodeUrl: accessCodeUrl || `https://compliance.example.com/partner/login?partner=${supplier.id}`,
        urgency: "urgent",
      });
    }
  };

  const isLoading = sendWhatsAppMutation.isPending || sendSMSMutation.isPending || sendEmailMutation.isPending;

  const supplierContactName = supplier.firstName && supplier.lastName 
    ? `${supplier.firstName} ${supplier.lastName}`
    : supplier.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Contact Supplier - {supplier.name}</DialogTitle>
          <DialogDescription>
            Send urgent compliance request to {supplierContactName}
            {touchpoint && ` for ${touchpoint.title}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Contact Method Selection */}
          <div className="space-y-3">
            <Label>Contact Method</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant={selectedMethod === "whatsapp" ? "default" : "outline"}
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => setSelectedMethod("whatsapp")}
                disabled={!supplier.phone}
              >
                <MessageSquare className="h-5 w-5" />
                <span className="text-sm">WhatsApp</span>
                {!supplier.phone && <span className="text-xs text-muted-foreground">(No phone)</span>}
              </Button>

              <Button
                type="button"
                variant={selectedMethod === "sms" ? "default" : "outline"}
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => setSelectedMethod("sms")}
                disabled={!supplier.phone}
              >
                <Phone className="h-5 w-5" />
                <span className="text-sm">SMS</span>
                {!supplier.phone && <span className="text-xs text-muted-foreground">(No phone)</span>}
              </Button>

              <Button
                type="button"
                variant={selectedMethod === "email" ? "default" : "outline"}
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => setSelectedMethod("email")}
                disabled={!supplier.email}
              >
                <Mail className="h-5 w-5" />
                <span className="text-sm">Email</span>
                {!supplier.email && <span className="text-xs text-muted-foreground">(No email)</span>}
              </Button>
            </div>
          </div>

          {/* Contact Information Display */}
          <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
            <div className="text-sm">
              <span className="font-medium">Contact:</span> {supplierContactName}
            </div>
            {supplier.phone && (
              <div className="text-sm">
                <span className="font-medium">Phone:</span> {supplier.phone}
              </div>
            )}
            {supplier.email && (
              <div className="text-sm">
                <span className="font-medium">Email:</span> {supplier.email}
              </div>
            )}
            {poNumber && (
              <div className="text-sm">
                <span className="font-medium">PO Number:</span> {poNumber}
              </div>
            )}
          </div>

          {/* Missing Documents */}
          {missingDocuments.length > 0 && (
            <div className="space-y-2">
              <Label>Missing Documents</Label>
              <div className="rounded-lg border p-3 bg-red-50 dark:bg-red-950/20">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {missingDocuments.map((doc, index) => (
                    <li key={index} className="text-red-700 dark:text-red-400">{doc}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Access Code URL */}
          <div className="space-y-2">
            <Label htmlFor="accessCodeUrl">Portal Access URL (Optional)</Label>
            <Input
              id="accessCodeUrl"
              placeholder="https://compliance.example.com/partner/login?code=ABC123"
              value={accessCodeUrl}
              onChange={(e) => setAccessCodeUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Include the supplier's unique access code URL for quick portal access
            </p>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="customMessage">Additional Message (Optional)</Label>
            <Textarea
              id="customMessage"
              placeholder="Add any specific instructions or context..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Preview */}
          <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950/20 space-y-2">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Message Preview:
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
              {selectedMethod === "whatsapp" && (
                <>
                  🚨 URGENT: Compliance Documents Required
                  
                  Hi {supplierContactName},
                  
                  Your compliance documents are needed to release Purchase Order{poNumber ? ` #${poNumber}` : ''}.
                  
                  {missingDocuments.length > 0 && `Missing:\n${missingDocuments.map(d => `• ${d}`).join('\n')}\n\n`}
                  {accessCodeUrl && `Portal: ${accessCodeUrl}\n\n`}
                  {customMessage && `${customMessage}\n\n`}
                  Please complete ASAP to avoid PO delays.
                  
                  Thank you,
                  {supplier.name} Procurement Team
                </>
              )}
              {selectedMethod === "sms" && (
                <>
                  URGENT: Compliance docs needed for PO{poNumber ? ` #${poNumber}` : ''}. 
                  {missingDocuments.length > 0 && ` Missing: ${missingDocuments.join(', ')}.`}
                  {accessCodeUrl && ` Access: ${accessCodeUrl}`}
                  {customMessage && ` ${customMessage}`}
                </>
              )}
              {selectedMethod === "email" && (
                <>
                  Subject: URGENT: Compliance Documents Required for PO{poNumber ? ` #${poNumber}` : ''}
                  
                  Dear {supplierContactName},
                  
                  Your compliance documents are urgently needed to release the Purchase Order{poNumber ? ` #${poNumber}` : ''} for {supplier.name}.
                  
                  {missingDocuments.length > 0 && `Missing Documents:\n${missingDocuments.map(d => `• ${d}`).join('\n')}\n\n`}
                  {accessCodeUrl && `Portal Access: ${accessCodeUrl}\n\n`}
                  {customMessage && `${customMessage}\n\n`}
                  Please complete these requirements as soon as possible to avoid delays in processing your Purchase Order.
                  
                  Best regards,
                  Procurement Team
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={isLoading || (!supplier.phone && selectedMethod !== "email") || (!supplier.email && selectedMethod === "email")}
          >
            {isLoading ? "Sending..." : `Send ${selectedMethod === "whatsapp" ? "WhatsApp" : selectedMethod === "sms" ? "SMS" : "Email"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
