export type VerificationStatus =
  | 'DRAFT'
  | 'NEEDS_KELDIA_VERIFICATION'
  | 'DISCREPANCY_FOUND'
  | 'VERIFIED_BY_KELDIA'
  | 'WAITING_MELIZA_APPROVAL'
  | 'MELIZA_APPROVED'
  | 'COMPLETED_MANUALLY';

export interface DiscrepancyDetail {
  id: string;
  field:
    | 'SKU'
    | 'Finish'
    | 'Quantity'
    | 'Unit Price'
    | 'Freight/Fees'
    | 'Total Cost'
    | 'ETA / Install Risk'
    | 'Missing Document'
    | 'Hours / Payroll Anomaly';
  expectedValue: string;
  actualValue: string;
  sourceDocA: string;
  sourceDocB: string;
  severity: 'HIGH' | 'MEDIUM';
  keldiaDecisionNote?: string;
  resolvedByKeldia?: boolean;
}

export interface QuoteOption {
  id: string;
  vendorName: string;
  quoteNumber: string;
  unitPrice: number;
  quantity: number;
  freightCost: number;
  totalCost: number;
  leadTimeWeeks: number;
  paymentTerms: string;
  matchesLockedSpec: boolean;
  specDeviationNote?: string;
}

export interface ProcurementOrder {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  targetInstallDate: string;
  itemName: string;
  roomCategory: string;
  vendorId: string;
  vendorName: string;
  lockedSpec: {
    sku: string;
    finish: string;
    dimensions: string;
    quantity: number;
    budgetedTotal: number;
  };
  approvedQuote?: {
    quoteNumber: string;
    sku: string;
    finish: string;
    quantity: number;
    unitPrice: number;
    freight: number;
    total: number;
    leadTime: string;
    terms: string;
  };
  draftPo?: {
    poNumber: string;
    orderDate: string;
    total: number;
  };
  vendorAck?: {
    ackNumber: string;
    receivedDate?: string;
    sku: string;
    finish: string;
    quantity: number;
    unitPrice: number;
    freight: number;
    total: number;
    shipDate: string;
    etaDate: string;
    deliveryWindow: string;
  };
  vendorInvoice?: {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    sku: string;
    finish: string;
    quantity: number;
    unitPrice: number;
    freightAndFees: number;
    total: number;
  };
  orderStatus:
    | 'Quote Comparison'
    | 'Draft PO Ready'
    | 'Order Placed - Awaiting Ack'
    | 'Acknowledged - In Production'
    | 'Backordered'
    | 'In Transit'
    | 'Delivered - Exception (Damaged/Short)'
    | 'Delivered - Complete';
  threatensInstallDate: boolean;
  missingAckOverdue: boolean;
  deliveryException?: 'NONE' | 'LATE' | 'SHORT' | 'DAMAGED' | 'WRONG_ITEM' | 'BACKORDER';
  deliveryExceptionNotes?: string;
  maferCoordination: {
    required: boolean;
    type: 'Receiving' | 'Warehouse Pickup' | 'Return / Replacement Pickup' | 'None';
    scheduledDate?: string;
    reminderNote: string;
    completedByKeldia: boolean;
  };
  houzzCurrentRecord: {
    itemStatus: string;
    recordedVendor: string;
    recordedCost: number;
    recordedOrderDate: string;
    recordedEta: string;
  };
  houzzProposedUpdate: {
    itemStatus: string;
    proposedVendor: string;
    proposedCost: number;
    proposedOrderDate: string;
    proposedEta: string;
    overBudgetAmount: number;
    isOverBudgetRisk: boolean;
  };
  discrepancies: DiscrepancyDetail[];
  verificationStatus: VerificationStatus;
  keldiaVerifiedAt?: string;
  keldiaAuditNote?: string;
}

