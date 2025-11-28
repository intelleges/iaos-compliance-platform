import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import SupplierDashboardView from "./SupplierDashboardView";

interface PartnerTypeStatus {
  type: string;
  g: number;
  u: number;
  r: number;
  c: number;
  nr: number;
  ri: number;
  rc: number;
  t: number;
}

interface GroupStatus {
  name: string;
  completion: number;
  partnerTypes: PartnerTypeStatus[];
}

interface DashboardData {
  touchpoint: string;
  overallCompletion: number;
  totalSent: number;
  completed: number;
  needsFocus: {
    group: string;
    percentage: number;
  };
  groups: GroupStatus[];
  totals: {
    preInvite: { u: number; r: number; c: number };
    postInvite: { nr: number; ri: number; rc: number; t: number };
  };
}

// Mock data matching the legacy site
const mockDashboardData: DashboardData = {
  touchpoint: "Reps & Certs Annual 2025",
  overallCompletion: 66,
  totalSent: 3961,
  completed: 2602,
  needsFocus: {
    group: "ROCHESTER",
    percentage: 52,
  },
  groups: [
    {
      name: "CME",
      completion: 57,
      partnerTypes: [
        { type: "Supplier", g: 0, u: 0, r: 0, c: 45, nr: 29, ri: 137, rc: 211, t: 377 },
        { type: "Distributor", g: 0, u: 0, r: 0, c: 12, nr: 8, ri: 25, rc: 45, t: 78 },
        { type: "Contractor", g: 0, u: 0, r: 0, c: 8, nr: 3, ri: 12, rc: 28, t: 43 },
      ],
    },
    {
      name: "CMO",
      completion: 61,
      partnerTypes: [
        { type: "Supplier", g: 0, u: 0, r: 0, c: 55, nr: 23, ri: 79, rc: 157, t: 259 },
        { type: "Distributor", g: 0, u: 0, r: 0, c: 15, nr: 6, ri: 18, rc: 38, t: 62 },
        { type: "Contractor", g: 0, u: 0, r: 0, c: 10, nr: 4, ri: 9, rc: 22, t: 35 },
      ],
    },
    {
      name: "CMY",
      completion: 69,
      partnerTypes: [
        { type: "Supplier", g: 0, u: 0, r: 9, c: 317, nr: 91, ri: 161, rc: 578, t: 830 },
        { type: "Distributor", g: 0, u: 0, r: 2, c: 45, nr: 18, ri: 32, rc: 98, t: 148 },
        { type: "Contractor", g: 0, u: 0, r: 1, c: 28, nr: 12, ri: 20, rc: 65, t: 97 },
      ],
    },
    {
      name: "CNO",
      completion: 63,
      partnerTypes: [
        { type: "Supplier", g: 0, u: 0, r: 0, c: 125, nr: 53, ri: 138, rc: 316, t: 507 },
        { type: "Distributor", g: 0, u: 0, r: 0, c: 22, nr: 9, ri: 28, rc: 67, t: 104 },
        { type: "Contractor", g: 0, u: 0, r: 0, c: 18, nr: 7, ri: 15, rc: 45, t: 67 },
      ],
    },
    {
      name: "COV",
      completion: 61,
      partnerTypes: [
        { type: "Supplier", g: 0, u: 0, r: 0, c: 67, nr: 23, ri: 100, rc: 190, t: 313 },
        { type: "Distributor", g: 0, u: 0, r: 0, c: 18, nr: 7, ri: 22, rc: 48, t: 77 },
        { type: "Contractor", g: 0, u: 0, r: 0, c: 12, nr: 5, ri: 14, rc: 32, t: 51 },
      ],
    },
    {
      name: "CSP",
      completion: 71,
      partnerTypes: [
        { type: "Supplier", g: 0, u: 0, r: 0, c: 149, nr: 45, ri: 50, rc: 244, t: 339 },
        { type: "Distributor", g: 0, u: 0, r: 0, c: 28, nr: 12, ri: 15, rc: 58, t: 85 },
        { type: "Contractor", g: 0, u: 0, r: 0, c: 20, nr: 8, ri: 10, rc: 42, t: 60 },
      ],
    },
    {
      name: "NEW_HOPE",
      completion: 76,
      partnerTypes: [
        { type: "Supplier", g: 0, u: 0, r: 0, c: 144, nr: 18, ri: 49, rc: 211, t: 278 },
        { type: "Distributor", g: 0, u: 0, r: 0, c: 25, nr: 5, ri: 12, rc: 52, t: 69 },
        { type: "Contractor", g: 0, u: 0, r: 0, c: 18, nr: 3, ri: 8, rc: 38, t: 49 },
      ],
    },
    {
      name: "ROCHESTER",
      completion: 52,
      partnerTypes: [
        { type: "Supplier", g: 0, u: 0, r: 0, c: 1, nr: 2, ri: 7, rc: 10, t: 19 },
        { type: "Distributor", g: 0, u: 0, r: 0, c: 1, nr: 1, ri: 3, rc: 4, t: 8 },
        { type: "Contractor", g: 0, u: 0, r: 0, c: 0, nr: 1, ri: 2, rc: 3, t: 6 },
      ],
    },
  ],
  totals: {
    preInvite: { u: 0, r: 12, c: 1183 },
    postInvite: { nr: 393, ri: 966, rc: 2602, t: 3961 },
  },
};

