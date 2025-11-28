#!/bin/bash
entities=("Enterprise" "Person" "Partner" "Protocol" "Touchpoint" "Partnertype" "Group" "Questionnaire" "Roles" "Permissions" "AuditLog" "Settings")
paths=("enterprise" "person" "partner" "protocol" "touchpoint" "partnertype" "group" "questionnaire" "roles" "permissions" "audit-log" "settings")

for i in "${!entities[@]}"; do
  entity="${entities[$i]}"
  path="${paths[$i]}"
  filename="${entity}.tsx"
  
  cat > "$filename" << EOPAGE
import DashboardLayout from "@/components/DashboardLayout";

export default function ${entity}() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">${entity}</h1>
        <p className="text-gray-600">Manage ${entity,,} records and settings.</p>
        
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">This page is under construction.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
EOPAGE
done
