import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

interface SupplierDashboardViewProps {
  touchpoint: string;
}

// Mock supplier compliance data
const mockSupplierData = {
  companyName: "Acme Manufacturing Corp",
  cageCode: "1A2B3",
  overallStatus: "incomplete",
  completionPercentage: 75,
  touchpoints: [
    {
      name: "Reps & Certs Annual 2025",
      status: "complete",
      dueDate: "2025-03-31",
      submittedDate: "2025-02-15",
      questions: { total: 45, answered: 45 },
    },
    {
      name: "CMMC Annual Review 2025",
      status: "incomplete",
      dueDate: "2025-04-15",
      submittedDate: null,
      questions: { total: 32, answered: 24 },
    },
    {
      name: "SB Plan Q1 2025",
      status: "no-response",
      dueDate: "2025-03-01",
      submittedDate: null,
      questions: { total: 18, answered: 0 },
    },
    {
      name: "Conflict Minerals 2025",
      status: "reviewing",
      dueDate: "2025-05-31",
      submittedDate: "2025-03-10",
      questions: { total: 28, answered: 28 },
    },
  ],
};

export default function SupplierDashboardView({ touchpoint }: SupplierDashboardViewProps) {
  const data = mockSupplierData;
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "incomplete":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "no-response":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "reviewing":
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      complete: { label: "Complete", className: "bg-green-100 text-green-800 border-green-200" },
      incomplete: { label: "Incomplete", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      "no-response": { label: "No Response", className: "bg-red-100 text-red-800 border-red-200" },
      reviewing: { label: "Under Review", className: "bg-blue-100 text-blue-800 border-blue-200" },
    };
    
    const variant = variants[status] || variants["no-response"];
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Supplier Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{data.companyName}</h3>
            <p className="text-sm text-gray-600 mt-1">CAGE Code: {data.cageCode}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-600">{data.completionPercentage}%</div>
            <p className="text-sm text-gray-600 mt-1">Overall Completion</p>
          </div>
        </div>
      </div>

      {/* Compliance Status Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Complete</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data.touchpoints.filter(t => t.status === "complete").length}
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-gray-600">In Progress</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data.touchpoints.filter(t => t.status === "incomplete").length}
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Under Review</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data.touchpoints.filter(t => t.status === "reviewing").length}
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-gray-600">Not Started</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data.touchpoints.filter(t => t.status === "no-response").length}
          </div>
        </div>
      </div>

      {/* Touchpoints List */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Your Compliance Touchpoints</h3>
        </div>
        
        <div className="divide-y">
          {data.touchpoints.map((tp, idx) => (
            <div key={idx} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">
                    {getStatusIcon(tp.status)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{tp.name}</h4>
                    <div className="mt-2 flex items-center gap-6 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Due Date:</span>{" "}
                        <span className={new Date(tp.dueDate) < new Date() && tp.status !== "complete" ? "text-red-600 font-medium" : ""}>
                          {formatDate(tp.dueDate)}
                        </span>
                      </div>
                      {tp.submittedDate && (
                        <div>
                          <span className="font-medium">Submitted:</span> {formatDate(tp.submittedDate)}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Progress:</span> {tp.questions.answered}/{tp.questions.total} questions
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {getStatusBadge(tp.status)}
                  <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                    {tp.status === "complete" ? "View" : tp.status === "reviewing" ? "View Status" : "Continue"}
                  </button>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3 ml-9">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      tp.status === "complete" ? "bg-green-500" :
                      tp.status === "incomplete" ? "bg-yellow-500" :
                      tp.status === "reviewing" ? "bg-blue-500" :
                      "bg-gray-300"
                    }`}
                    style={{ width: `${(tp.questions.answered / tp.questions.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
        <p className="text-sm text-gray-600">
          If you have questions about any compliance touchpoint or need assistance completing your submissions, 
          please contact your Enterprise Administrator or reach out to our support team.
        </p>
      </div>
    </div>
  );
}
