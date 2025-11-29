// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Menu, ChevronDown, ChevronRight, Plus, Archive, Search, Eye, RotateCcw, Building2, Users, FileText, ClipboardList, Settings, Shield, X, Upload, FileSpreadsheet, Sparkles, Loader2, Download, Filter, ChevronLeft, MoreVertical, Lock, ShieldCheck, History, Wrench, BarChart3, MessageSquare, CheckCircle, AlertTriangle, Clock, Calendar, HelpCircle, User, Award, Bell, ExternalLink, RefreshCw, FileCheck, FileClock, FileX, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { ContactSupplierDialog } from '@/components/ContactSupplierDialog';

export default function IntellegesQMS() {
  const [userRole, setUserRole] = useState('intelleges');
  const [expandedMenus, setExpandedMenus] = useState({});
  const [expandedSubMenus, setExpandedSubMenus] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [supplierStep, setSupplierStep] = useState(1);
  const [selectedTouchpoint, setSelectedTouchpoint] = useState('reps-certs-2025');
  const [dataGridView, setDataGridView] = useState({ open: false, entity: null });
  const [manualModal, setManualModal] = useState({ open: false, entity: null });
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, row: null, entity: null });
  const [cmsUploadModal, setCmsUploadModal] = useState({ open: false, questionnaire: null });
  const [cmsView, setCmsView] = useState('choice'); // 'choice', 'upload', 'edit'
  const [cmsContextMenu, setCmsContextMenu] = useState({ open: false, x: 0, y: 0, row: null });
  const [cmsPage, setCmsPage] = useState(1);
  const [selectedCmsPage, setSelectedCmsPage] = useState('access_code');
  const [selectedCmsLanguage, setSelectedCmsLanguage] = useState('en');
  const [cmsEditingRow, setCmsEditingRow] = useState(null);
  const [cmsEditValue, setCmsEditValue] = useState('');
  
  // Partner Management State
  const [partnerUploadModal, setPartnerUploadModal] = useState({ open: false });
  const [partnerManualModal, setPartnerManualModal] = useState({ open: false, mode: 'add', partner: null });
  const [personFormTab, setPersonFormTab] = useState('personal'); // 'personal', 'address', 'organization', 'access'
  const [spreadsheetUploadModal, setSpreadsheetUploadModal] = useState({ open: false, entity: null });
  
  // Protocol & Touchpoint Modal States
  const [protocolModal, setProtocolModal] = useState({ open: false, protocol: null });
  const [touchpointModal, setTouchpointModal] = useState({ open: false, touchpoint: null });
  const [partnertypeModal, setPartnertypeModal] = useState({ open: false, partnertype: null });
  const [groupModal, setGroupModal] = useState({ open: false, group: null });
  const [questionnaireModal, setQuestionnaireModal] = useState({ open: false, step: 1 });
  const [enterpriseModal, setEnterpriseModal] = useState({ open: false, enterprise: null });

  // Questionnaire Import Modal State
  const [qmProtocol, setQmProtocol] = useState('');
  const [qmTouchpoint, setQmTouchpoint] = useState('');
  const [qmPartnertype, setQmPartnertype] = useState('');
  const [qmLevel, setQmLevel] = useState('');
  const [qmFile, setQmFile] = useState<File | null>(null);
  const [qmUploading, setQmUploading] = useState(false);
  const qmFileInputRef = React.useRef<HTMLInputElement>(null);

  // Protocol Modal Form State
  const [protocolForm, setProtocolForm] = useState({
    enterpriseType: '', protocolName: '', endDate: '', keywords: '', domain: '', agency: '', purpose: ''
  });
  const [protocolSaving, setProtocolSaving] = useState(false);

  // Touchpoint Modal Form State
  const [touchpointForm, setTouchpointForm] = useState({
    protocol: '', frequency: '', sponsor: '', admin: '', locked: 'no', reminder: 'yes', purpose: '', startDate: '', endDate: ''
  });
  const [touchpointSaving, setTouchpointSaving] = useState(false);

  // Partnertype Modal Form State
  const [partnertypeForm, setPartnertypeForm] = useState({
    touchpoint: '', category: '', name: '', description: ''
  });
  const [partnertypeSaving, setPartnertypeSaving] = useState(false);

  // Group Modal Form State
  const [groupForm, setGroupForm] = useState({
    touchpoint: '', name: '', description: '', collection: 'opened'
  });
  const [groupSaving, setGroupSaving] = useState(false);

  // Enterprise Modal Form State
  const [enterpriseForm, setEnterpriseForm] = useState({
    name: '', country: 'United States', address1: '', address2: '', city: '', state: '', zipcode: '',
    licenseType: 'trial', partnerMax: 100, startDate: '', endDate: ''
  });
  const [enterpriseSaving, setEnterpriseSaving] = useState(false);

  const [partnerSearchFilters, setPartnerSearchFilters] = useState({
    protocol: '', touchpoint: '', partnerType: '', internalId: '', name: '',
    address1: '', address2: '', city: '', state: '', province: '', zipCode: '',
    country: '', phone: '', fax: '', firstName: '', lastName: '', title: '',
    email: '', dunsNumber: '', federalId: '', group: '', owner: '', dueDate: ''
  });
  const [partnerSearchExpanded, setPartnerSearchExpanded] = useState(false);
  
  // Partner Action Modals
  const [partnerResponsesModal, setPartnerResponsesModal] = useState({ open: false, partner: null });
  const [partnerHistoryModal, setPartnerHistoryModal] = useState({ open: false, partner: null });
  const [partnerDocumentsModal, setPartnerDocumentsModal] = useState({ open: false, partner: null });
  const [partnerConfirmModal, setPartnerConfirmModal] = useState({ open: false, action: null, partner: null });
  const [partnerContactModal, setPartnerContactModal] = useState({ open: false, partner: null });
  const [contactSupplierDialog, setContactSupplierDialog] = useState({ open: false, partner: null });
  const [approvalDialog, setApprovalDialog] = useState({ open: false, action: null, partner: null });
  
  // Admin Views
  const [adminView, setAdminView] = useState({ open: false, view: null }); // 'roles', 'permissions', 'audit', 'settings'
  
  // Supplier Dashboard State (Command Center)
  const [supplierAuthenticated, setSupplierAuthenticated] = useState(false);
  const [showRoutingModal, setShowRoutingModal] = useState(false);
  const [supplierViewMode, setSupplierViewMode] = useState('wizard'); // 'wizard' or 'dashboard'
  const [supplierActiveTab, setSupplierActiveTab] = useState('overview');
  const [supplierCarouselIndex, setSupplierCarouselIndex] = useState(0);
  
  // CENTRALIZED CMS DATA STORE - This drives both admin editor AND supplier view
  const [cmsData, setCmsData] = useState({
    // Access Code Page
    ACCESS_CODE_TITLE: '2025 Supplier Certifications and Assessment',
    ACCESS_CODE_SUBTITLE: 'Complete your annual compliance verification',
    ACCESS_CODE_PANEL_ONE: 'The Supplier Certification and Assessment Questionnaire is designed to ensure our supply base can comply with several U.S. Government statutory/regulatory requirements.',
    ACCESS_CODE_PANEL_TWO: '<b>Instructions:</b> Enter your Access Code from your invitation email in the applicable field below to begin the online questionnaire.',
    ACCESS_CODE_LABEL: 'Access Code:',
    ACCESS_CODE_SUBMIT_TEXT: 'SUBMIT',
    ACCESS_CODE_FOOTER_ONE: '*Required Fields',
    ACCESS_CODE_VALIDATION: 'Please enter a valid access code',
    RETRIEVE_ACCESS_CODE_TEXT: 'RETRIEVE ACCESS CODE',
    
    // Company Page (View)
    COMPANY_PAGE_TITLE: '2025 Supplier Certifications and Assessment',
    COMPANY_PAGE_SUBTITLE: '',
    COMPANY_PAGE_PANEL_ONE: 'The Supplier Certification and Assessment Questionnaire is designed to ensure our supply base can comply with several U.S. Government statutory/regulatory requirements.',
    COMPANY_PAGE_PANEL_TWO: '<b>Instructions:</b> Verify your Company Information. Click on the CORRECT button if no changes are required, or click the EDIT button to update.',
    COMPANY_PAGE_HEADER: 'Company Information (Please verify that your company information is correct)',
    COMPANY_PAGE_PREVIOUS_TEXT: 'MODIFY',
    COMPANY_PAGE_NEXT_TEXT: 'CORRECT',
    
    // Company Page (Edit)
    COMPANY_EDIT_PAGE_TITLE: '2025 Supplier Certifications and Assessment',
    COMPANY_EDIT_PAGE_PANEL_ONE: 'The Supplier Certification and Assessment Questionnaire is designed to ensure our supply base can comply with requirements.',
    COMPANY_EDIT_PAGE_PANEL_TWO: '<b>Instructions:</b> Modify your company information as needed. Address shown needs to match our vendor record.',
    COMPANY_EDIT_PAGE_HEADER: 'Company Information (Please verify that your company information is correct)',
    COMPANY_FIELD_ONE: 'Company:',
    COMPANY_FIELD_TWO: 'Physical Address',
    COMPANY_FIELD_THREE: 'Address One:',
    COMPANY_FIELD_FOUR: 'Address Two:',
    COMPANY_FIELD_FIVE: 'City:',
    COMPANY_FIELD_SIX: 'State/Province:',
    COMPANY_FIELD_SEVEN: 'Postal Code:',
    COMPANY_FIELD_EIGHT: 'Province:',
    COMPANY_FIELD_NINE: 'Country:',
    COMPANY_EDIT_PAGE_FOOTER_ONE: '*Required Fields',
    COMPANY_EDIT_PAGE_PREVIOUS_TEXT: 'CANCEL',
    COMPANY_EDIT_PAGE_NEXT_TEXT: 'SAVE',
    
    // Contact Page (View)
    CONTACT_PAGE_TITLE: '2025 Supplier Certifications and Assessment',
    CONTACT_PAGE_PANEL_ONE: 'The Supplier Certification and Assessment Questionnaire is designed to ensure compliance.',
    CONTACT_PAGE_PANEL_TWO: '<b>Instructions:</b> Verify your Contact Information, click CORRECT if no change required, or EDIT to update. To redirect questionnaire to another individual, please use the link provided.',
    CONTACT_PAGE_HEADER: 'Contact Information (Please verify that your contact information is correct)',
    CONTACT_PAGE_PREVIOUS_TEXT: 'BACK',
    CONTACT_PAGE_NEXT_TEXT: 'LOOKS GOOD',
    
    // Contact Page (Edit)
    CONTACT_EDIT_PAGE_TITLE: '2025 Supplier Certifications and Assessment',
    CONTACT_EDIT_PAGE_PANEL_TWO: '<b>Instructions:</b> Modify your contact information as needed. After making the applicable change(s), click the SAVE button.',
    CONTACT_EDIT_PAGE_HEADER: 'Contact Information (Please verify that your contact information is correct)',
    CONTACT_EDIT_FIELD_ONE: 'First Name:',
    CONTACT_EDIT_FIELD_TWO: 'Last Name:',
    CONTACT_EDIT_FIELD_THREE: 'Job Title:',
    CONTACT_EDIT_FIELD_FOUR: 'Email:',
    CONTACT_EDIT_FIELD_FIVE: 'Phone:',
    CONTACT_EDIT_FIELD_SIX: 'Fax:',
    CONTACT_EDIT_PAGE_EMAIL_CHANGE_CONFIRMATION: 'You have changed email address. Would you like to redirect this questionnaire to someone else?',
    CONTACT_EDIT_PAGE_FOOTER_ONE: '*Required Fields',
    CONTACT_EDIT_PAGE_PREVIOUS_TEXT: 'CANCEL',
    CONTACT_EDIT_PAGE_NEXT_TEXT: 'SAVE',
    
    // Questionnaire Page
    QUESTIONNAIRE_PAGE_TITLE: '2025 Supplier Certifications and Assessment',
    QUESTIONNAIRE_PAGE_PANEL_ONE: 'To view a PDF copy of the questionnaire, click on the Questionnaire (PDF) hyperlink in the upper right corner of this page.',
    QUESTIONNAIRE_PAGE_PANEL_TWO: '<b>Instructions:</b> Select the answer that best represents your company, click NEXT to continue. <span style="color:red;"><b>All questions require a response.</b></span>',
    SAVE_FOR_LATER_TEXT: 'SAVE FOR LATER',
    SAVE_EXIT_DIALOG_TITLE: 'Save Progress & Exit',
    SAVE_EXIT_DIALOG_MESSAGE: 'Your progress has been automatically saved. You can resume this questionnaire anytime using your access code.',
    SAVE_EXIT_RESUME_LABEL: 'Your Access Code:',
    SAVE_EXIT_COPY_BUTTON: 'Copy Access Code',
    SAVE_EXIT_COPIED_TOAST: 'Access code copied to clipboard!',
    SAVE_EXIT_INSTRUCTIONS: 'To resume later, simply return to the login page and enter this access code. All your responses will be preserved.',
    SAVE_EXIT_CLOSE_BUTTON: 'Close & Exit',
    QUESTIONNAIRE_PDF: 'Questionnaire (PDF)',
    QUESTIONNAIRE_FAQ: 'FAQ',
    QUESTIONNAIRE_PAGE_PREVIOUS_TEXT: 'PREVIOUS',
    QUESTIONNAIRE_PAGE_NEXT_TEXT: 'NEXT',
    
    // E-Signature Page
    ESIGNATURE_PAGE_TITLE: '2025 Supplier Certifications and Assessment',
    ESIGNATURE_PAGE_PANEL_ONE: 'The Supplier Certification and Assessment Questionnaire is designed to ensure compliance.',
    ESIGNATURE_PAGE_PANEL_TWO: '<b>Instructions:</b> An eSignature is required to complete the questionnaire. Click NEXT to continue to the Confirmation page.',
    ESIGNATURE_PAGE_TEXT: 'All information provided is secure and completely confidential. None of this information will be shared with anyone other than the requesting organization for purposes assisting you with assessing your compliance.',
    ESIGNATURE_FIELD_ONE: 'First Name:',
    ESIGNATURE_FIELD_TWO: 'Last Name:',
    ESIGNATURE_FIELD_THREE: 'Email:',
    ESIGNATURE_FOOTER_ONE: '*Required Fields',
    ESIGNATURE_PAGE_PREVIOUS_TEXT: 'PREVIOUS',
    ESIGNATURE_PAGE_NEXT_TEXT: 'SUBMIT',
    
    // Confirmation Page
    CONFIRMATION_PAGE_TITLE: '2025 Supplier Certifications and Assessment',
    CONFIRMATION_PAGE_PANEL_ONE: 'Thank you for completing the questionnaire.',
    CONFIRMATION_PAGE_PANEL_TWO: '<b>Instructions:</b> Please click EXIT to log out of the online tool. Thank you.',
    CONFIRMATION_PAGE_HEADLINE: 'Submission Complete',
    CONFIRMATION_PAGE_SIGNOFF_STATEMENT: 'Thank you for completing the questionnaire. You have successfully completed the online questionnaire and will receive a CONFIRMATION EMAIL shortly.',
    CONFIRMATION_PAGE_SIGNOFF_INCOMPLETE_STATEMENT: 'Your questionnaire is INCOMPLETE. Please complete all required fields.',
    CONFIRMATION_PAGE_ALERTIFY: 'Thank you for submitting your information. You will receive an email with the CURRENT STATUS of your questionnaire.',
    CONFIRMATION_PAGE_PREVIOUS_TEXT: 'Print PDF Copy',
    CONFIRMATION_PAGE_NEXT_TEXT: 'EXIT',
    CONFIRMATION_PAGE_EXIT_LINK: 'https://yourcompany.com',
    CONTACT_US_EMAIL: 'Contact Us',
    
    // Redirect Page
    REDIRECT_PAGE_TITLE: 'Redirect Questionnaire',
    REDIRECT_PAGE_PANEL_ONE: 'The questionnaire is designed to ensure compliance with requirements.',
    REDIRECT_PAGE_PANEL_TWO: '<b>Instructions:</b> Please complete the form below to redirect the online questionnaire request to the correct individual.',
    REDIRECT_PAGE_HEADER: 'Redirect to New Contact',
    REDIRECT_PAGE_HEADER_TEXT: 'You have indicated you are NOT the correct person to complete this questionnaire. To redirect the invitation to another person, complete the fields below and click REDIRECT.',
    REDIRECT_PAGE_FIELD_ONE: 'First Name:',
    REDIRECT_PAGE_FIELD_TWO: 'Last Name:',
    REDIRECT_PAGE_FIELD_THREE: 'Title:',
    REDIRECT_PAGE_FIELD_FOUR: 'Email:',
    REDIRECT_PAGE_FIELD_FIVE: 'Phone:',
    REDIRECT_PAGE_FIELD_SIX: 'Fax:',
    REDIRECT_PAGE_PREVIOUS_TEXT: 'CANCEL',
    REDIRECT_PAGE_NEXT_TEXT: 'REDIRECT',
  });

  // Helper to update CMS value
  const updateCmsValue = (key, value) => {
    setCmsData(prev => ({ ...prev, [key]: value }));
  };

  // Helper to strip HTML for display
  const stripHtml = (html) => html ? html.replace(/<[^>]*>/g, '') : '';
  
  // ============================================
  // CENTRALIZED AMS DATA STORE - AutoMail System
  // ============================================
  const [amsData, setAmsData] = useState({
    // Type 1: Invitation
    INVITE_SUBJECT: '[enterprisecompanyname] [touchpointYear] Supplier Certifications and Assessment Questionnaire – Invitation',
    INVITE_TEXT: `<p>Dear Valued Supplier,</p>
<p>As a potential supplier or existing valued supplier, [enterprisecompanyname] is required to obtain various information/Certifications to ensure our supply base can be deemed "Responsible" as defined at FAR Part 9.104.</p>
<p>For [touchpointYear], we have combined the online Annual Certifications and Representations and the Supplier Responsibility Assessment requirements into one questionnaire.</p>
<p>To begin the online [touchpointYear] Supplier Certifications and Assessment, please click on this <a href="[enterpriseapplicationpath]">hyperlink</a> and enter Access Code <span style="color:red;font-weight:bold;">[partner Access Code]</span> which is unique to your company.</p>
<p><strong>NOTE:</strong> An online Certifications and Assessment is required for each supplier's location supplying material or a service to [enterprisecompanyname], therefore you may receive multiple notifications, which is not in error.</p>
<p>To assist you with the online Certifications and Assessment, we've included helpful hints, links to the applicable FAR/DFARS clauses and/or publications, as well as provided a PDF copy of the questions contained in online questionnaire which can be viewed by clicking on the Questionnaire (PDF) link in the upper-right hand corner.</p>
<p><span style="color:red;">Please complete the online Certifications and Assessment no later than <strong>[Due Date]</strong>.</span></p>
<p>In the event you are not the correct person to complete the online Certifications and Assessment, please click <a href="[forward to]">here</a> to re-direct the invitation to the appropriate individual.</p>
<p>The online Certifications and Assessment is provided by Intelleges®, who is [enterprisecompanyname]'s third party administrator of this online process. All information provided is secure and completely confidential.</p>
<p>Per [enterprisecompanyname] policy, the Buyer or Commodity Manager is not authorized to award a purchase order or agreement until there is an "approved" Certifications and Assessment on file.</p>
<p>[enterprisecompanyname] extends its sincere thanks in advance for your support and assistance with this key compliance requirement.</p>`,
    INVITE_FOOTER: 'If you have any questions, please contact your applicable Sourcing/Procurement representative or the Sourcing Compliance Team at [ownerEmail]',
    INVITE_SIGNATURE: '[ownerFullName]',
    INVITE_SEND_FACTOR: 7,

    // Type 2: Incomplete Notification
    INCOMPLETE_SUBJECT: '[enterprisecompanyname] [touchpointYear] Supplier Certifications and Assessment Questionnaire – Incomplete',
    INCOMPLETE_TEXT: `<p>Dear [personfirstname] [lastname],</p>
<p>Thank you for accessing the online <i>[touchpointYear] Supplier Certifications and Representations</i> questionnaire.</p>
<p>To date, the completion status of your company's online questionnaire is <span style="color:red;font-weight:bold;">INCOMPLETE</span>.</p>
<p>Please take the time now to finish. To continue completing your online certification questionnaire please click on this <a href="[enterpriseapplicationpath]">hyperlink</a> and enter Access Code <span style="color:green;font-weight:bold;">[partner Access Code]</span> which is unique to your company.</p>
<p>In the event you are not the correct person to complete the online <i>[touchpointYear] Supplier Certifications and Representations</i> questionnaire, please click <a href="[forward to]">here</a> to re-direct the invitation to the correct individual.</p>
<p><span style="color:red;"><strong>Please complete this questionnaire [Due Date]</strong></span> – per [enterprisecompanyname] policy, the Buyer or Commodity Manager is not authorized to award the purchase order or agreement until the completed <i>[touchpointYear] Supplier Certifications and Representations</i> is obtained.</p>
<p>Your prompt response to this request is greatly appreciated.</p>
<p>Thank you.</p>`,
    INCOMPLETE_FOOTER: 'If you have any questions, please contact your applicable Commodity Manager/Buyer or the Certs/Reps Process Administrator at [ownerEmail]',
    INCOMPLETE_SIGNATURE: '[ownerFullName]',
    INCOMPLETE_SEND_FACTOR: 7,

    // Type 3: Complete Confirmation
    COMPLETE_SUBJECT: '[enterprisecompanyname] [touchpointYear] Supplier Certifications and Assessment Questionnaire – Complete Confirmation',
    COMPLETE_TEXT: `<p>Dear [personfirstname] [lastname],</p>
<p>Thank you for completing [enterprisecompanyname]'s <i>Annual Supplier Certifications and Representations</i> for calendar year [touchpointYear].</p>
<p>Please retain this <a href="[enterpriseapplicationpath]">hyperlink</a> and Access Code <span style="color:green;font-weight:bold;">[partner Access Code]</span> in case you need to make any changes to your online Certification submittal.</p>
<p>Please find attached PDF Confirmation. Retain this PDF as proof of your submission.</p>
<p>Thanks again for completing your online Certs & Reps Certification for [touchpointYear].</p>`,
    COMPLETE_FOOTER: 'If you have any questions, please contact your applicable Commodity Manager/Buyer or the Certs/Reps Process Administrator at [ownerEmail]',
    COMPLETE_SIGNATURE: '[ownerFullName]',
    COMPLETE_SEND_FACTOR: 0,

    // Type 1010: First Reminder
    REMINDER1_SUBJECT: '[enterprisecompanyname] [touchpointYear] Supplier Certifications and Assessment Questionnaire – First Reminder',
    REMINDER1_TEXT: `<p>Dear [personfirstname] [lastname],</p>
<p>To date, our records indicate that you have <span style="color:red;font-weight:bold;">not yet responded</span> to our [enterprisecompanyname] Annual Supplier Certifications and Representations for calendar year [touchpointYear] which was due on or before [Due Date]. The initial invitation was sent to your attention on [Invite Date] from Intelleges®, [enterprisecompanyname]'s third party administrator.</p>
<p>In case you mistook the <i>Annual Supplier Certifications and Representations</i> invitation as SPAM, we are providing the link and your Access Code again. To complete your online Certification please click on this <a href="[enterpriseapplicationpath]">hyperlink</a> and enter Access Code <span style="color:green;font-weight:bold;">[partner Access Code]</span> which is unique to your company.</p>
<p>Please complete this online Certification <span style="color:red;"><strong>as soon as possible</strong></span>. Per [enterprisecompanyname] policy, the Buyer or Commodity Manager is not authorized to award the purchase order or agreement until the completed <i>Annual Supplier Certifications and Representations</i> is obtained.</p>
<p>In the event you are not the correct person to complete the online Certification, please click <a href="[forward to]">here</a> to re-direct the invitation to the correct individual.</p>
<p>Your prompt response to this key compliance request is greatly appreciated.</p>
<p>Thank you.</p>`,
    REMINDER1_FOOTER: 'If you have any questions, please contact your applicable Commodity Manager/Buyer or the Certs/Reps Process Administrator at [ownerEmail]',
    REMINDER1_SIGNATURE: '[ownerFullName]',
    REMINDER1_SEND_FACTOR: 7,

    // Type 1011: Second Reminder
    REMINDER2_SUBJECT: '[enterprisecompanyname] [touchpointYear] Supplier Certifications and Assessment Questionnaire – Second Reminder',
    REMINDER2_TEXT: `<p>Dear [personfirstname] [lastname],</p>
<p>To date, our records indicate that you have <span style="color:red;font-weight:bold;">not yet responded</span> to our [enterprisecompanyname] <i>[touchpointYear] Supplier Representations and Certifications</i> (Reps and Certs).</p>
<p>Please complete this online Certification <span style="color:red;"><strong>as soon as possible</strong></span>. Per [enterprisecompanyname] policy, the Buyer or Commodity Manager is not authorized to award the purchase order or agreement until the completed <i>Annual Supplier Certifications and Representations</i> is obtained.</p>
<p>To complete your online Certification please click on this <a href="[enterpriseapplicationpath]">hyperlink</a> and enter Access Code <span style="color:green;font-weight:bold;">[partner Access Code]</span>.</p>
<p>Thank you.</p>`,
    REMINDER2_FOOTER: 'If you have any questions, please contact your applicable Commodity Manager/Buyer or the Certs/Reps Process Administrator at [ownerEmail]',
    REMINDER2_SIGNATURE: '[ownerFullName]',
    REMINDER2_SEND_FACTOR: 7,

    // Type 1012: Third Reminder
    REMINDER3_SUBJECT: '[enterprisecompanyname] [touchpointYear] Supplier Certifications and Assessment Questionnaire – Third Reminder',
    REMINDER3_TEXT: `<p>Dear [personfirstname] [lastname],</p>
<p>This is our <strong>third and final reminder</strong>.</p>
<p>To date, our records indicate that you have <span style="color:red;font-weight:bold;">not yet responded</span> to our [enterprisecompanyname] <i>[touchpointYear] Supplier Representations and Certifications</i> (Reps and Certs).</p>
<p>Please complete this online Certification <span style="color:red;"><strong>immediately</strong></span>.</p>
<p>To complete your online Certification please click on this <a href="[enterpriseapplicationpath]">hyperlink</a> and enter Access Code <span style="color:green;font-weight:bold;">[partner Access Code]</span>.</p>`,
    REMINDER3_FOOTER: 'If you have any questions, please contact your applicable Commodity Manager/Buyer or the Certs/Reps Process Administrator at [ownerEmail]',
    REMINDER3_SIGNATURE: '[ownerFullName]',
    REMINDER3_SEND_FACTOR: 7,

    // Type 1013: Past Due
    PASTDUE_SUBJECT: '[enterprisecompanyname] [touchpointYear] Supplier Certifications and Assessment Questionnaire – Past Due',
    PASTDUE_TEXT: `<p><a><span style="color:Red;"><b>***Please note – Your online <i>[touchpointYear] Certification and Assessment</i> is past due***</b></span></a></p>
<p>Dear [personfirstname] [lastname],</p>
<p>To date, our records indicate that you have <span style="color:red;font-weight:bold;">not yet responded</span> to our [enterprisecompanyname] <i>[touchpointYear] Supplier Representations and Certifications</i>.</p>
<p><strong>Your questionnaire is now PAST DUE.</strong></p>
<p>Please complete this online Certification <span style="color:red;"><strong>immediately</strong></span> to avoid potential impact to purchase orders.</p>
<p>To complete your online Certification please click on this <a href="[enterpriseapplicationpath]">hyperlink</a> and enter Access Code <span style="color:green;font-weight:bold;">[partner Access Code]</span>.</p>`,
    PASTDUE_FOOTER: 'If you have any questions, please contact your applicable Commodity Manager/Buyer or the Certs/Reps Process Administrator at [ownerEmail]',
    PASTDUE_SIGNATURE: '[ownerFullName]',
    PASTDUE_SEND_FACTOR: 7,

    // Type 1007: FAR 12 Invitation
    FAR12_SUBJECT: '[enterprisecompanyname] [touchpointYear] Supplier Certifications and Assessment Questionnaire – FAR 12 Invitation',
    FAR12_TEXT: `<p>Dear Valued Supplier,</p>
<p>Thank you for completing the <i>[touchpointYear] Supplier Representations and Certifications</i> (Reps and Certs) requirement.</p>
<p>Initially, you completed the Commercial FAR requirement. Based on your responses, you are now required to complete an additional FAR 12 questionnaire.</p>
<p>To complete this requirement, please click on this <a href="[enterpriseapplicationpath]">hyperlink</a> and enter Access Code <span style="color:green;font-weight:bold;">[partner Access Code]</span>.</p>`,
    FAR12_FOOTER: 'If you have any questions, please contact your applicable Sourcing/Procurement representative at [ownerEmail]',
    FAR12_SIGNATURE: '[ownerFullName]',
    FAR12_SEND_FACTOR: 7,

    // Type 1008: FAR 15 Invitation
    FAR15_SUBJECT: '[enterprisecompanyname] [touchpointYear] Supplier Certifications and Assessment Questionnaire – FAR 15 Invitation',
    FAR15_TEXT: `<p>Dear Valued Supplier,</p>
<p>Thank you for completing the <i>[touchpointYear] Supplier Representations and Certifications</i> (Reps and Certs) requirement.</p>
<p>Initially, you completed the Commercial FAR requirement. Based on your responses, you are now required to complete an additional FAR 15 questionnaire.</p>
<p>To complete this requirement, please click on this <a href="[enterpriseapplicationpath]">hyperlink</a> and enter Access Code <span style="color:green;font-weight:bold;">[partner Access Code]</span>.</p>`,
    FAR15_FOOTER: 'If you have any questions, please contact your applicable Sourcing/Procurement representative at [ownerEmail]',
    FAR15_SIGNATURE: '[ownerFullName]',
    FAR15_SEND_FACTOR: 7,
  });

  // Helper to update AMS value
  const updateAmsValue = (key, value) => {
    setAmsData(prev => ({ ...prev, [key]: value }));
  };

  // Intelleges Proprietary Merge Tags
  const mergeTags = [
    { tag: '[firstname]', description: 'Contact first name', category: 'Person', example: 'John' },
    { tag: '[lastname]', description: 'Contact last name', category: 'Person', example: 'Smith' },
    { tag: '[personfirstname]', description: 'Person first name', category: 'Person', example: 'John' },
    { tag: '[personfullname]', description: 'Person full name', category: 'Person', example: 'John Smith' },
    { tag: '[personemail]', description: 'Person email', category: 'Person', example: 'john.smith@acme.com' },
    { tag: '[personphone]', description: 'Person phone', category: 'Person', example: '(512) 555-0123' },
    { tag: '[persontitle]', description: 'Person job title', category: 'Person', example: 'Compliance Officer' },
    { tag: '[title]', description: 'Job title', category: 'Person', example: 'Compliance Officer' },
    { tag: '[email address]', description: 'Email address', category: 'Person', example: 'john.smith@acme.com' },
    { tag: '[phone number]', description: 'Phone number', category: 'Person', example: '(512) 555-0123' },
    { tag: '[partner name]', description: 'Partner/Company name', category: 'Partner', example: 'Acme Corporation' },
    { tag: '[partnername]', description: 'Partner/Company name', category: 'Partner', example: 'Acme Corporation' },
    { tag: '[partner address one]', description: 'Address line 1', category: 'Partner', example: '123 Main Street' },
    { tag: '[partner_city]', description: 'City', category: 'Partner', example: 'Austin' },
    { tag: '[partner_state]', description: 'State/Province', category: 'Partner', example: 'TX' },
    { tag: '[partner zip code]', description: 'Postal code', category: 'Partner', example: '78701' },
    { tag: '[partner country]', description: 'Country', category: 'Partner', example: 'United States' },
    { tag: '[partner Access Code]', description: 'Unique access code', category: 'Partner', example: '329347PW' },
    { tag: '[enterprisecompanyname]', description: 'Enterprise company', category: 'Enterprise', example: 'Celestica' },
    { tag: '[enterpriseapplicationpath]', description: 'Application URL', category: 'Enterprise', example: 'https://intelleges.com/questionnaire' },
    { tag: '[company url]', description: 'Company website', category: 'Enterprise', example: 'https://celestica.com' },
    { tag: '[industrySector]', description: 'Industry sector', category: 'Enterprise', example: 'Aerospace & Defense' },
    { tag: '[ownerEmail]', description: 'Owner email', category: 'Owner', example: 'compliance@celestica.com' },
    { tag: '[ownerFirstname]', description: 'Owner first name', category: 'Owner', example: 'Giorgio' },
    { tag: '[ownerLastname]', description: 'Owner last name', category: 'Owner', example: 'Palmisano' },
    { tag: '[ownerFullName]', description: 'Owner full name', category: 'Owner', example: 'Giorgio Palmisano' },
    { tag: '[ownerPhoneNumber]', description: 'Owner phone', category: 'Owner', example: '(917) 818-0225' },
    { tag: '[ownerTitle]', description: 'Owner title', category: 'Owner', example: 'Compliance Manager' },
    { tag: '[forward to]', description: 'Forward/redirect URL', category: 'Links', example: 'https://intelleges.com/redirect' },
    { tag: '[unsubscribe]', description: 'Unsubscribe link', category: 'Links', example: 'https://intelleges.com/unsubscribe' },
    { tag: '[Due Date]', description: 'Due date', category: 'Dates', example: 'Dec 31, 2025' },
    { tag: '[Invite Date]', description: 'Invitation sent date', category: 'Dates', example: 'Nov 15, 2025' },
    { tag: '[touchpointYear]', description: 'Touchpoint year', category: 'Touchpoint', example: '2025' },
    { tag: '[iteratepartnername]', description: 'Iterate partner name', category: 'Advanced', example: 'Acme Corp - Site 1' },
    { tag: '[iteratepersontitle]', description: 'Iterate person title', category: 'Advanced', example: 'Quality Manager' },
    { tag: '[purchase order number]', description: 'PO number', category: 'Advanced', example: 'PO-2025-0001234' },
    { tag: '[purchase order version number]', description: 'PO version', category: 'Advanced', example: 'v1.0' },
  ];

  // Sample data for merge tag preview
  const sampleMergeData = {
    '[firstname]': 'John',
    '[lastname]': 'Smith',
    '[personfirstname]': 'John',
    '[personfullname]': 'John Smith',
    '[personemail]': 'john.smith@acme.com',
    '[personphone]': '(512) 555-0123',
    '[persontitle]': 'Compliance Officer',
    '[title]': 'Compliance Officer',
    '[email address]': 'john.smith@acme.com',
    '[phone number]': '(512) 555-0123',
    '[partner name]': 'Acme Corporation',
    '[partnername]': 'Acme Corporation',
    '[partner address one]': '123 Main Street',
    '[partner_city]': 'Austin',
    '[partner_state]': 'TX',
    '[partner zip code]': '78701',
    '[partner country]': 'United States',
    '[partner Access Code]': '329347PW',
    '[enterprisecompanyname]': 'Celestica',
    '[enterpriseapplicationpath]': 'https://intelleges.com/questionnaire',
    '[company url]': 'https://celestica.com',
    '[industrySector]': 'Aerospace & Defense',
    '[ownerEmail]': 'compliance@celestica.com',
    '[ownerFirstname]': 'Giorgio',
    '[ownerLastname]': 'Palmisano',
    '[ownerFullName]': 'Giorgio Palmisano',
    '[ownerPhoneNumber]': '(917) 818-0225',
    '[ownerTitle]': 'Compliance Manager',
    '[forward to]': 'https://intelleges.com/redirect',
    '[unsubscribe]': 'https://intelleges.com/unsubscribe',
    '[Due Date]': 'Dec 31, 2025',
    '[Invite Date]': 'Nov 15, 2025',
    '[touchpointYear]': '2025',
    '[iteratepartnername]': 'Acme Corp - Site 1',
    '[iteratepersontitle]': 'Quality Manager',
    '[purchase order number]': 'PO-2025-0001234',
    '[purchase order version number]': 'v1.0',
  };

  // Function to replace merge tags in text
  const replaceMergeTags = (text, data = sampleMergeData) => {
    let result = text;
    Object.keys(data).forEach(tag => {
      result = result.split(tag).join(data[tag]);
    });
    return result;
  };

  // Communication Schedule
  const communicationSchedule = [
    { type: 'Non-Intelleges Awareness', sendFactor: 0, description: 'Immediate' },
    { type: 'Invite', sendFactor: 7, description: '3-7 days after previous' },
    { type: 'Reminder - 1', sendFactor: 7, description: '3-7 days after previous' },
    { type: 'Reminder - 2', sendFactor: 7, description: '3-7 days after previous' },
    { type: 'Reminder - 3', sendFactor: 7, description: '3-7 days after previous' },
    { type: 'Reminder - 4', sendFactor: 7, description: '3-7 days after previous' },
    { type: 'Reminder - 5', sendFactor: 7, description: '3-7 days after previous' },
    { type: 'Reminder - 6', sendFactor: 7, description: '3-7 days after previous' },
    { type: 'FINAL Reminder - 7', sendFactor: 7, description: '3-7 days after previous' },
    { type: 'Incomplete Reminder', sendFactor: 0, description: '[SAVE FOR LATER] trigger' },
    { type: 'Complete Confirmation', sendFactor: 0, description: 'Immediate on completion' },
    { type: 'Ad hoc Reminders', sendFactor: 0, description: 'Manual trigger' },
  ];
  
  // AutoMail modal state
  const [autoMailModal, setAutoMailModal] = useState({ open: false, questionnaire: null });
  const [autoMailView, setAutoMailView] = useState('choice'); // 'choice', 'upload', 'edit', 'preview', 'test-send'
  const [autoMailContextMenu, setAutoMailContextMenu] = useState({ open: false, x: 0, y: 0, row: null });
  const [autoMailPage, setAutoMailPage] = useState(1);
  const [amsEditingRow, setAmsEditingRow] = useState(null);
  const [amsEditValue, setAmsEditValue] = useState({ subject: '', text: '', footer: '', signature: '' });
  const [amsPreviewRow, setAmsPreviewRow] = useState(null);
  const [sendTestEmail, setSendTestEmail] = useState({ open: false, row: null, email: '', sending: false, sent: false, error: null });
  const [selectedMailCategory, setSelectedMailCategory] = useState('all');

  // ============================================
  // QUESTIONNAIRE DATA STORE
  // Core 8 columns + CommentType conditional actions
  // ============================================
  const [questionnaireData, setQuestionnaireData] = useState({
    survey: 'Supplier Assessment 2025',
    questions: [
      // Page 1: Compliance
      {
        qid: 1001,
        page: 1,
        surveyset: 'Compliance',
        survey: 'Supplier Assessment 2025',
        question: 'Requirements pertaining to CMMC are either anticipated or are now in place via a contract clause or RFP requirement. Suppliers must achieve CMMC certification at or above the required CMMC level before issuance of a Purchase Order (LSC). Answer the question below based on your organization\'s current state regarding CMMC. Offeror represents that it (Select only ONE of the following):',
        response: 'DROPDOWN:Has achieved a CMMC certification at Level 1(AA);Has achieved a CMMC certification at Level 2(AB);Has achieved a CMMC certification at Level 3(AC);Has NOT achieved a CMMC certification(AD)',
        title: 'cmmc2025Status',
        required: 1,
        // CommentType fields
        commentType: null,
        commentBoxMessageText: null,
        uploadMessageText: null,
        calendarMessageText: null,
        // Auto-calculated fields with defaults
        length: 0,
        titleLength: 0,
        yValue: 1,
        nValue: 0,
        naValue: -1,
        otherValue: -1,
        qWeight: 0,
      },
      {
        qid: 1002,
        page: 1,
        surveyset: 'Compliance',
        survey: 'Supplier Assessment 2025',
        question: 'Suppliers that have been certified must provide: Offeror\'s certification level (Select only ONE):',
        response: 'DROPDOWN:Level 1(AA);Level 2(AB);Level 3(AC)',
        title: 'cmmcCertLevel',
        required: 1,
        commentType: null, commentBoxMessageText: null, uploadMessageText: null, calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1003,
        page: 1,
        surveyset: 'Compliance',
        survey: 'Supplier Assessment 2025',
        question: 'Do you have the name of the accredited 3rd party assessor?',
        response: 'Y/N',
        title: 'cmmcAssessor',
        required: 1,
        // YN_COMMENT_Y: If Yes, show comment box to enter assessor name
        commentType: 'YN_COMMENT_Y',
        commentBoxMessageText: 'Please provide the name of the accredited 3rd party assessor:',
        uploadMessageText: null,
        calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1004,
        page: 1,
        surveyset: 'Compliance',
        survey: 'Supplier Assessment 2025',
        question: 'Do you have the date of certification expiration?',
        response: 'Y/N',
        title: 'cmmcExpiration',
        required: 1,
        // YN_DUEDATE_Y: If Yes, show calendar to enter expiration date
        commentType: 'YN_DUEDATE_Y',
        commentBoxMessageText: null,
        uploadMessageText: null,
        calendarMessageText: 'Enter your CMMC certification expiration date:',
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      // Page 1: Company Information
      {
        qid: 1005,
        page: 1,
        surveyset: 'Company Information',
        survey: 'Supplier Assessment 2025',
        question: 'Please enter your primary NAICS Code:',
        response: 'TEXT_NUMBER_6',
        title: 'naicsCode',
        required: 1,
        commentType: null, commentBoxMessageText: null, uploadMessageText: null, calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1006,
        page: 1,
        surveyset: 'Company Information',
        survey: 'Supplier Assessment 2025',
        question: 'Do you have additional NAICS Codes you would like to list?',
        response: 'Y/N',
        title: 'additionalNaics',
        required: 0,
        // YN_COMMENT_Y: If Yes, show comment box to list additional codes
        commentType: 'YN_COMMENT_Y',
        commentBoxMessageText: 'Please list your additional NAICS codes (comma separated):',
        uploadMessageText: null,
        calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1007,
        page: 1,
        surveyset: 'Company Information',
        survey: 'Supplier Assessment 2025',
        question: 'Is your company a:',
        response: 'DROPDOWN:Large Business(AA);Small Business(AB);Other(AC)',
        title: 'businessSize',
        required: 1,
        // SKIP LOGIC: If Large Business (AA), skip small business regulations question
        skipLogic: 'Y',
        skipLogicAnswer: 'AA',  // Large Business code
        skipLogicJump: '1009',  // Jump to veteran-owned question, skipping Q1008
        // SPINOFF: If Small Business, spawn additional compliance questionnaire
        spinOffQuestionnaire: 'Y',
        spinoffid: 'AB:5001;AC:5001',  // Small Business or Other → spawn questionnaire 5001
        // EMAIL ALERT: Notify compliance team if Small Business selected
        emailalert: 'Y',
        emailalertlist: 'AB:compliance@intelleges.com;AC:compliance@intelleges.com',
        commentType: null, commentBoxMessageText: null, uploadMessageText: null, calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1008,
        page: 1,
        surveyset: 'Compliance',
        survey: 'Supplier Assessment 2025',
        question: 'Supplier understands, under 15 USC 645(d), any person who misrepresents a firm\'s status as a small business concern shall be punished by a fine of not more than $500,000 or by imprisonment for not more than 10 years, or both.',
        response: 'Y/N',
        title: 'understandsRegulations',
        required: 1,
        skipLogic: 'N', skipLogicAnswer: null, skipLogicJump: null,
        spinOffQuestionnaire: 'N', spinoffid: null,
        // EMAIL ALERT: Alert legal team if supplier does NOT acknowledge
        emailalert: 'Y',
        emailalertlist: '0:legal@intelleges.com;0:compliance@intelleges.com',
        // YN_WARNING_N: If No, show warning modal
        commentType: 'YN_WARNING_N',
        commentBoxMessageText: 'WARNING: You must acknowledge understanding of these regulations to continue. Failure to comply with 15 USC 645(d) may result in severe penalties including fines up to $500,000 and imprisonment.',
        uploadMessageText: null,
        calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      // Page 1: Diversity Information
      {
        qid: 1009,
        page: 1,
        surveyset: 'Diversity Information',
        survey: 'Supplier Assessment 2025',
        question: 'Is your company a veteran-owned business?',
        response: 'Y/N',
        title: 'veteranOwned',
        required: 1,
        // SKIP LOGIC: If No (0), skip the disabled veteran question
        skipLogic: 'Y',
        skipLogicAnswer: '0',  // No
        skipLogicJump: '1011', // Jump to minority-owned, skipping Q1010
        spinOffQuestionnaire: 'N', spinoffid: null,
        emailalert: 'N', emailalertlist: null,
        // YN_UPLOAD_Y: If Yes, upload certification
        commentType: 'YN_UPLOAD_Y',
        commentBoxMessageText: null,
        uploadMessageText: 'Please upload your Veteran-Owned Business certification document:',
        calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1010,
        page: 1,
        surveyset: 'Diversity Information',
        survey: 'Supplier Assessment 2025',
        question: 'Is your company a service disabled veteran-owned business?',
        response: 'Y/N',
        title: 'disabledVeteranOwned',
        required: 1,
        skipLogic: 'N', skipLogicAnswer: null, skipLogicJump: null,
        // YN_UPLOAD_Y: If Yes, upload certification
        commentType: 'YN_UPLOAD_Y',
        commentBoxMessageText: null,
        uploadMessageText: 'Please upload your Service-Disabled Veteran-Owned Business certification:',
        calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1011,
        page: 1,
        surveyset: 'Diversity Information',
        survey: 'Supplier Assessment 2025',
        question: 'Is your company minority-owned? If yes, please select your ethnicity:',
        response: 'DROPDOWN:Not Minority-Owned(NA);Black American(AA);Hispanic American(AB);Native American(AC);Asian-Pacific American(AD);Subcontinent Asian American(AE);Other(AF)',
        title: 'minorityOwned',
        required: 1,
        commentType: null, commentBoxMessageText: null, uploadMessageText: null, calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1012,
        page: 1,
        surveyset: 'Diversity Information',
        survey: 'Supplier Assessment 2025',
        question: 'Is your company women-owned? If yes, please select the classification:',
        response: 'DROPDOWN:Not Women-Owned(NA);Women-Owned Small Business (WOSB)(AA);Economically Disadvantaged Women-Owned Small Business (EDWOSB)(AB);Other Women-Owned Business(AC)',
        title: 'womenOwned',
        required: 1,
        commentType: null, commentBoxMessageText: null, uploadMessageText: null, calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      // Page 2: Compensation & Location
      {
        qid: 1013,
        page: 2,
        surveyset: 'Compensation',
        survey: 'Supplier Assessment 2025',
        question: 'What is your company\'s total annual revenue?',
        response: 'DOLLAR',
        title: 'annualRevenue',
        required: 1,
        commentType: null, commentBoxMessageText: null, uploadMessageText: null, calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1014,
        page: 2,
        surveyset: 'Compensation',
        survey: 'Supplier Assessment 2025',
        question: 'What is the total number of employees at your company?',
        response: 'NUMBER',
        title: 'employeeCount',
        required: 1,
        commentType: null, commentBoxMessageText: null, uploadMessageText: null, calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1015,
        page: 2,
        surveyset: 'Location Information',
        survey: 'Supplier Assessment 2025',
        question: 'Does your company have manufacturing facilities outside the United States?',
        response: 'Y/N',
        title: 'foreignManufacturing',
        required: 1,
        // YN_WARNING_Y: If Yes, show warning about export controls
        commentType: 'YN_WARNING_Y',
        commentBoxMessageText: 'NOTICE: Companies with foreign manufacturing facilities may be subject to additional export control requirements under ITAR and EAR. Please ensure compliance with all applicable regulations.',
        uploadMessageText: null,
        calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1016,
        page: 2,
        surveyset: 'Location Information',
        survey: 'Supplier Assessment 2025',
        question: 'Please select all countries where you have manufacturing facilities:',
        response: 'List2List:Canada|North American neighbor with integrated supply chains|0;Mexico|North American manufacturing hub, USMCA partner|1;United Kingdom|European manufacturing base, post-Brexit trade partner|2;Germany|Major European industrial manufacturing center|3;France|European aerospace and defense manufacturing|4;Italy|European precision manufacturing hub|5;Spain|Southern European manufacturing center|6;Poland|Central European manufacturing hub|7;Ireland|European technology manufacturing|8;Netherlands|European logistics and light manufacturing|9;China|Major global manufacturing center, export control considerations|10;Japan|High-precision manufacturing partner|11;South Korea|Electronics and advanced manufacturing|12;Taiwan|Semiconductor and electronics manufacturing|13;India|Growing manufacturing hub|14;Vietnam|Southeast Asian manufacturing|15;Thailand|Southeast Asian automotive and electronics|16;Malaysia|Southeast Asian electronics manufacturing|17;Singapore|High-tech manufacturing hub|18;Philippines|Electronics assembly manufacturing|19;Indonesia|Southeast Asian manufacturing|20;Australia|Asia-Pacific manufacturing|21;Brazil|South American manufacturing hub|22;Israel|Defense and technology manufacturing|23;United Arab Emirates|Middle Eastern manufacturing hub|24;Saudi Arabia|Middle Eastern industrial base|25;Turkey|European-Asian manufacturing bridge|26;Czech Republic|Central European precision manufacturing|27;Hungary|Central European automotive manufacturing|28;Romania|Eastern European manufacturing|29;',
        title: 'manufacturingCountries',
        required: 0,
        commentType: null, commentBoxMessageText: null, uploadMessageText: null, calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      // Page 3: Cybersecurity & ITAR
      {
        qid: 1017,
        page: 3,
        surveyset: 'Cybersecurity',
        survey: 'Supplier Assessment 2025',
        question: 'Is your company <b>ISO 27001</b> certified for Information Security Management?',
        response: 'Y/N',
        title: 'iso27001Certified',
        required: 1,
        // SKIP LOGIC: If No (0), skip the ISO date question
        skipLogic: 'Y',
        skipLogicAnswer: '0',  // No
        skipLogicJump: '1019', // Jump to DDTC question, skipping Q1018 (ISO date)
        // YN_UPLOAD_Y: If Yes, upload certification
        commentType: 'YN_UPLOAD_Y',
        commentBoxMessageText: null,
        uploadMessageText: 'Please upload your ISO 27001 certificate:',
        calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1018,
        page: 3,
        surveyset: 'Cybersecurity',
        survey: 'Supplier Assessment 2025',
        question: 'Date of ISO 27001 certification (if applicable):',
        response: 'DATE',
        title: 'iso27001Date',
        required: 0,
        skipLogic: 'N', skipLogicAnswer: null, skipLogicJump: null,
        // CALENDAR: Always show date field
        commentType: 'CALENDAR',
        commentBoxMessageText: null,
        uploadMessageText: null,
        calendarMessageText: 'Select the date your ISO 27001 certification was issued:',
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1019,
        page: 3,
        surveyset: 'ITAR',
        survey: 'Supplier Assessment 2025',
        question: 'Is your company registered with the Directorate of Defense Trade Controls (DDTC)?',
        response: 'Y/N',
        title: 'ddtcRegistered',
        required: 1,
        skipLogic: 'N', skipLogicAnswer: null, skipLogicJump: null,
        // SPINOFF: If Yes, send ITAR compliance questionnaire
        spinOffQuestionnaire: 'Y',
        spinoffid: '1:5010',  // If Yes → spawn ITAR detailed questionnaire 5010
        // EMAIL ALERT: Alert ITAR team regardless of answer
        emailalert: 'Y',
        emailalertlist: '1:itar.compliance@intelleges.com;0:itar.review@intelleges.com',
        // YN_COMMENT_N: If No, explain why not registered
        commentType: 'YN_COMMENT_N',
        commentBoxMessageText: 'Please explain why your company is not registered with DDTC:',
        uploadMessageText: null,
        calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1020,
        page: 3,
        surveyset: 'ITAR',
        survey: 'Supplier Assessment 2025',
        question: 'Select all export control regulations your company complies with:',
        response: 'LIST:ITAR (International Traffic in Arms Regulations)(AA);EAR (Export Administration Regulations)(AB);OFAC (Office of Foreign Assets Control)(AC);None(AD)',
        title: 'exportCompliance',
        required: 1,
        skipLogic: 'N', skipLogicAnswer: null, skipLogicJump: null,
        spinOffQuestionnaire: 'N', spinoffid: null,
        // EMAIL ALERT: Alert if None (AD) selected
        emailalert: 'Y',
        emailalertlist: 'AD:export.control@intelleges.com;AD:compliance.manager@intelleges.com',
        commentType: null, commentBoxMessageText: null, uploadMessageText: null, calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1020.3,
        page: 3,
        surveyset: 'ITAR',
        survey: 'Supplier Assessment 2025',
        question: 'Select all product categories your company manufactures or supplies:',
        response: 'LIST:Aircraft Components(AC);Electronics/Avionics(EA);Interior Components(IC);Landing Gear Components(LG);Engine Components(EC);Structural Components(SC);Testing Equipment(TE);Ground Support Equipment(GS);Other(OT);Not Applicable(NA)',
        title: 'productCategories',
        required: 1,
        skipLogic: 'N', skipLogicAnswer: null, skipLogicJump: null,
        spinOffQuestionnaire: 'N', spinoffid: null,
        emailalert: 'N', emailalertlist: null,
        commentType: null, commentBoxMessageText: null, uploadMessageText: null, calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1020.5,
        page: 3,
        surveyset: 'ITAR',
        survey: 'Supplier Assessment 2025',
        question: 'Select all aerospace manufacturing capabilities your company provides:',
        response: 'List2List:Airframe structures|Major structural components of aircraft including fuselage, wings, and tail assemblies|0;Engine components|Parts for aircraft engines and propulsion systems including turbines and compressors|1;Avionics|Electronic systems for aircraft navigation, communication, and flight management|2;Landing gear|Components for aircraft landing systems including struts, wheels, and brakes|3;Flight control surfaces|Movable surfaces including ailerons, elevators, rudders, and flaps|4;Hydraulic systems|High-pressure fluid systems for aircraft control and operation|5;Fuel systems|Components for aircraft fuel storage, delivery, and management|6;',
        title: 'aerospaceCapabilities',
        required: 0,
        skipLogic: 'N', skipLogicAnswer: null, skipLogicJump: null,
        // SPINOFF: If Airframe AND Engine selected (AA+AB equivalent using bit positions)
        spinOffQuestionnaire: 'Y',
        spinoffid: '0+1:5020;2^3:5021',  // Airframe+Engine → 5020; Avionics OR Landing gear → 5021
        emailalert: 'N', emailalertlist: null,
        commentType: null, commentBoxMessageText: null, uploadMessageText: null, calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      // Page 4: Certifications
      {
        qid: 1021,
        page: 4,
        surveyset: 'Certifications',
        survey: 'Supplier Assessment 2025',
        question: 'Is your company <b>ISO 9001</b> certified for Quality Management?',
        response: 'Y/N',
        title: 'iso9001Certified',
        required: 1,
        // YN_UPLOAD_Y: If Yes, upload certification
        commentType: 'YN_UPLOAD_Y',
        commentBoxMessageText: null,
        uploadMessageText: 'Please upload your ISO 9001 certificate:',
        calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1022,
        page: 4,
        surveyset: 'Certifications',
        survey: 'Supplier Assessment 2025',
        question: 'Is your company <b>AS9100</b> certified for Aerospace Quality?',
        response: 'Y/N',
        title: 'as9100Certified',
        required: 1,
        // YN_UPLOAD_Y: If Yes, upload certification
        commentType: 'YN_UPLOAD_Y',
        commentBoxMessageText: null,
        uploadMessageText: 'Please upload your AS9100 certificate:',
        calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1023,
        page: 4,
        surveyset: 'Certifications',
        survey: 'Supplier Assessment 2025',
        question: 'Is your company <b>NADCAP</b> accredited?',
        response: 'Y/N',
        title: 'nadcapAccredited',
        required: 1,
        // YN_UPLOAD_Y: If Yes, upload accreditation
        commentType: 'YN_UPLOAD_Y',
        commentBoxMessageText: null,
        uploadMessageText: 'Please upload your NADCAP accreditation certificate:',
        calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      // Page 5: Submission with examples of Y/N/NA, CHECKBOX, COMMENTONLY and UPLOADONLY
      {
        qid: 1023.5,
        page: 5,
        surveyset: 'Certification',
        survey: 'Supplier Assessment 2025',
        question: 'Does your company have an active Quality Management System audit?',
        response: 'Y/N/NA',
        title: 'qmsAuditStatus',
        required: 1,
        commentType: null, commentBoxMessageText: null, uploadMessageText: null, calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1023.6,
        page: 5,
        surveyset: 'Certification',
        survey: 'Supplier Assessment 2025',
        question: 'I acknowledge that I have read and understand the Federal Acquisition Regulation (FAR) requirements applicable to this certification.',
        response: 'CHECKBOX',
        title: 'acknowledgeFAR',
        required: 1,
        commentType: null, commentBoxMessageText: null, uploadMessageText: null, calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1024,
        page: 5,
        surveyset: 'Submission',
        survey: 'Supplier Assessment 2025',
        question: 'I certify that all information provided in this questionnaire is accurate and complete to the best of my knowledge.',
        response: 'CHECKBOX',
        title: 'certifyAccurate',
        required: 1,
        commentType: null, commentBoxMessageText: null, uploadMessageText: null, calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1025,
        page: 5,
        surveyset: 'Submission',
        survey: 'Supplier Assessment 2025',
        question: 'Please provide any additional comments or information:',
        response: 'TEXT',
        title: 'additionalComments',
        required: 0,
        // COMMENTONLY: Always show comment field
        commentType: 'COMMENTONLY',
        commentBoxMessageText: 'Enter any additional information that may be relevant to your submission:',
        uploadMessageText: null,
        calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
      {
        qid: 1026,
        page: 5,
        surveyset: 'Submission',
        survey: 'Supplier Assessment 2025',
        question: 'Upload any additional supporting documents:',
        response: 'Y/N',
        title: 'hasAdditionalDocs',
        required: 0,
        // UPLOADONLY: Always show upload field
        commentType: 'UPLOADONLY',
        commentBoxMessageText: null,
        uploadMessageText: 'Upload any additional certifications, policies, or supporting documents:',
        calendarMessageText: null,
        length: 0, titleLength: 0, yValue: 1, nValue: 0, naValue: -1, otherValue: -1, qWeight: 0,
      },
    ]
  });

  // Questionnaire state
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState({});
  const [questionnaireComments, setQuestionnaireComments] = useState({}); // For comment boxes
  const [questionnaireUploads, setQuestionnaireUploads] = useState({}); // For file uploads
  const [questionnaireDates, setQuestionnaireDates] = useState({}); // For calendar dates
  const [questionnairePage, setQuestionnairePage] = useState(1);
  const [questionnaireValidation, setQuestionnaireValidation] = useState({});
  const [warningModal, setWarningModal] = useState({ open: false, message: '', qid: null });

  // Check if conditional widget should show based on CommentType and answer
  const shouldShowConditionalWidget = (q, widgetType) => {
    const answer = questionnaireAnswers[q.qid];
    const ct = q.commentType;
    
    if (!ct) return false;
    
    // Always-show types
    if (ct === 'CALENDAR' && widgetType === 'calendar') return true;
    if (ct === 'COMMENTONLY' && widgetType === 'comment') return true;
    if (ct === 'UPLOADONLY' && widgetType === 'upload') return true;
    
    // Conditional types based on Y/N answer
    if (ct === 'YN_COMMENT_Y' && answer === 'Y' && widgetType === 'comment') return true;
    if (ct === 'YN_COMMENT_N' && answer === 'N' && widgetType === 'comment') return true;
    if (ct === 'YN_UPLOAD_Y' && answer === 'Y' && widgetType === 'upload') return true;
    if (ct === 'YN_UPLOAD_N' && answer === 'N' && widgetType === 'upload') return true;
    if (ct === 'YN_DUEDATE_Y' && answer === 'Y' && widgetType === 'calendar') return true;
    if (ct === 'YN_DUEDATE_N' && answer === 'N' && widgetType === 'calendar') return true;
    
    return false;
  };

  // Check if warning should trigger
  const checkWarningTrigger = (q, newAnswer) => {
    const ct = q.commentType;
    if (ct === 'YN_WARNING_Y' && newAnswer === 'Y') {
      setWarningModal({ open: true, message: q.commentBoxMessageText, qid: q.qid });
    }
    if (ct === 'YN_WARNING_N' && newAnswer === 'N') {
      setWarningModal({ open: true, message: q.commentBoxMessageText, qid: q.qid });
    }
  };

  // Parse response type helper
  const parseResponseType = (response) => {
    if (response === 'Y/N') return { type: 'Y/N', options: [] };
    if (response === 'Y/N/NA') return { type: 'Y/N/NA', options: [] };
    if (response === 'CHECKBOX') return { type: 'CHECKBOX', options: [] };
    if (response === 'TEXT') return { type: 'TEXT', options: [] };
    if (response === 'NUMBER') return { type: 'NUMBER', options: [] };
    if (response === 'DOLLAR') return { type: 'DOLLAR', options: [] };
    if (response === 'DATE') return { type: 'DATE', options: [] };
    if (response.startsWith('TEXT_NUMBER_')) {
      const length = parseInt(response.replace('TEXT_NUMBER_', ''));
      return { type: 'TEXT_NUMBER', length, options: [] };
    }
    if (response.startsWith('DROPDOWN:')) {
      const optionsStr = response.replace('DROPDOWN:', '');
      const options = optionsStr.split(';').filter(o => o).map(opt => {
        const match = opt.match(/(.+)\(([^)]+)\)/);
        return match ? { label: match[1].trim(), code: match[2] } : { label: opt, code: opt };
      });
      return { type: 'DROPDOWN', options };
    }
    if (response.startsWith('LIST:')) {
      // Single-select list with AA-ZZ codes
      const optionsStr = response.replace('LIST:', '');
      const options = optionsStr.split(';').filter(o => o).map(opt => {
        const match = opt.match(/(.+)\(([^)]+)\)/);
        return match ? { label: match[1].trim(), code: match[2] } : { label: opt, code: opt };
      });
      return { type: 'LIST', options };
    }
    if (response.startsWith('List2List:')) {
      // Multi-select with binary flag storage
      // Format: List2List:Option|Description|BinaryPosition;Option|Description|BinaryPosition;...
      const optionsStr = response.replace('List2List:', '');
      const options = optionsStr.split(';').filter(o => o.trim()).map(opt => {
        const parts = opt.split('|');
        if (parts.length >= 3) {
          return {
            label: parts[0].trim(),
            description: parts[1].trim(),
            bitPosition: parseInt(parts[2].trim()),
            binaryValue: Math.pow(2, parseInt(parts[2].trim())) // 2^n
          };
        }
        // Fallback for simple format
        return { label: opt.trim(), description: '', bitPosition: 0, binaryValue: 1 };
      });
      return { type: 'LIST2LIST', options };
    }
    return { type: 'TEXT', options: [] };
  };

  // Helper to check if a bit is set in a binary value
  const isBitSet = (value, bitPosition) => {
    return (value & Math.pow(2, bitPosition)) !== 0;
  };

  // Helper to toggle a bit in a binary value
  const toggleBit = (value, bitPosition) => {
    const binaryValue = Math.pow(2, bitPosition);
    if (isBitSet(value, bitPosition)) {
      return value - binaryValue; // Unset the bit
    } else {
      return value + binaryValue; // Set the bit
    }
  };

  // ============ SKIP LOGIC EVALUATION ============
  
  // Evaluate if skip logic is triggered for a question
  const evaluateSkipLogic = (question, answers) => {
    if (question.skipLogic !== 'Y') return { triggered: false };
    
    const answer = answers[question.qid];
    if (answer === undefined || answer === null || answer === '') return { triggered: false };
    
    const skipAnswer = question.skipLogicAnswer;
    let triggered = false;
    
    // Y/N questions: 0 = No triggers, 1 = Yes triggers
    if (skipAnswer === '0') {
      triggered = (answer === 'N' || answer === 'No' || answer === 0);
    } else if (skipAnswer === '1') {
      triggered = (answer === 'Y' || answer === 'Yes' || answer === 1);
    }
    // D = Dropdown - any selection triggers
    else if (skipAnswer === 'D') {
      triggered = answer !== '' && answer !== null;
    }
    // M = Multi-select (List2List) - any selection triggers
    else if (skipAnswer === 'M') {
      triggered = answer > 0; // Binary value > 0 means something selected
    }
    // A = Any answer triggers
    else if (skipAnswer === 'A') {
      triggered = answer !== '' && answer !== null && answer !== undefined;
    }
    // Specific option code (AA, AB, etc.)
    else if (skipAnswer && skipAnswer.length === 2 && /^[A-Z]{2}$/.test(skipAnswer)) {
      triggered = answer === skipAnswer;
    }
    
    if (triggered) {
      return { 
        triggered: true, 
        jumpTo: question.skipLogicJump,
        fromQid: question.qid
      };
    }
    
    return { triggered: false };
  };

  // Get all visible questions for a page (after applying skip logic)
  const getVisibleQuestions = (page) => {
    const allQuestions = questionnaireData.questions;
    const pageQuestions = allQuestions.filter(q => q.page === page);
    
    // Build a set of QIDs to skip
    const skippedQids = new Set();
    const skipInfo = []; // Track skip events for display
    
    // Check all questions for skip logic triggers
    allQuestions.forEach(q => {
      const result = evaluateSkipLogic(q, questionnaireAnswers);
      if (result.triggered && result.jumpTo) {
        // Parse jumpTo - could be simple QID or complex condition
        let targetQid = null;
        
        // Simple QID
        if (/^\d+$/.test(result.jumpTo)) {
          targetQid = parseInt(result.jumpTo);
        }
        // Complex condition: QID=value:targetQID;
        else if (result.jumpTo.includes(':')) {
          const conditions = result.jumpTo.split(';').filter(c => c.trim());
          for (const condition of conditions) {
            const [predicate, target] = condition.split(':');
            if (target) {
              // Check if all predicates match
              const predicates = predicate.split('&');
              const allMatch = predicates.every(p => {
                const match = p.match(/(\d+)=(.+)/);
                if (!match) return false;
                const checkQid = parseInt(match[1]);
                const expected = match[2];
                const actual = questionnaireAnswers[checkQid];
                return actual == expected || 
                       (expected === '0' && (actual === 'N' || actual === 'No')) ||
                       (expected === '1' && (actual === 'Y' || actual === 'Yes'));
              });
              if (allMatch) {
                targetQid = parseInt(target);
                break;
              }
            }
          }
        }
        
        if (targetQid) {
          // Mark all questions between current and target as skipped
          const currentIndex = allQuestions.findIndex(x => x.qid === q.qid);
          const targetIndex = allQuestions.findIndex(x => x.qid === targetQid);
          
          if (currentIndex !== -1 && targetIndex !== -1 && targetIndex > currentIndex) {
            const skippedQuestions = [];
            for (let i = currentIndex + 1; i < targetIndex; i++) {
              skippedQids.add(allQuestions[i].qid);
              skippedQuestions.push(allQuestions[i].qid);
            }
            if (skippedQuestions.length > 0) {
              skipInfo.push({
                fromQid: q.qid,
                toQid: targetQid,
                skippedCount: skippedQuestions.length,
                skippedQids: skippedQuestions
              });
            }
          }
        }
      }
    });
    
    // Filter out skipped questions
    const visibleQuestions = pageQuestions.filter(q => !skippedQids.has(q.qid));
    
    // Group by surveyset
    const grouped = {};
    visibleQuestions.forEach(q => {
      if (!grouped[q.surveyset]) grouped[q.surveyset] = [];
      grouped[q.surveyset].push(q);
    });
    
    // Get skip info relevant to this page
    const pageSkipInfo = skipInfo.filter(info => 
      pageQuestions.some(q => info.skippedQids.includes(q.qid))
    );
    
    return { grouped, skipInfo: pageSkipInfo, skippedQids };
  };

  // Check if a question is skipped
  const isQuestionSkipped = (qid) => {
    const allQuestions = questionnaireData.questions;
    const skippedQids = new Set();
    
    allQuestions.forEach(q => {
      const result = evaluateSkipLogic(q, questionnaireAnswers);
      if (result.triggered && result.jumpTo) {
        let targetQid = null;
        if (/^\d+$/.test(result.jumpTo)) {
          targetQid = parseInt(result.jumpTo);
        }
        if (targetQid) {
          const currentIndex = allQuestions.findIndex(x => x.qid === q.qid);
          const targetIndex = allQuestions.findIndex(x => x.qid === targetQid);
          if (currentIndex !== -1 && targetIndex !== -1 && targetIndex > currentIndex) {
            for (let i = currentIndex + 1; i < targetIndex; i++) {
              skippedQids.add(allQuestions[i].qid);
            }
          }
        }
      }
    });
    
    return skippedQids.has(qid);
  };

  // Get unique pages
  const getQuestionnairePages = () => {
    const pages = [...new Set(questionnaireData.questions.map(q => q.page))].sort((a, b) => a - b);
    return pages;
  };

  // Get questions for current page grouped by surveyset
  const getPageQuestions = (page) => {
    const pageQuestions = questionnaireData.questions.filter(q => q.page === page);
    const grouped = {};
    pageQuestions.forEach(q => {
      if (!grouped[q.surveyset]) grouped[q.surveyset] = [];
      grouped[q.surveyset].push(q);
    });
    return grouped;
  };

  // Update answer - also check for warning triggers
  const updateAnswer = (qid, value, question = null) => {
    setQuestionnaireAnswers(prev => ({ ...prev, [qid]: value }));
    // Clear validation error when user answers
    setQuestionnaireValidation(prev => ({ ...prev, [qid]: null }));
    // Check for warning trigger if question provided
    if (question) {
      checkWarningTrigger(question, value);
    }
  };

  // Update comment for a question
  const updateComment = (qid, value) => {
    setQuestionnaireComments(prev => ({ ...prev, [qid]: value }));
  };

  // Update file upload for a question
  const updateUpload = (qid, file) => {
    setQuestionnaireUploads(prev => ({ ...prev, [qid]: file }));
  };

  // Update date for a question
  const updateDate = (qid, value) => {
    setQuestionnaireDates(prev => ({ ...prev, [qid]: value }));
  };

  // Validate page
  const validatePage = (page) => {
    // Get visible questions only (excludes skipped questions)
    const { grouped, skippedQids } = getVisibleQuestions(page);
    const visibleQuestions = Object.values(grouped).flat();
    const errors = {};
    let isValid = true;
    
    visibleQuestions.forEach(q => {
      // Skip validation for skipped questions
      if (skippedQids.has(q.qid)) return;
      
      const answer = questionnaireAnswers[q.qid];
      
      // Required field check
      if (q.required === 1) {
        if (answer === undefined || answer === '' || answer === null || (Array.isArray(answer) && answer.length === 0)) {
          errors[q.qid] = 'This field is required';
          isValid = false;
          return; // Skip further validation for this question
        }
      }
      
      // TEXT_NUMBER_X exact length validation
      if (q.response && q.response.startsWith('TEXT_NUMBER_') && answer) {
        const requiredLength = parseInt(q.response.replace('TEXT_NUMBER_', ''));
        if (answer.length !== requiredLength) {
          errors[q.qid] = `Must be exactly ${requiredLength} digits (currently ${answer.length})`;
          isValid = false;
        }
      }
    });
    
    setQuestionnaireValidation(errors);
    return isValid;
  };

  // Calculate progress - excludes skipped questions
  const calculateProgress = () => {
    // Get all visible (non-skipped) questions
    const allQuestions = questionnaireData.questions;
    const skippedQids = new Set();
    
    // Build skipped set
    allQuestions.forEach(q => {
      const result = evaluateSkipLogic(q, questionnaireAnswers);
      if (result.triggered && result.jumpTo) {
        let targetQid = null;
        if (/^\d+$/.test(result.jumpTo)) {
          targetQid = parseInt(result.jumpTo);
        }
        if (targetQid) {
          const currentIndex = allQuestions.findIndex(x => x.qid === q.qid);
          const targetIndex = allQuestions.findIndex(x => x.qid === targetQid);
          if (currentIndex !== -1 && targetIndex !== -1 && targetIndex > currentIndex) {
            for (let i = currentIndex + 1; i < targetIndex; i++) {
              skippedQids.add(allQuestions[i].qid);
            }
          }
        }
      }
    });
    
    const visibleQuestions = allQuestions.filter(q => !skippedQids.has(q.qid));
    const totalRequired = visibleQuestions.filter(q => q.required === 1).length;
    const answeredRequired = visibleQuestions.filter(q => {
      if (q.required !== 1) return false;
      const answer = questionnaireAnswers[q.qid];
      if (answer === undefined || answer === '' || answer === null) return false;
      if (Array.isArray(answer) && answer.length === 0) return false;
      
      // For TEXT_NUMBER_X, check exact length
      if (q.response && q.response.startsWith('TEXT_NUMBER_')) {
        const requiredLength = parseInt(q.response.replace('TEXT_NUMBER_', ''));
        if (answer.length !== requiredLength) return false;
      }
      
      return true;
    }).length;
    return totalRequired > 0 ? Math.round((answeredRequired / totalRequired) * 100) : 0;
  };

  // Mock dashboard data
  const touchpointDashboardData: Record<string, any> = {
    'reps-certs-2025': {
      touchpointName: 'Reps & Certs Annual 2025',
      protocolName: 'Annual Reps & Certs',
      groups: [
        { id: 'cme', name: 'CME', fullName: 'Celestica Manufacturing Electronics', partnerTypes: [{ type: 'Supplier', g: 0, u: 0, r: 0, c: 45, nr: 29, ri: 137, rc: 211, t: 377 }]},
        { id: 'cmo', name: 'CMO', fullName: 'Celestica Manufacturing Ontario', partnerTypes: [{ type: 'Supplier', g: 0, u: 0, r: 0, c: 55, nr: 23, ri: 79, rc: 157, t: 259 }]},
        { id: 'cmy', name: 'CMY', fullName: 'Celestica Malaysia', partnerTypes: [{ type: 'Supplier', g: 0, u: 0, r: 9, c: 317, nr: 91, ri: 161, rc: 578, t: 830 }]},
        { id: 'cno', name: 'CNO', fullName: 'Celestica Nashville Operations', partnerTypes: [{ type: 'Supplier', g: 0, u: 0, r: 0, c: 125, nr: 53, ri: 138, rc: 316, t: 507 }]},
        { id: 'cov', name: 'COV', fullName: 'Celestica Ovar Portugal', partnerTypes: [{ type: 'Supplier', g: 0, u: 0, r: 0, c: 67, nr: 23, ri: 100, rc: 190, t: 313 }]},
        { id: 'csp', name: 'CSP', fullName: 'Celestica Suzhou Plant', partnerTypes: [{ type: 'Supplier', g: 0, u: 0, r: 0, c: 149, nr: 45, ri: 50, rc: 244, t: 339 }]},
        { id: 'new-hope', name: 'NEW_HOPE', fullName: 'New Hope Facility', partnerTypes: [{ type: 'Supplier', g: 0, u: 0, r: 0, c: 144, nr: 18, ri: 49, rc: 211, t: 278 }]},
        { id: 'rochester', name: 'ROCHESTER', fullName: 'Rochester NY', partnerTypes: [{ type: 'Supplier', g: 0, u: 0, r: 0, c: 1, nr: 2, ri: 7, rc: 10, t: 19 }]},
      ]
    },
    'cmmc-2025': {
      touchpointName: 'CMMC Annual Review 2025',
      protocolName: 'CMMC Certification',
      groups: [
        { id: 'cme', name: 'CME', fullName: 'Celestica Manufacturing Electronics', partnerTypes: [{ type: 'Supplier', g: 50, u: 3, r: 5, c: 120, nr: 45, ri: 89, rc: 456, t: 590 }]},
        { id: 'cmo', name: 'CMO', fullName: 'Celestica Manufacturing Ontario', partnerTypes: [{ type: 'Supplier', g: 30, u: 0, r: 2, c: 89, nr: 34, ri: 67, rc: 312, t: 413 }]},
        { id: 'cmy', name: 'CMY', fullName: 'Celestica Malaysia', partnerTypes: [{ type: 'Supplier', g: 100, u: 12, r: 8, c: 456, nr: 123, ri: 234, rc: 890, t: 1247 }]},
        { id: 'cno', name: 'CNO', fullName: 'Celestica Nashville Operations', partnerTypes: [{ type: 'Supplier', g: 40, u: 5, r: 3, c: 234, nr: 78, ri: 145, rc: 567, t: 790 }]},
      ]
    },
    'sb-plan-q1-2025': {
      touchpointName: 'SB Plan Q1 2025',
      protocolName: 'Small Business Subcontracting',
      groups: [
        { id: 'cme', name: 'CME', fullName: 'Celestica Manufacturing Electronics', partnerTypes: [
          { type: 'Small Business', g: 0, u: 0, r: 0, c: 34, nr: 12, ri: 45, rc: 123, t: 180 },
          { type: 'WOSB', g: 0, u: 0, r: 0, c: 12, nr: 5, ri: 18, rc: 45, t: 68 },
        ]},
        { id: 'cmo', name: 'CMO', fullName: 'Celestica Manufacturing Ontario', partnerTypes: [
          { type: 'Small Business', g: 0, u: 0, r: 0, c: 28, nr: 9, ri: 34, rc: 98, t: 141 },
          { type: 'WOSB', g: 0, u: 0, r: 0, c: 8, nr: 3, ri: 12, rc: 34, t: 49 },
        ]},
      ]
    },
  };

  const menuItems = [
    { id: 'enterprise', label: 'Enterprise', icon: Shield, intellegesOnly: true },
    { id: 'person', label: 'Person', icon: Users },
    { id: 'partner', label: 'Partner', icon: Building2 },
    { id: 'protocol', label: 'Protocol', icon: FileText },
    { id: 'touchpoint', label: 'Touchpoint', icon: Users },
    { id: 'partnertype', label: 'Partnertype', icon: ClipboardList },
    { id: 'group', label: 'Group', icon: Settings },
    { id: 'questionnaire', label: 'Questionnaire', icon: ClipboardList },
  ];

  const adminMenuItems = [
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'role', label: 'Roles', icon: Lock, adminOnly: true },
    { id: 'permission', label: 'Permissions', icon: ShieldCheck, adminOnly: true },
    { id: 'audit', label: 'Audit Log', icon: History, adminOnly: true },
    { id: 'settings', label: 'System Settings', icon: Wrench, intellegesOnly: true },
  ];

  const subMenuItems = [
    { id: 'add', label: 'Add', icon: Plus, hasSubmenu: true, 
      submenu: [
        { id: 'manual', label: 'Manual' },
        { id: 'spreadsheet', label: 'Spreadsheet' },
      ]
    },
    { id: 'archive', label: 'Archive', icon: Archive },
    { id: 'find', label: 'Find', icon: Search },
    { id: 'view', label: 'View', icon: Eye },
    { id: 'unarchive', label: 'Unarchive', icon: RotateCcw },
  ];

  const toggleMenu = (menuId) => {
    // Accordion behavior: close all other menus when opening one
    setExpandedMenus(prev => {
      const isCurrentlyOpen = prev[menuId];
      // If clicking on open menu, just close it. Otherwise close all and open this one.
      if (isCurrentlyOpen) {
        return { ...prev, [menuId]: false };
      } else {
        // Close all menus and open only the clicked one
        const allClosed = Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {});
        return { ...allClosed, [menuId]: true };
      }
    });
    // Also close any expanded submenus when switching entities
    setExpandedSubMenus({});
  };

  const toggleSubMenu = (key) => {
    setExpandedSubMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredMenuItems = menuItems.filter(item => 
    userRole === 'intelleges' || !item.intellegesOnly
  );

  const filteredAdminMenuItems = adminMenuItems.filter(item => {
    if (item.intellegesOnly) return userRole === 'intelleges';
    if (item.adminOnly) return userRole === 'intelleges' || userRole === 'enterprise';
    return true;
  });

  // Touchpoint Dashboard Component
  const TouchpointDashboard = ({ dashboardData }) => {
    const getGroupTotals = (group) => {
      return group.partnerTypes.reduce((acc, pt) => ({
        g: acc.g + pt.g, u: acc.u + pt.u, r: acc.r + pt.r, c: acc.c + pt.c,
        nr: acc.nr + pt.nr, ri: acc.ri + pt.ri, rc: acc.rc + pt.rc, t: acc.t + pt.t,
      }), { g: 0, u: 0, r: 0, c: 0, nr: 0, ri: 0, rc: 0, t: 0 });
    };

    const getCompletionRate = (group) => {
      const totals = getGroupTotals(group);
      return totals.t > 0 ? (totals.rc / totals.t) * 100 : 0;
    };

    const worstGroup = dashboardData.groups.reduce((worst, group) => {
      return getCompletionRate(group) < getCompletionRate(worst) ? group : worst;
    }, dashboardData.groups[0]);

    const getWorstByPartnerType = () => {
      const allTypes = new Set();
      dashboardData.groups.forEach(g => g.partnerTypes.forEach(pt => allTypes.add(pt.type)));
      const worstByType = {};
      allTypes.forEach(type => {
        let worstG = null;
        let worstRate = 101;
        dashboardData.groups.forEach(group => {
          const pt = group.partnerTypes.find(p => p.type === type);
          if (pt) {
            const rate = pt.t > 0 ? (pt.rc / pt.t) * 100 : 0;
            if (rate < worstRate) { worstRate = rate; worstG = { group: group.name, rate }; }
          }
        });
        if (worstG) worstByType[type] = worstG;
      });
      return worstByType;
    };

    const worstByPartnerType = getWorstByPartnerType();

    const GroupCard = ({ group, isWorstOverall }) => {
      const totals = getGroupTotals(group);
      const completionRate = totals.t > 0 ? Math.round((totals.rc / totals.t) * 100) : 0;

      return (
        <div className={`border-2 bg-white shadow-sm ${isWorstOverall ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-300'}`}>
          <div className="text-center py-1.5 font-bold text-sm relative text-white"
            style={{ backgroundColor: isWorstOverall ? '#F2574D' : '#111117' }}>
            {group.name}
            <span className="absolute right-1 top-1 text-[10px] px-1 py-0.5 rounded text-white font-semibold"
              style={{ backgroundColor: completionRate >= 90 ? '#2496F4' : completionRate >= 70 ? '#FFCA16' : '#F2574D',
                color: completionRate >= 70 && completionRate < 90 ? '#111117' : 'white' }}>
              {completionRate}%
            </span>
          </div>
          {isWorstOverall && (
            <div className="text-xs text-center py-0.5 font-medium" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
              ⚠ NEEDS ATTENTION - Lowest Completion
            </div>
          )}
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="px-1 py-1 text-left font-medium text-gray-600 w-20">PARTNER TYPE</th>
                <th className="px-1 py-1 text-center font-medium w-8" style={{ color: '#111117' }}>G</th>
                <th className="px-1 py-1 text-center font-medium w-8" style={{ color: '#111117' }}>U</th>
                <th className="px-1 py-1 text-center font-medium w-8" style={{ color: '#111117' }}>R</th>
                <th className="px-1 py-1 text-center font-medium w-8" style={{ color: '#111117' }}>C</th>
                <th className="px-1 py-1 text-center font-medium w-8" style={{ color: '#FFCA16' }}>N/R</th>
                <th className="px-1 py-1 text-center font-medium w-8" style={{ color: '#F2574D' }}>R/I</th>
                <th className="px-1 py-1 text-center font-medium w-8" style={{ color: '#2496F4' }}>R/C</th>
                <th className="px-1 py-1 text-center font-medium w-8" style={{ color: '#111117' }}>T</th>
              </tr>
            </thead>
            <tbody>
              {group.partnerTypes.map((pt, idx) => {
                const isWorstForType = worstByPartnerType[pt.type]?.group === group.name;
                return (
                  <tr key={idx} className="border-b border-gray-200" style={{ backgroundColor: isWorstForType ? '#FEE2E2' : 'transparent' }}>
                    <td className="px-1 py-1 text-gray-700 flex items-center gap-1">
                      {pt.type}
                      {isWorstForType && <span style={{ color: '#F2574D' }} className="text-[10px]">▼</span>}
                    </td>
                    <td className="px-1 py-1 text-center bg-gray-50">{pt.g}</td>
                    <td className="px-1 py-1 text-center bg-gray-50">{pt.u}</td>
                    <td className="px-1 py-1 text-center bg-gray-50">{pt.r}</td>
                    <td className="px-1 py-1 text-center bg-gray-100 font-medium">{pt.c}</td>
                    <td className="px-1 py-1 text-center font-medium"
                      style={{ backgroundColor: pt.nr > 0 ? '#FFCA16' : '#FEF9C3', color: '#111117' }}>{pt.nr}</td>
                    <td className="px-1 py-1 text-center font-medium"
                      style={{ backgroundColor: pt.ri > 0 ? '#F2574D' : '#FEE2E2', color: pt.ri > 0 ? 'white' : '#111117' }}>{pt.ri}</td>
                    <td className="px-1 py-1 text-center font-medium"
                      style={{ backgroundColor: pt.rc > 0 ? '#2496F4' : '#DBEAFE', color: pt.rc > 0 ? 'white' : '#111117' }}>{pt.rc}</td>
                    <td className="px-1 py-1 text-center bg-gray-200 font-medium">{pt.t}</td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50 font-medium">
                <td className="px-1 py-1 text-gray-700">Total</td>
                <td className="px-1 py-1 text-center bg-gray-50">{totals.g}</td>
                <td className="px-1 py-1 text-center bg-gray-50">{totals.u}</td>
                <td className="px-1 py-1 text-center bg-gray-50">{totals.r}</td>
                <td className="px-1 py-1 text-center bg-gray-100">{totals.c}</td>
                <td className="px-1 py-1 text-center" style={{ backgroundColor: totals.nr > 0 ? '#FFCA16' : '#FEF9C3', color: '#111117' }}>{totals.nr}</td>
                <td className="px-1 py-1 text-center" style={{ backgroundColor: totals.ri > 0 ? '#F2574D' : '#FEE2E2', color: totals.ri > 0 ? 'white' : '#111117' }}>{totals.ri}</td>
                <td className="px-1 py-1 text-center" style={{ backgroundColor: totals.rc > 0 ? '#2496F4' : '#DBEAFE', color: totals.rc > 0 ? 'white' : '#111117' }}>{totals.rc}</td>
                <td className="px-1 py-1 text-center bg-gray-200">{totals.t}</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    };

    const enterpriseTotals = dashboardData.groups.reduce((acc, group) => {
      const gt = getGroupTotals(group);
      return { g: acc.g + gt.g, u: acc.u + gt.u, r: acc.r + gt.r, c: acc.c + gt.c,
        nr: acc.nr + gt.nr, ri: acc.ri + gt.ri, rc: acc.rc + gt.rc, t: acc.t + gt.t };
    }, { g: 0, u: 0, r: 0, c: 0, nr: 0, ri: 0, rc: 0, t: 0 });

    const completionRate = enterpriseTotals.t > 0 ? Math.round((enterpriseTotals.rc / enterpriseTotals.t) * 100) : 0;

    return (
      <div className="bg-gray-100 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#111117' }}>{dashboardData.touchpointName}</h2>
            <p className="text-sm text-gray-600">{dashboardData.protocolName}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-md px-3 py-1" style={{ backgroundColor: '#FEE2E2', border: '1px solid #F2574D' }}>
              <div className="text-xs font-medium" style={{ color: '#F2574D' }}>Needs Focus:</div>
              <div className="text-sm font-bold" style={{ color: '#111117' }}>{worstGroup.name} ({Math.round(getCompletionRate(worstGroup))}%)</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold" style={{ color: '#2496F4' }}>{completionRate}%</div>
              <div className="text-xs text-gray-500">Complete ({enterpriseTotals.rc}/{enterpriseTotals.t})</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4 text-xs flex-wrap">
          <span className="text-gray-600 font-medium">Legend:</span>
          <span className="px-2 py-0.5 bg-gray-100 rounded">G=Goal</span>
          <span className="px-2 py-0.5 bg-gray-50 rounded">U=Unconfirmed</span>
          <span className="px-2 py-0.5 bg-gray-50 rounded">R=Reviewing</span>
          <span className="px-2 py-0.5 bg-gray-100 rounded">C=Confirmed</span>
          <span className="px-2 py-0.5 rounded" style={{ backgroundColor: '#FFCA16', color: '#111117' }}>N/R=No Response</span>
          <span className="px-2 py-0.5 rounded" style={{ backgroundColor: '#F2574D', color: 'white' }}>R/I=Incomplete</span>
          <span className="px-2 py-0.5 rounded" style={{ backgroundColor: '#2496F4', color: 'white' }}>R/C=Complete</span>
          <span className="px-2 py-0.5 bg-gray-200 rounded">T=Total Sent</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {dashboardData.groups.map(group => (
            <GroupCard key={group.name} group={group} isWorstOverall={group.name === worstGroup.name} />
          ))}
        </div>

        <div className="mt-4 text-white p-4 rounded" style={{ backgroundColor: '#111117' }}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg">ENTERPRISE TOTALS ({dashboardData.groups.length} Groups)</span>
            <div className="text-right">
              <span className="text-2xl font-bold" style={{ color: '#2496F4' }}>{completionRate}%</span>
              <span className="text-xs ml-1 text-gray-400">Complete</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-400 text-xs uppercase tracking-wide">Pre-Invite:</span>
              <span className="text-gray-300">U: <strong>{enterpriseTotals.u}</strong></span>
              <span className="text-gray-300">R: <strong>{enterpriseTotals.r}</strong></span>
              <span className="text-gray-300">C: <strong>{enterpriseTotals.c}</strong></span>
            </div>
            <div className="flex items-center gap-4 text-sm justify-end">
              <span className="text-gray-400 text-xs uppercase tracking-wide">Post-Invite:</span>
              <span style={{ color: '#FFCA16' }}>N/R: <strong>{enterpriseTotals.nr}</strong></span>
              <span style={{ color: '#F2574D' }}>R/I: <strong>{enterpriseTotals.ri}</strong></span>
              <span style={{ color: '#2496F4' }}>R/C: <strong>{enterpriseTotals.rc}</strong></span>
              <span className="text-white border-l border-gray-600 pl-4">T: <strong>{enterpriseTotals.t}</strong></span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Data Grid Modal
  const DataGridView = () => {
    if (!dataGridView.open) return null;
    
    const mockData = {
      group: [
        { id: 1, name: 'CME', owner: '', description: 'CME', partnerCount: 987, userCount: 27 },
        { id: 2, name: 'CMO', owner: '', description: 'CMO', partnerCount: 747, userCount: 42 },
        { id: 3, name: 'CMY', owner: '', description: 'CMY', partnerCount: 2448, userCount: 73 },
        { id: 4, name: 'CNO', owner: 'Deborah Ellis', description: 'CNO', partnerCount: 2847, userCount: 19 },
        { id: 5, name: 'COV', owner: 'Deborah Ellis', description: 'COV', partnerCount: 1881, userCount: 23 },
      ],
      partner: [
        { 
          id: 1, accessCode: 'GDL-T1-S-001234', internalId: 'SUP-001', name: 'Acme Corporation', 
          status: 'Complete', statusCode: 'rc', progress: 100, 
          address1: '123 Industrial Blvd', address2: 'Suite 400', city: 'Guadalajara', state: '', province: 'Jalisco', zipCode: '44100', country: 'Mexico',
          phone: '+52 33 1234 5678', fax: '+52 33 1234 5679',
          firstName: 'Juan', lastName: 'Rodriguez', title: 'Supply Chain Manager', email: 'juan.rodriguez@acme.mx',
          dunsNumber: '123456789', federalId: '12-3456789',
          owner: 'John Smith', group: 'CME', partnerType: 'Supplier', protocol: 'Certs and Reps', touchpoint: 'Reps and Certs 2025',
          dueDate: '2025-03-31', lastActivity: '2025-01-15'
        },
        { 
          id: 2, accessCode: 'MTY-T2-S-000567', internalId: 'SUP-002', name: 'TechParts Industries', 
          status: 'Incomplete', statusCode: 'ri', progress: 45, 
          address1: '456 Manufacturing Ave', address2: '', city: 'Monterrey', state: '', province: 'Nuevo León', zipCode: '64000', country: 'Mexico',
          phone: '+52 81 9876 5432', fax: '',
          firstName: 'Maria', lastName: 'Garcia', title: 'Compliance Director', email: 'maria.garcia@techparts.mx',
          dunsNumber: '987654321', federalId: '98-7654321',
          owner: 'Jane Doe', group: 'CMO', partnerType: 'Supplier', protocol: 'Certs and Reps', touchpoint: 'Reps and Certs 2025',
          dueDate: '2025-03-31', lastActivity: '2025-01-10'
        },
        { 
          id: 3, accessCode: 'TIJ-T3-S-000891', internalId: 'SUP-003', name: 'Global Supply Solutions', 
          status: 'No Response', statusCode: 'nr', progress: 0, 
          address1: '789 Export Zone', address2: 'Building C', city: 'Tijuana', state: '', province: 'Baja California', zipCode: '22000', country: 'Mexico',
          phone: '+52 664 555 1234', fax: '+52 664 555 1235',
          firstName: 'Carlos', lastName: 'Mendez', title: 'Operations Manager', email: 'carlos.mendez@globalsupply.mx',
          dunsNumber: '456789123', federalId: '45-6789123',
          owner: 'Bob Wilson', group: 'CMY', partnerType: 'Supplier', protocol: 'Certs and Reps', touchpoint: 'Reps and Certs 2025',
          dueDate: '2025-03-31', lastActivity: null
        },
        { 
          id: 4, accessCode: 'PUE-T1-I-000234', internalId: 'INV-001', name: 'Aerospace Investors LLC', 
          status: 'Complete', statusCode: 'rc', progress: 100, 
          address1: '100 Finance Center', address2: 'Floor 25', city: 'Puebla', state: '', province: 'Puebla', zipCode: '72000', country: 'Mexico',
          phone: '+52 222 111 2222', fax: '',
          firstName: 'Roberto', lastName: 'Sanchez', title: 'Investment Partner', email: 'rsanchez@aero-invest.com',
          dunsNumber: '111222333', federalId: '11-1222333',
          owner: 'Sarah Lee', group: 'CME', partnerType: 'Investor', protocol: 'Certs and Reps', touchpoint: 'Reps and Certs 2025',
          dueDate: '2025-03-31', lastActivity: '2025-01-12'
        },
        { 
          id: 5, accessCode: 'MXC-T2-V-000345', internalId: 'VAL-001', name: 'Quality Assurance Partners', 
          status: 'Reminder Incomplete', statusCode: 'ri', progress: 75, 
          address1: '500 Reforma Ave', address2: '', city: 'Mexico City', state: '', province: 'CDMX', zipCode: '06600', country: 'Mexico',
          phone: '+52 55 5555 1234', fax: '+52 55 5555 1235',
          firstName: 'Ana', lastName: 'Lopez', title: 'Quality Director', email: 'ana.lopez@qa-partners.mx',
          dunsNumber: '333444555', federalId: '33-3444555',
          owner: 'Mike Chen', group: 'CNO', partnerType: 'Validator', protocol: 'Certs and Reps', touchpoint: 'Reps and Certs 2025',
          dueDate: '2025-03-31', lastActivity: '2025-01-08'
        },
      ],
      questionnaire: [
        { id: 1, name: 'Certs and Reps Campaign', touchpoint: '2020 Reps & Certs', partnerType: 'Supplier Expired', hasCMS: true },
        { id: 2, name: 'Certs and Reps Campaign', touchpoint: '2021 Reps & Certs', partnerType: 'Supplier', hasCMS: true },
        { id: 3, name: 'Certs and Reps Campaign', touchpoint: '2022 Reps & Certs', partnerType: 'Supplier', hasCMS: true },
        { id: 4, name: 'Certs and Reps Campaign', touchpoint: '2023 Reps & Certs', partnerType: 'Supplier', hasCMS: true },
        { id: 5, name: 'Celestica Certs', touchpoint: 'Reps and Certs 2024', partnerType: 'Supplier', hasCMS: false },
        { id: 6, name: 'Certs and Reps Campaign', touchpoint: 'Reps and Certs 2025', partnerType: 'Supplier', hasCMS: false },
      ],
      protocol: [
        { id: 1, name: 'Certs and Reps', description: 'Annual certification and representation campaign', touchpoints: 6, active: true },
        { id: 2, name: 'Supplier Onboarding', description: 'New supplier qualification process', touchpoints: 3, active: true },
        { id: 3, name: 'Risk Assessment', description: 'Supply chain risk evaluation', touchpoints: 2, active: true },
      ],
      touchpoint: [
        { id: 1, name: 'Reps and Certs 2025', protocol: 'Certs and Reps', startDate: '2025-01-01', endDate: '2025-03-31', partners: 987 },
        { id: 2, name: 'Reps and Certs 2024', protocol: 'Certs and Reps', startDate: '2024-01-01', endDate: '2024-03-31', partners: 1024 },
        { id: 3, name: 'Q1 Onboarding', protocol: 'Supplier Onboarding', startDate: '2025-01-15', endDate: '2025-04-15', partners: 45 },
      ],
      partnertype: [
        { id: 1, name: 'Supplier', description: 'Product and service suppliers', code: 'S', active: true },
        { id: 2, name: 'Investor', description: 'Financial stakeholders', code: 'I', active: true },
        { id: 3, name: 'Validator', description: 'Third-party auditors and validators', code: 'V', active: true },
      ],
      person: [
        { id: 1, name: 'John Smith', email: 'john.smith@honeywell.com', role: 'Admin', groups: 'CME, CMO', status: 'Active', lastLogin: '2025-01-15' },
        { id: 2, name: 'Jane Doe', email: 'jane.doe@honeywell.com', role: 'Manager', groups: 'CMY', status: 'Active', lastLogin: '2025-01-14' },
        { id: 3, name: 'Bob Wilson', email: 'bob.wilson@honeywell.com', role: 'Viewer', groups: 'CNO, COV', status: 'Active', lastLogin: '2025-01-10' },
        { id: 4, name: 'Sarah Lee', email: 'sarah.lee@honeywell.com', role: 'Admin', groups: 'CME', status: 'Inactive', lastLogin: '2024-12-20' },
        { id: 5, name: 'Mike Chen', email: 'mike.chen@honeywell.com', role: 'Manager', groups: 'All', status: 'Active', lastLogin: '2025-01-15' },
      ],
      enterprise: [
        { id: 1, name: 'Honeywell International', domain: 'honeywell.com', country: 'United States', users: 127, partners: 8910, license: 'Enterprise', expires: '2026-12-31' },
        { id: 2, name: 'Celestica Inc.', domain: 'celestica.com', country: 'Canada', users: 84, partners: 2922, license: 'Enterprise', expires: '2025-06-30' },
        { id: 3, name: 'Flex Ltd.', domain: 'flex.com', country: 'Singapore', users: 56, partners: 1547, license: 'Professional', expires: '2025-09-30' },
        { id: 4, name: 'Jabil Inc.', domain: 'jabil.com', country: 'United States', users: 43, partners: 892, license: 'Trial', expires: '2025-02-28' },
      ],
      role: [
        { id: 1, name: 'Super Admin', description: 'Full system access across all enterprises', users: 3, permissions: 45, system: true },
        { id: 2, name: 'Enterprise Admin', description: 'Full access within enterprise', users: 12, permissions: 38, system: true },
        { id: 3, name: 'Group Manager', description: 'Manage assigned groups and partners', users: 27, permissions: 24, system: true },
        { id: 4, name: 'Compliance Officer', description: 'View and export compliance data', users: 18, permissions: 15, system: false },
        { id: 5, name: 'Viewer', description: 'Read-only access to dashboards', users: 67, permissions: 8, system: true },
      ],
      permission: [
        { id: 1, name: 'partner.create', description: 'Create new partners', category: 'Partner', roles: 'Super Admin, Enterprise Admin, Group Manager' },
        { id: 2, name: 'partner.edit', description: 'Edit partner information', category: 'Partner', roles: 'Super Admin, Enterprise Admin, Group Manager' },
        { id: 3, name: 'partner.delete', description: 'Delete partners', category: 'Partner', roles: 'Super Admin, Enterprise Admin' },
        { id: 4, name: 'questionnaire.manage', description: 'Upload and manage questionnaires', category: 'Questionnaire', roles: 'Super Admin, Enterprise Admin' },
        { id: 5, name: 'cms.edit', description: 'Edit CMS content', category: 'CMS', roles: 'Super Admin, Enterprise Admin' },
        { id: 6, name: 'automail.send', description: 'Send emails via AutoMail', category: 'AutoMail', roles: 'Super Admin, Enterprise Admin, Group Manager' },
        { id: 7, name: 'reports.export', description: 'Export reports and data', category: 'Reports', roles: 'All Roles' },
        { id: 8, name: 'audit.view', description: 'View audit logs', category: 'Admin', roles: 'Super Admin, Enterprise Admin' },
      ],
      audit: [
        { id: 1, timestamp: '2025-01-15 14:32:15', user: 'john.smith@honeywell.com', action: 'Partner Created', details: 'Created partner: Acme Corporation (SUP-001)', ip: '192.168.1.100' },
        { id: 2, timestamp: '2025-01-15 14:28:00', user: 'jane.doe@honeywell.com', action: 'Email Sent', details: 'Sent invitation to maria.garcia@techparts.mx', ip: '192.168.1.105' },
        { id: 3, timestamp: '2025-01-15 13:45:22', user: 'john.smith@honeywell.com', action: 'CMS Updated', details: 'Modified ACCESS_CODE_TITLE element', ip: '192.168.1.100' },
        { id: 4, timestamp: '2025-01-15 11:20:00', user: 'bob.wilson@honeywell.com', action: 'Report Exported', details: 'Exported Partner Status Report (CSV)', ip: '192.168.1.112' },
        { id: 5, timestamp: '2025-01-15 10:15:33', user: 'sarah.lee@honeywell.com', action: 'Login', details: 'Successful login from Chrome/Windows', ip: '192.168.1.108' },
        { id: 6, timestamp: '2025-01-14 16:45:00', user: 'mike.chen@honeywell.com', action: 'Partner Archived', details: 'Archived partner: Old Supplier Inc. (SUP-089)', ip: '192.168.1.115' },
        { id: 7, timestamp: '2025-01-14 15:30:00', user: 'john.smith@honeywell.com', action: 'Role Modified', details: 'Added permission to Compliance Officer role', ip: '192.168.1.100' },
        { id: 8, timestamp: '2025-01-14 14:00:00', user: 'jane.doe@honeywell.com', action: 'Questionnaire Uploaded', details: 'Uploaded 2025 Reps & Certs questionnaire', ip: '192.168.1.105' },
      ],
      settings: [
        { id: 1, category: 'Email', setting: 'SMTP Server', value: 'smtp.sendgrid.net', description: 'Email relay server' },
        { id: 2, category: 'Email', setting: 'From Address', value: 'noreply@intelleges.com', description: 'Default sender email' },
        { id: 3, category: 'Security', setting: 'Session Timeout', value: '30 minutes', description: 'Idle session timeout' },
        { id: 4, category: 'Security', setting: 'Password Policy', value: 'Strong (12+ chars)', description: 'Minimum password requirements' },
        { id: 5, category: 'System', setting: 'Date Format', value: 'MM/DD/YYYY', description: 'Display date format' },
        { id: 6, category: 'System', setting: 'Time Zone', value: 'America/New_York', description: 'Default time zone' },
      ],
    };

    // Context menu options per entity type
    const contextMenuOptions = {
      questionnaire: [
        { id: 'edit', label: 'Edit/Correct', icon: '✏️' },
        { id: 'download', label: 'Download', icon: '📥' },
        { id: 'remove', label: 'Remove', icon: '🗑️' },
        { id: 'archive', label: 'Archive', icon: '📦' },
        { id: 'divider1', divider: true },
        { id: 'view-detail', label: 'View Detail', icon: '👁️' },
        { id: 'divider2', divider: true },
        { id: 'upload-cms', label: 'Edit/Upload CMS', icon: '📊', highlight: true },
        { id: 'upload-automail', label: 'Edit/Upload AutoMail', icon: '📧' },
        { id: 'test-automail', label: 'Test Automail All', icon: '🧪' },
        { id: 'divider3', divider: true },
        { id: 'raw-download', label: 'Raw Data Download', icon: '💾' },
        { id: 'raw-remove', label: 'Raw Data Remove', icon: '❌' },
        { id: 'mapping', label: 'Mapping', icon: '🔗' },
      ],
      partner: [
        { id: 'contact-supplier', label: 'Contact Supplier (Urgent)', icon: '📞', highlight: true },
        { id: 'divider0', divider: true },
        { id: 'view-responses', label: 'View Responses', icon: '📋' },
        { id: 'edit-partner', label: 'Edit Partner', icon: '✏️' },
        { id: 'edit-contact', label: 'Edit Contact', icon: '👤' },
        { id: 'divider1', divider: true },
        { id: 'flag-for-review', label: 'Flag for Review', icon: '🚩' },
        { id: 'approve-submission', label: 'Approve Submission', icon: '✅' },
        { id: 'reject-submission', label: 'Reject Submission', icon: '❌' },
        { id: 'divider2', divider: true },
        { id: 'resend-invite', label: 'Resend Invitation', icon: '📧' },
        { id: 'send-reminder', label: 'Send Reminder', icon: '🔔' },
        { id: 'divider3', divider: true },
        { id: 'view-history', label: 'View History', icon: '📜' },
        { id: 'view-documents', label: 'View Documents', icon: '📁' },
        { id: 'divider4', divider: true },
        { id: 'reset-responses', label: 'Reset Responses', icon: '🔄' },
        { id: 'archive', label: 'Archive Partner', icon: '📦' },
        { id: 'delete', label: 'Delete Partner', icon: '🗑️', danger: true },
      ],
      default: [
        { id: 'edit', label: 'Edit', icon: '✏️' },
        { id: 'view', label: 'View Details', icon: '👁️' },
        { id: 'archive', label: 'Archive', icon: '📦' },
      ]
    };

    const handleContextMenu = (e, row) => {
      e.preventDefault();
      e.stopPropagation();
      // Use client coordinates, positioning menu below and to the right of click point
      setContextMenu({
        open: true,
        x: e.clientX || e.pageX || 100,
        y: e.clientY || e.pageY || 100,
        row: row,
        entity: dataGridView.entity
      });
    };

    const handleContextAction = (actionId, row) => {
      // Questionnaire actions
      if (actionId === 'upload-cms') {
        setCmsUploadModal({ open: true, questionnaire: row });
        setCmsView('choice');
        setCmsPage(1);
        setDataGridView({ open: false, entity: null });
      }
      if (actionId === 'upload-automail') {
        setAutoMailModal({ open: true, questionnaire: row });
        setAutoMailView('choice');
        setAutoMailPage(1);
        setDataGridView({ open: false, entity: null });
      }
      
      // Partner actions
      if (actionId === 'contact-supplier') {
        setContactSupplierDialog({ open: true, partner: row });
        setDataGridView({ open: false, entity: null });
      }
      if (actionId === 'edit-partner') {
        setPartnerManualModal({ open: true, mode: 'edit', partner: row });
        setDataGridView({ open: false, entity: null });
      }
      if (actionId === 'edit-contact') {
        setPartnerContactModal({ open: true, partner: row });
      }
      if (actionId === 'view-responses') {
        setPartnerResponsesModal({ open: true, partner: row });
      }
      if (actionId === 'view-history') {
        setPartnerHistoryModal({ open: true, partner: row });
      }
      if (actionId === 'view-documents') {
        setPartnerDocumentsModal({ open: true, partner: row });
      }
      if (actionId === 'resend-invite') {
        setPartnerConfirmModal({ open: true, action: 'resend-invite', partner: row });
      }
      if (actionId === 'send-reminder') {
        setPartnerConfirmModal({ open: true, action: 'send-reminder', partner: row });
      }
      if (actionId === 'reset-responses') {
        setPartnerConfirmModal({ open: true, action: 'reset-responses', partner: row });
      }
      if (actionId === 'archive') {
        setPartnerConfirmModal({ open: true, action: 'archive', partner: row });
      }
      if (actionId === 'delete') {
        setPartnerConfirmModal({ open: true, action: 'delete', partner: row });
      }
      
      // Approval workflow actions (INT.DOC.40 Section 4.1)
      if (actionId === 'flag-for-review') {
        setApprovalDialog({ open: true, action: 'flag-for-review', partner: row });
      }
      if (actionId === 'approve-submission') {
        setApprovalDialog({ open: true, action: 'approve', partner: row });
      }
      if (actionId === 'reject-submission') {
        setApprovalDialog({ open: true, action: 'reject', partner: row });
      }
      
      setContextMenu({ open: false, x: 0, y: 0, row: null, entity: null });
    };

    const data = mockData[dataGridView.entity] || mockData.group;
    const entityLabel = dataGridView.entity?.charAt(0).toUpperCase() + dataGridView.entity?.slice(1) || 'Entity';
    const menuOptions = contextMenuOptions[dataGridView.entity] || contextMenuOptions.default;

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
        onClick={() => setDataGridView({ open: false, entity: null })}
      >
        <div 
          className="bg-white rounded-lg shadow-xl w-[95%] max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" 
          onClick={(e) => { 
            e.stopPropagation(); 
            // Close any open dropdown when clicking elsewhere in modal
            if (contextMenu.open) {
              setContextMenu({ open: false, x: 0, y: 0, row: null, entity: null }); 
            }
          }}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-800">{entityLabel} Management</h2>
              <span className="text-sm text-gray-500">({data.length} records)</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
                <Filter className="w-4 h-4" /> Filter
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
                <Download className="w-4 h-4" /> Export
              </button>
              <button onClick={() => setDataGridView({ open: false, entity: null })} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Questionnaire-specific toolbar */}
          {dataGridView.entity === 'questionnaire' && (
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button className="text-sm text-blue-600 hover:underline">Campaigns</button>
                <button className="text-sm text-blue-600 hover:underline">Icons</button>
                <button className="text-sm text-blue-600 hover:underline">Iterate</button>
              </div>
              <select className="text-sm border border-gray-300 rounded px-2 py-1 min-w-[150px]">
                <option>Select Report</option>
                <option>Summary Report</option>
                <option>Detail Report</option>
                <option>Compliance Report</option>
              </select>
              <select className="text-sm border border-gray-300 rounded px-2 py-1 min-w-[150px]">
                <option>Select Template</option>
                <option>Standard Template</option>
                <option>Reps & Certs Template</option>
                <option>CMMC Template</option>
              </select>
              <button className="ml-auto flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
                <FileSpreadsheet className="w-4 h-4" /> Export to Excel
              </button>
            </div>
          )}

          {/* Partner-specific toolbar with search filters */}
          {dataGridView.entity === 'partner' && (
            <div className="border-b border-gray-200">
              {/* Action buttons row */}
              <div className="px-4 py-2 bg-gray-50 flex items-center gap-4">
                <button 
                  onClick={() => setPartnerManualModal({ open: true, mode: 'add', partner: null })}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" /> Add Partner
                </button>
                <button 
                  onClick={() => setPartnerUploadModal({ open: true })}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  <Upload className="w-4 h-4" /> Upload Partners
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
                  <Download className="w-4 h-4" /> Download Template
                </button>
                <div className="ml-auto flex items-center gap-2">
                  <button 
                    onClick={() => setPartnerSearchExpanded(!partnerSearchExpanded)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-sm border rounded ${partnerSearchExpanded ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:bg-gray-50'}`}
                  >
                    <Search className="w-4 h-4" /> {partnerSearchExpanded ? 'Hide Search' : 'Search'}
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
                    <FileSpreadsheet className="w-4 h-4" /> Export to Excel
                  </button>
                </div>
              </div>
              
              {/* Expandable search filters */}
              {partnerSearchExpanded && (
                <div className="px-4 py-3 bg-white border-t border-gray-100">
                  <div className="grid grid-cols-6 gap-3 text-sm">
                    {/* Row 1: Protocol, Touchpoint, Partner Type */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Protocol</label>
                      <select 
                        value={partnerSearchFilters.protocol}
                        onChange={(e) => setPartnerSearchFilters(f => ({...f, protocol: e.target.value}))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                      >
                        <option value="">All Protocols</option>
                        <option value="certs-reps">Certs and Reps</option>
                        <option value="onboarding">Supplier Onboarding</option>
                        <option value="risk">Risk Assessment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Touchpoint</label>
                      <select 
                        value={partnerSearchFilters.touchpoint}
                        onChange={(e) => setPartnerSearchFilters(f => ({...f, touchpoint: e.target.value}))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                      >
                        <option value="">All Touchpoints</option>
                        <option value="reps-2025">Reps and Certs 2025</option>
                        <option value="reps-2024">Reps and Certs 2024</option>
                        <option value="q1-onboard">Q1 Onboarding</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Partner Type</label>
                      <select 
                        value={partnerSearchFilters.partnerType}
                        onChange={(e) => setPartnerSearchFilters(f => ({...f, partnerType: e.target.value}))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                      >
                        <option value="">All Types</option>
                        <option value="supplier">Supplier</option>
                        <option value="investor">Investor</option>
                        <option value="validator">Validator</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Internal ID</label>
                      <input 
                        type="text"
                        value={partnerSearchFilters.internalId}
                        onChange={(e) => setPartnerSearchFilters(f => ({...f, internalId: e.target.value}))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                        placeholder="SUP-001"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                      <input 
                        type="text"
                        value={partnerSearchFilters.name}
                        onChange={(e) => setPartnerSearchFilters(f => ({...f, name: e.target.value}))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Group</label>
                      <select 
                        value={partnerSearchFilters.group}
                        onChange={(e) => setPartnerSearchFilters(f => ({...f, group: e.target.value}))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                      >
                        <option value="">All Groups</option>
                        <option value="CME">CME</option>
                        <option value="CMO">CMO</option>
                        <option value="CMY">CMY</option>
                        <option value="CNO">CNO</option>
                        <option value="COV">COV</option>
                      </select>
                    </div>
                    
                    {/* Row 2: Address fields */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Address 1</label>
                      <input 
                        type="text"
                        value={partnerSearchFilters.address1}
                        onChange={(e) => setPartnerSearchFilters(f => ({...f, address1: e.target.value}))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                      <input 
                        type="text"
                        value={partnerSearchFilters.city}
                        onChange={(e) => setPartnerSearchFilters(f => ({...f, city: e.target.value}))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                      <select 
                        value={partnerSearchFilters.state}
                        onChange={(e) => setPartnerSearchFilters(f => ({...f, state: e.target.value}))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                      >
                        <option value="">Any</option>
                        <option value="CA">California</option>
                        <option value="TX">Texas</option>
                        <option value="AZ">Arizona</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
                      <select 
                        value={partnerSearchFilters.country}
                        onChange={(e) => setPartnerSearchFilters(f => ({...f, country: e.target.value}))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                      >
                        <option value="">All Countries</option>
                        <option value="USA">United States</option>
                        <option value="Mexico">Mexico</option>
                        <option value="Canada">Canada</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">DUNS Number</label>
                      <input 
                        type="text"
                        value={partnerSearchFilters.dunsNumber}
                        onChange={(e) => setPartnerSearchFilters(f => ({...f, dunsNumber: e.target.value}))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Owner</label>
                      <select 
                        value={partnerSearchFilters.owner}
                        onChange={(e) => setPartnerSearchFilters(f => ({...f, owner: e.target.value}))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                      >
                        <option value="">All Owners</option>
                        <option value="John Smith">John Smith</option>
                        <option value="Jane Doe">Jane Doe</option>
                        <option value="Bob Wilson">Bob Wilson</option>
                      </select>
                    </div>
                    
                    {/* Row 3: Contact fields */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                      <input 
                        type="text"
                        value={partnerSearchFilters.firstName}
                        onChange={(e) => setPartnerSearchFilters(f => ({...f, firstName: e.target.value}))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                      <input 
                        type="text"
                        value={partnerSearchFilters.lastName}
                        onChange={(e) => setPartnerSearchFilters(f => ({...f, lastName: e.target.value}))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                      <input 
                        type="text"
                        value={partnerSearchFilters.email}
                        onChange={(e) => setPartnerSearchFilters(f => ({...f, email: e.target.value}))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                      <input 
                        type="text"
                        value={partnerSearchFilters.phone}
                        onChange={(e) => setPartnerSearchFilters(f => ({...f, phone: e.target.value}))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                      <input 
                        type="date"
                        value={partnerSearchFilters.dueDate}
                        onChange={(e) => setPartnerSearchFilters(f => ({...f, dueDate: e.target.value}))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <button className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                        Search
                      </button>
                      <button 
                        onClick={() => setPartnerSearchFilters({
                          protocol: '', touchpoint: '', partnerType: '', internalId: '', name: '',
                          address1: '', address2: '', city: '', state: '', province: '', zipCode: '',
                          country: '', phone: '', fax: '', firstName: '', lastName: '', title: '',
                          email: '', dunsNumber: '', federalId: '', group: '', owner: '', dueDate: ''
                        })}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 overflow-auto p-4">
            {/* Partner-specific table with custom columns */}
            {dataGridView.entity === 'partner' ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Access Code</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Internal ID</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Name</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Status</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Type</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">City</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Country</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Contact</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Owner</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Group</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600 border-b w-10">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(row => {
                    // Status badge colors
                    const statusColors = {
                      'Complete': { bg: '#DCFCE7', text: '#166534' },
                      'Incomplete': { bg: '#FEF3C7', text: '#92400E' },
                      'Reminder Incomplete': { bg: '#FED7AA', text: '#9A3412' },
                      'No Response': { bg: '#FEE2E2', text: '#991B1B' },
                    };
                    const statusColor = statusColors[row.status] || { bg: '#E5E7EB', text: '#374151' };
                    
                    return (
                      <tr 
                        key={row.id} 
                        className="hover:bg-blue-50 border-b cursor-pointer"
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setContextMenu({
                            open: true,
                            x: e.clientX,
                            y: e.clientY,
                            row: row,
                            entity: dataGridView.entity
                          });
                        }}
                        onClick={() => setPartnerManualModal({ open: true, mode: 'edit', partner: row })}
                        style={{ backgroundColor: contextMenu.row?.id === row.id ? '#EFF6FF' : undefined }}
                      >
                        <td className="px-3 py-2 font-mono text-xs">{row.accessCode}</td>
                        <td className="px-3 py-2">{row.internalId}</td>
                        <td className="px-3 py-2 font-medium">{row.name}</td>
                        <td className="px-3 py-2">
                          <span 
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-3 py-2">{row.partnerType}</td>
                        <td className="px-3 py-2">{row.city}</td>
                        <td className="px-3 py-2">{row.country}</td>
                        <td className="px-3 py-2">
                          <div className="text-xs">
                            <div className="font-medium">{row.firstName} {row.lastName}</div>
                            <div className="text-gray-500">{row.email}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2">{row.owner}</td>
                        <td className="px-3 py-2">{row.group}</td>
                        <td className="px-3 py-2 text-center">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setContextMenu({
                                open: true,
                                x: e.clientX,
                                y: e.clientY,
                                row: row,
                                entity: dataGridView.entity
                              });
                            }}
                          >
                            <MoreVertical className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
            /* Generic table for other entities */
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {Object.keys(data[0] || {}).filter(k => k !== 'id' && k !== 'hasCMS').map(key => (
                    <th key={key} className="px-3 py-2 text-left font-medium text-gray-600 border-b">{key}</th>
                  ))}
                  <th className="px-3 py-2 text-center font-medium text-gray-600 border-b w-10">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map(row => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-blue-50 border-b cursor-pointer"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setContextMenu({
                        open: true,
                        x: e.clientX,
                        y: e.clientY,
                        row: row,
                        entity: dataGridView.entity
                      });
                    }}
                    onClick={() => {
                      // Select row on click
                      setContextMenu({ ...contextMenu, row: row, open: false });
                    }}
                    style={{ backgroundColor: contextMenu.row?.id === row.id ? '#EFF6FF' : undefined }}
                  >
                    {Object.entries(row).filter(([k]) => k !== 'id' && k !== 'hasCMS').map(([key, val]) => (
                      <td key={key} className="px-3 py-2">{val}</td>
                    ))}
                    <td className="px-3 py-2 text-center">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>

          {/* Hint for questionnaire */}
          {dataGridView.entity === 'questionnaire' && (
            <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 text-xs text-blue-700">
              💡 Tip: <strong>Right-click</strong> on any row to access options including <strong>Edit/Upload CMS</strong> for questionnaire content management.
            </div>
          )}

          {/* Hint for partner */}
          {dataGridView.entity === 'partner' && (
            <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 text-xs text-blue-700">
              💡 Tip: <strong>Click</strong> on any row to edit partner details. <strong>Right-click</strong> for more options including resend invitation, send reminders, and view response history.
            </div>
          )}
        </div>

        {/* Floating Context Menu */}
        {contextMenu.open && (
          <div 
            className="fixed bg-white rounded shadow-lg border border-gray-300 py-1 z-[100] min-w-[200px]"
            style={{ 
              left: contextMenu.x,
              top: contextMenu.y,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {menuOptions.map((option) => (
              option.divider ? (
                <div key={option.id} className="border-t border-gray-200 my-1" />
              ) : (
                <button
                  key={option.id}
                  className={`w-full px-4 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-blue-50 ${
                    option.highlight ? 'text-blue-600 font-medium' : 'text-gray-700'
                  }`}
                  onClick={() => handleContextAction(option.id, contextMenu.row)}
                >
                  <span className="w-4 text-center text-xs">{option.icon}</span>
                  {option.label}
                </button>
              )
            ))}
          </div>
        )}
      </div>
    );
  };

  // CMS Upload Modal
  const CMSUploadModal = () => {
    if (!cmsUploadModal.open) return null;

    const languages = [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'zh', name: '中文', flag: '🇨🇳' },
      { code: 'ja', name: '日本語', flag: '🇯🇵' },
      { code: 'pt', name: 'Português', flag: '🇧🇷' },
    ];

    const cmsPages = [
      { id: 'access_code', name: 'Access Code', icon: '🔑', count: 9 },
      { id: 'company_view', name: 'Company (View)', icon: '🏢', count: 8 },
      { id: 'company_edit', name: 'Company (Edit)', icon: '✏️', count: 14 },
      { id: 'contact_view', name: 'Contact (View)', icon: '👤', count: 8 },
      { id: 'contact_edit', name: 'Contact (Edit)', icon: '📝', count: 10 },
      { id: 'redirect', name: 'Redirect', icon: '↪️', count: 12 },
      { id: 'questionnaire', name: 'Questionnaire', icon: '📋', count: 10 },
      { id: 'esignature', name: 'E-Signature', icon: '✍️', count: 8 },
      { id: 'confirmation', name: 'Confirmation', icon: '✅', count: 12 },
      { id: 'save_later', name: 'Save for Later', icon: '💾', count: 7 },
    ];

    // CMS data organized by page - now reads from centralized store!
    const cmsDataByPage = {
      access_code: [
        { id: 50, key: 'ACCESS_CODE_TITLE', description: 'ACCESS_CODE_TITLE', text: cmsData.ACCESS_CODE_TITLE, preview: 'Page main title' },
        { id: 1, key: 'ACCESS_CODE_SUBTITLE', description: 'ACCESS_CODE_SUBTITLE', text: cmsData.ACCESS_CODE_SUBTITLE, preview: 'Subtitle under title' },
        { id: 2, key: 'ACCESS_CODE_PANEL_ONE', description: 'ACCESS_CODE_PANEL_ONE', text: cmsData.ACCESS_CODE_PANEL_ONE, preview: 'Left panel text' },
        { id: 3, key: 'ACCESS_CODE_PANEL_TWO', description: 'ACCESS_CODE_PANEL_TWO', text: cmsData.ACCESS_CODE_PANEL_TWO, preview: 'Right panel (instructions)' },
        { id: 56, key: 'ACCESS_CODE_LABEL', description: 'ACCESS_CODE_LABEL', text: cmsData.ACCESS_CODE_LABEL, preview: 'Input field label' },
        { id: 5, key: 'ACCESS_CODE_FOOTER_ONE', description: 'ACCESS_CODE_FOOTER_ONE', text: cmsData.ACCESS_CODE_FOOTER_ONE, preview: 'Footer note' },
        { id: 4, key: 'ACCESS_CODE_SUBMIT_TEXT', description: 'ACCESS_CODE_SUBMIT_TEXT', text: cmsData.ACCESS_CODE_SUBMIT_TEXT, preview: 'Submit button label' },
        { id: 58, key: 'RETRIEVE_ACCESS_CODE_TEXT', description: 'RETRIEVE_ACCESS_CODE_TEXT', text: cmsData.RETRIEVE_ACCESS_CODE_TEXT, preview: 'Retrieve code link' },
        { id: 98, key: 'ACCESS_CODE_VALIDATION', description: 'ACCESS_CODE_VALIDATION', text: cmsData.ACCESS_CODE_VALIDATION, preview: 'Validation message' },
      ],
      company_view: [
        { id: 7, key: 'COMPANY_PAGE_TITLE', description: 'COMPANY_PAGE_TITLE', text: cmsData.COMPANY_PAGE_TITLE, preview: 'Page title' },
        { id: 9, key: 'COMPANY_PAGE_PANEL_ONE', description: 'COMPANY_PAGE_PANEL_ONE', text: cmsData.COMPANY_PAGE_PANEL_ONE, preview: 'Left description' },
        { id: 10, key: 'COMPANY_PAGE_PANEL_TWO', description: 'COMPANY_PAGE_PANEL_TWO', text: cmsData.COMPANY_PAGE_PANEL_TWO, preview: 'Instructions panel' },
        { id: 100, key: 'COMPANY_PAGE_HEADER', description: 'COMPANY_PAGE_HEADER', text: cmsData.COMPANY_PAGE_HEADER, preview: 'Section header' },
        { id: 11, key: 'COMPANY_PAGE_PREVIOUS_TEXT', description: 'COMPANY_PAGE_PREVIOUS_TEXT', text: cmsData.COMPANY_PAGE_PREVIOUS_TEXT, preview: 'Back/Modify button' },
        { id: 12, key: 'COMPANY_PAGE_NEXT_TEXT', description: 'COMPANY_PAGE_NEXT_TEXT', text: cmsData.COMPANY_PAGE_NEXT_TEXT, preview: 'Next/Correct button' },
      ],
      company_edit: [
        { id: 13, key: 'COMPANY_EDIT_PAGE_TITLE', description: 'COMPANY_EDIT_PAGE_TITLE', text: cmsData.COMPANY_EDIT_PAGE_TITLE, preview: 'Page title' },
        { id: 15, key: 'COMPANY_EDIT_PAGE_PANEL_ONE', description: 'COMPANY_EDIT_PAGE_PANEL_ONE', text: cmsData.COMPANY_EDIT_PAGE_PANEL_ONE, preview: 'Left description' },
        { id: 16, key: 'COMPANY_EDIT_PAGE_PANEL_TWO', description: 'COMPANY_EDIT_PAGE_PANEL_TWO', text: cmsData.COMPANY_EDIT_PAGE_PANEL_TWO, preview: 'Instructions' },
        { id: 101, key: 'COMPANY_EDIT_PAGE_HEADER', description: 'COMPANY_EDIT_PAGE_HEADER', text: cmsData.COMPANY_EDIT_PAGE_HEADER, preview: 'Section header' },
        { id: 102, key: 'COMPANY_FIELD_ONE', description: 'COMPANY_FIELD_ONE', text: cmsData.COMPANY_FIELD_ONE, preview: 'Company name label' },
        { id: 103, key: 'COMPANY_FIELD_TWO', description: 'COMPANY_FIELD_TWO', text: cmsData.COMPANY_FIELD_TWO, preview: 'Address section label' },
        { id: 104, key: 'COMPANY_FIELD_THREE', description: 'COMPANY_FIELD_THREE', text: cmsData.COMPANY_FIELD_THREE, preview: 'Address line 1 label' },
        { id: 105, key: 'COMPANY_FIELD_FOUR', description: 'COMPANY_FIELD_FOUR', text: cmsData.COMPANY_FIELD_FOUR, preview: 'Address line 2 label' },
        { id: 106, key: 'COMPANY_FIELD_FIVE', description: 'COMPANY_FIELD_FIVE', text: cmsData.COMPANY_FIELD_FIVE, preview: 'City label' },
        { id: 107, key: 'COMPANY_FIELD_SIX', description: 'COMPANY_FIELD_SIX', text: cmsData.COMPANY_FIELD_SIX, preview: 'State label' },
        { id: 108, key: 'COMPANY_FIELD_SEVEN', description: 'COMPANY_FIELD_SEVEN', text: cmsData.COMPANY_FIELD_SEVEN, preview: 'Zip code label' },
        { id: 109, key: 'COMPANY_FIELD_NINE', description: 'COMPANY_FIELD_NINE', text: cmsData.COMPANY_FIELD_NINE, preview: 'Country label' },
        { id: 110, key: 'COMPANY_EDIT_PAGE_FOOTER_ONE', description: 'COMPANY_EDIT_PAGE_FOOTER_ONE', text: cmsData.COMPANY_EDIT_PAGE_FOOTER_ONE, preview: 'Footer note' },
        { id: 17, key: 'COMPANY_EDIT_PAGE_PREVIOUS_TEXT', description: 'COMPANY_EDIT_PAGE_PREVIOUS_TEXT', text: cmsData.COMPANY_EDIT_PAGE_PREVIOUS_TEXT, preview: 'Cancel button' },
        { id: 18, key: 'COMPANY_EDIT_PAGE_NEXT_TEXT', description: 'COMPANY_EDIT_PAGE_NEXT_TEXT', text: cmsData.COMPANY_EDIT_PAGE_NEXT_TEXT, preview: 'Save button' },
      ],
      contact_view: [
        { id: 19, key: 'CONTACT_PAGE_TITLE', description: 'CONTACT_PAGE_TITLE', text: cmsData.CONTACT_PAGE_TITLE, preview: 'Page title' },
        { id: 21, key: 'CONTACT_PAGE_PANEL_ONE', description: 'CONTACT_PAGE_PANEL_ONE', text: cmsData.CONTACT_PAGE_PANEL_ONE, preview: 'Left description' },
        { id: 22, key: 'CONTACT_PAGE_PANEL_TWO', description: 'CONTACT_PAGE_PANEL_TWO', text: cmsData.CONTACT_PAGE_PANEL_TWO, preview: 'Instructions' },
        { id: 111, key: 'CONTACT_PAGE_HEADER', description: 'CONTACT_PAGE_HEADER', text: cmsData.CONTACT_PAGE_HEADER, preview: 'Section header' },
        { id: 23, key: 'CONTACT_PAGE_PREVIOUS_TEXT', description: 'CONTACT_PAGE_PREVIOUS_TEXT', text: cmsData.CONTACT_PAGE_PREVIOUS_TEXT, preview: 'Back button' },
        { id: 24, key: 'CONTACT_PAGE_NEXT_TEXT', description: 'CONTACT_PAGE_NEXT_TEXT', text: cmsData.CONTACT_PAGE_NEXT_TEXT, preview: 'Confirm button' },
      ],
      contact_edit: [
        { id: 25, key: 'CONTACT_EDIT_PAGE_TITLE', description: 'CONTACT_EDIT_PAGE_TITLE', text: cmsData.CONTACT_EDIT_PAGE_TITLE, preview: 'Page title' },
        { id: 28, key: 'CONTACT_EDIT_PAGE_PANEL_TWO', description: 'CONTACT_EDIT_PAGE_PANEL_TWO', text: cmsData.CONTACT_EDIT_PAGE_PANEL_TWO, preview: 'Instructions' },
        { id: 112, key: 'CONTACT_EDIT_FIELD_ONE', description: 'CONTACT_EDIT_FIELD_ONE', text: cmsData.CONTACT_EDIT_FIELD_ONE, preview: 'First name label' },
        { id: 113, key: 'CONTACT_EDIT_FIELD_TWO', description: 'CONTACT_EDIT_FIELD_TWO', text: cmsData.CONTACT_EDIT_FIELD_TWO, preview: 'Last name label' },
        { id: 114, key: 'CONTACT_EDIT_FIELD_THREE', description: 'CONTACT_EDIT_FIELD_THREE', text: cmsData.CONTACT_EDIT_FIELD_THREE, preview: 'Title label' },
        { id: 115, key: 'CONTACT_EDIT_FIELD_FOUR', description: 'CONTACT_EDIT_FIELD_FOUR', text: cmsData.CONTACT_EDIT_FIELD_FOUR, preview: 'Email label' },
        { id: 116, key: 'CONTACT_EDIT_FIELD_FIVE', description: 'CONTACT_EDIT_FIELD_FIVE', text: cmsData.CONTACT_EDIT_FIELD_FIVE, preview: 'Phone label' },
        { id: 117, key: 'CONTACT_EDIT_PAGE_EMAIL_CHANGE_CONFIRMATION', description: 'CONTACT_EDIT_PAGE_EMAIL_CHANGE_CONFIRMATION', text: cmsData.CONTACT_EDIT_PAGE_EMAIL_CHANGE_CONFIRMATION, preview: 'Email change popup' },
        { id: 29, key: 'CONTACT_EDIT_PAGE_PREVIOUS_TEXT', description: 'CONTACT_EDIT_PAGE_PREVIOUS_TEXT', text: cmsData.CONTACT_EDIT_PAGE_PREVIOUS_TEXT, preview: 'Cancel button' },
        { id: 30, key: 'CONTACT_EDIT_PAGE_NEXT_TEXT', description: 'CONTACT_EDIT_PAGE_NEXT_TEXT', text: cmsData.CONTACT_EDIT_PAGE_NEXT_TEXT, preview: 'Save button' },
      ],
      questionnaire: [
        { id: 31, key: 'QUESTIONNAIRE_PAGE_TITLE', description: 'QUESTIONNAIRE_PAGE_TITLE', text: cmsData.QUESTIONNAIRE_PAGE_TITLE, preview: 'Page title' },
        { id: 33, key: 'QUESTIONNAIRE_PAGE_PANEL_ONE', description: 'QUESTIONNAIRE_PAGE_PANEL_ONE', text: cmsData.QUESTIONNAIRE_PAGE_PANEL_ONE, preview: 'Left instructions' },
        { id: 34, key: 'QUESTIONNAIRE_PAGE_PANEL_TWO', description: 'QUESTIONNAIRE_PAGE_PANEL_TWO', text: cmsData.QUESTIONNAIRE_PAGE_PANEL_TWO, preview: 'Right instructions' },
        { id: 59, key: 'SAVE_FOR_LATER_TEXT', description: 'SAVE_FOR_LATER_TEXT', text: cmsData.SAVE_FOR_LATER_TEXT, preview: 'Save later button' },
        { id: 60, key: 'QUESTIONNAIRE_PDF', description: 'QUESTIONNAIRE_PDF', text: cmsData.QUESTIONNAIRE_PDF, preview: 'PDF link text' },
        { id: 61, key: 'QUESTIONNAIRE_FAQ', description: 'QUESTIONNAIRE_FAQ', text: cmsData.QUESTIONNAIRE_FAQ, preview: 'FAQ link text' },
        { id: 35, key: 'QUESTIONNAIRE_PAGE_PREVIOUS_TEXT', description: 'QUESTIONNAIRE_PAGE_PREVIOUS_TEXT', text: cmsData.QUESTIONNAIRE_PAGE_PREVIOUS_TEXT, preview: 'Previous button' },
        { id: 36, key: 'QUESTIONNAIRE_PAGE_NEXT_TEXT', description: 'QUESTIONNAIRE_PAGE_NEXT_TEXT', text: cmsData.QUESTIONNAIRE_PAGE_NEXT_TEXT, preview: 'Next button' },
      ],
      esignature: [
        { id: 37, key: 'ESIGNATURE_PAGE_TITLE', description: 'ESIGNATURE_PAGE_TITLE', text: cmsData.ESIGNATURE_PAGE_TITLE, preview: 'Page title' },
        { id: 39, key: 'ESIGNATURE_PAGE_PANEL_ONE', description: 'ESIGNATURE_PAGE_PANEL_ONE', text: cmsData.ESIGNATURE_PAGE_PANEL_ONE, preview: 'Left description' },
        { id: 40, key: 'ESIGNATURE_PAGE_PANEL_TWO', description: 'ESIGNATURE_PAGE_PANEL_TWO', text: cmsData.ESIGNATURE_PAGE_PANEL_TWO, preview: 'Instructions' },
        { id: 52, key: 'ESIGNATURE_PAGE_TEXT', description: 'ESIGNATURE_PAGE_TEXT', text: cmsData.ESIGNATURE_PAGE_TEXT, preview: 'Confidentiality statement' },
        { id: 118, key: 'ESIGNATURE_FIELD_ONE', description: 'ESIGNATURE_FIELD_ONE', text: cmsData.ESIGNATURE_FIELD_ONE, preview: 'First name label' },
        { id: 119, key: 'ESIGNATURE_FIELD_TWO', description: 'ESIGNATURE_FIELD_TWO', text: cmsData.ESIGNATURE_FIELD_TWO, preview: 'Last name label' },
        { id: 120, key: 'ESIGNATURE_FOOTER_ONE', description: 'ESIGNATURE_FOOTER_ONE', text: cmsData.ESIGNATURE_FOOTER_ONE, preview: 'Footer note' },
        { id: 41, key: 'ESIGNATURE_PAGE_PREVIOUS_TEXT', description: 'ESIGNATURE_PAGE_PREVIOUS_TEXT', text: cmsData.ESIGNATURE_PAGE_PREVIOUS_TEXT, preview: 'Previous button' },
        { id: 42, key: 'ESIGNATURE_PAGE_NEXT_TEXT', description: 'ESIGNATURE_PAGE_NEXT_TEXT', text: cmsData.ESIGNATURE_PAGE_NEXT_TEXT, preview: 'Submit button' },
      ],
      confirmation: [
        { id: 43, key: 'CONFIRMATION_PAGE_TITLE', description: 'CONFIRMATION_PAGE_TITLE', text: cmsData.CONFIRMATION_PAGE_TITLE, preview: 'Page title' },
        { id: 45, key: 'CONFIRMATION_PAGE_PANEL_ONE', description: 'CONFIRMATION_PAGE_PANEL_ONE', text: cmsData.CONFIRMATION_PAGE_PANEL_ONE, preview: 'Thank you message' },
        { id: 46, key: 'CONFIRMATION_PAGE_PANEL_TWO', description: 'CONFIRMATION_PAGE_PANEL_TWO', text: cmsData.CONFIRMATION_PAGE_PANEL_TWO, preview: 'Instructions' },
        { id: 53, key: 'CONFIRMATION_PAGE_HEADLINE', description: 'CONFIRMATION_PAGE_HEADLINE', text: cmsData.CONFIRMATION_PAGE_HEADLINE, preview: 'Success headline' },
        { id: 54, key: 'CONFIRMATION_PAGE_SIGNOFF_STATEMENT', description: 'CONFIRMATION_PAGE_SIGNOFF_STATEMENT', text: cmsData.CONFIRMATION_PAGE_SIGNOFF_STATEMENT, preview: 'Confirmation message' },
        { id: 64, key: 'CONFIRMATION_PAGE_SIGNOFF_INCOMPLETE_STATEMENT', description: 'CONFIRMATION_PAGE_SIGNOFF_INCOMPLETE_STATEMENT', text: cmsData.CONFIRMATION_PAGE_SIGNOFF_INCOMPLETE_STATEMENT, preview: 'Incomplete warning' },
        { id: 121, key: 'CONFIRMATION_PAGE_ALERTIFY', description: 'CONFIRMATION_PAGE_ALERTIFY', text: cmsData.CONFIRMATION_PAGE_ALERTIFY, preview: 'Popup message' },
        { id: 47, key: 'CONFIRMATION_PAGE_PREVIOUS_TEXT', description: 'CONFIRMATION_PAGE_PREVIOUS_TEXT', text: cmsData.CONFIRMATION_PAGE_PREVIOUS_TEXT, preview: 'Print button' },
        { id: 48, key: 'CONFIRMATION_PAGE_NEXT_TEXT', description: 'CONFIRMATION_PAGE_NEXT_TEXT', text: cmsData.CONFIRMATION_PAGE_NEXT_TEXT, preview: 'Exit button' },
        { id: 49, key: 'CONFIRMATION_PAGE_EXIT_LINK', description: 'CONFIRMATION_PAGE_EXIT_LINK', text: cmsData.CONFIRMATION_PAGE_EXIT_LINK, preview: 'Exit destination URL', link: cmsData.CONFIRMATION_PAGE_EXIT_LINK },
        { id: 51, key: 'CONTACT_US_EMAIL', description: 'CONTACT_US_EMAIL', text: cmsData.CONTACT_US_EMAIL, preview: 'Contact link text' },
      ],
      redirect: [
        { id: 68, key: 'REDIRECT_PAGE_TITLE', description: 'REDIRECT_PAGE_TITLE', text: cmsData.REDIRECT_PAGE_TITLE, preview: 'Page title' },
        { id: 70, key: 'REDIRECT_PAGE_PANEL_ONE', description: 'REDIRECT_PAGE_PANEL_ONE', text: cmsData.REDIRECT_PAGE_PANEL_ONE, preview: 'Left description' },
        { id: 71, key: 'REDIRECT_PAGE_PANEL_TWO', description: 'REDIRECT_PAGE_PANEL_TWO', text: cmsData.REDIRECT_PAGE_PANEL_TWO, preview: 'Instructions' },
        { id: 72, key: 'REDIRECT_PAGE_HEADER', description: 'REDIRECT_PAGE_HEADER', text: cmsData.REDIRECT_PAGE_HEADER, preview: 'Section header' },
        { id: 73, key: 'REDIRECT_PAGE_HEADER_TEXT', description: 'REDIRECT_PAGE_HEADER_TEXT', text: cmsData.REDIRECT_PAGE_HEADER_TEXT, preview: 'Header explanation' },
        { id: 122, key: 'REDIRECT_PAGE_FIELD_ONE', description: 'REDIRECT_PAGE_FIELD_ONE', text: cmsData.REDIRECT_PAGE_FIELD_ONE, preview: 'First name label' },
        { id: 123, key: 'REDIRECT_PAGE_FIELD_TWO', description: 'REDIRECT_PAGE_FIELD_TWO', text: cmsData.REDIRECT_PAGE_FIELD_TWO, preview: 'Last name label' },
        { id: 124, key: 'REDIRECT_PAGE_FIELD_THREE', description: 'REDIRECT_PAGE_FIELD_THREE', text: cmsData.REDIRECT_PAGE_FIELD_THREE, preview: 'Title label' },
        { id: 125, key: 'REDIRECT_PAGE_FIELD_FOUR', description: 'REDIRECT_PAGE_FIELD_FOUR', text: cmsData.REDIRECT_PAGE_FIELD_FOUR, preview: 'Email label' },
        { id: 126, key: 'REDIRECT_PAGE_FIELD_FIVE', description: 'REDIRECT_PAGE_FIELD_FIVE', text: cmsData.REDIRECT_PAGE_FIELD_FIVE, preview: 'Phone label' },
        { id: 74, key: 'REDIRECT_PAGE_PREVIOUS_TEXT', description: 'REDIRECT_PAGE_PREVIOUS_TEXT', text: cmsData.REDIRECT_PAGE_PREVIOUS_TEXT, preview: 'Cancel button' },
        { id: 75, key: 'REDIRECT_PAGE_NEXT_TEXT', description: 'REDIRECT_PAGE_NEXT_TEXT', text: cmsData.REDIRECT_PAGE_NEXT_TEXT, preview: 'Redirect button' },
      ],
      save_later: [
        { id: 59, key: 'SAVE_FOR_LATER_TEXT', description: 'SAVE_FOR_LATER_TEXT', text: cmsData.SAVE_FOR_LATER_TEXT, preview: 'Save button text' },
        { id: 70, key: 'SAVE_EXIT_DIALOG_TITLE', description: 'SAVE_EXIT_DIALOG_TITLE', text: cmsData.SAVE_EXIT_DIALOG_TITLE, preview: 'Dialog title' },
        { id: 71, key: 'SAVE_EXIT_DIALOG_MESSAGE', description: 'SAVE_EXIT_DIALOG_MESSAGE', text: cmsData.SAVE_EXIT_DIALOG_MESSAGE, preview: 'Main message' },
        { id: 72, key: 'SAVE_EXIT_RESUME_LABEL', description: 'SAVE_EXIT_RESUME_LABEL', text: cmsData.SAVE_EXIT_RESUME_LABEL, preview: 'Access code label' },
        { id: 73, key: 'SAVE_EXIT_COPY_BUTTON', description: 'SAVE_EXIT_COPY_BUTTON', text: cmsData.SAVE_EXIT_COPY_BUTTON, preview: 'Copy button text' },
        { id: 74, key: 'SAVE_EXIT_INSTRUCTIONS', description: 'SAVE_EXIT_INSTRUCTIONS', text: cmsData.SAVE_EXIT_INSTRUCTIONS, preview: 'Resume instructions' },
        { id: 75, key: 'SAVE_EXIT_CLOSE_BUTTON', description: 'SAVE_EXIT_CLOSE_BUTTON', text: cmsData.SAVE_EXIT_CLOSE_BUTTON, preview: 'Close button text' },
      ],
    };

    const currentPageData = cmsDataByPage[selectedCmsPage] || [];

    const cmsMenuOptions = [
      { id: 'edit', label: 'Edit Text', icon: '✏️' },
      { id: 'preview', label: 'Preview', icon: '👁️' },
      { id: 'reset', label: 'Reset to Default', icon: '🔄' },
      { id: 'divider1', divider: true },
      { id: 'copy', label: 'Copy to Other Languages', icon: '🌐' },
      { id: 'upload-doc', label: 'Upload Document', icon: '📄' },
    ];

    const handleCmsAction = (actionId, row) => {
      if (actionId === 'edit') {
        setCmsEditingRow(row);
        setCmsEditValue(row.text);
      }
      setCmsContextMenu({ open: false, x: 0, y: 0, row: null });
    };

    const saveEdit = () => {
      if (cmsEditingRow && cmsEditingRow.key) {
        updateCmsValue(cmsEditingRow.key, cmsEditValue);
      }
      setCmsEditingRow(null);
      setCmsEditValue('');
    };

    const cancelEdit = () => {
      setCmsEditingRow(null);
      setCmsEditValue('');
    };

    const closeModal = () => {
      setCmsUploadModal({ open: false, questionnaire: null });
      setCmsView('choice');
      setCmsPage(1);
      setSelectedCmsPage('access_code');
      setSelectedCmsLanguage('en');
      setCmsContextMenu({ open: false, x: 0, y: 0, row: null });
      setCmsEditingRow(null);
      setCmsEditValue('');
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
        <div className={`bg-white rounded-lg shadow-xl ${cmsView === 'edit' ? 'w-[98%] max-w-7xl' : 'w-full max-w-2xl'} max-h-[95vh] overflow-hidden flex flex-col`}>
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {cmsView === 'choice' && 'Edit/Upload CMS'}
                {cmsView === 'upload' && 'Upload New CMS'}
                {cmsView === 'edit' && 'CMS Content Editor'}
              </h2>
              <p className="text-sm text-gray-500">{cmsUploadModal.questionnaire?.name} - {cmsUploadModal.questionnaire?.touchpoint}</p>
            </div>
            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Choice View */}
          {cmsView === 'choice' && (
            <div className="p-6">
              <p className="text-gray-600 mb-6">The CMS (Content Management System) controls all text, labels, and messaging displayed throughout the questionnaire workflow. Each page can be fully customized for different languages and corporate standards.</p>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Upload New Option */}
                <button
                  onClick={() => setCmsView('upload')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Upload New CMS</h3>
                  <p className="text-sm text-gray-500">Upload a CMS spreadsheet to replace or add language versions</p>
                </button>

                {/* Edit Existing Option */}
                <button
                  onClick={() => setCmsView('edit')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-200">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Edit Existing CMS</h3>
                  <p className="text-sm text-gray-500">Modify page content by section with visual preview</p>
                </button>
              </div>

              {/* Current Status */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Configured Languages:</span>
                  <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    <Download className="w-4 h-4" /> Export All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">🇺🇸 English (Default)</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">🇪🇸 Español</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">🇫🇷 Français (Incomplete)</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full flex items-center gap-1">+ Add Language</span>
                </div>
              </div>

              {/* Pages Overview */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium mb-2">📄 Pages managed by CMS:</p>
                <div className="grid grid-cols-5 gap-2 text-xs text-blue-700">
                  <span>🔑 Access Code</span>
                  <span>🏢 Company</span>
                  <span>👤 Contact</span>
                  <span>📋 Questionnaire</span>
                  <span>✍️ E-Signature</span>
                  <span>✅ Confirmation</span>
                  <span>↪️ Redirect</span>
                  <span>💾 Save Later</span>
                </div>
              </div>
            </div>
          )}

          {/* Upload View */}
          {cmsView === 'upload' && (
            <div className="p-6">
              {/* Back button */}
              <button 
                onClick={() => setCmsView('choice')}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 mb-4"
              >
                <ChevronLeft className="w-4 h-4" /> Back to options
              </button>

              {/* Language Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Language</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="en">🇺🇸 English (Replace existing)</option>
                  <option value="es">🇪🇸 Español (Replace existing)</option>
                  <option value="fr">🇫🇷 Français (Add new)</option>
                  <option value="de">🇩🇪 Deutsch (Add new)</option>
                  <option value="zh">🇨🇳 中文 (Add new)</option>
                  <option value="ja">🇯🇵 日本語 (Add new)</option>
                </select>
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer mb-4">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 font-medium">Drag and drop your CMS spreadsheet here</p>
                <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                <p className="text-xs text-gray-400 mt-3">Supported formats: .xlsx, .xls, .csv</p>
              </div>

              {/* Template Download */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-800">Need a template?</span>
                </div>
                <button className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1">
                  <Download className="w-4 h-4" /> Download CMS Template
                </button>
              </div>

              {/* Info */}
              <div className="text-xs text-gray-500 mb-6">
                <p className="font-medium mb-1">The CMS spreadsheet should contain columns:</p>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li><strong>questionnaireCMS</strong> - Numeric ID for the content element</li>
                  <li><strong>description</strong> - Key identifier (e.g., ACCESS_CODE_TITLE)</li>
                  <li><strong>text</strong> - The actual content (supports HTML)</li>
                  <li><strong>link</strong> - Optional URL or email link</li>
                  <li><strong>doc</strong> - Optional document reference</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setCmsView('choice')}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-90"
                  style={{ backgroundColor: '#2496F4' }}
                >
                  Upload CMS
                </button>
              </div>
            </div>
          )}

          {/* Edit View - Page-based Editor */}
          {cmsView === 'edit' && (
            <div className="flex-1 flex overflow-hidden" onClick={() => setCmsContextMenu({ open: false, x: 0, y: 0, row: null })}>
              {/* Left Sidebar - Page Navigation */}
              <div className="w-56 bg-gray-50 border-r border-gray-200 overflow-y-auto flex-shrink-0">
                <div className="p-3 border-b border-gray-200">
                  <button 
                    onClick={() => setCmsView('choice')}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 mb-3"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  
                  {/* Language Selector */}
                  <label className="block text-xs font-medium text-gray-500 mb-1">Language</label>
                  <select 
                    value={selectedCmsLanguage}
                    onChange={(e) => setSelectedCmsLanguage(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-500 px-2 mb-2">PAGES</p>
                  {cmsPages.map(page => (
                    <button
                      key={page.id}
                      onClick={() => setSelectedCmsPage(page.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm mb-1 ${
                        selectedCmsPage === page.id 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{page.icon}</span>
                        <span className="truncate">{page.name}</span>
                      </span>
                      <span className="text-xs text-gray-400">{page.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="px-4 py-2 bg-white border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cmsPages.find(p => p.id === selectedCmsPage)?.icon}</span>
                    <span className="font-medium text-gray-800">{cmsPages.find(p => p.id === selectedCmsPage)?.name} Page</span>
                    <span className="text-sm text-gray-400">({currentPageData.length} elements)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50">
                      <Eye className="w-4 h-4" /> Preview Page
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
                      <Download className="w-4 h-4" /> Export
                    </button>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="flex-1 overflow-auto p-4">
                  <table className="w-full text-sm border border-gray-300">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-r w-16">ID</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-r w-64">Element Key</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-r">Text Content</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700 border-b w-40">Preview Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPageData.map(row => (
                        <tr 
                          key={row.id} 
                          className="hover:bg-blue-50 border-b cursor-pointer"
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCmsContextMenu({
                              open: true,
                              x: e.clientX,
                              y: e.clientY,
                              row: row
                            });
                          }}
                          style={{ backgroundColor: cmsContextMenu.row?.id === row.id ? '#EFF6FF' : undefined }}
                        >
                          <td className="px-3 py-2 border-r text-gray-500 text-xs">{row.id}</td>
                          <td className="px-3 py-2 border-r font-mono text-xs text-gray-700">{row.description}</td>
                          <td className="px-3 py-2 border-r">
                            <div className="truncate max-w-lg" title={row.text}>
                              {row.text ? (
                                <span className="text-gray-800">{row.text.replace(/<[^>]*>/g, '').substring(0, 80)}...</span>
                              ) : (
                                <span className="text-gray-400 italic">Empty</span>
                              )}
                            </div>
                            {row.link && (
                              <div className="text-xs text-blue-500 mt-0.5 truncate">🔗 {row.link}</div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500">{row.preview}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer with tips */}
                <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 text-xs text-blue-700 flex items-center justify-between">
                  <span>💡 <strong>Right-click</strong> to edit, preview, reset to default, or copy to other languages.</span>
                  <span className="text-blue-500">Editing: {languages.find(l => l.code === selectedCmsLanguage)?.flag} {languages.find(l => l.code === selectedCmsLanguage)?.name}</span>
                </div>

                {/* CMS Context Menu */}
                {cmsContextMenu.open && (
                  <div 
                    className="fixed bg-white rounded shadow-lg border border-gray-300 py-1 z-[100] min-w-[200px]"
                    style={{ 
                      left: cmsContextMenu.x,
                      top: cmsContextMenu.y,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {cmsMenuOptions.map((option) => (
                      option.divider ? (
                        <div key={option.id} className="border-t border-gray-200 my-1" />
                      ) : (
                        <button
                          key={option.id}
                          className="w-full px-4 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-blue-50 text-gray-700"
                          onClick={() => handleCmsAction(option.id, cmsContextMenu.row)}
                        >
                          <span className="w-4 text-center text-xs">{option.icon}</span>
                          {option.label}
                        </button>
                      )
                    ))}
                  </div>
                )}

                {/* Edit Modal */}
                {cmsEditingRow && (
                  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[110]" onClick={cancelEdit}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Edit CMS Content</h3>
                          <p className="text-sm text-gray-500 font-mono">{cmsEditingRow.description}</p>
                        </div>
                        <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preview Location</label>
                        <p className="text-sm text-gray-500">{cmsEditingRow.preview}</p>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Text Content</label>
                        <textarea
                          value={cmsEditValue}
                          onChange={(e) => setCmsEditValue(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter content..."
                        />
                        <p className="text-xs text-gray-400 mt-1">HTML tags are supported for formatting (e.g., &lt;b&gt;, &lt;span style="..."&gt;)</p>
                      </div>
                      
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                        <p className="text-sm text-yellow-800">
                          <strong>🔗 Live Preview:</strong> Changes will immediately update the supplier questionnaire view. 
                          Switch to "Supplier" role after saving to see your changes.
                        </p>
                      </div>
                      
                      <div className="flex justify-end gap-3">
                        <button onClick={cancelEdit} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                          Cancel
                        </button>
                        <button onClick={saveEdit} className="px-4 py-2 text-sm text-white rounded-lg" style={{ backgroundColor: '#2496F4' }}>
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // AutoMail Upload Modal - ENHANCED with Full Editing, Preview, and SendGrid
  const AutoMailModal = () => {
    if (!autoMailModal.open) return null;

    const autoMailPerPage = 10;

    // AutoMail data structure - connected to amsData store
    const autoMailData = [
      { id: 5316, rid: 5316, type: 1, typeName: 'Invitation', amsKey: 'INVITE', subject: amsData.INVITE_SUBJECT, text: amsData.INVITE_TEXT, footer: amsData.INVITE_FOOTER, signature: amsData.INVITE_SIGNATURE, sendFactor: amsData.INVITE_SEND_FACTOR },
      { id: 5317, rid: 5317, type: 2, typeName: 'Incomplete', amsKey: 'INCOMPLETE', subject: amsData.INCOMPLETE_SUBJECT, text: amsData.INCOMPLETE_TEXT, footer: amsData.INCOMPLETE_FOOTER, signature: amsData.INCOMPLETE_SIGNATURE, sendFactor: amsData.INCOMPLETE_SEND_FACTOR },
      { id: 5318, rid: 5318, type: 3, typeName: 'Complete', amsKey: 'COMPLETE', subject: amsData.COMPLETE_SUBJECT, text: amsData.COMPLETE_TEXT, footer: amsData.COMPLETE_FOOTER, signature: amsData.COMPLETE_SIGNATURE, sendFactor: amsData.COMPLETE_SEND_FACTOR },
      { id: 5319, rid: 5319, type: 1010, typeName: '1st Reminder', amsKey: 'REMINDER1', subject: amsData.REMINDER1_SUBJECT, text: amsData.REMINDER1_TEXT, footer: amsData.REMINDER1_FOOTER, signature: amsData.REMINDER1_SIGNATURE, sendFactor: amsData.REMINDER1_SEND_FACTOR },
      { id: 5320, rid: 5320, type: 1011, typeName: '2nd Reminder', amsKey: 'REMINDER2', subject: amsData.REMINDER2_SUBJECT, text: amsData.REMINDER2_TEXT, footer: amsData.REMINDER2_FOOTER, signature: amsData.REMINDER2_SIGNATURE, sendFactor: amsData.REMINDER2_SEND_FACTOR },
      { id: 5321, rid: 5321, type: 1012, typeName: '3rd Reminder', amsKey: 'REMINDER3', subject: amsData.REMINDER3_SUBJECT, text: amsData.REMINDER3_TEXT, footer: amsData.REMINDER3_FOOTER, signature: amsData.REMINDER3_SIGNATURE, sendFactor: amsData.REMINDER3_SEND_FACTOR },
      { id: 5322, rid: 5322, type: 1013, typeName: 'Past Due', amsKey: 'PASTDUE', subject: amsData.PASTDUE_SUBJECT, text: amsData.PASTDUE_TEXT, footer: amsData.PASTDUE_FOOTER, signature: amsData.PASTDUE_SIGNATURE, sendFactor: amsData.PASTDUE_SEND_FACTOR },
      { id: 5323, rid: 5323, type: 1007, typeName: 'FAR 12 Invite', amsKey: 'FAR12', subject: amsData.FAR12_SUBJECT, text: amsData.FAR12_TEXT, footer: amsData.FAR12_FOOTER, signature: amsData.FAR12_SIGNATURE, sendFactor: amsData.FAR12_SEND_FACTOR },
      { id: 5324, rid: 5324, type: 1008, typeName: 'FAR 15 Invite', amsKey: 'FAR15', subject: amsData.FAR15_SUBJECT, text: amsData.FAR15_TEXT, footer: amsData.FAR15_FOOTER, signature: amsData.FAR15_SIGNATURE, sendFactor: amsData.FAR15_SEND_FACTOR },
    ];

    const filteredData = selectedMailCategory === 'all' 
      ? autoMailData 
      : autoMailData.filter(row => {
          if (selectedMailCategory === 'invite') return row.type === 1;
          if (selectedMailCategory === 'reminder') return row.type >= 1010 && row.type <= 1013;
          if (selectedMailCategory === 'status') return row.type === 2 || row.type === 3;
          if (selectedMailCategory === 'far') return row.type === 1007 || row.type === 1008;
          return true;
        });

    const totalPages = Math.ceil(filteredData.length / autoMailPerPage);
    const paginatedData = filteredData.slice((autoMailPage - 1) * autoMailPerPage, autoMailPage * autoMailPerPage);

    const autoMailMenuOptions = [
      { id: 'edit', label: 'Edit Template', icon: '✏️' },
      { id: 'preview', label: 'Preview Email', icon: '👁️' },
      { id: 'divider1', divider: true },
      { id: 'test-send', label: 'Send Test Email (SendGrid)', icon: '📧' },
      { id: 'divider2', divider: true },
      { id: 'copy', label: 'Copy to Clipboard', icon: '📋' },
      { id: 'reset', label: 'Reset to Default', icon: '🔄' },
    ];

    const handleAutoMailAction = (actionId, row) => {
      setAutoMailContextMenu({ open: false, x: 0, y: 0, row: null });
      
      if (actionId === 'edit') {
        setAmsEditingRow(row);
        setAmsEditValue({
          subject: row.subject,
          text: row.text,
          footer: row.footer,
          signature: row.signature
        });
      } else if (actionId === 'preview') {
        setAmsPreviewRow(row);
      } else if (actionId === 'test-send') {
        setSendTestEmail({ open: true, row: row, email: '', sending: false, sent: false });
      } else if (actionId === 'copy') {
        const fullEmail = `Subject: ${row.subject}\n\n${stripHtml(row.text)}\n\n${row.footer}\n\n${row.signature}`;
        navigator.clipboard.writeText(fullEmail);
      }
    };

    const saveAmsEdit = () => {
      if (amsEditingRow) {
        updateAmsValue(`${amsEditingRow.amsKey}_SUBJECT`, amsEditValue.subject);
        updateAmsValue(`${amsEditingRow.amsKey}_TEXT`, amsEditValue.text);
        updateAmsValue(`${amsEditingRow.amsKey}_FOOTER`, amsEditValue.footer);
        updateAmsValue(`${amsEditingRow.amsKey}_SIGNATURE`, amsEditValue.signature);
        setAmsEditingRow(null);
      }
    };

    const insertMergeTag = (tag) => {
      // Insert at cursor position in text field (simplified)
      setAmsEditValue(prev => ({
        ...prev,
        text: prev.text + ' ' + tag
      }));
    };

    // =====================================================
    // SENDGRID CONFIGURATION
    // ⚠️  REGENERATE THIS KEY AFTER TESTING - it's been exposed in chat!
    // =====================================================
    const SENDGRID_API_KEY = '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';
    const SENDER_EMAIL = 'john@intelleges.com';
    // =====================================================

    const sendViaSegndGrid = async () => {
      setSendTestEmail(prev => ({ ...prev, sending: true, error: null }));
      
      const row = sendTestEmail.row;
      const recipientEmail = sendTestEmail.email || 'john@intelleges.com';
      
      // Build the email content with merge tags replaced
      const subject = replaceMergeTags(row.subject);
      const htmlBody = `
        ${replaceMergeTags(row.text)}
        <br/><br/>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
        <p style="color: #666; font-size: 14px;">${replaceMergeTags(row.footer)}</p>
        <p style="color: #333; font-size: 14px; font-weight: bold;">${replaceMergeTags(row.signature)}</p>
      `;

      // Check if API key is configured
      if (SENDGRID_API_KEY === 'PASTE_YOUR_KEY_HERE') {
        // Fallback to simulation if no key configured
        console.log('SendGrid API key not configured - simulating send');
        console.log('Would send to:', recipientEmail);
        console.log('Subject:', subject);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSendTestEmail(prev => ({ ...prev, sending: false, sent: true }));
        return;
      }

      try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: recipientEmail }],
              subject: subject,
            }],
            from: {
              email: SENDER_EMAIL,
              name: 'Intelleges AutoMail System'
            },
            content: [{
              type: 'text/html',
              value: htmlBody
            }],
            tracking_settings: {
              click_tracking: { enable: true },
              open_tracking: { enable: true }
            }
          })
        });

        if (response.ok || response.status === 202) {
          console.log('✅ Email sent successfully via SendGrid!');
          setSendTestEmail(prev => ({ ...prev, sending: false, sent: true }));
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('SendGrid Error:', response.status, errorData);
          setSendTestEmail(prev => ({ 
            ...prev, 
            sending: false, 
            error: `SendGrid Error: ${response.status} - ${errorData.errors?.[0]?.message || 'Unknown error'}`
          }));
        }
      } catch (error) {
        console.error('Network error:', error);
        setSendTestEmail(prev => ({ 
          ...prev, 
          sending: false, 
          error: `Network error: ${error.message}. Note: CORS may block browser requests - use a backend proxy in production.`
        }));
      }
    };

    const closeModal = () => {
      setAutoMailModal({ open: false, questionnaire: null });
      setAutoMailView('choice');
      setAutoMailPage(1);
      setAutoMailContextMenu({ open: false, x: 0, y: 0, row: null });
      setAmsEditingRow(null);
      setAmsPreviewRow(null);
      setSendTestEmail({ open: false, row: null, email: '', sending: false, sent: false, error: null });
    };

    const getTypeColor = (type) => {
      if (type === 1) return { bg: '#DBEAFE', text: '#1E40AF' }; // Invitation - blue
      if (type === 2) return { bg: '#FEF3C7', text: '#92400E' }; // Incomplete - yellow
      if (type === 3) return { bg: '#D1FAE5', text: '#065F46' }; // Complete - green
      if (type >= 1010 && type <= 1012) return { bg: '#FEE2E2', text: '#991B1B' }; // Reminders - light red
      if (type === 1013) return { bg: '#FCA5A5', text: '#7F1D1D' }; // Past Due - red
      if (type === 1007 || type === 1008) return { bg: '#E0E7FF', text: '#3730A3' }; // FAR - indigo
      return { bg: '#F3F4F6', text: '#374151' }; // Default - gray
    };

    const tagCategories = [...new Set(mergeTags.map(t => t.category))];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
        <div className={`bg-white rounded-lg shadow-xl ${autoMailView === 'edit' ? 'w-[98%] max-w-7xl' : 'w-full max-w-2xl'} max-h-[95vh] overflow-hidden flex flex-col`}>
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {autoMailView === 'choice' && '📬 Edit/Upload AutoMail'}
                {autoMailView === 'upload' && '📤 Upload New AutoMail'}
                {autoMailView === 'edit' && '✉️ AutoMail Templates Editor'}
                {autoMailView === 'schedule' && '📅 Communication Schedule'}
              </h2>
              <p className="text-sm text-gray-500">{autoMailModal.questionnaire?.name} - {autoMailModal.questionnaire?.touchpoint}</p>
            </div>
            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Choice View */}
          {autoMailView === 'choice' && (
            <div className="p-6">
              <p className="text-gray-600 mb-6">How would you like to manage the AutoMail templates for this questionnaire?</p>
              
              <div className="grid grid-cols-3 gap-4">
                {/* Upload New Option */}
                <button
                  onClick={() => setAutoMailView('upload')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Upload New AutoMail</h3>
                  <p className="text-sm text-gray-500">Upload an AMS spreadsheet</p>
                </button>

                {/* Edit Existing Option */}
                <button
                  onClick={() => setAutoMailView('edit')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-200">
                    <MessageSquare className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Edit Email Templates</h3>
                  <p className="text-sm text-gray-500">Modify templates with live preview</p>
                </button>

                {/* Schedule Option */}
                <button
                  onClick={() => setAutoMailView('schedule')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-200">
                    <Settings className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Communication Schedule</h3>
                  <p className="text-sm text-gray-500">Configure send timing</p>
                </button>
              </div>

              {/* Current Status */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">AutoMail Status:</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">✓ Configured ({autoMailData.length} templates)</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">SendGrid Connected</span>
                  </div>
                  <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    <Download className="w-4 h-4" /> Export Current
                  </button>
                </div>
              </div>

              {/* Merge Tags Info */}
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600">💡</span>
                  <div className="text-sm">
                    <strong className="text-yellow-800">Intelleges Proprietary Tags:</strong>
                    <span className="text-yellow-700 ml-1">{mergeTags.length} merge tags available including [firstname], [partnername], [enterprisecompanyname], [Due Date], and more.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload View */}
          {autoMailView === 'upload' && (
            <div className="p-6">
              <button onClick={() => setAutoMailView('choice')} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 mb-4">
                <ChevronLeft className="w-4 h-4" /> Back to options
              </button>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer mb-4">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 font-medium">Drag and drop your AMS spreadsheet here</p>
                <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                <p className="text-xs text-gray-400 mt-3">Supported formats: .xlsx, .xls, .csv</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-800">Need a template?</span>
                </div>
                <button className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1">
                  <Download className="w-4 h-4" /> Download AMS Template
                </button>
              </div>

              <div className="text-xs text-gray-500">
                <p className="font-medium mb-1">Required columns: RID, Type, Subject, Text, Footer, Signature, Send_Date_Calc_Factor</p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setAutoMailView('choice')} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button className="px-4 py-2 text-sm text-white rounded-lg" style={{ backgroundColor: '#2496F4' }}>Upload AutoMail</button>
              </div>
            </div>
          )}

          {/* Schedule View */}
          {autoMailView === 'schedule' && (
            <div className="p-6 overflow-auto">
              <button onClick={() => setAutoMailView('choice')} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 mb-4">
                <ChevronLeft className="w-4 h-4" /> Back to options
              </button>

              <h3 className="font-semibold text-gray-800 mb-4">📅 Communication Schedule</h3>
              <p className="text-sm text-gray-600 mb-4">Configure when automated emails are sent to suppliers.</p>

              <table className="w-full text-sm border border-gray-300 rounded">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700 border-b">Communication Type</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700 border-b">Send Date Calculation</th>
                  </tr>
                </thead>
                <tbody>
                  {communicationSchedule.map((sched, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{sched.type}</td>
                      <td className="px-4 py-2 text-gray-600">{sched.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Reminders are automatically sent 3-7 days after the previous communication if the supplier has not responded.
                </p>
              </div>
            </div>
          )}

          {/* Edit View - Data Grid */}
          {autoMailView === 'edit' && (
            <div className="flex-1 flex flex-col overflow-hidden" onClick={() => setAutoMailContextMenu({ open: false, x: 0, y: 0, row: null })}>
              {/* Toolbar */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => setAutoMailView('choice')} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <span className="text-gray-300">|</span>
                  <select 
                    value={selectedMailCategory} 
                    onChange={(e) => { setSelectedMailCategory(e.target.value); setAutoMailPage(1); }}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="all">All Templates ({autoMailData.length})</option>
                    <option value="invite">Invitations</option>
                    <option value="reminder">Reminders</option>
                    <option value="status">Status Updates</option>
                    <option value="far">FAR Templates</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
                    <Download className="w-4 h-4" /> Export to Excel
                  </button>
                </div>
              </div>

              {/* Data Grid */}
              <div className="flex-1 overflow-auto p-4">
                <table className="w-full text-sm border border-gray-300">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-r w-16">RID</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-r w-28">Type</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-r">Subject</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-r w-64">Preview</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 border-b w-20">Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map(row => {
                      const typeColor = getTypeColor(row.type);
                      return (
                      <tr 
                        key={row.id} 
                        className="hover:bg-blue-50 border-b cursor-pointer"
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAutoMailContextMenu({ open: true, x: e.clientX, y: e.clientY, row: row });
                        }}
                        onDoubleClick={() => handleAutoMailAction('edit', row)}
                        style={{ backgroundColor: autoMailContextMenu.row?.id === row.id ? '#EFF6FF' : undefined }}
                      >
                        <td className="px-3 py-2 border-r text-gray-600">{row.rid}</td>
                        <td className="px-3 py-2 border-r">
                          <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: typeColor.bg, color: typeColor.text }}>
                            {row.typeName}
                          </span>
                        </td>
                        <td className="px-3 py-2 border-r truncate max-w-md" title={row.subject}>{replaceMergeTags(row.subject).substring(0, 60)}...</td>
                        <td className="px-3 py-2 border-r text-gray-500 truncate max-w-[250px]" title={stripHtml(row.text)}>{stripHtml(row.text).substring(0, 80)}...</td>
                        <td className="px-3 py-2 text-center text-gray-600">{row.sendFactor}</td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setAutoMailPage(page)}
                      className={`w-6 h-6 text-xs rounded ${autoMailPage === page ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  {filteredData.length} templates | Right-click or double-click to edit
                </span>
              </div>

              {/* Hint */}
              <div className="px-4 py-2 bg-green-50 border-t border-green-100 text-xs text-green-700">
                🔗 <strong>Live Connection:</strong> Changes made here update the AMS data store. Templates support HTML formatting and {mergeTags.length} merge tags.
              </div>

              {/* Context Menu */}
              {autoMailContextMenu.open && (
                <div 
                  className="fixed bg-white rounded shadow-lg border border-gray-300 py-1 z-[100] min-w-[200px]"
                  style={{ left: autoMailContextMenu.x, top: autoMailContextMenu.y }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {autoMailMenuOptions.map((option) => (
                    option.divider ? (
                      <div key={option.id} className="border-t border-gray-200 my-1" />
                    ) : (
                      <button
                        key={option.id}
                        className="w-full px-4 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-blue-50 text-gray-700"
                        onClick={() => handleAutoMailAction(option.id, autoMailContextMenu.row)}
                      >
                        <span className="w-5 text-center">{option.icon}</span>
                        {option.label}
                      </button>
                    )
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Edit Template Modal */}
          {amsEditingRow && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110]">
              <div className="bg-white rounded-lg shadow-xl w-[95%] max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">✏️ Edit Email Template: {amsEditingRow.typeName}</h2>
                    <p className="text-sm text-gray-500">RID: {amsEditingRow.rid} | Type: {amsEditingRow.type}</p>
                  </div>
                  <button onClick={() => setAmsEditingRow(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-auto p-4">
                  <div className="grid grid-cols-3 gap-4">
                    {/* Left: Editor */}
                    <div className="col-span-2 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                        <input 
                          type="text"
                          value={amsEditValue.subject}
                          onChange={(e) => setAmsEditValue(prev => ({ ...prev, subject: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Body (HTML)</label>
                        <textarea 
                          value={amsEditValue.text}
                          onChange={(e) => setAmsEditValue(prev => ({ ...prev, text: e.target.value }))}
                          rows={12}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Footer</label>
                          <textarea 
                            value={amsEditValue.footer}
                            onChange={(e) => setAmsEditValue(prev => ({ ...prev, footer: e.target.value }))}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
                          <input 
                            type="text"
                            value={amsEditValue.signature}
                            onChange={(e) => setAmsEditValue(prev => ({ ...prev, signature: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right: Merge Tags */}
                    <div className="border-l pl-4">
                      <h4 className="font-medium text-gray-700 mb-2">📎 Insert Merge Tag</h4>
                      <p className="text-xs text-gray-500 mb-3">Click a tag to insert it into the body</p>
                      
                      <div className="max-h-[400px] overflow-auto space-y-3">
                        {tagCategories.map(category => (
                          <div key={category}>
                            <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">{category}</h5>
                            <div className="flex flex-wrap gap-1">
                              {mergeTags.filter(t => t.category === category).map(tag => (
                                <button
                                  key={tag.tag}
                                  onClick={() => insertMergeTag(tag.tag)}
                                  className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 rounded border"
                                  title={`${tag.description} (e.g., ${tag.example})`}
                                >
                                  {tag.tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                  <div className="text-xs text-blue-600">
                    💡 Changes save to the centralized AMS data store
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setAmsPreviewRow({ ...amsEditingRow, subject: amsEditValue.subject, text: amsEditValue.text, footer: amsEditValue.footer, signature: amsEditValue.signature })} 
                      className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                      👁️ Preview
                    </button>
                    <button onClick={() => setAmsEditingRow(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button onClick={saveAmsEdit} className="px-4 py-2 text-sm text-white rounded-lg" style={{ backgroundColor: '#2496F4' }}>Save Changes</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Modal */}
          {amsPreviewRow && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120]">
              <div className="bg-white rounded-lg shadow-xl w-[90%] max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-100">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">📧 Email Preview: {amsPreviewRow.typeName}</h2>
                    <p className="text-sm text-gray-500">Merge tags replaced with sample data</p>
                  </div>
                  <button onClick={() => setAmsPreviewRow(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-auto p-6 bg-gray-50">
                  {/* Email Preview */}
                  <div className="bg-white rounded-lg shadow-md border border-gray-200 max-w-2xl mx-auto">
                    {/* Email Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                      <div className="text-xs text-gray-500 mb-1">From: Intelleges &lt;noreply@mail.intelleges.com&gt;</div>
                      <div className="text-xs text-gray-500 mb-2">To: john.smith@acme.com</div>
                      <div className="font-semibold text-gray-900">{replaceMergeTags(amsPreviewRow.subject)}</div>
                    </div>
                    
                    {/* Email Body */}
                    <div className="px-6 py-6">
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: replaceMergeTags(amsPreviewRow.text) }} />
                    </div>

                    {/* Email Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                      <p className="text-sm text-gray-600">{replaceMergeTags(amsPreviewRow.footer)}</p>
                      <p className="text-sm font-medium text-gray-700 mt-2">{replaceMergeTags(amsPreviewRow.signature)}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
                  <button onClick={() => setSendTestEmail({ open: true, row: amsPreviewRow, email: '', sending: false, sent: false })} 
                    className="px-4 py-2 text-sm text-white rounded-lg bg-green-600 hover:bg-green-700 flex items-center gap-2">
                    📧 Send Test Email
                  </button>
                  <button onClick={() => setAmsPreviewRow(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
                </div>
              </div>
            </div>
          )}

          {/* SendGrid Test Email Modal */}
          {sendTestEmail.open && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[130]">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">🧪 Send Test Email via SendGrid</h2>
                  <button onClick={() => setSendTestEmail({ open: false, row: null, email: '', sending: false, sent: false, error: null })} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">
                  {!sendTestEmail.sent ? (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                        <div className="px-3 py-2 bg-gray-100 rounded text-sm text-gray-700">{sendTestEmail.row?.typeName}</div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Send To Email Address</label>
                        <input 
                          type="email"
                          placeholder="test@yourcompany.com"
                          value={sendTestEmail.email}
                          onChange={(e) => setSendTestEmail(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>

                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                        <p className="text-xs text-blue-800">
                          <strong>SendGrid API:</strong> This will use your configured SendGrid API key to send a test email with merge tags replaced by sample data.
                        </p>
                      </div>

                      {/* Error display */}
                      {sendTestEmail.error && (
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200 mb-4">
                          <p className="text-xs text-red-800">
                            <strong>Error:</strong> {sendTestEmail.error}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end gap-3">
                        <button onClick={() => setSendTestEmail({ open: false, row: null, email: '', sending: false, sent: false, error: null })} 
                          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button 
                          onClick={sendViaSegndGrid}
                          disabled={!sendTestEmail.email || sendTestEmail.sending}
                          className="px-4 py-2 text-sm text-white rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
                        >
                          {sendTestEmail.sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : '📧 Send Test Email'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">✅</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Email Sent!</h3>
                      <p className="text-sm text-gray-600 mb-4">Check your inbox at {sendTestEmail.email}</p>
                      <button 
                        onClick={() => setSendTestEmail({ open: false, row: null, email: '', sending: false, sent: false, error: null })}
                        className="px-4 py-2 text-sm text-white rounded-lg" style={{ backgroundColor: '#2496F4' }}
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Partner Upload Modal
  const renderPartnerUploadModal = () => {
    if (!partnerUploadModal.open) return null;

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => setPartnerUploadModal({ open: false })}
      >
        <div 
          className="bg-white rounded-lg shadow-xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Upload Partner</h2>
            <button onClick={() => setPartnerUploadModal({ open: false })} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">1. Please select a protocol</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                <option>Certs and Reps</option>
                <option>Supplier Onboarding</option>
                <option>Risk Assessment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">2. Please select a touchpoint</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                <option>Reps and Certs 2025</option>
                <option>Reps and Certs 2024</option>
                <option>Q1 Onboarding</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">3. Please select a partnertype</label>
              <div className="flex gap-2">
                <select className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm">
                  <option>Supplier</option>
                  <option>Investor</option>
                  <option>Validator</option>
                </select>
                <button className="px-3 py-2 text-sm text-blue-600 hover:underline whitespace-nowrap">
                  Add Partner Type
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">4. Please select a group</label>
              <div className="flex gap-2">
                <select className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm">
                  <option>CME</option>
                  <option>CMO</option>
                  <option>CMY</option>
                  <option>CNO</option>
                  <option>COV</option>
                </select>
                <button className="px-3 py-2 text-sm text-blue-600 hover:underline whitespace-nowrap">
                  Add Group
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">5. Please select an Excel file containing the partner info</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <button className="px-4 py-2 bg-gray-100 rounded text-sm font-medium hover:bg-gray-200">
                  Select...
                </button>
                <p className="text-xs text-gray-500 mt-2">Maximum allowed file size: 10 MB</p>
              </div>
            </div>

            <div className="pt-2">
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Click here to download partner upload template
              </a>
            </div>

            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Template Columns:</strong> Internal ID, Name, Address 1, Address 2, City, State, Province, Zip Code, Country, Phone, Fax, First Name, Last Name, Title, Email, DUNS Number, Federal ID
              </p>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
            <button 
              onClick={() => setPartnerUploadModal({ open: false })}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button className="px-4 py-2 text-sm text-white rounded" style={{ backgroundColor: '#2496F4' }}>
              Upload Partners
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Partner Manual Add/Edit Modal - Matches actual UI
  const renderPartnerManualModal = () => {
    if (!partnerManualModal.open) return null;

    const isEdit = partnerManualModal.mode === 'edit';
    const partner = partnerManualModal.partner || {};

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => setPartnerManualModal({ open: false, mode: 'add', partner: null })}
      >
        <div 
          className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              {isEdit ? 'Edit Partner' : 'Create Partner'}
            </h2>
            <button onClick={() => setPartnerManualModal({ open: false, mode: 'add', partner: null })} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {/* Questionnaire Context */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-1">Questionnaire Context</h3>
              <p className="text-xs text-gray-500 mb-3">Partners must be associated with a specific questionnaire touchpoint.</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Protocol *</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.protocol || ''}>
                    <option value="">Select...</option>
                    <option value="annual-reps-certs">Annual Reps & Certs</option>
                    <option value="cmmc">CMMC Certification</option>
                    <option value="itar">ITAR Compliance</option>
                    <option value="small-business">Small Business Subcontracting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Touchpoint *</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.touchpoint || ''}>
                    <option value="">Select...</option>
                    <option value="reps-2025">Reps and Certs 2025</option>
                    <option value="reps-2024">Reps and Certs 2024</option>
                    <option value="q1-2025">Q1 2025 Assessment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Partner Type *</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.partnerType || ''}>
                    <option value="">Select...</option>
                    <option value="supplier">Supplier</option>
                    <option value="investor">Investor</option>
                    <option value="validator">Validator</option>
                    <option value="subcontractor">Subcontractor</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Company Information</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Internal ID</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.internalId || ''} placeholder="Your internal supplier ID" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Company Name *</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.name || ''} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address 1 *</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.address1 || ''} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address 2</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.address2 || ''} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.city || ''} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.state || ''}>
                    <option value="">Select...</option>
                    <option value="AL">Alabama</option>
                    <option value="AK">Alaska</option>
                    <option value="AZ">Arizona</option>
                    <option value="CA">California</option>
                    <option value="TX">Texas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Province</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.province || ''} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Zip Code</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.zipCode || ''} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.country || 'United States'}>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Mexico">Mexico</option>
                    <option value="United Kingdom">United Kingdom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.phone || ''} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fax</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.fax || ''} />
                </div>
              </div>
            </div>

            {/* Primary Contact */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Primary Contact</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.firstName || ''} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.lastName || ''} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.title || ''} placeholder="e.g., Compliance Manager" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.email || ''} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">DUNS Number</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.dunsNumber || ''} placeholder="9-digit identifier" maxLength={9} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Federal ID (EIN/TIN)</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.federalId || ''} placeholder="XX-XXXXXXX" />
                </div>
              </div>
            </div>

            {/* Assignment & Accountability */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Assignment & Accountability</h3>
              <p className="text-xs text-gray-500 mb-3">The Owner is responsible for ensuring this partner completes the questionnaire compliantly and on time.</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Group *</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.group || ''}>
                    <option value="">Select Group...</option>
                    <option value="CME">CME</option>
                    <option value="CMO">CMO</option>
                    <option value="CMY">CMY</option>
                    <option value="CNO">CNO</option>
                    <option value="COV">COV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Owner (Responsible) *</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.owner || ''}>
                    <option value="">Select Owner...</option>
                    <option value="John Smith">John Smith - Compliance Director</option>
                    <option value="Jane Doe">Jane Doe - Supply Chain Manager</option>
                    <option value="Bob Wilson">Bob Wilson - Procurement Lead</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner.dueDate || ''} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
            <button 
              onClick={() => setPartnerManualModal({ open: false, mode: 'add', partner: null })}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button className="px-4 py-2 text-sm text-white rounded" style={{ backgroundColor: '#2496F4' }}>
              {isEdit ? 'Save Changes' : 'Create Partner'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Generic Spreadsheet Upload Modal (for all entities except Partner which has its own)
  const renderSpreadsheetUploadModal = () => {
    if (!spreadsheetUploadModal.open) return null;
    
    const entityName = spreadsheetUploadModal.entity?.charAt(0).toUpperCase() + spreadsheetUploadModal.entity?.slice(1);
    
    // Template columns by entity type - matches actual form fields
    const templateInfo = {
      person: 'Title, First Name, Last Name, Suffix, Country, Address 1, Address 2, City, State, Zipcode, Manager, Roles, Groups',
      protocol: 'Enterprise Type, Protocol Name, End Date, Keywords, Domain, Requiring Agency, Purpose',
      touchpoint: 'Protocol, Frequency, Title, Sponsor, Admin, Locked, Auto Reminder, Purpose, Start Date, End Date',
      partnertype: 'Touchpoint, Category, Name, Description',
      group: 'Touchpoint, Name, Description, Group Collection (Opened/Closed)',
      questionnaire: 'See QMS Reference spreadsheet format - Page, Question#, Question, ResponseType, CommentType, SkipLogic, SpinOff, EmailAlert',
      enterprise: 'Name, Country, Address 1, Address 2, City, State, Zipcode, License Type, Partner Max, Start Date, End Date',
      partner: 'Protocol, Touchpoint, Partner Type, Internal ID, Company Name, Address 1, Address 2, City, State, Province, Zip Code, Country, Phone, Fax, First Name, Last Name, Title, Email, DUNS Number, Federal ID, Group, Owner, Due Date',
      ams: 'See AutoMail template - TemplateKey, Subject, Body, MergeTags, Trigger, Active',
      cms: 'See CMS template - ElementKey, PageSection, DefaultText, HTMLAllowed',
    };

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => setSpreadsheetUploadModal({ open: false, entity: null })}
      >
        <div 
          className="bg-white rounded-lg shadow-xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Add {entityName} via Spreadsheet</h2>
            <button onClick={() => setSpreadsheetUploadModal({ open: false, entity: null })} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Download Template Link */}
            <div className="mb-4">
              <a href="#" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
                <FileSpreadsheet className="w-4 h-4" />
                Download {entityName} Template (.xlsx)
              </a>
              <p className="text-xs text-gray-500 mt-1">Use this template to ensure your data is formatted correctly.</p>
            </div>

            {/* Drag and Drop Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 mb-4">Drag and drop your spreadsheet here, or</p>
              <div className="flex justify-center gap-3">
                <button className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Browse Files
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Google Drive
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-4">Accepted formats: .xlsx, .xls, .csv, .ods (max 25 MB)</p>
            </div>

            {/* Template Columns Info */}
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Template Columns:</strong> {templateInfo[spreadsheetUploadModal.entity] || 'Name, Description'}
              </p>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
            <button 
              onClick={() => setSpreadsheetUploadModal({ open: false, entity: null })}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button className="px-4 py-2 text-sm text-white rounded" style={{ backgroundColor: '#2496F4' }}>
              Upload
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Protocol Manual Add Modal
  const renderProtocolModal = () => {
    if (!protocolModal.open) return null;

    const isFormValid = protocolForm.enterpriseType && protocolForm.protocolName && protocolForm.endDate;

    const handleProtocolClose = () => {
      setProtocolForm({ enterpriseType: '', protocolName: '', endDate: '', keywords: '', domain: '', agency: '', purpose: '' });
      setProtocolModal({ open: false, protocol: null });
    };

    const handleProtocolSave = async () => {
      if (!isFormValid) {
        alert('Please fill in all required fields');
        return;
      }
      setProtocolSaving(true);
      try {
        const response = await fetch('/api/trpc/protocols.create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ json: protocolForm }),
        });
        if (!response.ok) throw new Error('Failed to create protocol');
        alert('Protocol created successfully!');
        handleProtocolClose();
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to create protocol');
      } finally {
        setProtocolSaving(false);
      }
    };

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleProtocolClose}
      >
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Add Protocol - Manual</h2>
            <button onClick={handleProtocolClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {/* Protocol Selection */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Protocol Selection</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Enterprise Type *</label>
                  <select
                    value={protocolForm.enterpriseType}
                    onChange={(e) => setProtocolForm({ ...protocolForm, enterpriseType: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select Type...</option>
                    <option value="dod">DoD (Defense)</option>
                    <option value="non-dod">Non-DoD (Federal Civilian)</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="homeland">Homeland Security</option>
                    <option value="supply-chain">Supply Chain Optimization</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Protocol Name *</label>
                  <select
                    value={protocolForm.protocolName}
                    onChange={(e) => setProtocolForm({ ...protocolForm, protocolName: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select Protocol...</option>
                    <option value="baa">Buy American Act (BAA)</option>
                    <option value="taa">Trade Agreements Act (TAA)</option>
                    <option value="berry">Berry Amendment</option>
                    <option value="cmmc">CMMC Certification</option>
                    <option value="nist">NIST SP 800-171</option>
                    <option value="itar">ITAR Compliance</option>
                    <option value="dfars">DFARS 252.204-7012</option>
                    <option value="reps-certs">Annual Reps & Certs</option>
                    <option value="small-biz">Small Business Subcontracting Plan</option>
                    <option value="counterfeit">Counterfeit Parts Prevention</option>
                    <option value="conflict-minerals">Conflict Minerals Reporting</option>
                    <option value="human-trafficking">Human Trafficking Compliance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date *</label>
                <input
                  type="date"
                  value={protocolForm.endDate}
                  onChange={(e) => setProtocolForm({ ...protocolForm, endDate: e.target.value })}
                  className="w-full max-w-xs border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Protocol Configuration */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Protocol Configuration</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Risks if Non-Compliant (Auto-filled)</label>
                  <textarea
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm h-20 bg-gray-50"
                    placeholder="Risks will be auto-filled when protocol is selected..."
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Keywords</label>
                  <input
                    type="text"
                    value={protocolForm.keywords}
                    onChange={(e) => setProtocolForm({ ...protocolForm, keywords: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="compliance, audit, reporting..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Domain (Data Collection Type)</label>
                  <select
                    value={protocolForm.domain}
                    onChange={(e) => setProtocolForm({ ...protocolForm, domain: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="single">Single Person - One respondent per entity</option>
                    <option value="multi">Multi-Person - Multiple respondents from Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Requiring Agency</label>
                  <select
                    value={protocolForm.agency}
                    onChange={(e) => setProtocolForm({ ...protocolForm, agency: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select Agency...</option>
                    <option value="dod">Department of Defense (DoD)</option>
                    <option value="hhs">Department of Health and Human Services (HHS)</option>
                    <option value="cms">Centers for Medicare & Medicaid Services (CMS)</option>
                    <option value="fda">Food and Drug Administration (FDA)</option>
                    <option value="dhs">Department of Homeland Security (DHS)</option>
                    <option value="gsa">General Services Administration (GSA)</option>
                    <option value="sba">Small Business Administration (SBA)</option>
                    <option value="epa">Environmental Protection Agency (EPA)</option>
                    <option value="doe">Department of Energy (DOE)</option>
                    <option value="dos">Department of State (DOS)</option>
                    <option value="doc">Department of Commerce (DOC)</option>
                    <option value="oig">Office of Inspector General (OIG)</option>
                    <option value="cbp">Customs and Border Protection (CBP)</option>
                    <option value="tsa">Transportation Security Administration (TSA)</option>
                    <option value="nih">National Institutes of Health (NIH)</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Supporting Documents */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-1">Supporting Documents</h3>
              <p className="text-xs text-gray-500 mb-3">AI will track best practices and checklists as the protocol progresses.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Best Practices Document</label>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">Select...</button>
                    <span className="text-sm text-gray-500">No file selected</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Checklist Document</label>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">Select...</button>
                    <span className="text-sm text-gray-500">No file selected</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Purpose / Notes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-700">Purpose / Notes</label>
                <button className="px-3 py-1 text-xs text-white rounded flex items-center gap-1" style={{ backgroundColor: '#2496F4' }}>
                  <Sparkles className="w-3 h-3" /> Generate with AI
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-2">Auto-generated based on protocol selection. Click "Generate with AI" to create a customized purpose based on all your selections, or edit manually.</p>
              <textarea
                value={protocolForm.purpose}
                onChange={(e) => setProtocolForm({ ...protocolForm, purpose: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm h-24"
                placeholder="Purpose will be auto-generated when a protocol is selected..."
              />
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
            <button
              onClick={handleProtocolClose}
              disabled={protocolSaving}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleProtocolSave}
              disabled={!isFormValid || protocolSaving}
              className="px-4 py-2 text-sm text-white rounded disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: isFormValid ? '#2496F4' : '#9CA3AF' }}
            >
              {protocolSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save'}
            </button>
            <button
              onClick={() => setProtocolForm({ enterpriseType: '', protocolName: '', endDate: '', keywords: '', domain: '', agency: '', purpose: '' })}
              className="px-4 py-2 text-sm text-white rounded bg-gray-500 hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Touchpoint Manual Add Modal
  const renderTouchpointModal = () => {
    if (!touchpointModal.open) return null;

    const isFormValid = touchpointForm.protocol && touchpointForm.frequency && touchpointForm.startDate && touchpointForm.endDate;

    const handleTouchpointClose = () => {
      setTouchpointForm({ protocol: '', frequency: '', sponsor: '', admin: '', locked: 'no', reminder: 'yes', purpose: '', startDate: '', endDate: '' });
      setTouchpointModal({ open: false, touchpoint: null });
    };

    const handleTouchpointSave = async () => {
      if (!isFormValid) {
        alert('Please fill in all required fields');
        return;
      }
      setTouchpointSaving(true);
      try {
        const response = await fetch('/api/trpc/touchpoint.create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ json: touchpointForm }),
        });
        if (!response.ok) throw new Error('Failed to create touchpoint');
        alert('Touchpoint created successfully!');
        handleTouchpointClose();
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to create touchpoint');
      } finally {
        setTouchpointSaving(false);
      }
    };

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleTouchpointClose}
      >
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Add Touchpoint - Manual</h2>
            <button onClick={handleTouchpointClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {/* Touchpoint Configuration */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Touchpoint Configuration</h3>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Protocol *</label>
                  <select
                    value={touchpointForm.protocol}
                    onChange={(e) => setTouchpointForm({ ...touchpointForm, protocol: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select Protocol...</option>
                    <option value="cmmc">CMMC Certification</option>
                    <option value="reps-certs">Annual Reps & Certs</option>
                    <option value="small-biz">Small Business Subcontracting Plan</option>
                    <option value="hipaa">HIPAA Business Associate Agreement</option>
                    <option value="supplier-perf">Supplier Performance Scorecard</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Protocol dates: 2025-01-01 to 2035-01-01</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Frequency *</label>
                  <select
                    value={touchpointForm.frequency}
                    onChange={(e) => setTouchpointForm({ ...touchpointForm, frequency: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select Frequency...</option>
                    <option value="annual">Annual</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50" placeholder="Auto-generated based on frequency" readOnly />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Abbreviation (Auto-generated)</label>
                  <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50" readOnly />
                </div>
              </div>
            </div>

            {/* Personnel Assignment */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Personnel Assignment</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sponsor (Accountable)</label>
                  <select
                    value={touchpointForm.sponsor}
                    onChange={(e) => setTouchpointForm({ ...touchpointForm, sponsor: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select Sponsor...</option>
                    <option value="john">John Smith - Compliance Director</option>
                    <option value="jane">Jane Doe - Supply Chain Manager</option>
                    <option value="robert">Robert Johnson - Quality Assurance Lead</option>
                    <option value="maria">Maria Garcia - Procurement Specialist</option>
                    <option value="admin">Admin - System Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Admin (Responsible)</label>
                  <select
                    value={touchpointForm.admin}
                    onChange={(e) => setTouchpointForm({ ...touchpointForm, admin: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select Admin...</option>
                    <option value="john">John Smith - Compliance Director</option>
                    <option value="jane">Jane Doe - Supply Chain Manager</option>
                    <option value="robert">Robert Johnson - Quality Assurance Lead</option>
                    <option value="maria">Maria Garcia - Procurement Specialist</option>
                    <option value="admin">Admin - System Administrator</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Details</h3>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">Description (Auto-generated)</label>
                <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50" placeholder="Generated based on frequency (Year, Quarter, etc.)" readOnly />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Locked</label>
                  <p className="text-xs text-gray-500 mb-2">If locked, questionnaire cannot be reopened without RBAC authorization</p>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1 text-sm">
                      <input type="radio" name="locked" value="yes" checked={touchpointForm.locked === 'yes'} onChange={() => setTouchpointForm({ ...touchpointForm, locked: 'yes' })} /> Yes
                    </label>
                    <label className="flex items-center gap-1 text-sm">
                      <input type="radio" name="locked" value="no" checked={touchpointForm.locked === 'no'} onChange={() => setTouchpointForm({ ...touchpointForm, locked: 'no' })} /> No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Automatic Reminder</label>
                  <p className="text-xs text-gray-500 mb-2">Send automated reminder notifications</p>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1 text-sm">
                      <input type="radio" name="reminder" value="yes" checked={touchpointForm.reminder === 'yes'} onChange={() => setTouchpointForm({ ...touchpointForm, reminder: 'yes' })} /> Yes
                    </label>
                    <label className="flex items-center gap-1 text-sm">
                      <input type="radio" name="reminder" value="no" checked={touchpointForm.reminder === 'no'} onChange={() => setTouchpointForm({ ...touchpointForm, reminder: 'no' })} /> No
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Purpose</label>
                <textarea
                  value={touchpointForm.purpose}
                  onChange={(e) => setTouchpointForm({ ...touchpointForm, purpose: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm h-20"
                  placeholder="Describe the purpose of this touchpoint..."
                />
              </div>
            </div>

            {/* Touchpoint Schedule */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Touchpoint Schedule</h3>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded mb-4">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> Dates must fall within the Protocol period: 2025-01-01 to 2035-01-01
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={touchpointForm.startDate}
                    onChange={(e) => setTouchpointForm({ ...touchpointForm, startDate: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={touchpointForm.endDate}
                    onChange={(e) => setTouchpointForm({ ...touchpointForm, endDate: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
            <button
              onClick={handleTouchpointClose}
              disabled={touchpointSaving}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleTouchpointSave}
              disabled={!isFormValid || touchpointSaving}
              className="px-4 py-2 text-sm text-white rounded disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: isFormValid ? '#2496F4' : '#9CA3AF' }}
            >
              {touchpointSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Partnertype Manual Add Modal
  const renderPartnertypeModal = () => {
    if (!partnertypeModal.open) return null;

    const isFormValid = partnertypeForm.touchpoint && partnertypeForm.name;

    const handlePartnertypeClose = () => {
      setPartnertypeForm({ touchpoint: '', category: '', name: '', description: '' });
      setPartnertypeModal({ open: false, partnertype: null });
    };

    const handlePartnertypeSave = async () => {
      if (!isFormValid) {
        alert('Please fill in all required fields (Touchpoint and Name)');
        return;
      }

      setPartnertypeSaving(true);
      try {
        const response = await fetch('/api/trpc/partnerTypes.create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            json: {
              name: partnertypeForm.name,
              description: partnertypeForm.description || null,
              category: partnertypeForm.category || null,
              touchpointId: parseInt(partnertypeForm.touchpoint),
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMsg = errorData?.error?.json?.message || errorData?.error?.message || 'Failed to create partnertype';
          throw new Error(errorMsg);
        }

        alert('Partnertype created successfully!');
        handlePartnertypeClose();
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to create partnertype');
      } finally {
        setPartnertypeSaving(false);
      }
    };

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handlePartnertypeClose}
      >
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Add Partnertype - Manual</h2>
            <button onClick={handlePartnertypeClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Info Box */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-6">
              <p className="text-sm text-blue-800">
                Partnertypes categorize suppliers/partners for protocol applicability. For example, a domestic supplier in the Canada Group for Reps & Certs 2025 touchpoint at Merck Pharmaceuticals.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Touchpoint *</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={partnertypeForm.touchpoint}
                  onChange={(e) => setPartnertypeForm({ ...partnertypeForm, touchpoint: e.target.value })}
                >
                  <option value="">Select Touchpoint...</option>
                  <option value="1">Reps and Certs 2025</option>
                  <option value="2">CMMC Annual Review 2025</option>
                  <option value="3">Q1 Onboarding 2025</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={partnertypeForm.category}
                  onChange={(e) => setPartnertypeForm({ ...partnertypeForm, category: e.target.value })}
                >
                  <option value="">Select Category (optional)...</option>
                  <option value="procurement">Procurement Type</option>
                  <option value="geographic">Geographic</option>
                  <option value="business-size">Business Size</option>
                  <option value="supplier-tier">Supplier Tier</option>
                  <option value="compliance">Compliance Level</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="e.g., FAR 15, Domestic, Small Business"
                  value={partnertypeForm.name}
                  onChange={(e) => setPartnertypeForm({ ...partnertypeForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm h-24"
                  placeholder="Describe when this partnertype applies and any specific requirements..."
                  value={partnertypeForm.description}
                  onChange={(e) => setPartnertypeForm({ ...partnertypeForm, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
            <button
              onClick={handlePartnertypeClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              disabled={partnertypeSaving}
            >
              Cancel
            </button>
            <button
              onClick={handlePartnertypeSave}
              disabled={!isFormValid || partnertypeSaving}
              className="px-4 py-2 text-sm text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#2496F4' }}
            >
              {partnertypeSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Group Manual Add Modal
  const renderGroupModal = () => {
    if (!groupModal.open) return null;

    const isFormValid = groupForm.touchpoint && groupForm.name;

    const handleGroupClose = () => {
      setGroupForm({ touchpoint: '', name: '', description: '', collection: 'opened' });
      setGroupModal({ open: false, group: null });
    };

    const handleGroupSave = async () => {
      if (!isFormValid) {
        alert('Please fill in all required fields (Touchpoint and Name)');
        return;
      }

      setGroupSaving(true);
      try {
        const response = await fetch('/api/trpc/groups.create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            json: {
              name: groupForm.name,
              description: groupForm.description || null,
              touchpointId: parseInt(groupForm.touchpoint),
              collection: groupForm.collection,
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMsg = errorData?.error?.json?.message || errorData?.error?.message || 'Failed to create group';
          throw new Error(errorMsg);
        }

        alert('Group created successfully!');
        handleGroupClose();
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to create group');
      } finally {
        setGroupSaving(false);
      }
    };

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleGroupClose}
      >
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Add Group - Manual</h2>
            <button onClick={handleGroupClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Info Box */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-6">
              <p className="text-sm text-blue-800">
                Groups allow large organizations to organize data collection by geography, function, or other criteria. Groups are associated with a specific Touchpoint.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Touchpoint *</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={groupForm.touchpoint}
                  onChange={(e) => setGroupForm({ ...groupForm, touchpoint: e.target.value })}
                >
                  <option value="">Select Touchpoint...</option>
                  <option value="1">Reps and Certs 2025</option>
                  <option value="2">CMMC Annual Review 2025</option>
                  <option value="3">Q1 Onboarding 2025</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="e.g., APAC Region, Manufacturing Division"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="Brief description of the group"
                    value={groupForm.description}
                    onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Collection *</label>
                <p className="text-xs text-gray-500 mb-2">Controls whether People or Partners can be added to this group without RBAC authorization.</p>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={groupForm.collection}
                  onChange={(e) => setGroupForm({ ...groupForm, collection: e.target.value })}
                >
                  <option value="opened">Opened - Anyone with access can add members</option>
                  <option value="closed">Closed - Requires RBAC authorization to add members</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
            <button
              onClick={handleGroupClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              disabled={groupSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleGroupSave}
              disabled={!isFormValid || groupSaving}
              className="px-4 py-2 text-sm text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#2496F4' }}
            >
              {groupSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Questionnaire Add Modal (Spreadsheet-based, no manual entry)
  const renderQuestionnaireModal = () => {
    if (!questionnaireModal.open) return null;

    // Check if all 4 fields have values
    const allFieldsSelected = qmProtocol !== '' && qmTouchpoint !== '' && qmPartnertype !== '' && qmLevel !== '';
    const canSubmit = allFieldsSelected && qmFile !== null && !qmUploading;

    // Helper to convert level string to number for API
    const getLevelNumber = (level: string): number => {
      const levelMap: Record<string, number> = {
        'company': 1, 'part-number': 2, 'site': 3, 'contract': 4, 'product-line': 5
      };
      return levelMap[level] || 1;
    };

    // Helper to get partnertype ID
    const getPartnertypeId = (pt: string): number => {
      const ptMap: Record<string, number> = {
        'domestic': 1, 'international': 2, 'small-business': 3
      };
      return ptMap[pt] || 1;
    };

    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setQmFile(e.target.files[0]);
      }
    };

    // Handle form submission
    const handleSubmit = async () => {
      if (!canSubmit || !qmFile) return;

      setQmUploading(true);
      try {
        // Create questionnaire first
        const createResponse = await fetch('/api/trpc/questionnaireBuilder.create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Include session cookie for auth
          body: JSON.stringify({
            json: {
              title: `QMS Import - ${qmFile.name}`,
              description: `Imported QMS questionnaire for ${qmTouchpoint}`,
              partnerTypeId: getPartnertypeId(qmPartnertype),
              levelType: getLevelNumber(qmLevel),
            }
          }),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => null);
          const errorMsg = errorData?.error?.json?.message || errorData?.error?.message || 'Failed to create questionnaire';
          throw new Error(errorMsg);
        }

        const createResult = await createResponse.json();
        const questionnaireId = createResult.result?.data?.json?.id;

        if (!questionnaireId) {
          throw new Error('No questionnaire ID returned');
        }

        // Convert file to base64
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const base64Data = event.target?.result as string;
            const base64Content = base64Data.split(',')[1]; // Remove data:... prefix

            // Upload QMS data
            const uploadResponse = await fetch('/api/trpc/questionnaireBuilder.uploadQMS', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include', // Include session cookie for auth
              body: JSON.stringify({
                json: {
                  questionnaireId,
                  fileData: base64Content,
                  mode: 'insert',
                }
              }),
            });

            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json().catch(() => null);
              const errorMsg = errorData?.error?.json?.message || errorData?.error?.message || 'Failed to upload questionnaire data';
              throw new Error(errorMsg);
            }

            const uploadResult = await uploadResponse.json();
            const questionsImported = uploadResult.result?.data?.json?.questionsImported || 0;

            alert(`Successfully imported ${questionsImported} questions!`);

            // Reset form and close modal
            setQmProtocol('');
            setQmTouchpoint('');
            setQmPartnertype('');
            setQmLevel('');
            setQmFile(null);
            setQuestionnaireModal({ open: false, step: 1 });
          } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to import questionnaire');
          } finally {
            setQmUploading(false);
          }
        };

        reader.onerror = () => {
          alert('Failed to read file');
          setQmUploading(false);
        };

        reader.readAsDataURL(qmFile);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to create questionnaire');
        setQmUploading(false);
      }
    };

    // Reset form when closing modal
    const handleClose = () => {
      setQmProtocol('');
      setQmTouchpoint('');
      setQmPartnertype('');
      setQmLevel('');
      setQmFile(null);
      setQuestionnaireModal({ open: false, step: 1 });
    };

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleClose}
      >
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Add Questionnaire</h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Info Box */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-6">
              <p className="text-sm text-blue-800">
                Configure the questionnaire context by selecting Protocol, Touchpoint, Partnertype, and Level. Then upload the questionnaire spreadsheet.
              </p>
            </div>

            {/* Step 1: Select Protocol & Touchpoint */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium">1</span>
                <h3 className="font-medium text-gray-800">Select Protocol & Touchpoint</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 ml-8">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Protocol *</label>
                  <select
                    value={qmProtocol}
                    onChange={(e) => {
                      setQmProtocol(e.target.value);
                      setQmTouchpoint(''); // Reset touchpoint when protocol changes
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select Protocol...</option>
                    <option value="cmmc">CMMC Certification</option>
                    <option value="reps-certs">Annual Reps & Certs</option>
                    <option value="itar">ITAR Compliance</option>
                    <option value="small-biz">Small Business Subcontracting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Touchpoint *</label>
                  <select
                    value={qmTouchpoint}
                    onChange={(e) => setQmTouchpoint(e.target.value)}
                    disabled={!qmProtocol}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Touchpoint...</option>
                    <option value="cmmc-2025">CMMC Annual Review 2025</option>
                    <option value="reps-2025">Reps and Certs 2025</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2: Select Partnertype & Level */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium">2</span>
                <h3 className="font-medium text-gray-800">Select Partnertype & Level</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 ml-8">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Partnertype *</label>
                  <select
                    value={qmPartnertype}
                    onChange={(e) => setQmPartnertype(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select Partnertype...</option>
                    <option value="domestic">Domestic</option>
                    <option value="international">International</option>
                    <option value="small-business">Small Business</option>
                  </select>
                  {qmPartnertype && (
                    <p className="text-xs text-gray-500 mt-1">
                      {qmPartnertype === 'domestic' && 'U.S.-based suppliers'}
                      {qmPartnertype === 'international' && 'Non-U.S. suppliers'}
                      {qmPartnertype === 'small-business' && 'Small business suppliers'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Level / Cardinality *</label>
                  <select
                    value={qmLevel}
                    onChange={(e) => setQmLevel(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select Level...</option>
                    <option value="company">Company Level</option>
                    <option value="part-number">Part Number Level</option>
                    <option value="site">Site Level</option>
                    <option value="contract">Contract Level</option>
                    <option value="product-line">Product Line Level</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Upload Questionnaire Spreadsheet */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-6 h-6 rounded-full ${allFieldsSelected ? 'bg-blue-500' : 'bg-gray-300'} text-white text-xs flex items-center justify-center font-medium`}>3</span>
                <h3 className="font-medium text-gray-800">Upload Questionnaire Spreadsheet</h3>
              </div>
              <div className="ml-8">
                <div className={`border-2 border-dashed rounded-lg p-8 text-center ${allFieldsSelected ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
                  {qmFile ? (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-green-500" />
                      <p className="font-medium text-gray-800">{qmFile.name}</p>
                      <p className="text-sm text-gray-500">{(qmFile.size / 1024).toFixed(2)} KB</p>
                      <button
                        type="button"
                        onClick={() => setQmFile(null)}
                        className="text-sm text-red-600 hover:text-red-700 underline"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : allFieldsSelected ? (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-blue-500" />
                      <input
                        ref={qmFileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => qmFileInputRef.current?.click()}
                        className="text-blue-600 hover:text-blue-700 font-medium underline"
                      >
                        Choose file
                      </button>
                      <p className="text-sm text-gray-500">Upload Excel questionnaire template (.xlsx, .xls)</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-500">Complete the selections above to enable upload</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
            <button
              onClick={handleClose}
              disabled={qmUploading}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-4 py-2 text-sm text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ backgroundColor: canSubmit ? '#2496F4' : '#9CA3AF' }}
            >
              {qmUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                'Load Questionnaire'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Enterprise Manual Add Modal (Intelleges only)
  const renderEnterpriseModal = () => {
    if (!enterpriseModal.open) return null;

    const isFormValid = enterpriseForm.name && enterpriseForm.address1 && enterpriseForm.city &&
                        enterpriseForm.state && enterpriseForm.zipcode && enterpriseForm.startDate && enterpriseForm.endDate;

    const handleEnterpriseClose = () => {
      setEnterpriseForm({
        name: '', country: 'United States', address1: '', address2: '', city: '', state: '', zipcode: '',
        licenseType: 'trial', partnerMax: 100, startDate: '', endDate: ''
      });
      setEnterpriseModal({ open: false, enterprise: null });
    };

    const handleEnterpriseSave = async () => {
      if (!isFormValid) {
        alert('Please fill in all required fields');
        return;
      }

      setEnterpriseSaving(true);
      try {
        const response = await fetch('/api/trpc/enterprises.create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            json: {
              name: enterpriseForm.name,
              country: enterpriseForm.country,
              address1: enterpriseForm.address1,
              address2: enterpriseForm.address2 || null,
              city: enterpriseForm.city,
              state: enterpriseForm.state,
              zipcode: enterpriseForm.zipcode,
              licenseType: enterpriseForm.licenseType,
              partnerMax: enterpriseForm.partnerMax,
              startDate: enterpriseForm.startDate,
              endDate: enterpriseForm.endDate,
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMsg = errorData?.error?.json?.message || errorData?.error?.message || 'Failed to create enterprise';
          throw new Error(errorMsg);
        }

        alert('Enterprise created successfully!');
        handleEnterpriseClose();
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to create enterprise');
      } finally {
        setEnterpriseSaving(false);
      }
    };

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleEnterpriseClose}
      >
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Add Enterprise - Manual</h2>
            <button onClick={handleEnterpriseClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {/* Company Information */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Company Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    value={enterpriseForm.name}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    value={enterpriseForm.country}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, country: e.target.value })}
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Mexico">Mexico</option>
                    <option value="United Kingdom">United Kingdom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address 1 *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    value={enterpriseForm.address1}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, address1: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address 2</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    value={enterpriseForm.address2}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, address2: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      value={enterpriseForm.city}
                      onChange={(e) => setEnterpriseForm({ ...enterpriseForm, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <select
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      value={enterpriseForm.state}
                      onChange={(e) => setEnterpriseForm({ ...enterpriseForm, state: e.target.value })}
                    >
                      <option value="">Select...</option>
                      <option value="CA">California</option>
                      <option value="TX">Texas</option>
                      <option value="NY">New York</option>
                      <option value="FL">Florida</option>
                      <option value="IL">Illinois</option>
                      <option value="PA">Pennsylvania</option>
                      <option value="OH">Ohio</option>
                      <option value="GA">Georgia</option>
                      <option value="NC">North Carolina</option>
                      <option value="MI">Michigan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zipcode *</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      value={enterpriseForm.zipcode}
                      onChange={(e) => setEnterpriseForm({ ...enterpriseForm, zipcode: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* License Information */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">License Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Type *</label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="license"
                        value="paid"
                        checked={enterpriseForm.licenseType === 'paid'}
                        onChange={(e) => setEnterpriseForm({ ...enterpriseForm, licenseType: e.target.value })}
                      /> Paid License
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="license"
                        value="trial"
                        checked={enterpriseForm.licenseType === 'trial'}
                        onChange={(e) => setEnterpriseForm({ ...enterpriseForm, licenseType: e.target.value })}
                      /> Free Trial
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Partner Max (User Limit) *</label>
                  <input
                    type="number"
                    className="w-32 border border-gray-300 rounded px-3 py-2 text-sm"
                    value={enterpriseForm.partnerMax}
                    onChange={(e) => setEnterpriseForm({ ...enterpriseForm, partnerMax: parseInt(e.target.value) || 100 })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      value={enterpriseForm.startDate}
                      onChange={(e) => setEnterpriseForm({ ...enterpriseForm, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      value={enterpriseForm.endDate}
                      onChange={(e) => setEnterpriseForm({ ...enterpriseForm, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                After adding the Enterprise, you will be prompted to add an Admin user for this enterprise.
              </p>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
            <button
              onClick={handleEnterpriseClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              disabled={enterpriseSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleEnterpriseSave}
              disabled={!isFormValid || enterpriseSaving}
              className="px-4 py-2 text-sm text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#2496F4' }}
            >
              {enterpriseSaving ? 'Saving...' : 'OK'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Partner Responses Modal
  const renderPartnerResponsesModal = () => {
    if (!partnerResponsesModal.open) return null;
    const partner = partnerResponsesModal.partner;
    
    // Mock response data
    const responses = [
      { page: 1, question: 'Q1.1', questionText: 'Is your company registered in SAM.gov?', response: 'Yes', status: 'Complete' },
      { page: 1, question: 'Q1.2', questionText: 'What is your CAGE Code?', response: '5ABC1', status: 'Complete' },
      { page: 2, question: 'Q2.1', questionText: 'Does your company manufacture domestically?', response: 'Yes', status: 'Complete' },
      { page: 2, question: 'Q2.2', questionText: 'Percentage of domestic content?', response: '78%', status: 'Complete' },
      { page: 3, question: 'Q3.1', questionText: 'Are you a small business?', response: 'No', status: 'Complete' },
      { page: 3, question: 'Q3.2', questionText: 'Annual revenue range?', response: '$50M - $100M', status: 'Pending' },
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setPartnerResponsesModal({ open: false, partner: null })}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Questionnaire Responses</h2>
              <p className="text-sm text-gray-500">{partner?.name} ({partner?.accessCode})</p>
            </div>
            <button onClick={() => setPartnerResponsesModal({ open: false, partner: null })} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Page</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Question</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Question Text</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Response</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500">{r.page}</td>
                    <td className="px-3 py-2 font-medium">{r.question}</td>
                    <td className="px-3 py-2 text-gray-700">{r.questionText}</td>
                    <td className="px-3 py-2">{r.response}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${r.status === 'Complete' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-200 flex justify-between bg-gray-50">
            <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"><Download className="w-4 h-4" /> Export</button>
            <button onClick={() => setPartnerResponsesModal({ open: false, partner: null })} className="px-4 py-2 text-sm text-white rounded" style={{ backgroundColor: '#2496F4' }}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  // Partner History Modal
  const renderPartnerHistoryModal = () => {
    if (!partnerHistoryModal.open) return null;
    const partner = partnerHistoryModal.partner;
    
    const history = [
      { date: '2025-01-15 14:32', action: 'Response Submitted', user: partner?.email, details: 'Completed page 3 of questionnaire' },
      { date: '2025-01-14 10:15', action: 'Response Saved', user: partner?.email, details: 'Saved progress on page 2' },
      { date: '2025-01-10 09:00', action: 'Reminder Sent', user: 'john.smith@honeywell.com', details: 'Automated reminder email sent' },
      { date: '2025-01-05 11:30', action: 'First Login', user: partner?.email, details: 'First access to questionnaire' },
      { date: '2025-01-01 08:00', action: 'Invitation Sent', user: 'jane.doe@honeywell.com', details: 'Initial invitation email sent' },
      { date: '2024-12-28 15:00', action: 'Partner Created', user: 'john.smith@honeywell.com', details: 'Partner record created via spreadsheet upload' },
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setPartnerHistoryModal({ open: false, partner: null })}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Activity History</h2>
              <p className="text-sm text-gray-500">{partner?.name} ({partner?.accessCode})</p>
            </div>
            <button onClick={() => setPartnerHistoryModal({ open: false, partner: null })} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              {history.map((h, i) => (
                <div key={i} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                  <div className="text-xs text-gray-400 w-32 flex-shrink-0">{h.date}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{h.action}</div>
                    <div className="text-sm text-gray-500">{h.details}</div>
                    <div className="text-xs text-gray-400 mt-1">By: {h.user}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border-t border-gray-200 flex justify-end bg-gray-50">
            <button onClick={() => setPartnerHistoryModal({ open: false, partner: null })} className="px-4 py-2 text-sm text-white rounded" style={{ backgroundColor: '#2496F4' }}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  // Partner Documents Modal
  const renderPartnerDocumentsModal = () => {
    if (!partnerDocumentsModal.open) return null;
    const partner = partnerDocumentsModal.partner;
    
    const documents = [
      { name: 'SAM_Registration_2025.pdf', type: 'PDF', size: '245 KB', uploaded: '2025-01-10', status: 'Verified' },
      { name: 'ISO_9001_Certificate.pdf', type: 'PDF', size: '1.2 MB', uploaded: '2025-01-08', status: 'Pending Review' },
      { name: 'W9_Form.pdf', type: 'PDF', size: '89 KB', uploaded: '2025-01-05', status: 'Verified' },
      { name: 'Insurance_Certificate.pdf', type: 'PDF', size: '456 KB', uploaded: '2025-01-05', status: 'Verified' },
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setPartnerDocumentsModal({ open: false, partner: null })}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Documents</h2>
              <p className="text-sm text-gray-500">{partner?.name}</p>
            </div>
            <button onClick={() => setPartnerDocumentsModal({ open: false, partner: null })} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-2">
              {documents.map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-red-500" />
                    <div>
                      <div className="font-medium text-gray-800">{doc.name}</div>
                      <div className="text-xs text-gray-500">{doc.size} • Uploaded {doc.uploaded}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs ${doc.status === 'Verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{doc.status}</span>
                    <button className="text-gray-400 hover:text-blue-600"><Download className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border-t border-gray-200 flex justify-between bg-gray-50">
            <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"><Upload className="w-4 h-4" /> Upload Document</button>
            <button onClick={() => setPartnerDocumentsModal({ open: false, partner: null })} className="px-4 py-2 text-sm text-white rounded" style={{ backgroundColor: '#2496F4' }}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  // Partner Contact Edit Modal
  const renderPartnerContactModal = () => {
    if (!partnerContactModal.open) return null;
    const partner = partnerContactModal.partner;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setPartnerContactModal({ open: false, partner: null })}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Edit Contact</h2>
            <button onClick={() => setPartnerContactModal({ open: false, partner: null })} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner?.firstName} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner?.lastName} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
              <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner?.title} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner?.email} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={partner?.phone} />
            </div>
          </div>
          <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
            <button onClick={() => setPartnerContactModal({ open: false, partner: null })} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
            <button onClick={() => setPartnerContactModal({ open: false, partner: null })} className="px-4 py-2 text-sm text-white rounded" style={{ backgroundColor: '#2496F4' }}>Save Changes</button>
          </div>
        </div>
      </div>
    );
  };

  // Partner Confirmation Modal (for dangerous actions)
  const renderPartnerConfirmModal = () => {
    if (!partnerConfirmModal.open) return null;
    const { action, partner } = partnerConfirmModal;
    
    const actionConfig = {
      'resend-invite': { title: 'Resend Invitation', message: `Send a new invitation email to ${partner?.email}?`, buttonText: 'Send Invitation', buttonColor: '#2496F4' },
      'send-reminder': { title: 'Send Reminder', message: `Send a reminder email to ${partner?.email}?`, buttonText: 'Send Reminder', buttonColor: '#2496F4' },
      'reset-responses': { title: 'Reset Responses', message: `This will delete all questionnaire responses for ${partner?.name}. This action cannot be undone.`, buttonText: 'Reset Responses', buttonColor: '#F59E0B', danger: true },
      'archive': { title: 'Archive Partner', message: `Archive ${partner?.name}? The partner will be hidden from active views but data will be preserved.`, buttonText: 'Archive', buttonColor: '#6B7280' },
      'delete': { title: 'Delete Partner', message: `Permanently delete ${partner?.name}? This action cannot be undone and all associated data will be lost.`, buttonText: 'Delete Partner', buttonColor: '#EF4444', danger: true },
    };
    
    const config = actionConfig[action] || { title: 'Confirm', message: 'Are you sure?', buttonText: 'Confirm', buttonColor: '#2496F4' };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setPartnerConfirmModal({ open: false, action: null, partner: null })}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">{config.title}</h2>
            <button onClick={() => setPartnerConfirmModal({ open: false, action: null, partner: null })} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-600">{config.message}</p>
            {config.danger && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-xs text-red-700 font-medium">⚠️ Warning: This action cannot be undone</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
            <button onClick={() => setPartnerConfirmModal({ open: false, action: null, partner: null })} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
            <button onClick={() => { setPartnerConfirmModal({ open: false, action: null, partner: null }); }} className="px-4 py-2 text-sm text-white rounded" style={{ backgroundColor: config.buttonColor }}>{config.buttonText}</button>
          </div>
        </div>
      </div>
    );
  };

  // ========== SUPPLIER COMMAND CENTER ==========
  
  // Supplier data (CMS-driven where applicable)
  const supplierData = {
    company: cmsData.COMPANY_PAGE_COMPANY_NAMER || 'Acme Aerospace Inc.',
    supplierId: 'SUP-2024-00847',
    clientName: 'Honeywell Aerospace',
    primaryContact: cmsData.CONTACT_PAGE_CONTACT_NAME || 'Jane Smith',
    overallCompletion: 68,
  };

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

  // Original wizard steps (CMS-driven)
  const supplierWizardSteps = [
    { step: 1, title: cmsData.ACCESS_CODE_TITLE || 'Access Code Entry', description: stripHtml(cmsData.ACCESS_CODE_PANEL_TWO || 'Enter your secure access code').substring(0, 50) + '...' },
    { step: 2, title: 'Company Confirmation', description: 'Verify your company information' },
    { step: 3, title: 'Contact Confirmation', description: 'Confirm contact details' },
    { step: 4, title: 'Questionnaire', description: stripHtml(cmsData.QUESTIONNAIRE_PAGE_PANEL_TWO || 'Complete compliance questionnaire').substring(0, 50) + '...' },
    { step: 5, title: 'E-Signature', description: 'Sign electronically' },
    { step: 6, title: cmsData.CONFIRMATION_PAGE_HEADLINE || 'Submission Complete', description: 'Download your receipt' },
  ];

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
  const supplierTasksData = [
    { id: 1, name: 'Upload updated ISO 9001 certificate', category: 'Certifications', status: 'expiring', assignee: 'Maria Lopez', dueDate: '2025-03-15', lastUpdated: '2025-02-19' },
    { id: 2, name: 'Complete cybersecurity questionnaire', category: 'Cybersecurity', status: 'partial', assignee: 'IT Security', dueDate: '2025-02-28', lastUpdated: '2025-02-20' },
    { id: 3, name: 'Verify company contact information', category: 'General', status: 'complete', assignee: 'Admin', lastUpdated: '2025-02-10' },
    { id: 4, name: 'Sign Business Associate Agreement (BAA)', category: 'Regulatory', status: 'incomplete', assignee: 'CFO', dueDate: '2025-03-01' },
    { id: 5, name: 'Provide updated insurance certificate', category: 'Documents', status: 'overdue', assignee: 'Maria Lopez', dueDate: '2025-01-15' },
  ];

  // Documents data
  const supplierDocumentsData = [
    { id: 1, name: 'ISO 9001:2015 Certificate', category: 'Certifications', status: 'expiring', uploadDate: '2024-03-15', expirationDate: '2025-02-08' },
    { id: 2, name: 'Certificate of Insurance', category: 'Insurance', status: 'expired', uploadDate: '2024-01-10', expirationDate: '2025-01-10' },
    { id: 3, name: 'W-9 Tax Form', category: 'Financial', status: 'valid', uploadDate: '2024-06-20' },
    { id: 4, name: 'ITAR Registration', category: 'Regulatory', status: 'valid', uploadDate: '2024-08-01', expirationDate: '2026-08-01' },
    { id: 5, name: 'Cybersecurity Policy', category: 'Cybersecurity', status: 'pending', uploadDate: '2025-01-15' },
    { id: 6, name: 'SOC 2 Type II Report', category: 'Cybersecurity', status: 'missing' },
  ];

  // Certifications data
  const supplierCertificationsData = [
    { id: 1, name: 'ISO 9001:2015', status: 'expiring', expiration: '27 days', lastReview: '2024', reviewer: 'Intelleges QA' },
    { id: 2, name: 'AS9100D', status: 'valid', expiration: 'Mar 2026', lastReview: '2024', reviewer: 'Intelleges QA' },
    { id: 3, name: 'ITAR Registered', status: 'valid', expiration: 'Aug 2026', lastReview: '2024', reviewer: 'Intelleges Compliance' },
    { id: 4, name: 'C-TPAT', status: 'valid', expiration: 'Mar 2026', lastReview: '2024', reviewer: 'Intelleges Compliance' },
    { id: 5, name: 'SOC 2 Type II', status: 'required', expiration: '—', lastReview: '—', reviewer: '—' },
    { id: 6, name: 'CMMC Level 2', status: 'partial', expiration: 'Pending', lastReview: '—', reviewer: 'Intelleges Cyber' },
  ];

  // History data
  const supplierHistoryData = [
    { id: 1, date: '2025-01-23', action: 'Logged in', entity: 'Portal Access', user: 'Maria Lopez', details: 'Access code authentication' },
    { id: 2, date: '2025-01-15', action: 'Document uploaded', entity: 'Cybersecurity Policy', user: 'Joseph Kim', details: 'New version submitted for review' },
    { id: 3, date: '2025-01-10', action: 'Certification expired', entity: 'Certificate of Insurance', user: 'System', details: 'Auto-flagged for renewal' },
    { id: 4, date: '2025-01-08', action: 'Questionnaire started', entity: 'Cybersecurity Assessment', user: 'Joseph Kim', details: '45% complete' },
    { id: 5, date: '2024-12-20', action: 'Review approved', entity: 'ITAR Registration', user: 'Intelleges Compliance', details: 'Annual verification complete' },
  ];

  // Messages data
  const supplierMessagesData = [
    { id: 1, type: 'inbound', subject: 'ISO 9001 Certificate Renewal Required', from: 'Intelleges Compliance', date: '2025-01-20', status: 'unread' },
    { id: 2, type: 'inbound', subject: 'Cybersecurity Questionnaire Assignment', from: 'Honeywell Procurement', date: '2025-01-19', status: 'read' },
    { id: 3, type: 'outbound', subject: 'Extension Request - Insurance Certificate', from: 'Maria Lopez', date: '2025-01-18', status: 'pending' },
    { id: 4, type: 'inbound', subject: 'Welcome to 2025 Compliance Cycle', from: 'Intelleges', date: '2025-01-02', status: 'read' },
  ];

  // Marketing/Thought Leadership Content
  const marketingContent = [
    { id: 1, type: 'award', icon: '🏆', headline: 'Intelleges Earns Battelle Supplier of the Year Award', subtext: 'Recognized for excellence in compliance management', cta: 'Read More', link: '#' },
    { id: 2, type: 'whitepaper', icon: '📄', headline: 'Supply Chain Compliance with Federal Regulations in 2025', subtext: 'Free whitepaper: Navigate CMMC, ITAR, and more', cta: 'Download', link: '#' },
    { id: 3, type: 'guide', icon: '🚀', headline: 'Managing Compliance Across Multiple Customers?', subtext: 'See how suppliers streamline with a single dashboard', cta: 'Learn More', link: '#' },
    { id: 4, type: 'webinar', icon: '🎥', headline: 'Webinar: Reduce Compliance Fatigue by 60%', subtext: 'Live session with industry experts • March 15', cta: 'Register Free', link: '#' },
    { id: 5, type: 'case_study', icon: '📊', headline: 'How Tier-2 Suppliers Cut Audit Prep Time in Half', subtext: 'Case study featuring aerospace suppliers', cta: 'Read Case Study', link: '#' },
  ];

  // Auto-rotate carousel
  useEffect(() => {
    if (userRole === 'supplier') {
      const timer = setInterval(() => {
        setSupplierCarouselIndex((prev) => (prev + 1) % marketingContent.length);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [userRole]);

  // Status chip helper for supplier dashboard
  const SupplierStatusChip = ({ status }) => {
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
    const s = styles[status] || styles.pending;
    const Icon = s.icon;
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: s.bg, color: s.color }}>
        {Icon && <Icon className="w-3 h-3" />}
        {s.text}
      </span>
    );
  };

  const getScoreColor = (status) => {
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
    const overdue = supplierTasksData.filter(t => t.status === 'overdue').length;
    const expiring = supplierCertificationsData.filter(c => c.status === 'expiring').length;
    if (overdue > 0) return { icon: '🔴', text: 'Action Required', color: '#DC2626', bg: '#FEE2E2' };
    if (expiring > 0) return { icon: '🟡', text: 'Expiring Soon', color: '#D97706', bg: '#FEF3C7' };
    return { icon: '🟢', text: 'Current', color: '#059669', bg: '#D1FAE5' };
  };

  const getComplianceEmoji = (percentage) => {
    if (percentage < 65) return { emoji: '😟', label: 'Needs Attention', color: '#DC2626', bg: '#FEE2E2' };
    if (percentage <= 80) return { emoji: '😐', label: 'Making Progress', color: '#D97706', bg: '#FEF3C7' };
    return { emoji: '😊', label: 'Doing Well', color: '#059669', bg: '#D1FAE5' };
  };

  const complianceHealth = getComplianceEmoji(supplierData.overallCompletion);
  const openTasks = supplierTasksData.filter(t => t.status !== 'complete').length;
  const overdueTasks = supplierTasksData.filter(t => t.status === 'overdue').length;
  const unreadMessages = supplierMessagesData.filter(m => m.status === 'unread').length;

  // Marketing Carousel Component
  const MarketingCarousel = ({ variant = 'light' }) => {
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
                <button key={idx} onClick={() => setSupplierCarouselIndex(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === supplierCarouselIndex ? (isLight ? 'bg-blue-500' : 'bg-blue-400') : (isLight ? 'bg-gray-300' : 'bg-gray-600')}`} />
              ))}
            </div>
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2].map((offset) => {
              const item = marketingContent[(supplierCarouselIndex + offset) % marketingContent.length];
              return (
                <a key={item.id} href={item.link}
                  className={`flex-1 p-4 rounded-lg border transition-all hover:shadow-md group ${isLight ? 'bg-white border-gray-200 hover:border-blue-300' : 'bg-gray-700 border-gray-600 hover:border-blue-500'}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm leading-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>{item.headline}</div>
                      <div className={`text-xs mt-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{item.subtext}</div>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-500 mt-2 group-hover:text-blue-600">
                        {item.cta} <ChevronRight className="w-3 h-3" />
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

  // Dashboard tabs
  const supplierTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'tasks', label: 'Your Tasks', badge: openTasks },
    { id: 'documents', label: 'Documents' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'history', label: 'History' },
    { id: 'messages', label: 'Messages', badge: unreadMessages },
    { id: 'support', label: 'Support' },
  ];

  // ========== SUPPLIER VIEW ==========
  if (userRole === 'supplier') {
    const status = getOverallStatus();

    // ========== PRE-AUTHENTICATION: ACCESS CODE WIZARD ==========
    if (!supplierAuthenticated) {
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
                  <p className="text-sm text-gray-600">{cmsData.ACCESS_CODE_TITLE || 'Federal Compliance Management System'}</p>
                </div>
              </div>
              <select value={userRole} onChange={(e) => setUserRole(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white">
                <option value="intelleges">Intelleges Admin</option>
                <option value="enterprise">Enterprise User</option>
                <option value="supplier">Supplier</option>
              </select>
            </div>
          </header>

          {/* Wizard */}
          <main className="max-w-4xl mx-auto py-8 px-6 flex-1">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {supplierWizardSteps.map((s, idx) => (
                  <React.Fragment key={s.step}>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                        style={{ backgroundColor: s.step < supplierStep ? '#2496F4' : s.step === supplierStep ? '#2496F4' : '#E5E7EB', color: s.step <= supplierStep ? 'white' : '#4B5563' }}>
                        {s.step < supplierStep ? '✓' : s.step}
                      </div>
                      <span className="text-xs mt-2 text-center max-w-[80px]"
                        style={{ color: s.step === supplierStep ? '#2496F4' : '#6B7280', fontWeight: s.step === supplierStep ? 500 : 400 }}>
                        {s.title}
                      </span>
                    </div>
                    {idx < supplierWizardSteps.length - 1 && (
                      <div className="flex-1 h-1 mx-2" style={{ backgroundColor: s.step < supplierStep ? '#2496F4' : '#E5E7EB' }} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Current Step Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{supplierWizardSteps[supplierStep - 1].title}</h2>
              <p className="text-gray-600 mb-6">{supplierWizardSteps[supplierStep - 1].description}</p>

              {/* Step 1: Access Code */}
              {supplierStep === 1 && (
                <div className="space-y-4">
                  <div dangerouslySetInnerHTML={{ __html: cmsData.ACCESS_CODE_PANEL_ONE }} className="text-sm text-gray-700" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{cmsData.ACCESS_CODE_LABEL || 'Access Code'}</label>
                    <input type="text" placeholder={cmsData.ACCESS_CODE_PLACEHOLDER || 'Enter your access code'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: cmsData.ACCESS_CODE_PANEL_TWO }} className="text-sm text-gray-500" />
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button onClick={() => setSupplierStep(Math.max(1, supplierStep - 1))} disabled={supplierStep === 1}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50">
                  {cmsData.ACCESS_CODE_PREVIOUS_TEXT || 'Back'}
                </button>
                <button onClick={() => {
                  if (supplierStep === 1) {
                    // Show routing modal after access code
                    setShowRoutingModal(true);
                  } else {
                    setSupplierStep(Math.min(6, supplierStep + 1));
                  }
                }}
                  className="px-6 py-2 text-white rounded-md" style={{ backgroundColor: '#2496F4' }}>
                  {cmsData.ACCESS_CODE_SUBMIT_TEXT || 'Continue'}
                </button>
              </div>
            </div>

            {/* CMS indicator */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <strong>🔗 Live CMS Connection:</strong> All text on this page is driven by the CMS.
            </div>
          </main>

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

                {/* Latest Communication */}
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
                  <button onClick={() => { setShowRoutingModal(false); setSupplierAuthenticated(true); setSupplierViewMode('wizard'); setSupplierStep(2); }}
                    className="w-full mt-4 px-6 py-3 text-white rounded-lg font-medium hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#2496F4' }}>
                    <ChevronRight className="w-5 h-5" /> Go Directly to This Request
                  </button>
                </div>

                {/* Compliance Health Summary */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ backgroundColor: complianceHealth.bg }}>
                        {complianceHealth.emoji}
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Your Compliance with</div>
                        <div className="font-semibold text-gray-900">{supplierData.clientName}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="text-2xl font-bold" style={{ color: complianceHealth.color }}>{supplierData.overallCompletion}%</div>
                          <span className="text-sm" style={{ color: complianceHealth.color }}>{complianceHealth.label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>{openTasks} open tasks</div>
                      {overdueTasks > 0 && <div className="text-red-600 font-medium">{overdueTasks} overdue</div>}
                    </div>
                  </div>

                  {/* Secondary CTA - View Dashboard */}
                  <button onClick={() => { setShowRoutingModal(false); setSupplierAuthenticated(true); setSupplierViewMode('dashboard'); setSupplierActiveTab('overview'); }}
                    className="w-full mt-4 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
                    <Eye className="w-5 h-5" /> View Full Dashboard
                  </button>
                </div>

                {/* All Communications */}
                <div className="p-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <History className="w-4 h-4" /> All Communications from {supplierData.clientName}
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {allCommunications.map(comm => (
                      <div key={comm.id}
                        className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${comm.status === 'overdue' ? 'border-red-200 bg-red-50' : comm.status === 'pending' ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{comm.subject}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{comm.date}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {comm.status === 'overdue' && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">Overdue</span>}
                            {comm.status === 'pending' && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">Action Needed</span>}
                            {comm.status === 'in_progress' && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">In Progress</span>}
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Supplier ID: {supplierData.supplierId}</span>
                    <button className="text-blue-600 hover:underline flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" /> Need help?
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto border-t border-gray-200 bg-white">
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
      );
    }

    // ========== WIZARD MODE (Steps 2-6) ==========
    if (supplierViewMode === 'wizard' && supplierStep >= 2) {
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
                <button onClick={() => { setSupplierViewMode('dashboard'); setSupplierActiveTab('overview'); }}
                  className="text-sm text-blue-600 hover:underline">Exit to Dashboard</button>
                <select value={userRole} onChange={(e) => setUserRole(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white">
                  <option value="intelleges">Intelleges Admin</option>
                  <option value="enterprise">Enterprise User</option>
                  <option value="supplier">Supplier</option>
                </select>
              </div>
            </div>
          </header>

          <main className="max-w-4xl mx-auto py-8 px-6 flex-1">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {supplierWizardSteps.map((s, idx) => (
                  <React.Fragment key={s.step}>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                        style={{ backgroundColor: s.step <= supplierStep ? '#2496F4' : '#E5E7EB', color: s.step <= supplierStep ? 'white' : '#4B5563' }}>
                        {s.step < supplierStep ? '✓' : s.step}
                      </div>
                      <span className="text-xs mt-2 text-center max-w-[80px]"
                        style={{ color: s.step === supplierStep ? '#2496F4' : '#6B7280', fontWeight: s.step === supplierStep ? 500 : 400 }}>
                        {s.title}
                      </span>
                    </div>
                    {idx < supplierWizardSteps.length - 1 && (
                      <div className="flex-1 h-1 mx-2" style={{ backgroundColor: s.step < supplierStep ? '#2496F4' : '#E5E7EB' }} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              
              {/* STEP 2: Company Confirmation - CMS Driven */}
              {supplierStep === 2 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-2" style={{ color: '#1E40AF' }}>{cmsData.COMPANY_PAGE_TITLE}</h2>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="text-sm text-gray-700">{stripHtml(cmsData.COMPANY_PAGE_PANEL_ONE)}</div>
                    <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: cmsData.COMPANY_PAGE_PANEL_TWO }} />
                  </div>
                  
                  <div className="bg-gray-700 text-white px-4 py-2 rounded-t-lg text-sm font-medium">{cmsData.COMPANY_PAGE_HEADER}</div>
                  <div className="border border-gray-300 rounded-b-lg p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{cmsData.COMPANY_FIELD_ONE}</label>
                        <p className="text-gray-900">{supplierData.company}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{cmsData.COMPANY_FIELD_TWO}</label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-500">{cmsData.COMPANY_FIELD_THREE}</label>
                        <p className="text-gray-900">123 Aerospace Way</p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500">{cmsData.COMPANY_FIELD_FOUR}</label>
                        <p className="text-gray-900">Suite 400</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm text-gray-500">{cmsData.COMPANY_FIELD_FIVE}</label>
                        <p className="text-gray-900">Phoenix</p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500">{cmsData.COMPANY_FIELD_SIX}</label>
                        <p className="text-gray-900">AZ</p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500">{cmsData.COMPANY_FIELD_SEVEN}</label>
                        <p className="text-gray-900">85001</p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500">{cmsData.COMPANY_FIELD_NINE}</label>
                        <p className="text-gray-900">United States</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Contact Confirmation - CMS Driven */}
              {supplierStep === 3 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-2" style={{ color: '#1E40AF' }}>{cmsData.CONTACT_PAGE_TITLE}</h2>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="text-sm text-gray-700">{stripHtml(cmsData.CONTACT_PAGE_PANEL_ONE)}</div>
                    <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: cmsData.CONTACT_PAGE_PANEL_TWO }} />
                  </div>
                  
                  <div className="bg-gray-700 text-white px-4 py-2 rounded-t-lg text-sm font-medium">{cmsData.CONTACT_PAGE_HEADER}</div>
                  <div className="border border-gray-300 rounded-b-lg p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-500">{cmsData.CONTACT_EDIT_FIELD_ONE}</label>
                        <p className="text-gray-900">{supplierData.primaryContact.split(' ')[0] || 'Jane'}</p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500">{cmsData.CONTACT_EDIT_FIELD_TWO}</label>
                        <p className="text-gray-900">{supplierData.primaryContact.split(' ')[1] || 'Smith'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-500">{cmsData.CONTACT_EDIT_FIELD_THREE}</label>
                        <p className="text-gray-900">Compliance Officer</p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500">{cmsData.CONTACT_EDIT_FIELD_FOUR}</label>
                        <p className="text-gray-900">jane.smith@acme-aerospace.com</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500">{cmsData.CONTACT_EDIT_FIELD_FIVE}</label>
                      <p className="text-gray-900">(602) 555-0123</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Questionnaire - Full Response Types */}
              {supplierStep === 4 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-2" style={{ color: '#1E40AF' }}>{cmsData.QUESTIONNAIRE_PAGE_TITLE}</h2>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: cmsData.QUESTIONNAIRE_PAGE_PANEL_TWO }} />
                    <div className="flex items-center gap-4 text-sm">
                      <a href="#" className="text-blue-600 hover:underline">{cmsData.QUESTIONNAIRE_PDF}</a>
                      <span className="text-gray-300">|</span>
                      <a href="#" className="text-blue-600 hover:underline">{cmsData.QUESTIONNAIRE_FAQ}</a>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mb-4">
                    <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">{cmsData.SAVE_FOR_LATER_TEXT}</button>
                  </div>
                  
                  {/* Questionnaire Pages with Full Response Types */}
                  <div className="space-y-6">
                    {questionnaireData.filter(p => p.page <= 3).map(page => {
                      const { grouped } = getVisibleQuestions(page.page);
                      return (
                        <div key={page.page} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
                            <h3 className="font-medium text-blue-900">{page.title}</h3>
                          </div>
                          <div className="p-4 space-y-4">
                            {Object.entries(grouped).map(([group, questions]) => (
                              <div key={group}>
                                {group !== 'ungrouped' && (
                                  <div className="text-sm font-medium text-gray-700 mb-2 pb-2 border-b">{group}</div>
                                )}
                                {questions.map(q => renderQuestion(q))}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 5: E-Signature - CMS Driven */}
              {supplierStep === 5 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-2" style={{ color: '#1E40AF' }}>{cmsData.ESIGNATURE_PAGE_TITLE}</h2>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="text-sm text-gray-700">{stripHtml(cmsData.ESIGNATURE_PAGE_PANEL_ONE)}</div>
                    <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: cmsData.ESIGNATURE_PAGE_PANEL_TWO }} />
                  </div>
                  
                  <div className="bg-gray-700 text-white px-4 py-3 rounded-t-lg text-sm">{cmsData.ESIGNATURE_PAGE_TEXT}</div>
                  <div className="border border-gray-300 rounded-b-lg p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{cmsData.ESIGNATURE_FIELD_ONE} <span className="text-red-500">*</span></label>
                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded" defaultValue={supplierData.primaryContact.split(' ')[0] || 'Jane'} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{cmsData.ESIGNATURE_FIELD_TWO} <span className="text-red-500">*</span></label>
                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded" defaultValue={supplierData.primaryContact.split(' ')[1] || 'Smith'} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{cmsData.ESIGNATURE_FIELD_THREE} <span className="text-red-500">*</span></label>
                      <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded" defaultValue="jane.smith@acme-aerospace.com" />
                    </div>
                    <p className="text-xs text-gray-500">{cmsData.ESIGNATURE_FOOTER_ONE}</p>
                  </div>
                </div>
              )}

              {/* STEP 6: Confirmation - CMS Driven */}
              {supplierStep === 6 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#D1FAE5' }}>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2" style={{ color: '#1E40AF' }}>{cmsData.CONFIRMATION_PAGE_HEADLINE}</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">{cmsData.CONFIRMATION_PAGE_SIGNOFF_STATEMENT}</p>
                  <div className="flex justify-center gap-4">
                    <button className="inline-flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                      <FileText className="w-4 h-4" /> {cmsData.CONFIRMATION_PAGE_PREVIOUS_TEXT}
                    </button>
                    <button onClick={() => { setSupplierViewMode('dashboard'); setSupplierActiveTab('overview'); }}
                      className="inline-flex items-center gap-2 px-6 py-2 text-white rounded-md" 
                      style={{ backgroundColor: '#2496F4' }}>
                      {cmsData.CONFIRMATION_PAGE_NEXT_TEXT}
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation Buttons - CMS Driven */}
              {supplierStep < 6 && (
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                  <button onClick={() => supplierStep === 2 ? setSupplierViewMode('dashboard') : setSupplierStep(supplierStep - 1)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                    {supplierStep === 2 ? cmsData.COMPANY_PAGE_PREVIOUS_TEXT : 
                     supplierStep === 3 ? cmsData.CONTACT_PAGE_PREVIOUS_TEXT :
                     supplierStep === 4 ? cmsData.QUESTIONNAIRE_PAGE_PREVIOUS_TEXT :
                     supplierStep === 5 ? cmsData.ESIGNATURE_PAGE_PREVIOUS_TEXT : 'Back'}
                  </button>
                  <button onClick={() => setSupplierStep(supplierStep + 1)}
                    className="px-6 py-2 text-white rounded-md" style={{ backgroundColor: '#2496F4' }}>
                    {supplierStep === 2 ? cmsData.COMPANY_PAGE_NEXT_TEXT :
                     supplierStep === 3 ? cmsData.CONTACT_PAGE_NEXT_TEXT :
                     supplierStep === 4 ? cmsData.QUESTIONNAIRE_PAGE_NEXT_TEXT :
                     supplierStep === 5 ? cmsData.ESIGNATURE_PAGE_NEXT_TEXT : 'Continue'}
                  </button>
                </div>
              )}
            </div>
            
            {/* CMS Connection indicator */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <strong>🔗 Live CMS Connection:</strong> All text on this page is driven by the CMS. Switch to Intelleges Admin → Questionnaire → Edit/Upload CMS to modify.
            </div>
          </main>

          {/* Footer */}
          <div className="mt-auto border-t border-gray-200 bg-white">
            <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between text-xs text-gray-400">
              <span>© 2025 Intelleges. All rights reserved.</span>
              <div className="flex gap-4">
                <a href="#" className="hover:text-gray-600">Privacy</a>
                <a href="#" className="hover:text-gray-600">Terms</a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ========== SUPPLIER COMMAND CENTER DASHBOARD ==========
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
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
                <div className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 bg-white" style={{ color: status.color }}>
                  <span>{status.icon}</span> Status: {status.text}
                </div>
                <button className="relative p-2 text-white hover:bg-blue-600 rounded-lg">
                  <Bell className="w-5 h-5" />
                  {overdueTasks > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{overdueTasks}</span>}
                </button>
                <select value={userRole} onChange={(e) => setUserRole(e.target.value)}
                  className="text-sm border border-white/30 rounded-md px-2 py-1 bg-transparent text-white">
                  <option value="intelleges" className="text-gray-900">Intelleges Admin</option>
                  <option value="enterprise" className="text-gray-900">Enterprise User</option>
                  <option value="supplier" className="text-gray-900">Supplier</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6">
              <nav className="flex gap-1">
                {supplierTabs.map(tab => (
                  <button key={tab.id} onClick={() => setSupplierActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${supplierActiveTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'}`}>
                    {tab.label}
                    {tab.badge > 0 && <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${supplierActiveTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'}`}>{tab.badge}</span>}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-6 flex-1">
          {/* ===== OVERVIEW TAB ===== */}
          {supplierActiveTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                {/* Compliance Scorecard */}
                <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Compliance Scorecard</h2>
                    <button className="p-1 text-gray-400 hover:text-gray-600"><Info className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {complianceScorecard.map(item => (
                      <div key={item.code} className="border-2 rounded-lg p-3 text-center" style={{ borderColor: getScoreColor(item.status) }}>
                        <div className="text-xs font-bold text-gray-500">{item.code}</div>
                        <div className="text-xs text-gray-500 truncate">{item.label}</div>
                        <div className="text-2xl font-bold mt-1" style={{ color: getScoreColor(item.status) }}>{item.count}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overall Completion */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Overall Completion</h2>
                  <p className="text-sm text-gray-500 mb-4">You are {supplierData.overallCompletion}% complete for the current compliance cycle.</p>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
                    <div className="h-full rounded-full" style={{ width: `${supplierData.overallCompletion}%`, backgroundColor: '#2496F4' }} />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="font-medium text-blue-900 text-sm">What's next?</div>
                    <p className="text-xs text-blue-700 mt-1">Upload your most recent ISO 9001 certificate. Est. time: <strong>5 minutes</strong>.</p>
                  </div>
                </div>
              </div>

              {/* Action Items + Timeline */}
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Your Action Items</h2>
                    <button className="text-sm text-blue-600 hover:underline" onClick={() => setSupplierActiveTab('tasks')}>View All →</button>
                  </div>
                  <div className="space-y-3">
                    {supplierTasksData.filter(t => t.status !== 'complete').slice(0, 4).map(task => (
                      <div key={task.id} className={`p-4 rounded-lg border ${task.status === 'overdue' ? 'bg-red-50 border-red-200' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{task.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{task.category}</div>
                          </div>
                          <SupplierStatusChip status={task.status} />
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="text-xs text-gray-500">{task.dueDate && <span>Due: {task.dueDate}</span>}</div>
                          <button onClick={() => { setSupplierViewMode('wizard'); setSupplierStep(2); }}
                            className="px-4 py-1.5 text-sm font-medium rounded-lg text-white"
                            style={{ backgroundColor: task.status === 'overdue' ? '#F2574D' : '#2496F4' }}>Open</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Timeline</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Request sent:</span><span className="font-medium text-gray-900">January 20, 2025</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Days since request:</span><span className="font-medium text-gray-900">28</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Current status:</span><span className="font-medium text-gray-900">Under Supplier Review</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Primary contact:</span><span className="font-medium text-gray-900">{supplierData.primaryContact}</span></div>
                  </div>
                  <button className="w-full mt-4 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50" onClick={() => setSupplierActiveTab('history')}>View full history</button>
                </div>
              </div>
            </div>
          )}

          {/* ===== TASKS TAB ===== */}
          {supplierActiveTab === 'tasks' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Your Tasks</h2></div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Task</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Assignee</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Due Date</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierTasksData.map(task => (
                    <tr key={task.id} className={`border-b hover:bg-gray-50 ${task.status === 'overdue' ? 'bg-red-50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{task.name}</td>
                      <td className="px-4 py-3 text-gray-600">{task.category}</td>
                      <td className="px-4 py-3"><SupplierStatusChip status={task.status} /></td>
                      <td className="px-4 py-3 text-gray-600">{task.assignee}</td>
                      <td className="px-4 py-3 text-gray-600">{task.dueDate || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => { setSupplierViewMode('wizard'); setSupplierStep(2); }}
                          className="px-3 py-1.5 text-sm text-white rounded-lg" style={{ backgroundColor: '#2496F4' }}>Open</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ===== DOCUMENTS TAB ===== */}
          {supplierActiveTab === 'documents' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
                <button className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ backgroundColor: '#2496F4' }}>
                  <Upload className="w-4 h-4" /> Upload Document
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 p-4">
                {supplierDocumentsData.map(doc => (
                  <div key={doc.id} className={`border rounded-lg p-4 ${doc.status === 'expired' || doc.status === 'missing' ? 'border-red-300 bg-red-50' : doc.status === 'expiring' ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-gray-900 text-sm">{doc.name}</div>
                      <SupplierStatusChip status={doc.status} />
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>{doc.category}</div>
                      {doc.uploadDate && <div>Uploaded: {doc.uploadDate}</div>}
                      {doc.expirationDate && <div>Expires: {doc.expirationDate}</div>}
                    </div>
                    <div className="mt-3">
                      {doc.status === 'missing' ? (
                        <button className="w-full px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg">Upload Now</button>
                      ) : (
                        <button className="w-full px-3 py-1.5 border border-gray-300 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50">View</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== CERTIFICATIONS TAB ===== */}
          {supplierActiveTab === 'certifications' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Certifications</h2></div>
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
                  {supplierCertificationsData.map(cert => (
                    <tr key={cert.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{cert.name}</td>
                      <td className="px-4 py-3"><SupplierStatusChip status={cert.status} /></td>
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
          {supplierActiveTab === 'history' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">History</h2></div>
              <div className="divide-y">
                {supplierHistoryData.map(item => (
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
          {supplierActiveTab === 'messages' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Messages & Requests</h2>
                <button className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ backgroundColor: '#2496F4' }}>
                  <MessageSquare className="w-4 h-4" /> New Message
                </button>
              </div>
              <div className="divide-y">
                {supplierMessagesData.map(msg => (
                  <div key={msg.id} className={`p-4 flex items-start gap-4 hover:bg-gray-50 cursor-pointer ${msg.status === 'unread' ? 'bg-blue-50' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.type === 'inbound' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <MessageSquare className={`w-5 h-5 ${msg.type === 'inbound' ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${msg.status === 'unread' ? 'text-gray-900' : 'text-gray-700'}`}>{msg.subject}</span>
                        {msg.status === 'unread' && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">{msg.type === 'inbound' ? `From: ${msg.from}` : 'To: Intelleges Support'}</div>
                      <div className="text-xs text-gray-400 mt-1">{msg.date}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== SUPPORT TAB ===== */}
          {supplierActiveTab === 'support' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Support</h2>
              <p className="text-sm text-gray-500 mb-6">Contact options, FAQs, and links to knowledge base.</p>
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

  // Admin/Enterprise View
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-200 transition-all duration-200 flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 50 50" className="w-10 h-10 flex-shrink-0">
              <circle cx="25" cy="25" r="20" fill="none" stroke="#2496F4" strokeWidth="6" strokeDasharray="80 45" transform="rotate(-45 25 25)"/>
              <path d="M 10 35 Q 5 25 15 20" fill="none" stroke="#FFCA16" strokeWidth="6" strokeLinecap="round"/>
              <path d="M 35 40 Q 45 35 40 25" fill="none" stroke="#F2574D" strokeWidth="6" strokeLinecap="round"/>
            </svg>
            {sidebarOpen && (
              <div className="min-w-0">
                <h1 className="text-lg font-bold truncate" style={{ color: '#111117' }}>Intelleges</h1>
                <p className="text-xs text-gray-500 leading-tight">Federal Compliance<br/>Management System</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto">
          {filteredMenuItems.map(item => {
            const Icon = item.icon;
            const isExpanded = expandedMenus[item.id];
            return (
              <div key={item.id} className="mb-1">
                <button onClick={() => toggleMenu(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-gray-100"
                  style={{ color: item.intellegesOnly ? '#2496F4' : '#374151' }}>
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 font-medium">{item.label}</span>
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
                {sidebarOpen && isExpanded && (
                  <div className="ml-8 mt-1 space-y-1">
                    {subMenuItems.map(sub => {
                      const SubIcon = sub.icon;
                      const isAddExpanded = expandedSubMenus[`${item.id}-${sub.id}`];
                      
                      // Entities that only have spreadsheet upload (no manual)
                      const spreadsheetOnlyEntities = ['questionnaire', 'ams', 'cms'];
                      
                      // Handle Add with submenu (Manual/Spreadsheet)
                      if (sub.hasSubmenu) {
                        // Filter submenu based on entity type
                        const filteredSubmenu = spreadsheetOnlyEntities.includes(item.id)
                          ? sub.submenu.filter(s => s.id === 'spreadsheet')
                          : sub.submenu;
                        
                        return (
                          <div key={sub.id}>
                            <button
                              onClick={() => {
                                // If only one option (spreadsheet only), trigger directly
                                if (spreadsheetOnlyEntities.includes(item.id)) {
                                  if (item.id === 'questionnaire') {
                                    setQuestionnaireModal({ open: true, step: 1 });
                                  } else {
                                    setSpreadsheetUploadModal({ open: true, entity: item.id });
                                  }
                                } else {
                                  toggleSubMenu(`${item.id}-${sub.id}`);
                                }
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 rounded-md hover:bg-gray-100">
                              <SubIcon className="w-4 h-4" />
                              <span className="flex-1 text-left">{sub.label}</span>
                              {!spreadsheetOnlyEntities.includes(item.id) && (
                                isAddExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
                              )}
                            </button>
                            {isAddExpanded && !spreadsheetOnlyEntities.includes(item.id) && (
                              <div className="ml-6 mt-1 space-y-1">
                                {filteredSubmenu.map(subItem => (
                                  <button key={subItem.id}
                                    onClick={() => {
                                      if (subItem.id === 'manual') {
                                        if (item.id === 'partner') {
                                          setPartnerManualModal({ open: true, mode: 'add', partner: null });
                                        } else if (item.id === 'protocol') {
                                          setProtocolModal({ open: true, protocol: null });
                                        } else if (item.id === 'touchpoint') {
                                          setTouchpointModal({ open: true, touchpoint: null });
                                        } else if (item.id === 'partnertype') {
                                          setPartnertypeModal({ open: true, partnertype: null });
                                        } else if (item.id === 'group') {
                                          setGroupModal({ open: true, group: null });
                                        } else if (item.id === 'enterprise') {
                                          setEnterpriseModal({ open: true, enterprise: null });
                                        } else {
                                          setManualModal({ open: true, entity: item.id });
                                        }
                                      } else if (subItem.id === 'spreadsheet') {
                                        if (item.id === 'partner') {
                                          setPartnerUploadModal({ open: true });
                                        } else {
                                          setSpreadsheetUploadModal({ open: true, entity: item.id });
                                        }
                                      }
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 rounded-md hover:bg-gray-100">
                                    <span className="text-left">{subItem.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      // Regular submenu items
                      return (
                        <button key={sub.id}
                          onClick={() => {
                            if (sub.id === 'view') setDataGridView({ open: true, entity: item.id });
                            else if (sub.id === 'find') setDataGridView({ open: true, entity: item.id }); // Find opens grid with search
                            else if (sub.id === 'archive') console.log('Archive', item.id);
                            else if (sub.id === 'unarchive') console.log('Unarchive', item.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 rounded-md hover:bg-gray-100">
                          <SubIcon className="w-4 h-4" />
                          <span className="flex-1 text-left">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {filteredAdminMenuItems.length > 0 && sidebarOpen && (
            <div className="mt-4 mb-2 px-3">
              <div className="border-t border-gray-200 pt-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Administration</span>
              </div>
            </div>
          )}

          {filteredAdminMenuItems.map(item => {
            const Icon = item.icon;
            const isExpanded = expandedMenus[item.id];
            return (
              <div key={item.id} className="mb-1">
                <button onClick={() => {
                    // All admin items open their grid view directly
                    setDataGridView({ open: true, entity: item.id });
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-gray-100"
                  style={{ color: item.intellegesOnly ? '#2496F4' : '#374151' }}>
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="flex-1 font-medium">{item.label}</span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-4 border-t border-gray-200 text-gray-500 hover:text-gray-700">
          <Menu className="w-5 h-5" />
        </button>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
            <div className="flex items-center gap-4">
              <select value={userRole} onChange={(e) => setUserRole(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white">
                <option value="intelleges">Intelleges Admin</option>
                <option value="enterprise">Enterprise User</option>
                <option value="supplier">Supplier</option>
              </select>
              <div className="text-sm text-gray-600">
                {userRole === 'intelleges' ? 'admin@intelleges.com' : 'user@honeywell.com'}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Compliance Command Center</h2>
              <p className="text-sm text-gray-500">Enterprise-wide situational awareness</p>
            </div>
            <select value={selectedTouchpoint} onChange={(e) => setSelectedTouchpoint(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white">
              <option value="reps-certs-2025">Reps & Certs Annual 2025</option>
              <option value="cmmc-2025">CMMC Annual Review 2025</option>
              <option value="sb-plan-q1-2025">SB Plan Q1 2025</option>
            </select>
          </div>

          <TouchpointDashboard dashboardData={touchpointDashboardData[selectedTouchpoint]} />

          <div className="mt-4 border rounded-md p-3" style={{ backgroundColor: "#EFF6FF", borderColor: "#2496F4" }}>
            <p className="text-sm" style={{ color: "#111117" }}>
              <strong>Demo Mode:</strong> Use the dropdown to switch touchpoints. Use the sidebar menu to access entity grids. Switch roles using the header dropdown.
            </p>
          </div>
        </main>
      </div>

      <DataGridView />
      <CMSUploadModal />
      <AutoMailModal />
      {renderPartnerUploadModal()}
      {renderPartnerManualModal()}
      {renderSpreadsheetUploadModal()}
      {renderProtocolModal()}
      {renderTouchpointModal()}
      {renderPartnertypeModal()}
      {renderGroupModal()}
      {renderQuestionnaireModal()}
      {renderEnterpriseModal()}
      {renderPartnerResponsesModal()}
      {renderPartnerHistoryModal()}
      {renderPartnerDocumentsModal()}
      {renderPartnerContactModal()}
      {renderPartnerConfirmModal()}

      {/* Entity-Specific Manual Add Modals */}
      {manualModal.open && manualModal.entity === 'person' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[500px] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Add Person - Manual</h2>
              <button onClick={() => setManualModal({ open: false, entity: null })} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {[
                { id: 'personal', label: 'Personal Info' },
                { id: 'address', label: 'Address' },
                { id: 'organization', label: 'Organization' },
                { id: 'access', label: 'Roles & Groups' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setPersonFormTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    personFormTab === tab.id 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-auto p-6">
              {/* Personal Information Tab */}
              {personFormTab === 'personal' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Title</label>
                      <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                        <option>Select.</option>
                        <option>Mr.</option>
                        <option>Ms.</option>
                        <option>Mrs.</option>
                        <option>Dr.</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">First Name *</label>
                      <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Last Name *</label>
                      <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Suffix</label>
                      <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Jr., III" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Email *</label>
                    <input type="email" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Phone</label>
                      <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Mobile</label>
                      <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div>
              )}

              {/* Address Tab */}
              {personFormTab === 'address' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Country</label>
                    <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                      <option>United States</option>
                      <option>Canada</option>
                      <option>Mexico</option>
                      <option>United Kingdom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Address 1</label>
                    <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Address 2</label>
                    <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">City</label>
                      <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">State</label>
                      <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                        <option>Select...</option>
                        <option>Alabama</option>
                        <option>California</option>
                        <option>Texas</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Zipcode</label>
                      <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div>
              )}

              {/* Organization Tab */}
              {personFormTab === 'organization' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Manager</label>
                    <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                      <option>Admin</option>
                      <option>John Smith</option>
                      <option>Jane Doe</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Department</label>
                    <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                      <option>Select...</option>
                      <option>Compliance</option>
                      <option>Procurement</option>
                      <option>Quality</option>
                      <option>Engineering</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Job Title</label>
                    <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                  </div>
                </div>
              )}

              {/* Roles & Groups Tab */}
              {personFormTab === 'access' && (
                <div className="space-y-6">
                  {/* Roles */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Roles</h3>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Available</label>
                        <select multiple className="w-full border border-gray-300 rounded px-2 py-1 text-sm h-28">
                          <option>Viewer</option>
                          <option>Editor</option>
                          <option>Approver</option>
                          <option>Auditor</option>
                          <option>Reporter</option>
                        </select>
                      </div>
                      <div className="flex flex-col justify-center gap-1">
                        <button className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100">»</button>
                        <button className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100">→</button>
                        <button className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100">←</button>
                        <button className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100">«</button>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Selected</label>
                        <select multiple className="w-full border border-gray-300 rounded px-2 py-1 text-sm h-28"></select>
                      </div>
                    </div>
                  </div>

                  {/* Groups */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Groups</h3>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Available</label>
                        <select multiple className="w-full border border-gray-300 rounded px-2 py-1 text-sm h-28">
                          <option>Compliance</option>
                          <option>Procurement</option>
                          <option>Quality</option>
                          <option>Engineering</option>
                          <option>Finance</option>
                        </select>
                      </div>
                      <div className="flex flex-col justify-center gap-1">
                        <button className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100">»</button>
                        <button className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100">→</button>
                        <button className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100">←</button>
                        <button className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100">«</button>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Selected</label>
                        <select multiple className="w-full border border-gray-300 rounded px-2 py-1 text-sm h-28"></select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
              <button onClick={() => setManualModal({ open: false, entity: null })}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
              <button className="px-4 py-2 text-white rounded-md" style={{ backgroundColor: '#2496F4' }}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Generic Manual Modal for other entities */}
      {manualModal.open && manualModal.entity !== 'person' && manualModal.entity !== 'partner' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Add {manualModal.entity ? manualModal.entity.charAt(0).toUpperCase() + manualModal.entity.slice(1) : ''} - Manual</h2>
              <button onClick={() => setManualModal({ open: false, entity: null })} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder={`Enter ${manualModal.entity} name`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md" rows={3} placeholder="Enter description" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button onClick={() => setManualModal({ open: false, entity: null })}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                <button className="px-4 py-2 text-white rounded-md" style={{ backgroundColor: '#2496F4' }}>OK</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Supplier Dialog */}
      {contactSupplierDialog.open && contactSupplierDialog.partner && (
        <ContactSupplierDialog
          open={contactSupplierDialog.open}
          onOpenChange={(open) => setContactSupplierDialog({ open, partner: null })}
          supplier={{
            id: contactSupplierDialog.partner.id,
            name: contactSupplierDialog.partner.name || contactSupplierDialog.partner.companyName || 'Unknown',
            email: contactSupplierDialog.partner.email,
            phone: contactSupplierDialog.partner.phone,
            firstName: contactSupplierDialog.partner.firstName,
            lastName: contactSupplierDialog.partner.lastName,
          }}
          touchpoint={{
            id: 1, // TODO: Get from context
            title: selectedTouchpoint === 'reps-certs-2025' ? 'Reps & Certs Annual 2025' : 'Compliance Request',
          }}
          missingDocuments={[
            'Certificate of Insurance',
            'W-9 Form',
            'Socioeconomic Classification',
          ]}
          poNumber={contactSupplierDialog.partner.poNumber}
          deadline={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
        />
      )}

      {/* Approval Workflow Dialog (INT.DOC.40 Section 4.1) */}
      {approvalDialog.open && approvalDialog.partner && (
        <ApprovalDialog
          open={approvalDialog.open}
          action={approvalDialog.action}
          partner={approvalDialog.partner}
          onClose={() => setApprovalDialog({ open: false, action: null, partner: null })}
          onConfirm={(notes) => {
            // TODO: Connect to tRPC approval procedures
            console.log(`[Approval] ${approvalDialog.action} for partner:`, approvalDialog.partner.name, notes ? `Notes: ${notes}` : '');
            alert(`Approval action "${approvalDialog.action}" completed for ${approvalDialog.partner.name || 'partner'}. This will be connected to the backend approval workflow.`);
            setApprovalDialog({ open: false, action: null, partner: null });
          }}
        />
      )}
    </div>
  );
}

// Approval Dialog Component
function ApprovalDialog({ open, action, partner, onClose, onConfirm }) {
  const [notes, setNotes] = React.useState('');
  
  const getTitle = () => {
    switch (action) {
      case 'flag-for-review': return 'Flag Submission for Review';
      case 'approve': return 'Approve Submission';
      case 'reject': return 'Reject Submission';
      default: return 'Approval Action';
    }
  };
  
  const getDescription = () => {
    const partnerName = partner?.name || partner?.companyName || 'this partner';
    switch (action) {
      case 'flag-for-review':
        return `Mark ${partnerName}'s submission as requiring compliance review. Reviewers will be notified via email.`;
      case 'approve':
        return `Approve ${partnerName}'s questionnaire submission. This will update the compliance status and notify the supplier.`;
      case 'reject':
        return `Reject ${partnerName}'s questionnaire submission. You must provide a reason for rejection.`;
      default:
        return 'Perform approval action on this submission.';
    }
  };
  
  const requiresNotes = action === 'reject';
  const canSubmit = !requiresNotes || notes.trim().length > 0;
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">{getTitle()}</h2>
          <p className="text-sm text-gray-600 mt-2">{getDescription()}</p>
        </div>
        
        <div className="p-6">
          {action !== 'flag-for-review' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {requiresNotes ? 'Rejection Reason (Required)' : 'Notes (Optional)'}
              </label>
              <textarea
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder={requiresNotes ? 'Explain why this submission is being rejected...' : 'Add any comments or notes...'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              {requiresNotes && notes.trim().length === 0 && (
                <p className="text-xs text-red-600 mt-1">Rejection notes are required</p>
              )}
            </div>
          )}
          
          {action === 'flag-for-review' && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <p className="text-sm text-blue-800">
                <strong>What happens next:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>Submission status will be set to "Pending Review"</li>
                <li>Email alerts will be sent to authorized reviewers</li>
                <li>Reviewers can approve or reject from their dashboard</li>
              </ul>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => canSubmit && onConfirm(notes)}
            disabled={!canSubmit}
            className={`px-4 py-2 text-sm rounded ${
              action === 'approve'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : action === 'reject'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } ${!canSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
