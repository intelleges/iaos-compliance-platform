import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Import Claude's pages
import Home from "./pages/Home";
import IntellegesQMS from "./pages/IntellegesQMS";
import Enterprise from "./pages/Enterprise";
import Partner from "./pages/Partner";
import Protocol from "./pages/Protocol";
import Touchpoint from "./pages/Touchpoint";
import ResponseTracking from "./pages/ResponseTracking";
import Questionnaires from "./pages/Questionnaires";
import Groups from "./pages/Groups";
import ReviewerDashboard from "./pages/ReviewerDashboard";
import TestReportDashboard from "./pages/TestReportDashboard";
import AuditLogViewer from "./pages/AuditLogViewer";

// Partner-facing pages
import PartnerLogin from "./pages/PartnerLogin";
import PartnerQuestionnaire from "./pages/PartnerQuestionnaire";
import PartnerSuccess from "./pages/PartnerSuccess";
import SupplierCommandCenter from "./pages/SupplierCommandCenter";
import EsrsReports from "./pages/EsrsReports";
import SupplierLogin from "./pages/SupplierLogin";
import SupplierVerifyCompany from "./pages/SupplierVerifyCompany";
import SupplierVerifyContact from "./pages/SupplierVerifyContact";
import SupplierQuestionnaire from "./pages/SupplierQuestionnaire";
import SupplierESignature from "./pages/SupplierESignature";
import SupplierConfirmation from "./pages/SupplierConfirmation";
import SupplierSuccess from "./pages/SupplierSuccess";

function Router() {
  return (
    <Switch>
      {/* Admin/Internal Routes */}
      <Route path={"/"} component={IntellegesQMS} />
      <Route path={"/old-dashboard"} component={Home} />
      <Route path={"/dashboard"} component={Home} />
      <Route path={"/response-tracking"} component={ResponseTracking} />
      <Route path={"/enterprises"} component={Enterprise} />
      <Route path={"/partners"} component={Partner} />
      <Route path={"/protocols"} component={Protocol} />
      <Route path={"/touchpoints"} component={Touchpoint} />
      <Route path={"/questionnaires"} component={Questionnaires} />
      <Route path={"/groups"} component={Groups} />
      <Route path={"/reports"} component={EsrsReports} />
      <Route path={"/esrs"} component={EsrsReports} />
      <Route path={"/reviewer-dashboard"} component={ReviewerDashboard} />
      <Route path={"/test-reports"} component={TestReportDashboard} />
      <Route path={"/audit-logs"} component={AuditLogViewer} />
      
      {/* Partner-Facing Routes */}
      <Route path={"/partner/login"} component={PartnerLogin} />
      <Route path={"/partner/dashboard"} component={SupplierCommandCenter} />
      <Route path={"/partner/questionnaire"} component={PartnerQuestionnaire} />
      <Route path={"/partner/success"} component={PartnerSuccess} />
      
      {/* Supplier Portal Routes (New Access Code System) */}
      <Route path={"/supplier/login"} component={SupplierLogin} />
      <Route path={"/supplier/verify-company"} component={SupplierVerifyCompany} />
      <Route path={"/supplier/verify-contact"} component={SupplierVerifyContact} />
      <Route path={"/supplier/questionnaire"} component={SupplierQuestionnaire} />
      <Route path={"/supplier/e-signature"} component={SupplierESignature} />
      <Route path={"/supplier/confirmation"} component={SupplierConfirmation} />
      <Route path={"/supplier/success"} component={SupplierSuccess} />
      
      {/* 404 */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
