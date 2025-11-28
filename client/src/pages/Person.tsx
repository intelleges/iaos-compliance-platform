import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { UserBatchUploadDialog } from '@/components/UserBatchUploadDialog';
import { toast } from 'sonner';

export default function Person() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Users</h1>
            <p className="text-gray-600">Manage enterprise users and access control.</p>
          </div>
          <Button
            onClick={() => setShowUploadDialog(true)}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Import Users
          </Button>
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              User Batch Load
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Bulk import enterprise users from Excel template per INT.DOC.64 Section 3.
              Supports role assignment, site/group configuration, and SSO integration.
            </p>
            <Button
              onClick={() => setShowUploadDialog(true)}
              variant="outline"
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Import Users from Excel
            </Button>
          </div>

          <div className="mt-8 border-t pt-8">
            <h4 className="font-semibold text-gray-900 mb-4">Supported Roles</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { role: 'ENTERPRISE_ADMIN', desc: 'Full access to all sites, groups, partners, settings' },
                { role: 'SITE_ADMIN', desc: 'Full access within assigned site' },
                { role: 'GROUP_ADMIN', desc: 'Access within assigned group/department' },
                { role: 'PARTNERTYPE_ADMIN', desc: 'Manage specific partner categories' },
                { role: 'PROCUREMENT_DIRECTOR', desc: 'View all, manage touchpoints, reports' },
                { role: 'PROCUREMENT_MANAGER', desc: 'Manage touchpoints, view partners' },
                { role: 'BUYER', desc: 'Manage assigned partners, send invitations' },
                { role: 'PROCUREMENT_ANALYST', desc: 'View reports, compliance dashboards' },
                { role: 'COMPLIANCE_MANAGER', desc: 'Manage compliance touchpoints, review responses' },
                { role: 'COMPLIANCE_SME', desc: 'Review and approve questionnaire responses' },
                { role: 'DATA_ADMIN', desc: 'Manage data loads, partner records' },
                { role: 'VIEWER', desc: 'Read-only access to dashboards, reports' },
              ].map((item) => (
                <div key={item.role} className="p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="font-medium text-sm text-gray-900">{item.role}</p>
                  <p className="text-xs text-gray-600 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t pt-8">
            <h4 className="font-semibold text-gray-900 mb-4">Template Structure</h4>
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 rounded border border-blue-200">
                <p className="font-medium text-blue-900">Section 1: User Identification (Required)</p>
                <p className="text-sm text-blue-700 mt-1">
                  USER_ID, USER_FIRST_NAME, USER_LAST_NAME, USER_EMAIL, USER_PHONE
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded border border-purple-200">
                <p className="font-medium text-purple-900">Section 2: Role & Access (Required)</p>
                <p className="text-sm text-purple-700 mt-1">
                  USER_ROLE, SITE_CODE, GROUP_CODE, PARTNERTYPE_ACCESS
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded border border-gray-200">
                <p className="font-medium text-gray-900">Section 3: Additional Fields (Optional)</p>
                <p className="text-sm text-gray-700 mt-1">
                  USER_TITLE, DEPARTMENT, MANAGER_EMAIL, SSO_ID, IS_ACTIVE, NOTES
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UserBatchUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSuccess={() => {
          toast.success('Users imported successfully');
        }}
      />
    </DashboardLayout>
  );
}
