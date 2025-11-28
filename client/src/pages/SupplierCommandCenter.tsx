import React, { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { 
  FileText, Upload, CheckCircle, AlertTriangle, Clock, Calendar, 
  ChevronRight, Download, MessageSquare, HelpCircle, User, Building2,
  Shield, Award, History, Bell, ExternalLink, RefreshCw, Eye,
  FileCheck, FileClock, FileX, AlertCircle, TrendingUp, Users, Info
} from 'lucide-react';

export default function SupplierCompliancePortal() {
  const searchParams = useSearch();
  const [, setLocation] = useLocation();
  
  const [supplierStep, setSupplierStep] = useState(1);
  const [authenticated, setAuthenticated] = useState(false);
  const [showRoutingModal, setShowRoutingModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Check URL parameters on mount to enable routing modal
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.get('showRoutingModal') === 'true') {
      setAuthenticated(true);
      setShowRoutingModal(true);
      // Clean up URL
      setLocation('/partner/dashboard', { replace: true });
    }
  }, [searchParams, setLocation]);
  
  // Questionnaire workflow state
  const [inQuestionnaireFlow, setInQuestionnaireFlow] = useState(false);
  const [questionnaireStep, setQuestionnaireStep] = useState(1);
  
  // Questionnaire steps definition
  const questionnaireSteps = [
    { step: 1, title: 'Company Information', description: 'Confirm or update your company details' },
    { step: 2, title: 'Contact Information', description: 'Confirm or update contact details' },
    { step: 3, title: 'Questionnaire', description: 'Complete the compliance questionnaire' },
    { step: 4, title: 'E-Signature', description: 'Review and sign electronically' },
    { step: 5, title: 'Complete', description: 'Download your submission receipt' },
  ];

  // Latest communication that triggered this visit
  const latestCommunication = {
    id: 'EMAIL-2025-0847',
    subject: 'Action Required: Upload ISO 9001:2015 Certificate',
    sentDate: '2025-01-20',
    daysSinceSent: 28,
    from: 'Honeywell Aerospace Supplier Management',
    preview: 'Your ISO 9001:2015 certificate is expiring on February 8, 2025. Please upload your renewed certificate to maintain your compliance status.',
    linkedTask: {
      id: 1,
      name: 'Upload updated ISO 9001 certificate',
      type: 'document_upload',
      category: 'Certifications',
      dueDate: '2025-02-08',
      daysUntilDue: 12,
    }
  };

  // All communications sent to this supplier
  const allCommunications = [
    { id: 1, subject: 'Action Required: Upload ISO 9001:2015 Certificate', date: '2025-01-20', status: 'pending', type: 'action_required' },
    { id: 2, subject: 'Cybersecurity Questionnaire Assignment', date: '2025-01-19', status: 'in_progress', type: 'questionnaire' },
    { id: 3, subject: 'Reminder: Insurance Certificate Expired', date: '2025-01-15', status: 'overdue', type: 'action_required' },
    { id: 4, subject: 'Welcome to 2025 Compliance Cycle', date: '2025-01-02', status: 'read', type: 'informational' },
    { id: 5, subject: '2024 Compliance Cycle Complete - Thank You', date: '2024-12-15', status: 'read', type: 'informational' },
  ];

  // EXACT original steps from intelleges-demo
  const supplierSteps = [
    { step: 1, title: 'Access Code Entry', description: 'Enter your secure access code' },
    { step: 2, title: 'Company Confirmation', description: 'Verify your company information' },
    { step: 3, title: 'Contact Confirmation', description: 'Confirm contact details' },
    { step: 4, title: 'Questionnaire', description: 'Complete compliance questionnaire' },
    { step: 5, title: 'E-Signature', description: 'Sign electronically' },
    { step: 6, title: 'Submission Complete', description: 'Download your receipt' },
  ];

  // Mock supplier data for dashboard
  const supplierData = {
    company: 'Acme Aerospace Inc.',
    supplierId: 'SUP-2024-00847',
    clientName: 'Honeywell Aerospace',
    primaryContact: 'Jane Smith',
    overallCompletion: 68,
  };

  // Compliance scorecard data
  const complianceScorecard = [
    { code: 'G', label: 'General Info', status: 'complete', count: 4 },
    { code: 'U', label: 'Unique IDs', status: 'partial', count: 2 },
    { code: 'R', label: 'Regulatory', status: 'incomplete', count: 1 },
    { code: 'C', label: 'Certifications', status: 'expiring', count: 3 },
    { code: 'N/R', label: 'Needs Review', status: 'partial', count: 2 },
    { code: 'R/I', label: 'Review In Progress', status: 'complete', count: 5 },
    { code: 'R/C', label: 'Review Complete', status: 'complete', count: 7 },
    { code: 'T', label: 'Total Required', status: 'total', count: 25 },
  ];

  // Tasks data
  const tasksData = [
    { id: 1, name: 'Upload updated ISO 9001 certificate', category: 'Certifications', status: 'expiring', assignee: 'Maria Lopez', dueDate: '2025-03-15', lastUpdated: '2025-02-19' },
    { id: 2, name: 'Complete cybersecurity questionnaire', category: 'Cybersecurity', status: 'partial', assignee: 'IT Security', dueDate: '2025-02-28', lastUpdated: '2025-02-20' },
    { id: 3, name: 'Verify company contact information', category: 'General', status: 'complete', assignee: 'Admin', lastUpdated: '2025-02-10' },
    { id: 4, name: 'Sign Business Associate Agreement (BAA)', category: 'Regulatory', status: 'incomplete', assignee: 'CFO', dueDate: '2025-03-01' },
    { id: 5, name: 'Provide updated insurance certificate', category: 'Documents', status: 'overdue', assignee: 'Maria Lopez', dueDate: '2025-01-15' },
  ];

  // Documents data
  const documentsData = [
    { id: 1, name: 'ISO 9001:2015 Certificate', category: 'Certifications', status: 'expiring', uploadDate: '2024-03-15', expirationDate: '2025-02-08' },
    { id: 2, name: 'Certificate of Insurance', category: 'Insurance', status: 'expired', uploadDate: '2024-01-10', expirationDate: '2025-01-10' },
    { id: 3, name: 'W-9 Tax Form', category: 'Financial', status: 'valid', uploadDate: '2024-06-20' },
    { id: 4, name: 'ITAR Registration', category: 'Regulatory', status: 'valid', uploadDate: '2024-08-01', expirationDate: '2026-08-01' },
    { id: 5, name: 'Cybersecurity Policy', category: 'Cybersecurity', status: 'pending', uploadDate: '2025-01-15' },
    { id: 6, name: 'SOC 2 Type II Report', category: 'Cybersecurity', status: 'missing' },
  ];

  // Certifications data
  const certificationsData = [
    { id: 1, name: 'ISO 9001:2015', status: 'expiring', expiration: '27 days', lastReview: '2024', reviewer: 'Intelleges QA' },
    { id: 2, name: 'AS9100D', status: 'valid', expiration: 'Mar 2026', lastReview: '2024', reviewer: 'Intelleges QA' },
    { id: 3, name: 'ITAR Registered', status: 'valid', expiration: 'Aug 2026', lastReview: '2024', reviewer: 'Intelleges Compliance' },
    { id: 4, name: 'C-TPAT', status: 'valid', expiration: 'Mar 2026', lastReview: '2024', reviewer: 'Intelleges Compliance' },
    { id: 5, name: 'SOC 2 Type II', status: 'required', expiration: '—', lastReview: '—', reviewer: '—' },
    { id: 6, name: 'CMMC Level 2', status: 'partial', expiration: 'Pending', lastReview: '—', reviewer: 'Intelleges Cyber' },
  ];

  // History data
  const historyData = [
    { id: 1, date: '2025-01-23', action: 'Logged in', entity: 'Portal Access', user: 'Maria Lopez', details: 'Access code authentication' },
    { id: 2, date: '2025-01-15', action: 'Document uploaded', entity: 'Cybersecurity Policy', user: 'Joseph Kim', details: 'New version submitted for review' },
    { id: 3, date: '2025-01-10', action: 'Certification expired', entity: 'Certificate of Insurance', user: 'System', details: 'Auto-flagged for renewal' },
    { id: 4, date: '2025-01-08', action: 'Questionnaire started', entity: 'Cybersecurity Assessment', user: 'Joseph Kim', details: '45% complete' },
    { id: 5, date: '2024-12-20', action: 'Review approved', entity: 'ITAR Registration', user: 'Intelleges Compliance', details: 'Annual verification complete' },
  ];

  // Messages data
  const messagesData = [
    { id: 1, type: 'inbound', subject: 'ISO 9001 Certificate Renewal Required', from: 'Intelleges Compliance', date: '2025-01-20', status: 'unread' },
    { id: 2, type: 'inbound', subject: 'Cybersecurity Questionnaire Assignment', from: 'Honeywell Procurement', date: '2025-01-19', status: 'read' },
    { id: 3, type: 'outbound', subject: 'Extension Request - Insurance Certificate', from: 'Maria Lopez', date: '2025-01-18', status: 'pending' },
    { id: 4, type: 'inbound', subject: 'Welcome to 2025 Compliance Cycle', from: 'Intelleges', date: '2025-01-02', status: 'read' },
  ];

  // Status chip helper
  const StatusChip = ({ status }: { status: string }) => {
    const styles = {
      complete: { bg: '#D1FAE5', color: '#059669', icon: CheckCircle, text: 'Complete' },
      valid: { bg: '#D1FAE5', color: '#059669', icon: CheckCircle, text: 'Valid' },
      partial: { bg: '#FEF3C7', color: '#D97706', icon: AlertTriangle, text: 'In Progress' },
      expiring: { bg: '#FEF3C7', color: '#D97706', icon: AlertTriangle, text: 'Expiring Soon' },
      pending: { bg: '#FEF3C7', color: '#D97706', icon: Clock, text: 'Under Review' },
      incomplete: { bg: '#FEE2E2', color: '#DC2626', icon: AlertCircle, text: 'Action Required' },
      overdue: { bg: '#FEE2E2', color: '#DC2626', icon: AlertCircle, text: 'Overdue' },
      expired: { bg: '#FEE2E2', color: '#DC2626', icon: AlertCircle, text: 'Expired' },
      missing: { bg: '#FEE2E2', color: '#DC2626', icon: FileX, text: 'Missing' },
      required: { bg: '#FEE2E2', color: '#DC2626', icon: AlertCircle, text: 'Required' },
      total: { bg: '#F3F4F6', color: '#374151', icon: null, text: 'Total' },
    };
    const s = styles[status as keyof typeof styles] || styles.pending;
    const Icon = s.icon;
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: s.bg, color: s.color }}>
        {Icon && <Icon className="w-3 h-3" />}
        {s.text}
      </span>
    );
  };

  const getScoreColor = (status: string) => {
    switch (status) {
      case 'complete': return '#2496F4';
      case 'partial': return '#FFCA16';
      case 'expiring': return '#FFCA16';
      case 'incomplete': return '#F2574D';
      case 'overdue': return '#F2574D';
      case 'total': return '#111117';
      default: return '#6B7280';
    }
  };

  const getOverallStatus = () => {
    const overdue = tasksData.filter(t => t.status === 'overdue').length;
    const expiring = certificationsData.filter(c => c.status === 'expiring').length;
    if (overdue > 0) return { icon: '🔴', text: 'Action Required', color: '#DC2626', bg: '#FEE2E2' };
    if (expiring > 0) return { icon: '🟡', text: 'Expiring Soon', color: '#D97706', bg: '#FEF3C7' };
    return { icon: '🟢', text: 'Current', color: '#059669', bg: '#D1FAE5' };
  };

  // Compliance health emoji based on percentage
  const getComplianceEmoji = (percentage: number) => {
    if (percentage < 65) return { emoji: '😟', label: 'Needs Attention', color: '#DC2626', bg: '#FEE2E2' };
    if (percentage <= 80) return { emoji: '😐', label: 'Making Progress', color: '#D97706', bg: '#FEF3C7' };
    return { emoji: '😊', label: 'Doing Well', color: '#059669', bg: '#D1FAE5' };
  };

  const complianceHealth = getComplianceEmoji(supplierData.overallCompletion);

  // Task counts - needed for routing modal and dashboard
  const openTasks = tasksData.filter(t => t.status !== 'complete').length;
  const overdueTasks = tasksData.filter(t => t.status === 'overdue').length;
  const unreadMessages = messagesData.filter(m => m.status === 'unread').length;

  // Marketing/Thought Leadership Content
  const marketingContent = [
    {
      id: 1,
      type: 'award',
      icon: '🏆',
      headline: 'Intelleges Earns Battelle Supplier of the Year Award',
      subtext: 'Recognized for excellence in compliance management',
      cta: 'Read More',
      link: '#',
    },
    {
      id: 2,
      type: 'whitepaper',
      icon: '📄',
      headline: 'Supply Chain Compliance with Federal Regulations in 2025',
      subtext: 'Free whitepaper: Navigate CMMC, ITAR, and more',
      cta: 'Download',
      link: '#',
    },
    {
      id: 3,
      type: 'guide',
      icon: '🚀',
      headline: 'Managing Compliance Across Multiple Customers?',
      subtext: 'See how suppliers streamline with a single dashboard',
      cta: 'Learn More',
      link: '#',
    },
    {
      id: 4,
      type: 'webinar',
      icon: '🎥',
      headline: 'Webinar: Reduce Compliance Fatigue by 60%',
      subtext: 'Live session with industry experts • March 15',
      cta: 'Register Free',
      link: '#',
    },
    {
      id: 5,
      type: 'case_study',
      icon: '📊',
      headline: 'How Tier-2 Suppliers Cut Audit Prep Time in Half',
      subtext: 'Case study featuring aerospace suppliers',
      cta: 'Read Case Study',
      link: '#',
    },
  ];

  const [carouselIndex, setCarouselIndex] = useState(0);

  // Auto-rotate carousel
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % marketingContent.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Marketing Carousel Component
  const MarketingCarousel = ({ variant = 'light' }) => {
    const visibleItems = 3;
    const isLight = variant === 'light';
    
    return (
      <div className={`${isLight ? 'bg-gray-50 border-t border-gray-200' : 'bg-gray-800'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-medium uppercase tracking-wide ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
              Resources from Intelleges
            </span>
            <div className="flex gap-1">
              {marketingContent.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCarouselIndex(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    idx === carouselIndex 
                      ? (isLight ? 'bg-blue-500' : 'bg-blue-400')
                      : (isLight ? 'bg-gray-300' : 'bg-gray-600')
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2].map((offset) => {
              const item = marketingContent[(carouselIndex + offset) % marketingContent.length];
              return (
                <a
                  key={item.id}
                  href={item.link}
                  className={`flex-1 p-4 rounded-lg border transition-all hover:shadow-md group ${
                    isLight 
                      ? 'bg-white border-gray-200 hover:border-blue-300' 
                      : 'bg-gray-700 border-gray-600 hover:border-blue-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm leading-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        {item.headline}
                      </div>
                      <div className={`text-xs mt-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                        {item.subtext}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-500 mt-2 group-hover:text-blue-600">
                        {item.cta}
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ========== ORIGINAL SUPPLIER WIZARD (EXACT CODE FROM intelleges-demo) ==========
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              {/* Logo - Intelleges Brand Colors */}
              <svg viewBox="0 0 50 50" className="w-10 h-10 flex-shrink-0">
                <circle cx="25" cy="25" r="20" fill="none" stroke="#2496F4" strokeWidth="6" strokeDasharray="80 45" transform="rotate(-45 25 25)"/>
                <path d="M 10 35 Q 5 25 15 20" fill="none" stroke="#FFCA16" strokeWidth="6" strokeLinecap="round"/>
                <path d="M 35 40 Q 45 35 40 25" fill="none" stroke="#F2574D" strokeWidth="6" strokeLinecap="round"/>
              </svg>
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#111117' }}>Intelleges</h1>
                <p className="text-sm text-gray-600">Federal Compliance Management System</p>
              </div>
            </div>
            {/* Demo role switcher */}
            <select className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white">
              <option value="supplier">Supplier</option>
            </select>
          </div>
        </header>

        {/* Supplier Wizard */}
        <main className="max-w-4xl mx-auto py-8 px-6 flex-1">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {supplierSteps.map((s, idx) => (
                <React.Fragment key={s.step}>
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{ 
                        backgroundColor: s.step < supplierStep ? '#2496F4' : s.step === supplierStep ? '#2496F4' : '#E5E7EB',
                        color: s.step <= supplierStep ? 'white' : '#4B5563'
                      }}
                    >
                      {s.step < supplierStep ? '✓' : s.step}
                    </div>
                    <span 
                      className="text-xs mt-2 text-center max-w-[80px]"
                      style={{ color: s.step === supplierStep ? '#2496F4' : '#6B7280', fontWeight: s.step === supplierStep ? 500 : 400 }}
                    >
                      {s.title}
                    </span>
                  </div>
                  {idx < supplierSteps.length - 1 && (
                    <div 
                      className="flex-1 h-1 mx-2"
                      style={{ backgroundColor: s.step < supplierStep ? '#2496F4' : '#E5E7EB' }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Current Step Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {supplierSteps[supplierStep - 1].title}
            </h2>
            <p className="text-gray-600 mb-6">
              {supplierSteps[supplierStep - 1].description}
            </p>

            {/* Step-specific content */}
            {supplierStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access Code
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter your access code"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {supplierStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input type="text" defaultValue="Acme Aerospace Inc." className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input type="text" defaultValue="123 Industrial Blvd" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input type="text" defaultValue="Seattle" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input type="text" defaultValue="WA" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                    <input type="text" defaultValue="98101" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                  </div>
                </div>
              </div>
            )}

            {supplierStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input type="text" defaultValue="Jane Smith" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" defaultValue="jane.smith@acmeaero.com" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" defaultValue="(206) 555-1234" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> If you change the email address to someone else, you will be redirected to a routing form and a new access code will be sent to that person.
                  </p>
                </div>
              </div>
            )}

            {supplierStep === 4 && (
              <div className="space-y-6">
                <div className="border rounded-md p-4 mb-4" style={{ backgroundColor: "#EFF6FF", borderColor: "#2496F4" }}>
                  <p className="text-sm" style={{ color: "#111117" }}>
                    This is the compliance questionnaire section. Questions would be dynamically loaded based on the enterprise's requirements.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    1. Does your company have a Quality Management System (QMS)?
                  </label>
                  <div className="space-x-4">
                    <label className="inline-flex items-center">
                      <input type="radio" name="q1" className="mr-2" /> Yes
                    </label>
                    <label className="inline-flex items-center">
                      <input type="radio" name="q1" className="mr-2" /> No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    2. Is your company AS9100 certified?
                  </label>
                  <div className="space-x-4">
                    <label className="inline-flex items-center">
                      <input type="radio" name="q2" className="mr-2" /> Yes
                    </label>
                    <label className="inline-flex items-center">
                      <input type="radio" name="q2" className="mr-2" /> No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    3. Upload your certification document
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                    <p className="text-gray-500">Drag and drop files here or click to browse</p>
                  </div>
                </div>
              </div>
            )}

            {supplierStep === 5 && (
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-md p-6 max-h-48 overflow-y-auto text-sm text-gray-700">
                  <p className="font-medium mb-2">Terms and Conditions</p>
                  <p>By signing below, I certify that all information provided is accurate and complete to the best of my knowledge. I understand that false statements may result in disqualification from supplier programs...</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type your full name to sign
                  </label>
                  <input type="text" placeholder="Full Legal Name" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input type="text" placeholder="Your Title" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
            )}

            {supplierStep === 6 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#EFF6FF' }}>
                  <span className="text-3xl" style={{ color: '#2496F4' }}>✓</span>
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#111117' }}>Submission Complete!</h3>
                <p className="text-gray-600 mb-6">Thank you for completing your compliance submission.</p>
                <button 
                  className="inline-flex items-center gap-2 px-6 py-2 text-white rounded-md hover:opacity-90"
                  style={{ backgroundColor: '#2496F4' }}
                >
                  <FileText className="w-4 h-4" />
                  Download PDF Receipt
                </button>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button 
                onClick={() => setSupplierStep(Math.max(1, supplierStep - 1))}
                disabled={supplierStep === 1}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Back
              </button>
              <button 
                onClick={() => {
                  if (supplierStep === 1) {
                    // After access code, show routing modal
                    setShowRoutingModal(true);
                  } else {
                    setSupplierStep(Math.min(6, supplierStep + 1));
                  }
                }}
                disabled={supplierStep === 6}
                className="px-6 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                style={{ backgroundColor: '#2496F4' }}
              >
                {supplierStep === 5 ? 'Submit' : 'Continue'}
              </button>
            </div>
          </div>

          {/* ===== ROUTING MODAL ===== */}
          {showRoutingModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <svg viewBox="0 0 50 50" className="w-8 h-8 flex-shrink-0">
                      <circle cx="25" cy="25" r="20" fill="none" stroke="#2496F4" strokeWidth="6" strokeDasharray="80 45" transform="rotate(-45 25 25)"/>
                      <path d="M 10 35 Q 5 25 15 20" fill="none" stroke="#FFCA16" strokeWidth="6" strokeLinecap="round"/>
                      <path d="M 35 40 Q 45 35 40 25" fill="none" stroke="#F2574D" strokeWidth="6" strokeLinecap="round"/>
                    </svg>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Welcome back, {supplierData.primaryContact}!</h2>
                      <p className="text-sm text-gray-500">{supplierData.company}</p>
                    </div>
                  </div>
                </div>

                {/* Latest Communication - Prominent */}
                <div className="p-6 bg-blue-50 border-b border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Latest Request</span>
                        <span className="text-xs text-gray-500">• {latestCommunication.daysSinceSent} days ago</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{latestCommunication.subject}</h3>
                      <p className="text-sm text-gray-600 mb-3">{latestCommunication.preview}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>From: {latestCommunication.from}</span>
                        <span>Due: {latestCommunication.linkedTask.dueDate}</span>
                        {latestCommunication.linkedTask.daysUntilDue > 0 ? (
                          <span className="text-amber-600 font-medium">{latestCommunication.linkedTask.daysUntilDue} days remaining</span>
                        ) : (
                          <span className="text-red-600 font-medium">Overdue</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Primary CTA - Go to Task */}
                  <button 
                    onClick={() => {
                      setShowRoutingModal(false);
                      // Navigate to the specific questionnaire/task
                      // For now, navigate to questionnaire page (will be dynamic based on linkedTask.id)
                      setLocation('/partner/questionnaire/1');
                    }}
                    className="w-full mt-4 px-6 py-3 text-white rounded-lg font-medium hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#2496F4' }}
                  >
                    <ChevronRight className="w-5 h-5" />
                    Go Directly to This Request
                  </button>
                </div>

                {/* Compliance Health Summary */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                        style={{ backgroundColor: complianceHealth.bg }}
                      >
                        {complianceHealth.emoji}
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Your Compliance with</div>
                        <div className="font-semibold text-gray-900">{supplierData.clientName}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="text-2xl font-bold" style={{ color: complianceHealth.color }}>
                            {supplierData.overallCompletion}%
                          </div>
                          <span className="text-sm" style={{ color: complianceHealth.color }}>
                            {complianceHealth.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>{openTasks} open tasks</div>
                      <div>{overdueTasks > 0 && <span className="text-red-600 font-medium">{overdueTasks} overdue</span>}</div>
                    </div>
                  </div>

                  {/* Secondary CTA - View Dashboard */}
                  <button 
                    onClick={() => {
                      setShowRoutingModal(false);
                      setAuthenticated(true);
                      setActiveTab('overview');
                    }}
                    className="w-full mt-4 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <Eye className="w-5 h-5" />
                    View Full Dashboard
                  </button>
                </div>

                {/* All Communications */}
                <div className="p-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    All Communications from {supplierData.clientName}
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {allCommunications.map(comm => (
                      <div 
                        key={comm.id}
                        className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                          comm.status === 'overdue' ? 'border-red-200 bg-red-50' :
                          comm.status === 'pending' ? 'border-blue-200 bg-blue-50' :
                          'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{comm.subject}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{comm.date}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {comm.status === 'overdue' && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">Overdue</span>
                            )}
                            {comm.status === 'pending' && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">Action Needed</span>
                            )}
                            {comm.status === 'in_progress' && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">In Progress</span>
                            )}
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtle Marketing Banner */}
                <div className="mx-6 mb-4">
                  <a 
                    href="#" 
                    className="block p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg hover:shadow-sm transition-shadow group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📄</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">
                          Managing compliance for multiple customers?
                        </div>
                        <div className="text-xs text-gray-500">
                          Learn how suppliers consolidate requests into one dashboard
                        </div>
                      </div>
                      <span className="text-xs font-medium text-blue-600 group-hover:text-blue-700 flex items-center gap-1">
                        Learn More <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </a>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Supplier ID: {supplierData.supplierId}</span>
                    <button className="text-blue-600 hover:underline flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" />
                      Need help?
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Subtle Marketing Footer on Landing Page */}
        <div className="mt-auto">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
              <a href="#" className="hover:text-gray-600 flex items-center gap-1">
                <span>🏆</span> Battelle Supplier of the Year
              </a>
              <span className="text-gray-300">|</span>
              <a href="#" className="hover:text-gray-600 flex items-center gap-1">
                <span>📄</span> 2025 Compliance Whitepaper
              </a>
              <span className="text-gray-300">|</span>
              <a href="#" className="hover:text-gray-600 flex items-center gap-1">
                <span>🚀</span> Supply Chain Solutions
              </a>
            </div>
          </div>
          <div className="border-t border-gray-200 bg-white">
            <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between text-xs text-gray-400">
              <span>© 2025 Intelleges. All rights reserved.</span>
              <div className="flex gap-4">
                <a href="#" className="hover:text-gray-600">Privacy</a>
                <a href="#" className="hover:text-gray-600">Terms</a>
                <a href="#" className="hover:text-gray-600">Support</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== SUPPLIER COMPLIANCE COMMAND CENTER ==========
  const status = getOverallStatus();

  // ========== QUESTIONNAIRE WORKFLOW ==========
  if (inQuestionnaireFlow) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 50 50" className="w-10 h-10 flex-shrink-0">
                <circle cx="25" cy="25" r="20" fill="none" stroke="#2496F4" strokeWidth="6" strokeDasharray="80 45" transform="rotate(-45 25 25)"/>
                <path d="M 10 35 Q 5 25 15 20" fill="none" stroke="#FFCA16" strokeWidth="6" strokeLinecap="round"/>
                <path d="M 35 40 Q 45 35 40 25" fill="none" stroke="#F2574D" strokeWidth="6" strokeLinecap="round"/>
              </svg>
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#111117' }}>Intelleges</h1>
                <p className="text-sm text-gray-600">Federal Compliance Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{supplierData.company}</span>
              <button 
                onClick={() => {
                  setInQuestionnaireFlow(false);
                  setActiveTab('overview');
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Exit to Dashboard
              </button>
            </div>
          </div>
        </header>

        {/* Questionnaire Wizard */}
        <main className="max-w-4xl mx-auto py-8 px-6 flex-1">
          {/* Task Context Banner */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">{latestCommunication.linkedTask.name}</div>
                <div className="text-sm text-gray-500">
                  Requested by {supplierData.clientName} • Due: {latestCommunication.linkedTask.dueDate}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {questionnaireSteps.map((s, idx) => (
                <React.Fragment key={s.step}>
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{ 
                        backgroundColor: s.step < questionnaireStep ? '#2496F4' : s.step === questionnaireStep ? '#2496F4' : '#E5E7EB',
                        color: s.step <= questionnaireStep ? 'white' : '#4B5563'
                      }}
                    >
                      {s.step < questionnaireStep ? '✓' : s.step}
                    </div>
                    <span 
                      className="text-xs mt-2 text-center max-w-[80px]"
                      style={{ color: s.step === questionnaireStep ? '#2496F4' : '#6B7280', fontWeight: s.step === questionnaireStep ? 500 : 400 }}
                    >
                      {s.title}
                    </span>
                  </div>
                  {idx < questionnaireSteps.length - 1 && (
                    <div 
                      className="flex-1 h-1 mx-2"
                      style={{ backgroundColor: s.step < questionnaireStep ? '#2496F4' : '#E5E7EB' }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Current Step Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {questionnaireSteps[questionnaireStep - 1].title}
            </h2>
            <p className="text-gray-600 mb-6">
              {questionnaireSteps[questionnaireStep - 1].description}
            </p>

            {/* Step 1: Company Information */}
            {questionnaireStep === 1 && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Please review and confirm your company information. Update any fields that have changed.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input type="text" defaultValue={supplierData.company} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input type="text" defaultValue="123 Industrial Blvd" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input type="text" defaultValue="Seattle" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input type="text" defaultValue="WA" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                    <input type="text" defaultValue="98101" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DUNS Number</label>
                  <input type="text" defaultValue="123456789" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CAGE Code</label>
                  <input type="text" defaultValue="1ABC2" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
            )}

            {/* Step 2: Contact Information */}
            {questionnaireStep === 2 && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Confirm the primary contact for this compliance submission.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input type="text" defaultValue={supplierData.primaryContact} className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" defaultValue="Compliance Manager" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" defaultValue="jane.smith@acmeaero.com" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" defaultValue="(206) 555-1234" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> If you need to reassign this submission to someone else, update the email address above. They will receive a new access code.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Questionnaire */}
            {questionnaireStep === 3 && (
              <div className="space-y-6">
                <div className="p-4 border rounded-lg" style={{ backgroundColor: "#EFF6FF", borderColor: "#2496F4" }}>
                  <p className="text-sm" style={{ color: "#111117" }}>
                    <strong>ISO 9001:2015 Certification Questionnaire</strong><br/>
                    Please answer the following questions and upload your current certificate.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    1. Is your company currently ISO 9001:2015 certified?
                  </label>
                  <div className="space-x-4">
                    <label className="inline-flex items-center">
                      <input type="radio" name="q1" className="mr-2" defaultChecked /> Yes
                    </label>
                    <label className="inline-flex items-center">
                      <input type="radio" name="q1" className="mr-2" /> No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    2. Certification expiration date
                  </label>
                  <input type="date" defaultValue="2025-02-08" className="px-4 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    3. Certifying body name
                  </label>
                  <input type="text" defaultValue="Bureau Veritas" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    4. Upload your current ISO 9001:2015 certificate
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-blue-400 cursor-pointer transition-colors">
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Drag and drop your certificate here, or click to browse</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, JPG, or PNG up to 10MB</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    5. Additional comments (optional)
                  </label>
                  <textarea 
                    rows={3} 
                    placeholder="Any additional information about your certification..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            )}

            {/* Step 4: E-Signature */}
            {questionnaireStep === 4 && (
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-md p-6 max-h-64 overflow-y-auto text-sm text-gray-700">
                  <p className="font-medium mb-3">Certification and Agreement</p>
                  <p className="mb-3">
                    By signing below, I certify that:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 mb-3">
                    <li>All information provided in this submission is accurate and complete to the best of my knowledge.</li>
                    <li>The uploaded documents are authentic and currently valid.</li>
                    <li>I am authorized to submit this information on behalf of {supplierData.company}.</li>
                    <li>I understand that false statements may result in disqualification from supplier programs and potential legal action.</li>
                  </ul>
                  <p>
                    I agree to notify {supplierData.clientName} promptly if any of the information provided changes or if any certifications expire or are revoked.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <input type="checkbox" id="agree" className="mt-1" />
                  <label htmlFor="agree" className="text-sm text-gray-700">
                    I have read and agree to the terms above
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type your full legal name to sign
                  </label>
                  <input type="text" placeholder="Full Legal Name" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input type="text" defaultValue="Compliance Manager" className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input type="text" value={new Date().toLocaleDateString()} disabled className="w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500" />
                </div>
              </div>
            )}

            {/* Step 5: Complete */}
            {questionnaireStep === 5 && (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#D1FAE5' }}>
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-semibold mb-2" style={{ color: '#111117' }}>Submission Complete!</h3>
                <p className="text-gray-600 mb-2">Thank you for completing your compliance submission.</p>
                <p className="text-sm text-gray-500 mb-6">
                  Confirmation #: <span className="font-mono font-medium">SUB-2025-{Math.random().toString(36).substr(2, 8).toUpperCase()}</span>
                </p>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
                  <h4 className="font-medium text-gray-900 mb-3">Submission Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Request:</span>
                      <span className="text-gray-900">{latestCommunication.linkedTask.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Submitted by:</span>
                      <span className="text-gray-900">{supplierData.primaryContact}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Company:</span>
                      <span className="text-gray-900">{supplierData.company}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span className="text-gray-900">{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className="text-green-600 font-medium">Pending Review</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button 
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg hover:opacity-90"
                    style={{ backgroundColor: '#2496F4' }}
                  >
                    <Download className="w-4 h-4" />
                    Download PDF Receipt
                  </button>
                  <button 
                    onClick={() => {
                      setInQuestionnaireFlow(false);
                      setQuestionnaireStep(1);
                      setActiveTab('overview');
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <Eye className="w-4 h-4" />
                    View Dashboard
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {questionnaireStep < 5 && (
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button 
                  onClick={() => {
                    if (questionnaireStep === 1) {
                      // Go back to dashboard
                      setInQuestionnaireFlow(false);
                      setActiveTab('overview');
                    } else {
                      setQuestionnaireStep(questionnaireStep - 1);
                    }
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {questionnaireStep === 1 ? 'Cancel' : 'Previous'}
                </button>
                <button 
                  onClick={() => setQuestionnaireStep(questionnaireStep + 1)}
                  className="px-6 py-2 text-white rounded-md hover:opacity-90"
                  style={{ backgroundColor: '#2496F4' }}
                >
                  {questionnaireStep === 4 ? 'Submit' : 'Next'}
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Subtle Marketing Footer */}
        <div className="mt-auto">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
              <a href="#" className="hover:text-gray-600 flex items-center gap-1">
                <span>🏆</span> Battelle Supplier of the Year
              </a>
              <span className="text-gray-300">|</span>
              <a href="#" className="hover:text-gray-600 flex items-center gap-1">
                <span>📄</span> 2025 Compliance Whitepaper
              </a>
            </div>
          </div>
          <div className="border-t border-gray-200 bg-white">
            <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between text-xs text-gray-400">
              <span>© 2025 Intelleges. All rights reserved.</span>
              <div className="flex gap-4">
                <a href="#" className="hover:text-gray-600">Privacy</a>
                <a href="#" className="hover:text-gray-600">Terms</a>
                <a href="#" className="hover:text-gray-600">Support</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'tasks', label: 'Your Tasks', badge: openTasks },
    { id: 'documents', label: 'Documents' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'history', label: 'History' },
    { id: 'messages', label: 'Messages', badge: unreadMessages },
    { id: 'support', label: 'Support' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header style={{ backgroundColor: '#2496F4' }} className="text-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 50 50" className="w-10 h-10 flex-shrink-0">
                  <circle cx="25" cy="25" r="20" fill="none" stroke="white" strokeWidth="6" strokeDasharray="80 45" transform="rotate(-45 25 25)"/>
                  <path d="M 10 35 Q 5 25 15 20" fill="none" stroke="#FFCA16" strokeWidth="6" strokeLinecap="round"/>
                  <path d="M 35 40 Q 45 35 40 25" fill="none" stroke="#F2574D" strokeWidth="6" strokeLinecap="round"/>
                </svg>
                <div>
                  <h1 className="text-lg font-bold">Supplier Compliance Portal</h1>
                  <p className="text-xs text-blue-100">{supplierData.company} • Customer: {supplierData.clientName}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 bg-white"
                style={{ color: status.color }}>
                <span>{status.icon}</span>
                Status: {status.text}
              </div>
              
              <button className="relative p-2 text-white hover:bg-blue-600 rounded-lg">
                <Bell className="w-5 h-5" />
                {overdueTasks > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {overdueTasks}
                  </span>
                )}
              </button>

              <button className="p-2 text-white hover:bg-blue-600 rounded-lg">
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex gap-1">
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      isActive 
                        ? 'border-blue-500 text-blue-600' 
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                        isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">

        {/* ===== OVERVIEW TAB ===== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Compliance Scorecard */}
              <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Compliance Scorecard</h2>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Info className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {complianceScorecard.map(item => (
                    <div 
                      key={item.code}
                      className="border-2 rounded-lg p-3 text-center"
                      style={{ borderColor: getScoreColor(item.status) }}
                    >
                      <div className="text-xs font-bold text-gray-500">{item.code}</div>
                      <div className="text-xs text-gray-500 truncate">{item.label}</div>
                      <div className="text-2xl font-bold mt-1" style={{ color: getScoreColor(item.status) }}>
                        {item.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall Completion */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Overall Completion</h2>
                <p className="text-sm text-gray-500 mb-4">
                  You are {supplierData.overallCompletion}% complete for the current compliance cycle.
                </p>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full rounded-full"
                    style={{ width: `${supplierData.overallCompletion}%`, backgroundColor: '#2496F4' }}
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="font-medium text-blue-900 text-sm">What's next?</div>
                  <p className="text-xs text-blue-700 mt-1">
                    Next step: <strong>Upload your most recent HIPAA training policy.</strong> Estimated time: <strong>5 minutes</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Items + Timeline */}
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Your Action Items</h2>
                  <button className="text-sm text-blue-600 hover:underline" onClick={() => setActiveTab('tasks')}>
                    View All →
                  </button>
                </div>
                <div className="space-y-3">
                  {tasksData.filter(t => t.status !== 'complete').slice(0, 4).map(task => (
                    <div 
                      key={task.id}
                      className={`p-4 rounded-lg border ${task.status === 'overdue' ? 'bg-red-50 border-red-200' : 'border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{task.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{task.category}</div>
                        </div>
                        <StatusChip status={task.status} />
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-xs text-gray-500">
                          {task.dueDate && <span>Due: {task.dueDate}</span>}
                        </div>
                        <button 
                          onClick={() => {
                            setInQuestionnaireFlow(true);
                            setQuestionnaireStep(1);
                          }}
                          className="px-4 py-1.5 text-sm font-medium rounded-lg text-white"
                          style={{ backgroundColor: task.status === 'overdue' ? '#F2574D' : '#2496F4' }}
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Timeline</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Request sent:</span>
                    <span className="font-medium text-gray-900">January 20, 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Days since request:</span>
                    <span className="font-medium text-gray-900">28</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Current status:</span>
                    <span className="font-medium text-gray-900">Under Supplier Review</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Primary contact:</span>
                    <span className="font-medium text-gray-900">{supplierData.primaryContact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last modified:</span>
                    <span className="font-medium text-gray-900">2 days ago</span>
                  </div>
                </div>
                <button 
                  className="w-full mt-4 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
                  onClick={() => setActiveTab('history')}
                >
                  View full history
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== TASKS TAB ===== */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Your Tasks</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Task</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Assignee</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Due Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Last Updated</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {tasksData.map(task => (
                  <tr key={task.id} className={`border-b hover:bg-gray-50 ${task.status === 'overdue' ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{task.name}</td>
                    <td className="px-4 py-3 text-gray-600">{task.category}</td>
                    <td className="px-4 py-3"><StatusChip status={task.status} /></td>
                    <td className="px-4 py-3 text-gray-600">{task.assignee}</td>
                    <td className="px-4 py-3 text-gray-600">{task.dueDate || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{task.lastUpdated || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => {
                          setInQuestionnaireFlow(true);
                          setQuestionnaireStep(1);
                        }}
                        className="px-3 py-1.5 text-sm text-white rounded-lg" 
                        style={{ backgroundColor: '#2496F4' }}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== DOCUMENTS TAB ===== */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
              <button className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ backgroundColor: '#2496F4' }}>
                <Upload className="w-4 h-4" /> Upload Document
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 p-4">
              {documentsData.map(doc => (
                <div key={doc.id} className={`border rounded-lg p-4 ${
                  doc.status === 'expired' || doc.status === 'missing' ? 'border-red-300 bg-red-50' :
                  doc.status === 'expiring' ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-gray-900 text-sm">{doc.name}</div>
                    <StatusChip status={doc.status} />
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>{doc.category}</div>
                    {doc.uploadDate && <div>Uploaded: {doc.uploadDate}</div>}
                    {doc.expirationDate && <div>Expires: {doc.expirationDate}</div>}
                  </div>
                  <div className="mt-3 flex gap-2">
                    {doc.status === 'missing' ? (
                      <button className="flex-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg">Upload Now</button>
                    ) : (
                      <button className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50">View</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== CERTIFICATIONS TAB ===== */}
        {activeTab === 'certifications' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Certifications</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Certification</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Expiration</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Last Review</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Reviewer</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {certificationsData.map(cert => (
                  <tr key={cert.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{cert.name}</td>
                    <td className="px-4 py-3"><StatusChip status={cert.status} /></td>
                    <td className="px-4 py-3 text-gray-600">{cert.expiration}</td>
                    <td className="px-4 py-3 text-gray-600">{cert.lastReview}</td>
                    <td className="px-4 py-3 text-gray-600">{cert.reviewer}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50">
                        {cert.status === 'required' ? 'Start' : cert.status === 'expiring' ? 'Upload New' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== HISTORY TAB ===== */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">History</h2>
            </div>
            <div className="divide-y">
              {historyData.map(item => (
                <div key={item.id} className="p-4 flex items-start gap-4 hover:bg-gray-50">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <History className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{item.action}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">{item.entity}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">{item.details}</div>
                    <div className="text-xs text-gray-400 mt-1">By {item.user} on {item.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== MESSAGES TAB ===== */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Messages & Requests</h2>
              <button className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ backgroundColor: '#2496F4' }}>
                <MessageSquare className="w-4 h-4" /> New Message
              </button>
            </div>
            <div className="divide-y">
              {messagesData.map(msg => (
                <div key={msg.id} className={`p-4 flex items-start gap-4 hover:bg-gray-50 cursor-pointer ${msg.status === 'unread' ? 'bg-blue-50' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.type === 'inbound' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <MessageSquare className={`w-5 h-5 ${msg.type === 'inbound' ? 'text-blue-600' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${msg.status === 'unread' ? 'text-gray-900' : 'text-gray-700'}`}>
                        {msg.subject}
                      </span>
                      {msg.status === 'unread' && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {msg.type === 'inbound' ? `From: ${msg.from}` : `To: Intelleges Support`}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{msg.date}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== SUPPORT TAB ===== */}
        {activeTab === 'support' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Support</h2>
            <p className="text-sm text-gray-500 mb-6">
              Contact options, FAQs, and links to knowledge base. This is where suppliers go when they're stuck.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                <MessageSquare className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <div className="font-medium text-gray-900">Contact Support</div>
                <div className="text-xs text-gray-500 mt-1">Get help from our team</div>
              </div>
              <div className="border rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                <HelpCircle className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <div className="font-medium text-gray-900">FAQs</div>
                <div className="text-xs text-gray-500 mt-1">Common questions answered</div>
              </div>
              <div className="border rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                <FileText className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <div className="font-medium text-gray-900">Knowledge Base</div>
                <div className="text-xs text-gray-500 mt-1">Guides and documentation</div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Marketing Carousel */}
      <MarketingCarousel variant="light" />

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between text-sm text-gray-500">
          <div>© 2025 Intelleges. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-700">Privacy Policy</a>
            <a href="#" className="hover:text-gray-700">Terms of Service</a>
            <a href="#" className="hover:text-gray-700">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
