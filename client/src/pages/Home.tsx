import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import DashboardLayout from "@/components/DashboardLayout";
import EnterpriseGridModal from "@/components/EnterpriseGridModal";
import PartnerGridModal from "@/components/PartnerGridModal";
import ProtocolGridModal from "@/components/ProtocolGridModal";
import TouchpointGridModal from "@/components/TouchpointGridModal";
import ComplianceDashboard from "@/components/ComplianceDashboard";
import { useState } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const [activeModal, setActiveModal] = useState<{ entity: string; action: string; filters?: any } | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleMenuAction = (entity: string, action: string) => {
    console.log(`Menu action: ${entity} - ${action}`);
    setActiveModal({ entity, action });
  };

  const handleDrillDown = (filters: { group: string; partnerType: string; status: string }) => {
    console.log('Drill-down:', filters);
    setActiveModal({ entity: 'Partner', action: 'View', filters });
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <DashboardLayout onMenuAction={handleMenuAction}>
      {/* Dashboard Content */}
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Compliance Command Center</p>
          <p className="text-sm text-gray-500 mt-2">Enterprise-wide situational awareness</p>
        </div>

        {/* Compliance Command Center Dashboard */}
        <div className="bg-white rounded-lg shadow p-6">
          <ComplianceDashboard onDrillDown={handleDrillDown} />
        </div>
      </div>

      {/* Modals */}
      <EnterpriseGridModal
        isOpen={activeModal?.entity === "Enterprise" && activeModal?.action === "View"}
        onClose={closeModal}
      />
      
      <PartnerGridModal
        isOpen={activeModal?.entity === "Partner" && activeModal?.action === "View"}
        onClose={closeModal}
        initialFilters={activeModal?.filters}
      />
      
      <ProtocolGridModal
        isOpen={activeModal?.entity === "Protocol" && activeModal?.action === "View"}
        onClose={closeModal}
      />
      
      <TouchpointGridModal
        isOpen={activeModal?.entity === "Touchpoint" && activeModal?.action === "View"}
        onClose={closeModal}
      />
    </DashboardLayout>
  );
}
