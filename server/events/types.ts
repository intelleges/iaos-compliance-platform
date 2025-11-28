/**
 * Event Type Definitions for Intelleges FCMS
 * Based on INT.DOC.11 - Event & Webhook Architecture
 */

// ============================================================================
// ASSIGNMENT EVENTS
// ============================================================================

export interface AssignmentCreatedEvent {
  assignmentId: number;
  touchpointId: number;
  partnerId: number;
  contactId: number;
  accessCode: string;
  dueDate: Date | null;
  createdBy: number; // PersonID
  enterpriseId: number;
  timestamp: Date;
}

export interface AssignmentInvitedEvent {
  assignmentId: number;
  touchpointId: number;
  partnerId: number;
  contactId: number;
  email: string;
  accessCode: string;
  dueDate: Date | null;
  invitedBy: number;
  enterpriseId: number;
  timestamp: Date;
}

export interface AssignmentAccessedEvent {
  assignmentId: number;
  touchpointId: number;
  partnerId: number;
  accessCode: string;
  firstAccess: boolean;
  enterpriseId: number;
  ipAddress?: string;
  timestamp: Date;
}

export interface AssignmentStartedEvent {
  assignmentId: number;
  touchpointId: number;
  partnerId: number;
  enterpriseId: number;
  timestamp: Date;
}

export interface AssignmentSubmittedEvent {
  assignmentId: number;
  touchpointId: number;
  partnerId: number;
  partnerName: string;
  touchpointTitle: string;
  contactId: number;
  email?: string;
  questionnaireId: number;
  eSignature: string;
  score: number;
  zcode: string;
  zCodeValues: Record<number, number>; // QID -> Z-Code
  progress: number; // Should be 100
  completedDate: string;
  enterpriseId: number;
  submittedAt: Date;
}

export interface AssignmentDelegatedEvent {
  assignmentId: number;
  originalAssignmentId: number;
  newAssignmentId: number;
  partnerId: number;
  originalContact: string;
  newContact: string;
  newEmail: string;
  newAccessCode: string;
  touchpointTitle: string;
  dueDate: Date | null;
  reason?: string;
  enterpriseId: number;
  delegatedAt: Date;
}

export interface AssignmentPastDueEvent {
  assignmentId: number;
  touchpointId: number;
  partnerId: number;
  partnerName: string;
  touchpointTitle: string;
  contactId: number;
  dueDate: Date;
  daysOverdue: number;
  enterpriseId: number;
  timestamp: Date;
}

// ============================================================================
// TOUCHPOINT EVENTS
// ============================================================================

export interface TouchpointCreatedEvent {
  touchpointId: number;
  protocolId: number;
  title: string;
  createdBy: number;
  enterpriseId: number;
  timestamp: Date;
}

export interface TouchpointActivatedEvent {
  touchpointId: number;
  protocolId: number;
  startDate: Date;
  activatedBy: number;
  assignmentCount: number;
  enterpriseId: number;
  timestamp: Date;
}

export interface TouchpointClosedEvent {
  touchpointId: number;
  protocolId: number;
  endDate: Date;
  closedBy: number;
  completionRate: number;
  enterpriseId: number;
  timestamp: Date;
}

export interface TouchpointArchivedEvent {
  touchpointId: number;
  protocolId: number;
  archivedBy: number;
  timestamp: Date;
}

// ============================================================================
// RESPONSE EVENTS
// ============================================================================

export interface ResponseSavedEvent {
  assignmentId: number;
  questionId: number;
  responseId: number | null;
  value: number | null;
  comment: string | null;
  timestamp: Date;
}

export interface ResponseUploadCompleteEvent {
  assignmentId: number;
  questionId: number;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  timestamp: Date;
}

// ============================================================================
// EMAIL EVENTS
// ============================================================================

export interface EmailSentEvent {
  messageId: string;
  to: string;
  from: string;
  subject: string;
  templateCode: number;
  assignmentId?: number;
  enterpriseId: number;
  timestamp: Date;
}

export interface EmailDeliveredEvent {
  messageId: string;
  email: string;
  timestamp: number;
  sg_message_id: string;
  sg_event_id: string;
  assignmentId?: string;
  templateCode?: string;
  enterpriseId?: string;
}

export interface EmailBouncedEvent {
  messageId: string;
  email: string;
  timestamp: number;
  sg_message_id: string;
  sg_event_id: string;
  reason?: string;
  bounce_classification?: string;
  assignmentId?: string;
  templateCode?: string;
  enterpriseId?: string;
}

export interface EmailOpenedEvent {
  messageId: string;
  email: string;
  timestamp: number;
  sg_message_id: string;
  sg_event_id: string;
  assignmentId?: string;
  url?: string;
}

export interface EmailClickedEvent {
  messageId: string;
  email: string;
  timestamp: number;
  sg_message_id: string;
  sg_event_id: string;
  url?: string;
  assignmentId?: string;
}

// ============================================================================
// SPINOFF EVENTS
// ============================================================================

export interface SpinoffCreatedEvent {
  spinoffId: number;
  assignmentId: number;
  triggeredBy: string; // Question ID or rule
  createdAt: Date;
}

// ============================================================================
// ALERT EVENTS
// ============================================================================

export interface AlertTriggeredEvent {
  alertId: number;
  alertType: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  entityType: 'assignment' | 'touchpoint' | 'partner';
  entityId: number;
  timestamp: Date;
}

// ============================================================================
// EVENT MAP
// ============================================================================

export interface FCMSEvents {
  // Assignment Events
  'assignment.created': AssignmentCreatedEvent;
  'assignment.invited': AssignmentInvitedEvent;
  'assignment.accessed': AssignmentAccessedEvent;
  'assignment.started': AssignmentStartedEvent;
  'assignment.submitted': AssignmentSubmittedEvent;
  'assignment.delegated': AssignmentDelegatedEvent;
  'assignment.pastDue': AssignmentPastDueEvent;

  // Touchpoint Events
  'touchpoint.created': TouchpointCreatedEvent;
  'touchpoint.activated': TouchpointActivatedEvent;
  'touchpoint.closed': TouchpointClosedEvent;
  'touchpoint.archived': TouchpointArchivedEvent;

  // Response Events
  'response.saved': ResponseSavedEvent;
  'response.uploadComplete': ResponseUploadCompleteEvent;

  // Email Events
  'email.sent': EmailSentEvent;
  'email.delivered': EmailDeliveredEvent;
  'email.bounced': EmailBouncedEvent;
  'email.opened': EmailOpenedEvent;
  'email.clicked': EmailClickedEvent;

  // Spinoff Events
  'spinoff.created': SpinoffCreatedEvent;

  // Alert Events
  'alert.triggered': AlertTriggeredEvent;
}

export type FCMSEventType = keyof FCMSEvents;