interface ComplianceDashboardProps {
  onDrillDown?: (filters: {
    group: string;
    partnerType: string;
    status: string;
  }) => void;
}

export default function ComplianceDashboard({ onDrillDown }: ComplianceDashboardProps) {
  const [selectedTouchpoint, setSelectedTouchpoint] = useState("reps-certs-2025");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedPartnerType, setSelectedPartnerType] = useState("all");
  const [selectedRole, setSelectedRole] = useState<"admin" | "enterprise" | "supplier">("admin");

  const data = mockDashboardData;

  // Filter groups based on role and selection
  let filteredGroups = data.groups;
  
  // Role-based filtering
  if (selectedRole === "enterprise") {
    // Enterprise users see only their assigned group (default to first group)
    filteredGroups = data.groups.slice(0, 1);
  } else if (selectedRole === "supplier") {
    // Suppliers don't see group grids, only their own status
    filteredGroups = [];
  } else {
    // Admin sees all groups or filtered by selection
    filteredGroups = selectedGroup === "all" 
      ? data.groups 
      : data.groups.filter(g => g.name === selectedGroup);
  }

  const getCompletionBadgeColor = (percentage: number) => {
    if (percentage >= 70) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const calculateTotals = (partnerTypes: PartnerTypeStatus[]) => {
    return partnerTypes.reduce(
      (acc, pt) => ({
        g: acc.g + pt.g,
        u: acc.u + pt.u,
        r: acc.r + pt.r,
        c: acc.c + pt.c,
        nr: acc.nr + pt.nr,
        ri: acc.ri + pt.ri,
        rc: acc.rc + pt.rc,
        t: acc.t + pt.t,
      }),
      { g: 0, u: 0, r: 0, c: 0, nr: 0, ri: 0, rc: 0, t: 0 }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as any)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Intelleges Admin</SelectItem>
                <SelectItem value="enterprise">Enterprise User</SelectItem>
                <SelectItem value="supplier">Supplier</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedTouchpoint} onValueChange={setSelectedTouchpoint}>
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reps-certs-2025">Reps & Certs Annual 2025</SelectItem>
                <SelectItem value="cmmc-2025">CMMC Annual Review 2025</SelectItem>
                <SelectItem value="sb-plan-q1">SB Plan Q1 2025</SelectItem>
                <SelectItem value="conflict-minerals">Conflict Minerals 2025</SelectItem>
                <SelectItem value="ctpat-2025">C-TPAT Annual 2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-gray-600">Annual Reps & Certs</p>
        </div>

        <div className="flex items-center gap-6">
          {data.needsFocus && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div className="text-sm">
                <span className="font-medium text-red-900">Needs Focus:</span>
                <span className="ml-2 text-red-700">{data.needsFocus.group} ({data.needsFocus.percentage}%)</span>
              </div>
            </div>
          )}
          
          <div className="text-right">
            <div className="text-5xl font-bold text-gray-900">{data.overallCompletion}%</div>
            <div className="text-sm text-gray-600">Complete ({data.completed}/{data.totalSent})</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {selectedRole !== "supplier" && (
        <div className="flex items-center gap-4 pb-4 border-b">
          {selectedRole === "admin" && (
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {data.groups.map(group => (
                  <SelectItem key={group.name} value={group.name}>{group.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={selectedPartnerType} onValueChange={setSelectedPartnerType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Partner Types</SelectItem>
              <SelectItem value="Supplier">Supplier</SelectItem>
              <SelectItem value="Distributor">Distributor</SelectItem>
              <SelectItem value="Contractor">Contractor</SelectItem>
              <SelectItem value="Consultant">Consultant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Supplier View */}
      {selectedRole === "supplier" && (
        <SupplierDashboardView touchpoint={selectedTouchpoint} />
      )}

      {/* Admin/Enterprise View */}
      {selectedRole !== "supplier" && (
        <>
          {/* Legend */}
          <div className="flex items-center gap-6 text-sm text-gray-600 pb-4">
            <span><strong>G</strong>=Goal</span>
            <span><strong>U</strong>=Unconfirmed</span>
            <span><strong>R</strong>=Reviewing</span>
            <span><strong>C</strong>=Confirmed</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-900 rounded"><strong>N/R</strong>=No Response</span>
            <span className="px-2 py-1 bg-red-100 text-red-900 rounded"><strong>R/I</strong>=Incomplete</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded"><strong>R/C</strong>=Complete</span>
            <span><strong>T</strong>=Total Sent</span>
          </div>

          {/* Group Status Grids */}
          <div className="space-y-6">
        {filteredGroups.map((group) => {
          const totals = calculateTotals(group.partnerTypes);
          const isNeedsFocus = group.name === data.needsFocus.group;

          return (
            <div key={group.name} className="border rounded-lg overflow-hidden">
              {/* Group Header */}
              <div className={`px-4 py-3 flex items-center justify-between ${
                isNeedsFocus ? 'bg-red-600 text-white' : 'bg-black text-white'
              }`}>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{group.name}</h3>
                  {isNeedsFocus && (
                    <span className="flex items-center gap-1 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      NEEDS ATTENTION - Lowest Completion
                    </span>
                  )}
                </div>
                <Badge className={`${getCompletionBadgeColor(group.completion)} text-white`}>
                  {group.completion}%
                </Badge>
              </div>

              {/* Status Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">PARTNER TYPE</th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-700">G</th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-700">U</th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-700">R</th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-700">C</th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-700 bg-yellow-100">N/R</th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-700 bg-red-100">R/I</th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-700 bg-blue-100">R/C</th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-700">T</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.partnerTypes
                      .filter(pt => selectedPartnerType === "all" || pt.type === selectedPartnerType)
                      .map((pt, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{pt.type}</td>
                          <td className="px-3 py-3 text-center text-gray-700">
                            <button
                              onClick={() => onDrillDown?.({ group: group.name, partnerType: pt.type, status: 'goal' })}
                              className="hover:text-blue-600 hover:underline cursor-pointer"
                              disabled={pt.g === 0}
                            >
                              {pt.g}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-center text-gray-700">
                            <button
                              onClick={() => onDrillDown?.({ group: group.name, partnerType: pt.type, status: 'unconfirmed' })}
                              className="hover:text-blue-600 hover:underline cursor-pointer"
                              disabled={pt.u === 0}
                            >
                              {pt.u}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-center text-gray-700">
                            <button
                              onClick={() => onDrillDown?.({ group: group.name, partnerType: pt.type, status: 'reviewing' })}
                              className="hover:text-blue-600 hover:underline cursor-pointer"
                              disabled={pt.r === 0}
                            >
                              {pt.r}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-center text-gray-700">
                            <button
                              onClick={() => onDrillDown?.({ group: group.name, partnerType: pt.type, status: 'confirmed' })}
                              className="hover:text-blue-600 hover:underline cursor-pointer"
                              disabled={pt.c === 0}
                            >
                              {pt.c}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-center bg-yellow-50 font-medium text-gray-900">
                            <button
                              onClick={() => onDrillDown?.({ group: group.name, partnerType: pt.type, status: 'no-response' })}
                              className="hover:text-blue-600 hover:underline cursor-pointer"
                              disabled={pt.nr === 0}
                            >
                              {pt.nr}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-center bg-red-50 font-medium text-gray-900">
                            <button
                              onClick={() => onDrillDown?.({ group: group.name, partnerType: pt.type, status: 'incomplete' })}
                              className="hover:text-blue-600 hover:underline cursor-pointer"
                              disabled={pt.ri === 0}
                            >
                              {pt.ri}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-center bg-blue-50 font-medium text-gray-900">
                            <button
                              onClick={() => onDrillDown?.({ group: group.name, partnerType: pt.type, status: 'complete' })}
                              className="hover:text-blue-600 hover:underline cursor-pointer"
                              disabled={pt.rc === 0}
                            >
                              {pt.rc}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-center font-medium text-gray-900">
                            <button
                              onClick={() => onDrillDown?.({ group: group.name, partnerType: pt.type, status: 'all' })}
                              className="hover:text-blue-600 hover:underline cursor-pointer"
                              disabled={pt.t === 0}
                            >
                              {pt.t}
                            </button>
                          </td>
                        </tr>
                      ))}
                    <tr className="bg-gray-100 font-semibold">
                      <td className="px-4 py-3 text-gray-900">Total</td>
                      <td className="px-3 py-3 text-center text-gray-900">{totals.g}</td>
                      <td className="px-3 py-3 text-center text-gray-900">{totals.u}</td>
                      <td className="px-3 py-3 text-center text-gray-900">{totals.r}</td>
                      <td className="px-3 py-3 text-center text-gray-900">{totals.c}</td>
                      <td className="px-3 py-3 text-center bg-yellow-100 text-gray-900">{totals.nr}</td>
                      <td className="px-3 py-3 text-center bg-red-100 text-gray-900">{totals.ri}</td>
                      <td className="px-3 py-3 text-center bg-blue-100 text-gray-900">{totals.rc}</td>
                      <td className="px-3 py-3 text-center text-gray-900">{totals.t}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
          </div>

          {/* Enterprise Totals */}
          <div className="border rounded-lg p-6 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            ENTERPRISE TOTALS ({data.groups.length} Groups)
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-2xl">😐</span>
            <div className="text-right">
              <div className="text-sm text-gray-600">Making Progress</div>
              <div className="text-2xl font-bold text-gray-900">{data.overallCompletion}%</div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">PRE-INVITE:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div>U: {data.totals.preInvite.u}</div>
              <div>R: {data.totals.preInvite.r}</div>
              <div>C: {data.totals.preInvite.c}</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">POST-INVITE:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div>N/R: {data.totals.postInvite.nr} ({Math.round((data.totals.postInvite.nr / data.totals.postInvite.t) * 100)}%)</div>
              <div>R/I: {data.totals.postInvite.ri} ({Math.round((data.totals.postInvite.ri / data.totals.postInvite.t) * 100)}%)</div>
              <div>R/C: {data.totals.postInvite.rc} ({Math.round((data.totals.postInvite.rc / data.totals.postInvite.t) * 100)}%)</div>
              <div>T: {data.totals.postInvite.t}</div>
            </div>
          </div>
        </div>
          </div>
        </>
      )}
    </div>
  );
}