export interface VendorProfile {
  id: string;
  name: string;
  contactEmail: string;
  zelleRecipientOnFile: string;
  paymentMethod: 'Zelle' | 'ACH / Check';
  hasW9: boolean;
  hasCOI: boolean;
  coiExpires: string;
  requiresLienRelease: boolean;
  hasLienReleaseOnFile: boolean;
  totalOrdersCount: number;
  onTimeDeliveryCount: number;
  lateOrdersCount: number;
  damagedOrWrongCount: number;
  billingDiscrepancyCount: number;
}

export interface PaymentPacket {
  id: string;
  procurementOrderId: string;
  vendorId: string;
  vendorName: string;
  projectName: string;
  clientName: string;
  invoiceNumber: string;
  invoiceAmount: number;
  poOrQuoteAmount: number;
  dueDate: string;
  zelleRecipientOnFile: string;
  zelleRecipientOnInvoice: string;
  recipientMismatch: boolean;
  amountMismatch: boolean;
  missingDocuments: ('W-9' | 'COI' | 'Lien Release')[];
  discrepancySummary: string[];
  verificationStatus: VerificationStatus;
  keldiaChecklist: {
    invoiceVerifiedAgainstSource: boolean;
    projectAndBudgetVerified: boolean;
    recipientAndAmountVerified: boolean;
    melizaWrittenApprovalObtained: boolean;
    zelleSentManuallyByKeldia: boolean;
    confirmationSaved: boolean;
  };
  melizaApprovalRef?: string;
  zelleConfirmationRef?: string;
}

export interface PayrollDayEntry {
  date: string;
  dayName: string;
  clockIn: string;
  clockOut: string;
  breakMinutes: number;
  totalHours: number;
  projectNotes: string;
  anomalyFlag?: string;
}

export interface PayrollPrepPeriod {
  id: string;
  employeeName: string;
  employeeRole: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payrollDeadline: string;
  sourceDocumentName: string;
  entries: PayrollDayEntry[];
  totalRegularHours: number;
  totalOvertimeHours: number;
  flaggedGapsAndAnomalies: string[];
  verificationStatus: VerificationStatus;
  keldiaChecklist: {
    hoursVerifiedAgainstSource: boolean;
    anomaliesResolvedByKeldia: boolean;
    enteredInQuickBooksOnline: boolean;
    personallyReviewedQbPreview: boolean;
    melizaWrittenApprovalObtained: boolean;
    submittedInQuickBooksAndSaved: boolean;
  };
  melizaApprovalRef?: string;
  qbConfirmationRef?: string;
}

export interface DraftCommunication {
  id: string;
  category:
    | 'Missing Acknowledgment'
    | 'Updated ETA Request'
    | 'Damaged / Short / Replacement Claim'
    | 'Backorder Inquiry'
    | 'Mafer Receiving / Pickup Reminder'
    | 'Houzz Client Order-Status Update'
    | 'Meliza Payment Approval Request'
    | 'Vendor Payment Confirmation (Post-Zelle)'
    | 'Meliza Payroll Approval Request';
  relatedEntityName: string;
  projectName: string;
  recipientRole: string;
  subjectLine: string;
  bodyText: string;
  verificationStatus: VerificationStatus;
}

export type FeedbackCategory = 'BUG' | 'FEATURE_REQUEST' | 'REDESIGN_UX' | 'GENERAL_NOTE';

export type FeedbackPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface RedesignFeedbackItem {
  id: string;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  targetArea: string;
  reporterName: string;
  title: string;
  description: string;
  redesignSuggestion?: string;
  createdAt: string;
  verificationStatus: VerificationStatus;
  reviewerVerifiedNote?: string;
  gitbridgeBugId?: string;
  gitbridgeStatus?:
    | 'SYNCED'
    | 'AUTO_FIXED'
    | 'WAITING_GITHUB_LISTENER'
    | 'PENDING_LOCAL'
    | 'ERROR';
  gitbridgeAutoFixSummary?: string;
  gitbridgePatchedFile?: string;
  gitbridgeRebuiltStandalone?: boolean;
  githubIssueNumber?: number;
  githubIssueUrl?: string;
  githubCommitSha?: string;
}

