import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Languages, Upload } from "lucide-react";
import { useState } from "react";
import { CMSBatchUploadDialog } from "@/components/CMSBatchUploadDialog";
import { toast } from "sonner";

export default function Settings() {
  const [showCMSUploadDialog, setShowCMSUploadDialog] = useState(false);

  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
        <p className="text-gray-600 mb-8">Manage system configuration and content</p>
        
        <div className="grid gap-6">
          {/* CMS Content Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Languages className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>CMS Content Management</CardTitle>
                    <CardDescription>
                      Manage multi-language page content for supplier portal
                    </CardDescription>
                  </div>
                </div>
                <Button onClick={() => setShowCMSUploadDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Content
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">Supported Languages</p>
                    <p className="text-2xl font-bold text-gray-900">6</p>
                    <p className="text-xs text-gray-500 mt-1">EN, ES, FR, DE, ZH, JA</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">Content Pages</p>
                    <p className="text-2xl font-bold text-gray-900">5</p>
                    <p className="text-xs text-gray-500 mt-1">Access Code, Company Edit, Questionnaire, Confirmation, Save & Exit</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">Template Columns</p>
                    <p className="text-2xl font-bold text-gray-900">5</p>
                    <p className="text-xs text-gray-500 mt-1">questionnaireCMS, description, text, link, doc</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">CMS Template Structure (INT.DOC.64 Section 6.3)</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>questionnaireCMS:</strong> Page identifier (1=Access Code, 2=Company Edit, 3=Questionnaire, 50=Confirmation, 51=Save & Exit)</p>
                    <p><strong>description:</strong> Element type (ACCESS_CODE_TITLE, COMPANY_EDIT_PAGE_SUBTITLE, etc.)</p>
                    <p><strong>text:</strong> Display content (HTML allowed, e.g., &lt;p&gt;Welcome...&lt;/p&gt;)</p>
                    <p><strong>link:</strong> Optional hyperlink URL (https://help.enterprise.com)</p>
                    <p><strong>doc:</strong> Optional document reference (User_Guide_v1.pdf)</p>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-900 mb-2">Import Behavior</h4>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li>Same key + language + different content → <strong>UPDATE</strong> (version incremented)</li>
                    <li>Same key + language + same content → <strong>SKIP</strong></li>
                    <li>New key + language → <strong>CREATE</strong></li>
                    <li>Each import can target a specific language (en, es, fr, de, zh, ja)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Template Management (AMS) - Placeholder */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Upload className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Email Template Management (AMS)</CardTitle>
                  <CardDescription>
                    Bulk import email templates for automated reminders
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Coming soon: AMS Batch Load (INT.DOC.64 Section 6.4)</p>
            </CardContent>
          </Card>
        </div>

        {/* CMS Batch Upload Dialog */}
        <CMSBatchUploadDialog
          open={showCMSUploadDialog}
          onOpenChange={setShowCMSUploadDialog}
          onSuccess={() => {
            toast.success('CMS content imported successfully');
          }}
        />
      </div>
    </DashboardLayout>
  );
}
