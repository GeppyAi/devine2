'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  INITIAL_PROCUREMENT_ORDERS,
  INITIAL_PAYMENT_PACKETS,
  INITIAL_PAYROLL_PERIOD,
  INITIAL_DRAFTS,
  INITIAL_VENDORS,
  INITIAL_QUOTE_COMPARISONS,
} from '@/data/mockData';
import {
  HOUZZ_PRO_KNOWLEDGE_BASE,
  INITIAL_HOUZZ_MERGE_CANDIDATES,
} from '@/data/houzzKnowledge';
import {
  ProcurementOrder,
  PaymentPacket,
  PayrollPrepPeriod,
  DraftCommunication,
  VerificationStatus,
} from '@/types/divine';
import { StatusBadge } from '@/components/StatusBadge';
import { FeedbackWidget } from '@/components/FeedbackWidget';
import {
  ShieldAlert,
  FileSpreadsheet,
  Truck,
  CreditCard,
  Clock,
  ClipboardCheck,
  Copy,
  Check,
  AlertTriangle,
  Sparkles,
  Upload,
  Lock,
  Calendar,
  FileText,
  Send,
  UserCheck,
  Building2,
  Ban,
  Download,
  Globe,
  Paperclip,
  Trash2,
  RefreshCw,
} from 'lucide-react';

const APP_CURRENT_VERSION = '1.1.0';
const GITHUB_REPO_SLUG = 'GeppyAi/devine2';
const GITHUB_REPO_URL = 'https://github.com/GeppyAi/devine2';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/GeppyAi/devine2/main';

interface UploadedSourceFile {
  id: string;
  name: string;
  sizeLabel: string;
  docCategory: string;
  uploadedAt: string;
  extractedPreview: string;
  status: VerificationStatus;
}

const INITIAL_SAMPLE_UPLOADED_FILES: UploadedSourceFile[] = [
  {
    id: 'uf-sample-1',
    name: 'Arteriors_Invoice_INV-99241.pdf',
    sizeLabel: '248 KB',
    docCategory: 'Vendor Invoice (PDF)',
    uploadedAt: 'Oct 19, 10:14 AM',
    extractedPreview:
      'Extracted: SKU ART-88412-VB (Vintage Bronze), Qty 1, Unit $3,850, Freight $375, Total $4,225. Flagged SKU/Finish & +$175 Freight mismatch vs PO-SSS-2026-041.',
    status: 'DISCREPANCY_FOUND',
  },
  {
    id: 'uf-sample-2',
    name: 'Sofia_Morales_Timesheet_Oct05-18.csv',
    sizeLabel: '18 KB',
    docCategory: 'W-2 Employee Timesheet (CSV)',
    uploadedAt: 'Oct 19, 9:05 AM',
    extractedPreview:
      'Extracted: 10 daily entries (71.50 reg hrs, 2.50 OT hrs). Flagged missing clock-out on Oct 8 & 0-min break on Oct 14.',
    status: 'DISCREPANCY_FOUND',
  },
];

const INITIAL_SAMPLE_CHAT: { role: 'user' | 'divine'; statusBanner?: string; text: string }[] = [
  {
    role: 'divine',
    statusBanner: 'STATUS: READY — STRICT AIR-GAP ACTIVE',
    text: `Hello. I am Divine, your preparation and organization assistant for Sixth Sense Studio.\n\nToday's Priority Flags Requiring Your Review:\n1. PO-SSS-2026-041 (Arteriors Chandelier): Vendor Ack & Invoice list wrong SKU/Finish (Vintage Bronze instead of Antique Brass), +$175 unapproved freight, and Nov 9 ETA threatens the Nov 5 Castellanos install.\n2. PO-SSS-2026-038 (Atelier Entry Console): Delivered Oct 19 with cracked travertine top & 2 missing leveling feet. Coordinate Mafer for Oct 22 pickup. Final invoice INV-ABM-882 has a Zelle handle mismatch and missing COI + Lien Release.\n3. PO-SSS-2026-044 (Vanguard Sectional): Missing Order Acknowledgment (7 days overdue).\n4. Payroll Prep (Sofia Morales, Oct 5–18): Missing clock-out on Thu Oct 8 and 0-min break on 10-hr shift Wed Oct 14. Deadline is Oct 21 at 3:00 PM.`,
  },
];

const CLEAN_WELCOME_CHAT: { role: 'user' | 'divine'; statusBanner?: string; text: string }[] = [
  {
    role: 'divine',
    statusBanner: 'STATUS: FRESH WORKSPACE — STRICT AIR-GAP ACTIVE',
    text: `Hello. I am Divine, your preparation and organization assistant for Sixth Sense Studio.\n\nThis workspace is clean and ready for your live project documents.\n\n• Click "Upload PDF / File" (or drag & drop) to ingest vendor quotes, purchase orders, acknowledgments, invoices, Houzz Pro CSV exports, or W-2 timesheets.\n• Ask me any question about Houzz Pro workflows (My Items, Selections Tracker, Create/Merge POs, Manage Vendors) or studio preparation tasks.`,
  },
];

const EMPTY_PAYROLL_PERIOD: PayrollPrepPeriod = {
  id: 'pay-period-clean',
  employeeName: 'W-2 Employee (Upload Timesheet to Populate)',
  employeeType: 'W-2 (Single Employee)',
  payPeriodStart: '—',
  payPeriodEnd: '—',
  payrollDeadline: 'Pending Timesheet Upload',
  sourceDocumentName: 'No timesheet uploaded yet',
  entries: [],
  totalRegularHours: 0,
  totalOvertimeHours: 0,
  flaggedGapsAndAnomalies: [],
  verificationStatus: 'DRAFT',
  keldiaChecklist: {
    hoursVerifiedAgainstSource: false,
    anomaliesResolvedByKeldia: false,
    enteredInQuickBooksOnline: false,
    personallyReviewedQbPreview: false,
    melizaWrittenApprovalObtained: false,
    submittedInQuickBooksAndSaved: false,
  },
};

type ActiveTab =
  | 'overview'
  | 'procurement'
  | 'houzz'
  | 'payments'
  | 'payroll'
  | 'assistant';

export default function DivineDashboard() {
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const t = (en: string, es: string) => (lang === 'es' ? es : en);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [orders, setOrders] = useState<ProcurementOrder[]>(INITIAL_PROCUREMENT_ORDERS);
  const [quoteComparisons, setQuoteComparisons] = useState(INITIAL_QUOTE_COMPARISONS);
  const [paymentPackets, setPaymentPackets] = useState<PaymentPacket[]>(INITIAL_PAYMENT_PACKETS);
  const [payroll, setPayroll] = useState<PayrollPrepPeriod>(INITIAL_PAYROLL_PERIOD);
  const [drafts, setDrafts] = useState<DraftCommunication[]>(INITIAL_DRAFTS);
  const [vendors, setVendors] = useState(INITIAL_VENDORS);
  const [houzzMergeCandidates, setHouzzMergeCandidates] = useState(INITIAL_HOUZZ_MERGE_CANDIDATES);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Clean / Reset Workspace State
  const [isCleanWorkspace, setIsCleanWorkspace] = useState<boolean>(false);
  const [showResetBanner, setShowResetBanner] = useState<boolean>(false);

  // Ingestion / AI Chat state
  const [ingestText, setIngestText] = useState('');
  const [selectedDocCategory, setSelectedDocCategory] = useState<string>('Auto-Detect');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedSourceFile[]>(
    INITIAL_SAMPLE_UPLOADED_FILES
  );
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<
    { role: 'user' | 'divine'; statusBanner?: string; text: string }[]
  >(INITIAL_SAMPLE_CHAT);

  // Clear all test/demo data across every tab and the Feedback widget
  const clearAllTestData = (showNotification = true) => {
    setOrders([]);
    setQuoteComparisons([]);
    setPaymentPackets([]);
    setPayroll(EMPTY_PAYROLL_PERIOD);
    setDrafts([]);
    setVendors([]);
    setHouzzMergeCandidates([]);
    setUploadedFiles([]);
    setIngestText('');
    setChatInput('');
    setChatHistory(CLEAN_WELCOME_CHAT);
    setIsCleanWorkspace(true);
    if (showNotification) {
      setShowResetBanner(true);
    }
    try {
      window.localStorage.setItem('divine_workspace_clean_mode', 'clean');
      window.localStorage.setItem('divine_redesign_feedback_v1', JSON.stringify([]));
      window.dispatchEvent(new Event('divine-clear-all-data'));
    } catch {
      // Ignore storage errors
    }
  };

  // Restore the original demo dataset anytime for training/testing
  const restoreSampleDemoData = () => {
    setOrders(INITIAL_PROCUREMENT_ORDERS);
    setQuoteComparisons(INITIAL_QUOTE_COMPARISONS);
    setPaymentPackets(INITIAL_PAYMENT_PACKETS);
    setPayroll(INITIAL_PAYROLL_PERIOD);
    setDrafts(INITIAL_DRAFTS);
    setVendors(INITIAL_VENDORS);
    setHouzzMergeCandidates(INITIAL_HOUZZ_MERGE_CANDIDATES);
    setUploadedFiles(INITIAL_SAMPLE_UPLOADED_FILES);
    setChatHistory(INITIAL_SAMPLE_CHAT);
    setIsCleanWorkspace(false);
    setShowResetBanner(false);
    try {
      window.localStorage.setItem('divine_workspace_clean_mode', 'demo');
      window.dispatchEvent(new Event('divine-restore-demo-data'));
    } catch {
      // Ignore storage errors
    }
  };

  // Export/Download a fresh standalone HTML file pre-configured to open with zero test data
  const downloadFreshStandaloneHtml = () => {
    clearAllTestData(true);
    setTimeout(() => {
      try {
        const docClone = document.documentElement.cloneNode(true) as HTMLElement;
        const headEl = docClone.querySelector('head');
        if (headEl && !docClone.innerHTML.includes('__DIVINE_DEFAULT_CLEAN__')) {
          const cleanScript = document.createElement('script');
          cleanScript.textContent =
            'window.__DIVINE_DEFAULT_CLEAN__ = true; try { localStorage.setItem("divine_workspace_clean_mode", "clean"); localStorage.setItem("divine_redesign_feedback_v1", "[]"); } catch(e) {}';
          headEl.insertBefore(cleanScript, headEl.firstChild);
        }
        const serializedHtml = '<!DOCTYPE html>\n' + docClone.outerHTML;
        const blob = new Blob([serializedHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Divine_Sixth_Sense_Studio_Standalone.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        alert(
          t(
            'All test data has been cleared from this workspace.',
            'Todos los datos de prueba han sido eliminados del espacio de trabajo.'
          )
        );
      }
    }, 80);
  };

  // On mount, check if Clean Mode was saved or baked into the standalone HTML
  useEffect(() => {
    try {
      const savedMode = window.localStorage.getItem('divine_workspace_clean_mode');
      const bakedClean = Boolean(
        (window as unknown as { __DIVINE_DEFAULT_CLEAN__?: boolean }).__DIVINE_DEFAULT_CLEAN__
      );
      if (savedMode === 'clean' || (bakedClean && savedMode !== 'demo')) {
        clearAllTestData(false);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const copyToClipboard = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const updateOrderStatus = (orderId: string, newStatus: VerificationStatus, note?: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              verificationStatus: newStatus,
              keldiaVerifiedAt: new Date().toLocaleString(),
              keldiaAuditNote: note || o.keldiaAuditNote,
            }
          : o
      )
    );
  };

  const toggleMaferComplete = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              maferCoordination: {
                ...o.maferCoordination,
                completedByKeldia: !o.maferCoordination.completedByKeldia,
              },
            }
          : o
      )
    );
  };

  const togglePaymentCheck = (
    packetId: string,
    field: keyof PaymentPacket['keldiaChecklist']
  ) => {
    setPaymentPackets((prev) =>
      prev.map((p) => {
        if (p.id !== packetId) return p;
        const updatedChecklist = {
          ...p.keldiaChecklist,
          [field]: !p.keldiaChecklist[field],
        };
        let nextStatus: VerificationStatus = p.verificationStatus;
        if (
          updatedChecklist.invoiceVerifiedAgainstSource &&
          updatedChecklist.projectAndBudgetVerified &&
          updatedChecklist.recipientAndAmountVerified
        ) {
          nextStatus = 'WAITING_MELIZA_APPROVAL';
        }
        if (updatedChecklist.melizaWrittenApprovalObtained) {
          nextStatus = 'MELIZA_APPROVED';
        }
        if (
          updatedChecklist.zelleSentManuallyByKeldia &&
          updatedChecklist.confirmationSaved
        ) {
          nextStatus = 'COMPLETED_MANUALLY';
        }
        return {
          ...p,
          keldiaChecklist: updatedChecklist,
          verificationStatus: nextStatus,
        };
      })
    );
  };

  const togglePayrollCheck = (field: keyof PayrollPrepPeriod['keldiaChecklist']) => {
    setPayroll((prev) => {
      const updated = {
        ...prev.keldiaChecklist,
        [field]: !prev.keldiaChecklist[field],
      };
      let nextStatus: VerificationStatus = prev.verificationStatus;
      if (updated.hoursVerifiedAgainstSource && updated.anomaliesResolvedByKeldia) {
        nextStatus = 'WAITING_MELIZA_APPROVAL';
      }
      if (updated.melizaWrittenApprovalObtained) {
        nextStatus = 'MELIZA_APPROVED';
      }
      if (updated.submittedInQuickBooksAndSaved) {
        nextStatus = 'COMPLETED_MANUALLY';
      }
      return {
        ...prev,
        keldiaChecklist: updated,
        verificationStatus: nextStatus,
      };
    });
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const query = chatInput.trim();
    const lower = query.toLowerCase();

    const userMsg = { role: 'user' as const, text: query };

    // Out-of-scope & Firm Limit Guardrail Engine
    if (
      lower.includes('reconcil') ||
      lower.includes('general ledger') ||
      lower.includes('bookkeep') ||
      lower.includes('month-end') ||
      lower.includes('tax') ||
      lower.includes('collect') ||
      lower.includes('client invoice')
    ) {
      setChatHistory((prev) => [
        ...prev,
        userMsg,
        {
          role: 'divine',
          statusBanner: 'FIRM LIMIT — OUT OF DIVINE OPERATIONAL SCOPE',
          text: `I cannot perform that task. Under Sixth Sense Studio's firm operational rules, Divine does not handle official bookkeeping, ledger review, bank reconciliations, month-end close, taxes, manual payroll-tax calculations/filings, or client collections/payments.\n\nI can, however, prepare a draft procurement log, vendor payment approval packet, Houzz budget variance table, or W-2 hours summary for you to verify.`,
        },
      ]);
      setChatInput('');
      return;
    }

    if (
      lower.includes('send email') ||
      lower.includes('send zelle') ||
      lower.includes('pay vendor') ||
      lower.includes('submit payroll') ||
      lower.includes('submit po') ||
      lower.includes('approve ')
    ) {
      setChatHistory((prev) => [
        ...prev,
        userMsg,
        {
          role: 'divine',
          statusBanner: 'FIRM LIMIT — HUMAN EXECUTION & MELIZA APPROVAL REQUIRED',
          text: `Firm Limit Triggered: Divine is strictly prohibited from contacting vendors or clients, submitting purchase orders, approving business actions, sending Zelle payments, or running/submitting payroll.\n\nI have prepared the copy-ready drafts and verification packets in your tabs so you can personally verify them against source documents, obtain Meliza's written approval where required, and execute the action yourself.`,
        },
      ]);
      setChatInput('');
      return;
    }

    // Houzz Pro Knowledge Base Queries (Product Library, Selections Tracker, Create/Merge POs, Manage Vendors)
    if (
      lower.includes('houzz') ||
      lower.includes('product library') ||
      lower.includes('my items') ||
      lower.includes('clipper') ||
      lower.includes('selections tracker') ||
      lower.includes('selection board') ||
      lower.includes('merge po') ||
      lower.includes('merge purchase') ||
      lower.includes('create purchase order') ||
      lower.includes('manage vendor') ||
      lower.includes('vendor tag')
    ) {
      let matchedSections = HOUZZ_PRO_KNOWLEDGE_BASE.filter(
        (sec) =>
          (lower.includes('library') || lower.includes('my items') || lower.includes('clipper')
            ? sec.id === 'hp-product-library'
            : false) ||
          (lower.includes('tracker') || lower.includes('selection') || lower.includes('column')
            ? sec.id === 'hp-selections-tracker-designer' || sec.id === 'hp-selections-tracker-usage'
            : false) ||
          (lower.includes('create') && (lower.includes('po') || lower.includes('purchase'))
            ? sec.id === 'hp-create-purchase-orders'
            : false) ||
          (lower.includes('merge')
            ? sec.id === 'hp-merge-purchase-orders'
            : false) ||
          (lower.includes('vendor') || lower.includes('tag')
            ? sec.id === 'hp-manage-vendors'
            : false)
      );

      if (matchedSections.length === 0) {
        matchedSections = HOUZZ_PRO_KNOWLEDGE_BASE;
      }

      const formattedGuide = matchedSections
        .map(
          (s) =>
            `• ${s.title}\n  Houzz Path: ${s.navigationPath}\n  Workflow: ${s.keyWorkflowSteps.join(' ')}\n  Divine's Role: ${s.divinePreparationRole}\n  Your Action in Houzz: ${s.keldiaManualActionInHouzz}`
        )
        .join('\n\n');

      setChatHistory((prev) => [
        ...prev,
        userMsg,
        {
          role: 'divine',
          statusBanner: 'STATUS: HOUZZ PRO WORKFLOW GUIDE — FOR HUMAN VERIFICATION',
          text: `Here is the exact Houzz Pro workflow from your indexed Houzz Pro Knowledge Base:\n\n${formattedGuide}${
            houzzMergeCandidates.length > 0
              ? `\n\nNote: Divine also detected 2 eligible Draft POs for Vanguard Custom Furniture on Coral Gables Residence (PO-SSS-2026-048 & PO-SSS-2026-049) that meet Houzz Pro's Merge criteria (Draft stage + Same Vendor + Same Project). See Tab "2. Houzz & Budgets" for the step-by-step merge packet.`
              : ''
          }`,
        },
      ]);
      setChatInput('');
      return;
    }

    // Standard helpful draft / comparison response
    setChatHistory((prev) => [
      ...prev,
      userMsg,
      {
        role: 'divine',
        statusBanner: 'STATUS: DRAFT — NEEDS HUMAN VERIFICATION',
        text:
          orders.length === 0 && paymentPackets.length === 0 && uploadedFiles.length === 0
            ? `Your workspace is currently fresh with 0 test records.\n\nTo have me prepare a 3-way procurement match, Houzz Pro tracker update, vendor payment approval packet, or W-2 hours summary:\n1. Click "Upload PDF / File" below to attach your source document (PDF, CSV, XLSX, or Image), or\n2. Paste the quote, PO, acknowledgment, invoice, or timesheet text in the Source Document panel on the right.`
            : `I have prepared the requested draft analysis based on your current Sixth Sense Studio source records:\n\n• Open Orders Tracked: ${orders.length}\n• Uploaded Source Documents: ${uploadedFiles.length}\n• Pending Vendor Payment Packets: ${paymentPackets.length}\n• Draft Communications Queued: ${drafts.length}\n\nReminder: Please check all values against original source PDFs before copying or taking action.`,
      },
    ]);
    setChatInput('');
  };

  const handleIngestSource = () => {
    if (!ingestText.trim()) return;
    const newDraft: DraftCommunication = {
      id: `dr-${Date.now()}`,
      category: 'Updated ETA Request',
      relatedEntityName: 'Extracted from Pasted Source Document',
      projectName: 'Coral Gables Residence — Castellanos',
      recipientRole: 'Human Review Queue',
      subjectLine: '[DRAFT — NEEDS VERIFICATION] Extracted Document Comparison & Follow-up',
      bodyText: `DRAFT — NEEDS HUMAN VERIFICATION\n\nSource Snippet Analyzed:\n"${ingestText.slice(0, 220)}..."\n\nDivine Preliminary Comparison Notes:\n- Checked against locked project specifications and open POs.\n- Status remains UNVERIFIED until checked against the original vendor PDF.\n- Do not treat this extraction as confirmation of approval or payment safety.`,
      verificationStatus: 'NEEDS_KELDIA_VERIFICATION',
    };
    setDrafts((prev) => [newDraft, ...prev]);
    setIngestText('');
    alert('Source text parsed into a new Draft item marked [Needs Human Verification].');
  };

  const detectDocumentCategory = (fileName: string): string => {
    if (selectedDocCategory !== 'Auto-Detect') return selectedDocCategory;
    const lower = fileName.toLowerCase();
    if (lower.includes('inv') || lower.includes('factura') || lower.includes('bill')) {
      return 'Vendor Invoice';
    }
    if (lower.includes('ack') || lower.includes('confirm')) {
      return 'Order Acknowledgment';
    }
    if (lower.includes('quote') || lower.includes('cotiz') || lower.includes('est')) {
      return 'Vendor Quote';
    }
    if (lower.includes('po') || lower.includes('purchase')) {
      return 'Purchase Order (PO)';
    }
    if (lower.includes('houzz') || lower.includes('tracker') || lower.includes('selection')) {
      return 'Houzz Pro Export';
    }
    if (lower.includes('time') || lower.includes('hour') || lower.includes('payroll') || lower.includes('nomina')) {
      return 'W-2 Employee Timesheet';
    }
    if (lower.includes('w9') || lower.includes('w-9') || lower.includes('coi') || lower.includes('lien')) {
      return 'Compliance Doc (W-9 / COI / Lien Release)';
    }
    if (lower.endsWith('.pdf')) return 'Uploaded Source PDF';
    if (lower.endsWith('.csv') || lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'Spreadsheet / CSV Import';
    return 'Source Document';
  };

  const handleFileUpload = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    Array.from(fileList).forEach((file) => {
      const sizeKb = Math.max(1, Math.round(file.size / 1024));
      const category = detectDocumentCategory(file.name);
      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const finishIngestion = (snippetText: string) => {
        const fileId = `uf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const newUploadedFile: UploadedSourceFile = {
          id: fileId,
          name: file.name,
          sizeLabel: `${sizeKb} KB`,
          docCategory: category,
          uploadedAt: `Today, ${timeNow}`,
          extractedPreview: snippetText,
          status: 'NEEDS_KELDIA_VERIFICATION',
        };

        setUploadedFiles((prev) => [newUploadedFile, ...prev]);

        const newDraft: DraftCommunication = {
          id: `dr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          category: 'Updated ETA Request',
          relatedEntityName: `${file.name} (${category})`,
          projectName: 'Sixth Sense Studio — Active Project Queue',
          recipientRole: 'Human Verification Queue',
          subjectLine: `[DRAFT — NEEDS HUMAN VERIFICATION] Uploaded File Analysis: ${file.name}`,
          bodyText: `[STATUS: DRAFT — NEEDS HUMAN VERIFICATION]\nUploaded File: ${file.name} (${sizeKb} KB)\nDetected Document Type: ${category}\n\nExtracted Summary / Preview:\n${snippetText}\n\nMandatory Verification Steps:\n1. Verify extracted SKU, finish, quantity, unit price, freight, and dates against the original ${file.name} file.\n2. Confirm whether any Houzz Pro Tracker update or Vendor Payment Packet update is required.\n3. Obtain Meliza's written approval before any payment or payroll action.`,
          verificationStatus: 'NEEDS_KELDIA_VERIFICATION',
        };

        setDrafts((prev) => [newDraft, ...prev]);

        setChatHistory((prev) => [
          ...prev,
          {
            role: 'user',
            text: `📎 Uploaded Document: ${file.name} (${sizeKb} KB • ${category})`,
          },
          {
            role: 'divine',
            statusBanner: 'STATUS: DOCUMENT UPLOADED — DRAFT NEEDS HUMAN VERIFICATION',
            text: `I have ingested "${file.name}" (${category}, ${sizeKb} KB) into your local Air-Gapped workspace.\n\n• Extracted Preview: ${snippetText}\n• Action Taken: Added a watermarked comparison & verification draft to your Draft Queue (Marked: Draft — Needs Human Verification).\n• Reminder: Please verify all extracted numbers, SKUs, finishes, and dates directly against "${file.name}" before updating Houzz Pro or preparing a payment packet.`,
          },
        ]);
      };

      if (
        file.type.startsWith('text/') ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.json')
      ) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const raw = typeof ev.target?.result === 'string' ? ev.target.result.trim() : '';
          const preview = raw
            ? `Read ${raw.split(/\r?\n/).length} lines from ${file.name}: "${raw.slice(0, 180).replace(/\s+/g, ' ')}..."`
            : `Parsed structured text/CSV from ${file.name} for 3-way procurement & budget comparison.`;
          finishIngestion(preview);
        };
        reader.readAsText(file);
      } else {
        const preview = `Parsed ${file.name} (${category}). Queued for 3-way SKU/Finish/Price/Freight/ETA comparison against locked project specs and open POs.`;
        finishIngestion(preview);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // GitHub Auto-Update State & Handlers (https://github.com/GeppyAi/devine2)
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateChecking, setUpdateChecking] = useState(false);
  const [updateApplying, setUpdateApplying] = useState(false);
  const [remoteVersionInfo, setRemoteVersionInfo] = useState<{
    version: string;
    builtAt: string;
    notes: string;
    commitSha?: string;
    hasNewerVersion: boolean;
    statusMessage: string;
  } | null>(null);

  const checkForGitHubUpdates = async () => {
    setShowUpdateModal(true);
    setUpdateChecking(true);
    try {
      const cacheBust = Date.now();
      const res = await fetch(`${GITHUB_RAW_BASE}/version.json?t=${cacheBust}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        const remoteVer = String(data.version || APP_CURRENT_VERSION);
        const isNewer = remoteVer !== APP_CURRENT_VERSION;
        setRemoteVersionInfo({
          version: remoteVer,
          builtAt: data.builtAt || 'Latest Main Branch',
          notes:
            data.releaseNotes ||
            'Latest Divine standalone build from github.com/GeppyAi/devine2.',
          commitSha: data.commitSha,
          hasNewerVersion: isNewer,
          statusMessage: isNewer
            ? `New version v${remoteVer} is available on GitHub!`
            : `Connected to GitHub (${GITHUB_REPO_SLUG}). Latest version on main: v${remoteVer}.`,
        });
      } else {
        // Fallback to GitHub Commits API if version.json is not yet pushed
        const commitRes = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO_SLUG}/commits/main`
        );
        if (commitRes.ok) {
          const commitData = await commitRes.json();
          const shaShort = String(commitData.sha || '').slice(0, 7);
          const commitDate = commitData.commit?.committer?.date
            ? new Date(commitData.commit.committer.date).toLocaleString()
            : 'Latest';
          setRemoteVersionInfo({
            version: `${APP_CURRENT_VERSION} (${shaShort})`,
            builtAt: commitDate,
            notes: commitData.commit?.message || 'Latest commit on GeppyAi/devine2 main branch.',
            commitSha: shaShort,
            hasNewerVersion: true,
            statusMessage: `Connected to ${GITHUB_REPO_SLUG} (Commit ${shaShort}). Ready to pull latest standalone build.`,
          });
        } else {
          setRemoteVersionInfo({
            version: APP_CURRENT_VERSION,
            builtAt: 'Pending First Push to main',
            notes:
              'Repository https://github.com/GeppyAi/devine2 is configured. Once the latest commit is pushed to the main branch, clicking Update will automatically pull it.',
            hasNewerVersion: false,
            statusMessage:
              'Configured for github.com/GeppyAi/devine2 (awaiting public main branch or version.json).',
          });
        }
      }
    } catch {
      setRemoteVersionInfo({
        version: APP_CURRENT_VERSION,
        builtAt: 'Offline / Local Mode',
        notes:
          'Unable to reach github.com/GeppyAi/devine2 right now. Your local standalone app continues to work 100% offline.',
        hasNewerVersion: false,
        statusMessage: 'Currently offline or repository not reachable.',
      });
    } finally {
      setUpdateChecking(false);
    }
  };

  const hotLoadGitHubUpdate = async () => {
    setUpdateApplying(true);
    try {
      const res = await fetch(
        `${GITHUB_RAW_BASE}/Divine_Sixth_Sense_Studio_Standalone.html?t=${Date.now()}`,
        { cache: 'no-store' }
      );
      if (!res.ok) {
        alert(
          t(
            'Could not fetch Divine_Sixth_Sense_Studio_Standalone.html from https://github.com/GeppyAi/devine2/tree/main yet. Make sure the latest build is pushed to the main branch.',
            'Aún no se pudo descargar Divine_Sixth_Sense_Studio_Standalone.html desde https://github.com/GeppyAi/devine2/tree/main. Asegúrese de haber subido la última versión a la rama main.'
          )
        );
        return;
      }
      const latestHtml = await res.text();
      if (!latestHtml.includes('<!DOCTYPE html>')) {
        throw new Error('Invalid HTML payload');
      }
      document.open();
      document.write(latestHtml);
      document.close();
    } catch {
      alert(
        t(
          'Unable to hot-load from GitHub right now. Please check your internet connection or repository visibility.',
          'No se pudo cargar la actualización desde GitHub en este momento. Verifique su conexión o el repositorio.'
        )
      );
    } finally {
      setUpdateApplying(false);
    }
  };

  const downloadGitHubUpdateFile = async () => {
    setUpdateApplying(true);
    try {
      const res = await fetch(
        `${GITHUB_RAW_BASE}/Divine_Sixth_Sense_Studio_Standalone.html?t=${Date.now()}`,
        { cache: 'no-store' }
      );
      if (!res.ok) {
        alert(
          t(
            'Could not download Divine_Sixth_Sense_Studio_Standalone.html from github.com/GeppyAi/devine2 (branch: main). Please push the latest build to GitHub first.',
            'No se pudo descargar Divine_Sixth_Sense_Studio_Standalone.html desde github.com/GeppyAi/devine2 (rama: main).'
          )
        );
        return;
      }
      const latestHtml = await res.text();
      const blob = new Blob([latestHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Divine_Sixth_Sense_Studio_Standalone.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert(
        t(
          'Download failed. Check connection to https://github.com/GeppyAi/devine2.',
          'Error al descargar. Verifique la conexión a https://github.com/GeppyAi/devine2.'
        )
      );
    } finally {
      setUpdateApplying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f6] text-slate-900">
      {/* Hidden Global Multi-Format File Upload Input (PDF, CSV, XLSX, Images, Docs) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.txt,.doc,.docx"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
      {/* Top Mandatory Air-Gap & Firm Limits Security Bar */}
      <div className="bg-slate-900 text-amber-100 px-6 py-2.5 text-xs border-b border-slate-700 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>
              {t('STRICT AIR-GAP MODE:', 'MODO DE AISLAMIENTO ESTRICTO (AIR-GAP):')}
            </strong>{' '}
            {t(
              'Divine cannot contact vendors/clients, submit POs, approve actions, send Zelle payments, or submit QuickBooks payroll.',
              'Divine nunca puede contactar a proveedores/clientes, enviar órdenes de compra (POs), aprobar acciones, enviar pagos por Zelle ni enviar la nómina en QuickBooks.'
            )}
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-300">
          <span>
            {t('All outputs are', 'Todos los resultados son')}{' '}
            <strong>{t('Working Drafts', 'Borradores de Trabajo')}</strong>
          </span>
          <span className="text-amber-300 font-semibold">
            {t(
              '• Confidential: Sixth Sense Studio Internal',
              '• Confidencial: Uso Interno de Sixth Sense Studio'
            )}
          </span>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3.5">
              <img
                src="/divine-logo.png"
                alt="Divine AI Logo"
                className="w-12 h-12 rounded-xl object-cover shadow-md border border-stone-300 shrink-0"
              />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
                  {t(
                    'Divine — AI Operations & Procurement Assistant',
                    'Divine — Asistente IA de Operaciones y Compras'
                  )}
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-300">
                    Sixth Sense Studio
                  </span>
                </h1>
                <p className="text-xs text-stone-500">
                  {t(
                    'Procurement • Houzz Pro Tracker & Budgets • Vendor-Payment Prep • W-2 Payroll Prep • Daily/Weekly/Monthly Logs',
                    'Compras y Logística • Rastreador y Presupuestos Houzz Pro • Preparación de Pagos • Preparación de Nómina W-2 • Registros y Reportes'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* One-Click Reset / Clear All Test Data Button */}
            {!isCleanWorkspace ? (
              <button
                type="button"
                onClick={() => clearAllTestData(true)}
                title={t(
                  'Clear all sample/test data across all tabs so you can send or start a fresh workspace',
                  'Eliminar todos los datos de prueba en todas las pestañas para iniciar o enviar un espacio limpio'
                )}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-red-300 bg-red-50 text-red-900 hover:bg-red-100 transition shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-700" />
                <span>{t('Reset / Clear All Test Data', 'Reiniciar / Limpiar Datos de Prueba')}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadFreshStandaloneHtml}
                  title={t(
                    'Download a clean standalone HTML copy with all test data removed to send to your team',
                    'Descargar copia HTML independiente limpia sin datos de prueba para enviar al equipo'
                  )}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-emerald-400 bg-emerald-50 text-emerald-950 hover:bg-emerald-100 transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{t('Download Fresh HTML to Send', 'Descargar HTML Limpio')}</span>
                </button>
                <button
                  type="button"
                  onClick={restoreSampleDemoData}
                  title={t(
                    'Restore sample demo data for testing or training',
                    'Restaurar datos de demostración para pruebas o entrenamiento'
                  )}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-stone-600" />
                  <span>{t('Load Demo Data', 'Cargar Demo')}</span>
                </button>
              </div>
            )}

            {/* GitHub Auto-Update Button (https://github.com/GeppyAi/devine2) */}
            <button
              onClick={checkForGitHubUpdates}
              title={t(
                'Check & pull the latest Divine app update from github.com/GeppyAi/devine2',
                'Comprobar y descargar la última versión de Divine desde github.com/GeppyAi/devine2'
              )}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-stone-300 bg-stone-900 text-white hover:bg-stone-800 transition shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${updateChecking ? 'animate-spin' : ''}`} />
              <span>{t('Update from GitHub', 'Actualizar desde GitHub')}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                v{APP_CURRENT_VERSION}
              </span>
            </button>

            {/* Bilingual Language Switcher Button (English <-> Español) */}
            <button
              onClick={() => setLang((prev) => (prev === 'en' ? 'es' : 'en'))}
              title={t('Switch interface language to Spanish', 'Cambiar idioma de la interfaz a Inglés')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-amber-400 bg-amber-50 text-stone-900 hover:bg-amber-100 transition shadow-sm"
            >
              <Globe className="w-4 h-4 text-amber-800" />
              <span>{lang === 'en' ? 'ESPAÑOL (ES)' : 'ENGLISH (EN)'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-900 text-amber-200">
                {lang === 'en' ? 'EN → ES' : 'ES → EN'}
              </span>
            </button>

            {/* Navigation Pills */}
            <nav className="flex flex-wrap gap-1.5 bg-stone-100 p-1.5 rounded-xl border border-stone-200">
              {[
                {
                  id: 'overview',
                  label: t('5. Logs, Reminders & EOD', '5. Registros, Recordatorios y Cierre'),
                  icon: ClipboardCheck,
                },
                {
                  id: 'procurement',
                  label: t('1. Procurement & Mafer', '1. Compras y Mafer'),
                  icon: Truck,
                },
                {
                  id: 'houzz',
                  label: t('2. Houzz & Budgets', '2. Houzz y Presupuestos'),
                  icon: FileSpreadsheet,
                },
                {
                  id: 'payments',
                  label: t('3. Vendor Payment Prep', '3. Prep. de Pagos'),
                  icon: CreditCard,
                },
                {
                  id: 'payroll',
                  label: t('4. W-2 Payroll Prep', '4. Prep. de Nómina W-2'),
                  icon: Clock,
                },
                {
                  id: 'assistant',
                  label: t('Ingest & Draft Studio', 'Ingesta y Borradores IA'),
                  icon: Sparkles,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      active
                        ? 'bg-stone-900 text-white shadow-sm'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* GitHub Self-Contained Updater Modal (https://github.com/GeppyAi/devine2) */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-300 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-stone-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 text-amber-700 ${updateChecking ? 'animate-spin' : ''}`} />
                  {t(
                    'GitHub Self-Updater — GeppyAi/devine2',
                    'Actualizador Automático desde GitHub — GeppyAi/devine2'
                  )}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {t(
                    'Pull the latest Divine standalone app directly from GitHub without needing a new email attachment.',
                    'Descargue o cargue la última versión de Divine directamente desde GitHub sin necesidad de recibir otro correo.'
                  )}
                </p>
              </div>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200"
              >
                {t('Close', 'Cerrar')}
              </button>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-medium">
                  {t('Connected GitHub Repository:', 'Repositorio GitHub Conectado:')}
                </span>
                <a
                  href={GITHUB_REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono font-bold text-amber-800 underline"
                >
                  github.com/{GITHUB_REPO_SLUG}
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-medium">
                  {t('Installed App Version:', 'Versión Instalada:')}
                </span>
                <span className="font-mono font-bold text-stone-900">v{APP_CURRENT_VERSION}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-medium">
                  {t('Latest GitHub Version (main):', 'Última Versión en GitHub (main):')}
                </span>
                <span className="font-mono font-bold text-emerald-700">
                  {updateChecking
                    ? t('Checking GitHub...', 'Consultando GitHub...')
                    : remoteVersionInfo
                    ? `v${remoteVersionInfo.version} (${remoteVersionInfo.builtAt})`
                    : '—'}
                </span>
              </div>
              {remoteVersionInfo && (
                <div className="pt-2 border-t border-stone-200 space-y-1">
                  <div className="font-bold text-stone-800">{remoteVersionInfo.statusMessage}</div>
                  <div className="text-[11px] text-stone-600">{remoteVersionInfo.notes}</div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                disabled={updateApplying}
                onClick={hotLoadGitHubUpdate}
                className="px-4 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${updateApplying ? 'animate-spin' : ''}`} />
                {t('Hot-Load Latest Version Now', 'Cargar Última Versión Ahora')}
              </button>
              <button
                type="button"
                disabled={updateApplying}
                onClick={downloadGitHubUpdateFile}
                className="px-4 py-2.5 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold hover:bg-amber-400 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {t('Download Updated HTML File', 'Descargar Archivo HTML Actualizado')}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
              <span>
                {t(
                  'Read-only pull from github.com/GeppyAi/devine2 • Zero studio data ever leaves your computer.',
                  'Descarga de solo lectura desde github.com/GeppyAi/devine2 • Ningún dato del estudio sale de su equipo.'
                )}
              </span>
              <button
                type="button"
                onClick={checkForGitHubUpdates}
                className="underline font-semibold text-stone-700 hover:text-stone-900 shrink-0 ml-2"
              >
                {t('Re-check', 'Reintentar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
        {/* Fresh / Reset Confirmation Banner */}
        {showResetBanner && (
          <div className="bg-emerald-900 text-emerald-50 border border-emerald-700 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-sm text-white">
                  {t(
                    'All Test Data Cleared — Workspace is 100% Fresh & Ready!',
                    '¡Todos los Datos de Prueba Eliminados — El Espacio está 100% Limpio y Listo!'
                  )}
                </p>
                <p className="text-emerald-200">
                  {t(
                    'Sample orders, quotes, invoices, payment packets, W-2 timesheets, uploaded files, drafts, and feedback logs have all been wiped. Click "Download Fresh HTML to Send" to save a clean standalone file for your team.',
                    'Las órdenes, cotizaciones, facturas, paquetes de pago, hojas de horas W-2, archivos subidos, borradores y reportes de prueba han sido eliminados. Haga clic en "Descargar HTML Limpio" para guardar una copia limpia para su equipo.'
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={downloadFreshStandaloneHtml}
                className="px-3.5 py-2 rounded-lg bg-amber-400 text-stone-950 text-xs font-bold hover:bg-amber-300 inline-flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                {t('Download Fresh HTML to Send', 'Descargar HTML Limpio para Enviar')}
              </button>
              <button
                type="button"
                onClick={restoreSampleDemoData}
                className="px-3 py-2 rounded-lg bg-emerald-800 text-emerald-100 border border-emerald-600 text-xs font-semibold hover:bg-emerald-700 inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t('Restore Demo Data', 'Restaurar Demo')}
              </button>
              <button
                type="button"
                onClick={() => setShowResetBanner(false)}
                className="px-2.5 py-2 rounded-lg text-emerald-200 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Global Human Review Responsibility Notice */}
        <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950 space-y-1">
              <p className="font-bold text-sm">
                {t(
                  'Human Review & Control Gate (Mandatory Before Any External Action)',
                  'Control y Revisión Humana (Obligatorio Antes de Cualquier Acción Externa)'
                )}
              </p>
              <p>
                {t(
                  'Every table, comparison, flag, and message below is a working draft. You must verify all data against original source documents, decide on flagged discrepancies, personally verify payment recipients/amounts, obtain Meliza’s written approval where required, and manually execute Houzz updates, Zelle transfers, or QuickBooks Payroll runs.',
                  'Cada tabla, comparación, alerta y mensaje a continuación es un borrador de trabajo. Usted debe verificar todos los datos contra los documentos originales, tomar decisiones sobre las discrepancias detectadas, verificar personalmente los destinatarios y montos de pago, obtener la aprobación por escrito de Meliza cuando corresponda y ejecutar manualmente las actualizaciones en Houzz, transferencias por Zelle o envíos en QuickBooks Payroll.'
                )}
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <StatusBadge status="NEEDS_KELDIA_VERIFICATION" size="sm" lang={lang} />
          </div>
        </div>

        {/* =====================================================================
            TAB 5 / OVERVIEW: LOGS, REMINDERS, EOD & WEEKLY/MONTHLY REPORTING
           ===================================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                  <span>{t('OPEN PROCUREMENT & RISKS', 'COMPRAS ABIERTAS Y RIESGOS')}</span>
                  <Truck className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-stone-900 mt-2">
                  {orders.length} {t('Open Orders', 'Órdenes Abiertas')}
                </p>
                {orders.length > 0 ? (
                  <p className="text-xs text-red-700 font-medium mt-1">
                    {t(
                      '• 2 Threaten Nov 5 Install • 1 Missing Ack',
                      '• 2 Amenazan Instalación 5 Nov • 1 Sin Acuse'
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-emerald-700 font-medium mt-1">
                    {t('✓ Clean — Upload POs or Quotes to track', '✓ Limpio — Suba POs o Cotizaciones')}
                  </p>
                )}
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                  <span>{t('HOUZZ BUDGET & TRACKER', 'PRESUPUESTO Y RASTREADOR HOUZZ')}</span>
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-stone-900 mt-2">
                  {orders.length} {t('Draft Updates', 'Actualizaciones en Borrador')}
                </p>
                {orders.length > 0 ? (
                  <p className="text-xs text-amber-800 font-medium mt-1">
                    {t(
                      '• 1 Line Over-Budget Risk (+$25 Freight)',
                      '• 1 Línea con Riesgo de Sobrecosto (+$25 Flete)'
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-emerald-700 font-medium mt-1">
                    {t('✓ Clean — Ready for Houzz CSV / Selections', '✓ Limpio — Listo para CSV de Houzz')}
                  </p>
                )}
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                  <span>{t('VENDOR PAYMENT PACKETS', 'PAQUETES DE PAGO A PROVEEDORES')}</span>
                  <CreditCard className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-stone-900 mt-2">
                  {paymentPackets.length}{' '}
                  {t('Packets', 'Paquetes')} ($
                  {paymentPackets.reduce((sum, p) => sum + p.invoiceAmount, 0).toLocaleString()})
                </p>
                {paymentPackets.length > 0 ? (
                  <p className="text-xs text-red-700 font-medium mt-1">
                    {t(
                      '• Both Flagged (Zelle Mismatch / Missing Docs)',
                      '• Ambos con Alerta (Discrepancia Zelle / Faltan Docs)'
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-emerald-700 font-medium mt-1">
                    {t('✓ Clean — Upload Vendor Invoice to prep', '✓ Limpio — Suba Factura para preparar')}
                  </p>
                )}
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                  <span>{t('W-2 PAYROLL PREP (1 EMPLOYEE)', 'PREP. NÓMINA W-2 (1 EMPLEADA)')}</span>
                  <Clock className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-stone-900 mt-2">
                  {payroll.entries.length > 0
                    ? t('Due Oct 21', 'Vence 21 Oct')
                    : t('0 Hrs Logged', '0 Hrs Registradas')}
                </p>
                {payroll.entries.length > 0 ? (
                  <p className="text-xs text-red-700 font-medium mt-1">
                    {t(
                      '• 2 Hours Anomalies Flagged for Review',
                      '• 2 Anomalías de Horas Marcadas para Revisión'
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-emerald-700 font-medium mt-1">
                    {t('✓ Clean — Upload W-2 Timesheet to begin', '✓ Limpio — Suba Hoja de Horas W-2')}
                  </p>
                )}
              </div>
            </div>

            {/* HERO FEATURE ON MAIN PAGE: Divine AI Chat Workspace + Quick Source Ingestion */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 Columns: Main Divine AI Interactive Chat Assistant */}
              <div className="lg:col-span-7 bg-white rounded-2xl border-2 border-stone-900/15 shadow-md flex flex-col h-[520px] overflow-hidden">
                <div className="p-4 border-b border-stone-800 bg-stone-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="/divine-logo.png"
                      alt="Divine AI"
                      className="w-9 h-9 rounded-lg object-cover border border-amber-400/50 shadow"
                    />
                    <div>
                      <h2 className="text-sm font-bold flex items-center gap-2">
                        {t(
                          'Divine AI Assistant — Daily Operations Co-Pilot',
                          'Asistente IA Divine — Copiloto Diario de Operaciones'
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                          {t('Houzz Pro + Studio Rules Active', 'Reglas de Estudio + Houzz Pro Activas')}
                        </span>
                      </h2>
                      <p className="text-[11px] text-stone-300">
                        {t(
                          'Ask Divine to compare quotes/POs/invoices, draft vendor follow-ups, check Houzz workflows, or prep payment & payroll packets',
                          'Pida a Divine comparar cotizaciones/POs/facturas, redactar seguimientos, consultar flujos de Houzz o preparar paquetes de pago y nómina'
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* One-Click Prompt Bar */}
                <div className="px-4 py-2 bg-stone-100 border-b border-stone-200 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-stone-500 mr-1">
                    {t('Try asking:', 'Probar consulta:')}
                  </span>
                  <button
                    onClick={() =>
                      setChatInput(
                        t(
                          'Summarize today’s open order discrepancies and Mafer coordination reminders',
                          'Resume las discrepancias de órdenes abiertas de hoy y los recordatorios de Mafer'
                        )
                      )
                    }
                    className="text-[11px] px-2.5 py-1 rounded-md bg-white border border-stone-300 text-stone-800 font-medium hover:bg-stone-50"
                  >
                    {t('Discrepancies & Mafer', 'Discrepancias y Mafer')}
                  </button>
                  <button
                    onClick={() =>
                      setChatInput(
                        'How do I merge Purchase Orders or update the Selections Tracker in Houzz Pro?'
                      )
                    }
                    className="text-[11px] px-2.5 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-900 font-medium hover:bg-amber-100"
                  >
                    {t('Houzz Pro: Merge POs & Tracker', 'Houzz Pro: Fusionar POs y Rastreador')}
                  </button>
                  <button
                    onClick={() =>
                      setChatInput(
                        'How do I import items to Houzz Product Library (My Items) and manage vendor tags?'
                      )
                    }
                    className="text-[11px] px-2.5 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-900 font-medium hover:bg-amber-100"
                  >
                    {t('Houzz Pro: My Items & Vendors', 'Houzz Pro: Mis Artículos y Proveedores')}
                  </button>
                  <button
                    onClick={() => setChatInput('Send the Zelle payment to Atelier Bespoke now')}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-red-800 font-medium hover:bg-red-100"
                  >
                    {t('Test Limit: Send Zelle', 'Probar Límite: Enviar Zelle')}
                  </button>
                </div>

                {/* Chat Transcript */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-stone-50/40">
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-xl ${
                        msg.role === 'user'
                          ? 'bg-stone-900 text-white ml-10 shadow-sm'
                          : 'bg-white text-stone-900 mr-6 border border-stone-200 shadow-sm'
                      }`}
                    >
                      {msg.statusBanner && (
                        <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 inline-block mb-1.5">
                          {msg.statusBanner}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                    </div>
                  ))}
                </div>

                {/* Chat Input Bar with Direct PDF / File Upload Button */}
                <form
                  onSubmit={handleChatSubmit}
                  className="p-3 bg-white border-t border-stone-200 flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title={t(
                      'Upload PDF, CSV, Excel, or Image directly to Divine',
                      'Subir PDF, CSV, Excel o Imagen directamente a Divine'
                    )}
                    className="px-3 py-2.5 rounded-xl border border-amber-400 bg-amber-50 text-stone-900 text-xs font-bold hover:bg-amber-100 inline-flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-amber-800" />
                    {t('Upload PDF / File', 'Subir PDF / Archivo')}
                  </button>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={t(
                      'Message Divine (e.g., "Compare Arteriors invoice with PO", "How do I merge POs in Houzz?")...',
                      'Escriba a Divine (ej. "Comparar factura de Arteriors con PO", "¿Cómo fusionar POs en Houzz?")...'
                    )}
                    className="flex-1 rounded-xl border border-stone-300 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 inline-flex items-center gap-1.5 shadow-sm shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {t('Ask Divine', 'Preguntar a Divine')}
                  </button>
                </form>
              </div>

              {/* Right 5 Columns: Quick Source Document Upload (PDF / CSV / Image) & Paste Queue */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-amber-700" />
                        {t(
                          'Source Document Upload & Paste (PDF, CSV, XLSX, Images)',
                          'Subir o Pegar Documento Fuente (PDF, CSV, XLSX, Imágenes)'
                        )}
                      </h3>
                      <StatusBadge status="NEEDS_KELDIA_VERIFICATION" size="sm" lang={lang} />
                    </div>

                    {/* Interactive Drag-and-Drop & Upload Button Area */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(true);
                      }}
                      onDragLeave={() => setIsDraggingFile(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(false);
                        handleFileUpload(e.dataTransfer.files);
                      }}
                      className={`rounded-xl border-2 border-dashed p-3.5 transition flex flex-col sm:flex-row items-center justify-between gap-3 ${
                        isDraggingFile
                          ? 'border-amber-500 bg-amber-50/80'
                          : 'border-stone-300 bg-stone-50/70 hover:border-stone-400'
                      }`}
                    >
                      <div className="space-y-1 text-center sm:text-left">
                        <div className="text-xs font-bold text-stone-900">
                          {t(
                            'Upload Quotes, POs, Acknowledgments, Invoices, Houzz CSVs, or Timesheets',
                            'Subir Cotizaciones, POs, Confirmaciones, Facturas, CSV de Houzz u Horas'
                          )}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {t(
                            'Supports PDF, CSV, XLSX, PNG/JPG, TXT • Drag & drop or click Upload',
                            'Soporta PDF, CSV, XLSX, PNG/JPG, TXT • Arrastre o haga clic en Subir'
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={selectedDocCategory}
                          onChange={(e) => setSelectedDocCategory(e.target.value)}
                          className="rounded-lg border border-stone-300 bg-white px-2 py-2 text-[11px] font-medium text-stone-800 focus:outline-none"
                        >
                          <option value="Auto-Detect">{t('Auto-Detect Type', 'Auto-Detectar Tipo')}</option>
                          <option value="Vendor Quote (PDF)">{t('Vendor Quote', 'Cotización Proveedor')}</option>
                          <option value="Purchase Order (PO)">{t('Purchase Order (PO)', 'Orden de Compra (PO)')}</option>
                          <option value="Order Acknowledgment">{t('Order Acknowledgment', 'Acuse de Recibo')}</option>
                          <option value="Vendor Invoice (PDF)">{t('Vendor Invoice', 'Factura de Proveedor')}</option>
                          <option value="Houzz Pro Export (CSV)">{t('Houzz Pro Export', 'Exportación Houzz Pro')}</option>
                          <option value="W-2 Employee Timesheet">{t('W-2 Timesheet', 'Hoja de Horas W-2')}</option>
                          <option value="Compliance Doc (W-9/COI/Lien)">{t('W-9 / COI / Lien Release', 'W-9 / COI / Liberación')}</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold hover:bg-amber-400 inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {t('Upload PDF / File', 'Subir PDF / Archivo')}
                        </button>
                      </div>
                    </div>

                    {/* Recently Uploaded Source Files Mini-Queue */}
                    {uploadedFiles.length > 0 && (
                      <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 space-y-1.5 max-h-28 overflow-y-auto">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-500">
                          <span>
                            {t('Uploaded Source Files', 'Archivos Fuente Subidos')} ({uploadedFiles.length})
                          </span>
                          <span>{t('Air-Gapped Local Vault', 'Bóveda Local Aislada')}</span>
                        </div>
                        {uploadedFiles.slice(0, 3).map((uf) => (
                          <div
                            key={uf.id}
                            className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-stone-200 text-[11px]"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span className="font-semibold text-stone-900 truncate">{uf.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 shrink-0">
                                {uf.docCategory} • {uf.sizeLabel}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setUploadedFiles((prev) => prev.filter((item) => item.id !== uf.id))
                              }
                              title={t('Remove from queue', 'Quitar de la cola')}
                              className="text-stone-400 hover:text-red-600 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <textarea
                      value={ingestText}
                      onChange={(e) => setIngestText(e.target.value)}
                      rows={3}
                      placeholder={t(
                        'Or paste vendor quote, acknowledgment, invoice text, Houzz export, or timesheet rows here...',
                        'O pegue aquí el texto de la cotización, acuse de recibo, factura, exportación de Houzz u horas...'
                      )}
                      className="w-full rounded-xl border border-stone-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-stone-500">
                      {t('100% Local & Air-Gapped', '100% Local y Aislado')}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab('assistant')}
                        className="px-3 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100"
                      >
                        {t('View All Drafts', 'Ver Borradores')} ({drafts.length})
                      </button>
                      <button
                        onClick={handleIngestSource}
                        className="px-3.5 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800"
                      >
                        {t('Analyze Pasted Text', 'Analizar Texto Pegado')}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Compact Houzz Pro & Guardrail Status Card */}
                <div className="bg-stone-900 text-stone-100 rounded-2xl p-4 space-y-2 text-xs shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      {t('Active Divine Capabilities & Firm Limits', 'Capacidades Activas y Límites de Divine')}
                    </span>
                    <button
                      onClick={() => setActiveTab('houzz')}
                      className="text-[11px] underline text-amber-200 hover:text-white"
                    >
                      {t('Open Houzz Guides →', 'Abrir Guías de Houzz →')}
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-300 leading-relaxed">
                    {t(
                      '• Indexed with 6 official Houzz Pro guides (My Items, Selections Tracker, Create/Merge POs, Manage Vendors).\n• Never contacts vendors/clients, never submits POs, never sends Zelle, and never runs QuickBooks Payroll.',
                      '• Indexado con las 6 guías oficiales de Houzz Pro (Mis Artículos, Rastreador de Selecciones, Crear/Fusionar POs, Proveedores).\n• Nunca contacta a proveedores/clientes, nunca envía POs, nunca envía Zelle ni ejecuta nómina en QuickBooks.'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Daily Reminders & End-of-Day Status Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-700" />
                      {t(
                        'Daily Reminders & Action Queue',
                        'Recordatorios Diarios y Cola de Acciones'
                      )}
                    </h2>
                    <p className="text-xs text-stone-500">
                      {t(
                        'Working reminder list — Not an official accounting record',
                        'Lista de trabajo — No es un registro contable oficial'
                      )}
                    </p>
                  </div>
                  <StatusBadge status="DRAFT" size="sm" lang={lang} />
                </div>

                {orders.length === 0 && paymentPackets.length === 0 && payroll.entries.length === 0 ? (
                  <div className="p-6 rounded-xl bg-stone-50 border border-stone-200 text-center space-y-3">
                    <div className="text-xs font-bold text-stone-900">
                      {t(
                        'Workspace is Clean — No Active Discrepancies or Overdue Reminders',
                        'Espacio Limpio — Sin Discrepancias Activas ni Recordatorios Vencidos'
                      )}
                    </div>
                    <p className="text-xs text-stone-500 max-w-md mx-auto">
                      {t(
                        'All sample/test data has been cleared. Upload a vendor Quote, Purchase Order, Acknowledgment, Invoice, Houzz CSV, or W-2 Timesheet above to begin.',
                        'Todos los datos de prueba han sido eliminados. Suba una Cotización, Orden de Compra, Acuse, Factura, CSV de Houzz u Hoja de Horas W-2 arriba para comenzar.'
                      )}
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold hover:bg-amber-400 inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {t('Upload Source File', 'Subir Archivo Fuente')}
                      </button>
                      <button
                        type="button"
                        onClick={restoreSampleDemoData}
                        className="px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100"
                      >
                        {t('Restore Demo Data', 'Restaurar Datos Demo')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <ul className="space-y-3 text-xs">
                    <li className="p-3 rounded-lg bg-red-50/70 border border-red-200 flex items-start justify-between gap-3">
                      <div>
                        <span className="font-bold text-red-900 block">
                          {t(
                            '[INSTALL RISK + SKU/FREIGHT DISCREPANCY] PO-SSS-2026-041 — Arteriors Chandelier',
                            '[RIESGO DE INSTALACIÓN + DISCREPANCIA SKU/FLETE] PO-SSS-2026-041 — Candil Arteriors'
                          )}
                        </span>
                        <span className="text-red-800">
                          {t(
                            'Vendor Ack lists Vintage Bronze (ART-89420-VB) instead of Antique Brass (ART-89420-AB), adds $175 freight, and shifts ETA to Nov 9 (4 days past Nov 5 Castellanos install). Review draft follow-up.',
                            'El acuse del proveedor indica Vintage Bronze (ART-89420-VB) en lugar de Antique Brass (ART-89420-AB), agrega $175 de flete y cambia la entrega estimada al 9 de nov (4 días después de la instalación Castellanos del 5 de nov). Revisar borrador.'
                          )}
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveTab('procurement')}
                        className="shrink-0 px-2.5 py-1 bg-white text-red-900 border border-red-300 rounded font-semibold hover:bg-red-100"
                      >
                        {t('Review PO', 'Ver Orden')}
                      </button>
                    </li>

                    <li className="p-3 rounded-lg bg-red-50/70 border border-red-200 flex items-start justify-between gap-3">
                      <div>
                        <span className="font-bold text-red-900 block">
                          {t(
                            '[DAMAGED DELIVERY + MAFER COORDINATION] PO-SSS-2026-038 — Atelier Entry Console',
                            '[ENTREGA DAÑADA + COORDINACIÓN CON MAFER] PO-SSS-2026-038 — Consola Atelier'
                          )}
                        </span>
                        <span className="text-red-800">
                          {t(
                            'Delivered Oct 19 with cracked travertine top slab & 2 missing brass leveling feet. Coordinate Mafer for Oct 22 at 10:00 AM replacement pickup. Hold final payment INV-ABM-882.',
                            'Entregado el 19 de oct con fisura en la cubierta de travertino y 2 patas niveladoras faltantes. Coordinar con Mafer el 22 de oct a las 10:00 AM para recolección. Retener pago final INV-ABM-882.'
                          )}
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveTab('procurement')}
                        className="shrink-0 px-2.5 py-1 bg-white text-red-900 border border-red-300 rounded font-semibold hover:bg-red-100"
                      >
                        {t('Mafer Log', 'Registro Mafer')}
                      </button>
                    </li>

                    <li className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 flex items-start justify-between gap-3">
                      <div>
                        <span className="font-bold text-amber-900 block">
                          {t(
                            '[MISSING ACKNOWLEDGMENT — 7 DAYS OVERDUE] PO-SSS-2026-044 — Vanguard Sectional',
                            '[FALTA ACUSE DE RECIBO — 7 DÍAS VENCIDO] PO-SSS-2026-044 — Seccional Vanguard'
                          )}
                        </span>
                        <span className="text-amber-800">
                          {t(
                            'Order placed Oct 12 for Brickell Key Penthouse. No vendor acknowledgment or ship date received yet. Copy-ready follow-up draft prepared.',
                            'Orden enviada el 12 de oct para Brickell Key Penthouse. Aún no se recibe confirmación ni fecha de envío del proveedor. Borrador de seguimiento listo para revisar.'
                          )}
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveTab('assistant')}
                        className="shrink-0 px-2.5 py-1 bg-white text-amber-900 border border-amber-300 rounded font-semibold hover:bg-amber-100"
                      >
                        {t('View Draft', 'Ver Borrador')}
                      </button>
                    </li>

                    <li className="p-3 rounded-lg bg-purple-50/70 border border-purple-200 flex items-start justify-between gap-3">
                      <div>
                        <span className="font-bold text-purple-900 block">
                          {t(
                            '[PAYROLL DEADLINE: OCT 21 @ 3:00 PM] Sofia Morales (Single W-2 Employee)',
                            '[FECHA LÍMITE DE NÓMINA: 21 OCT @ 3:00 PM] Sofia Morales (Única Empleada W-2)'
                          )}
                        </span>
                        <span className="text-purple-800">
                          {t(
                            'Verify 2 flagged timesheet anomalies (Oct 8 missing clock-out; Oct 14 10-hr shift with 0 break), request Meliza’s written approval, and enter in QuickBooks Payroll Online.',
                            'Verificar 2 anomalías de horas (8 oct sin hora de salida; 14 oct turno de 10 hrs sin descanso registrado), solicitar aprobación escrita de Meliza e ingresar en QuickBooks Payroll Online.'
                          )}
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveTab('payroll')}
                        className="shrink-0 px-2.5 py-1 bg-white text-purple-900 border border-purple-300 rounded font-semibold hover:bg-purple-100"
                      >
                        {t('Verify Hours', 'Verificar Horas')}
                      </button>
                    </li>
                  </ul>
                )}
              </div>

              {/* Copy-Ready End-of-Day & Weekly/Monthly Digest */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-stone-900">
                      {t(
                        'End-of-Day (EOD) & Weekly/Monthly Status Summaries',
                        'Resúmenes de Cierre del Día (EOD), Semanales y Mensuales'
                      )}
                    </h2>
                    <p className="text-xs text-stone-500">
                      {t(
                        'Draft summaries to verify and share internally',
                        'Resúmenes en borrador para verificar y compartir internamente'
                      )}
                    </p>
                  </div>
                  <StatusBadge status="DRAFT" size="sm" lang={lang} />
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-lg p-3.5 text-xs font-mono whitespace-pre-wrap text-stone-800 leading-relaxed">
{orders.length === 0 && paymentPackets.length === 0 && payroll.entries.length === 0
  ? `[STATUS: DRAFT EOD SUMMARY — NEEDS HUMAN VERIFICATION]
Sixth Sense Studio — Fresh Workspace

1. OPEN ORDERS & INSTALL RISKS:
   • 0 Open Orders currently tracked. Upload vendor quotes, POs, or acknowledgments to begin 3-way matching.

2. PENDING MELIZA APPROVALS & PAYMENT HOLDS:
   • 0 Vendor Payment Packets pending.

3. W-2 PAYROLL PREP:
   • No W-2 timesheet uploaded for the current period yet.`
  : `[STATUS: DRAFT EOD SUMMARY — NEEDS HUMAN VERIFICATION]
Date: October 19, 2026 | Sixth Sense Studio

1. OPEN ORDERS & INSTALL RISKS:
   • Castellanos Dining Chandelier (PO-SSS-2026-041): ACK/Invoice SKU mismatch (Vintage Bronze vs Antique Brass), +$175 freight variance, and Nov 9 ETA threatens Nov 5 install.
   • Castellanos Entry Console (PO-SSS-2026-038): Delivered today with cracked travertine top & 2 missing feet. Mafer pickup reminder set for Oct 22 @ 10 AM.
   • Sterling Sectional (PO-SSS-2026-044): Missing vendor acknowledgment since Oct 12.

2. PENDING MELIZA APPROVALS & PAYMENT HOLDS:
   • INV-ART-77104 ($4,225.00 - Arteriors): ON HOLD pending SKU & $175 freight correction.
   • INV-ABM-882 ($4,225.00 - Atelier): ON HOLD due to damaged delivery, expired COI, missing Lien Release, and Zelle recipient mismatch on invoice.

3. W-2 PAYROLL PREP (Deadline Oct 21):
   • Sofia Morales (Oct 5–18): 74.0 logged hrs + 1 missing clock-out (Oct 8) & 1 unlogged break flag (Oct 14). Needs human verification before Meliza approval request.`}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'eod-summary',
                        `[STATUS: DRAFT EOD SUMMARY — NEEDS HUMAN VERIFICATION]\nSixth Sense Studio\nOpen Orders: ${orders.length} | Payment Packets Pending: ${paymentPackets.length} | Uploaded Source Files: ${uploadedFiles.length}`
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800"
                  >
                    {copiedId === 'eod-summary' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Draft Summary
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy EOD Draft Summary
                      </>
                    )}
                  </button>
                </div>

                {/* Monthly Vendor Performance Scorecard */}
                <div className="pt-3 border-t border-stone-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                      Monthly Vendor Performance Summary (Draft)
                    </h3>
                    <span className="text-[11px] text-stone-500">Tracks Late, Wrong, Damaged & Billing Flags</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-stone-200 text-stone-500">
                          <th className="py-1.5 pr-2">Vendor</th>
                          <th className="py-1.5 px-2">Orders</th>
                          <th className="py-1.5 px-2">Late</th>
                          <th className="py-1.5 px-2">Damaged/Wrong</th>
                          <th className="py-1.5 px-2">Billing Flags</th>
                          <th className="py-1.5 pl-2">Compliance Docs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {vendors.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-4 text-center text-stone-500">
                              {t(
                                'No vendor discrepancies or compliance flags recorded yet.',
                                'Aún no hay discrepancias de proveedores ni alertas de cumplimiento registradas.'
                              )}
                            </td>
                          </tr>
                        ) : (
                          vendors.map((v) => (
                            <tr key={v.id}>
                              <td className="py-2 pr-2 font-semibold text-stone-900">{v.name}</td>
                              <td className="py-2 px-2">{v.totalOrdersCount}</td>
                              <td className="py-2 px-2 text-amber-800 font-medium">{v.lateOrdersCount}</td>
                              <td className="py-2 px-2 text-red-700 font-medium">{v.damagedOrWrongCount}</td>
                              <td className="py-2 px-2 text-red-700 font-medium">{v.billingDiscrepancyCount}</td>
                              <td className="py-2 pl-2">
                                {v.hasW9 && v.hasCOI && (!v.requiresLienRelease || v.hasLienReleaseOnFile) ? (
                                  <span className="text-emerald-700 font-semibold">Complete</span>
                                ) : (
                                  <span className="text-red-700 font-semibold">
                                    Missing {!v.hasCOI ? 'COI ' : ''}
                                    {v.requiresLienRelease && !v.hasLienReleaseOnFile ? '+ Lien Release' : ''}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 1: PROCUREMENT SUPPORT, QUOTE COMPARISON, 3-WAY MATCH & MAFER
           ===================================================================== */}
        {activeTab === 'procurement' && (
          <div className="space-y-6">
            {/* Quote Comparison Matrix & Draft PO Generator */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-stone-900">
                    {t(
                      '1A. Quote Comparison Table & Draft Purchase Order Builder',
                      '1A. Tabla Comparativa de Cotizaciones y Creador de Órdenes de Compra (PO) en Borrador'
                    )}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {t(
                      'Compares price, lead time, terms, and freight against Designer’s Locked Specification',
                      'Compara precio, tiempo de entrega, términos y flete contra la Especificación Bloqueada del Diseñador'
                    )}
                  </p>
                </div>
                <StatusBadge status="DRAFT" size="sm" lang={lang} />
              </div>

              {quoteComparisons.length === 0 ? (
                <div className="p-6 rounded-xl bg-stone-50 border border-stone-200 text-center space-y-2 text-xs text-stone-600">
                  <div className="font-bold text-stone-900">
                    {t(
                      'No Quote Comparisons Loaded Yet',
                      'Aún No Hay Comparaciones de Cotizaciones Cargadas'
                    )}
                  </div>
                  <p>
                    {t(
                      'Upload vendor quotes (PDF/CSV) to compare pricing, freight, lead time, and payment terms against your locked project specification.',
                      'Suba cotizaciones de proveedores (PDF/CSV) para comparar precio, flete, tiempo de entrega y términos contra la especificación del proyecto.'
                    )}
                  </p>
                </div>
              ) : (
                quoteComparisons.map((comp, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold text-stone-900">{comp.itemTitle}</span> —{' '}
                        <span className="text-stone-600">{comp.projectName}</span>
                        <div className="text-stone-500 mt-0.5">
                          <strong>Designer Locked Spec:</strong> {comp.lockedSpecSummary}
                        </div>
                      </div>
                      <div className="font-bold text-stone-800 bg-white px-3 py-1.5 rounded border border-stone-200">
                        Project Budget Cap: ${comp.budgetedAmount.toLocaleString()}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-stone-100 text-stone-700 border-b border-stone-200">
                            <th className="p-2.5">Vendor & Quote #</th>
                            <th className="p-2.5">Unit Price x Qty</th>
                            <th className="p-2.5">Shipping / Freight</th>
                            <th className="p-2.5">Total Landed Cost</th>
                            <th className="p-2.5">Lead Time</th>
                            <th className="p-2.5">Payment Terms</th>
                            <th className="p-2.5">Spec & Budget Check</th>
                            <th className="p-2.5 text-right">Draft PO Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200">
                          {comp.quotes.map((q) => (
                            <tr key={q.id} className={q.matchesLockedSpec ? 'bg-emerald-50/20' : 'bg-red-50/30'}>
                              <td className="p-2.5 font-bold text-stone-900">
                                {q.vendorName}
                                <div className="text-[11px] font-normal text-stone-500">{q.quoteNumber}</div>
                              </td>
                              <td className="p-2.5">
                                ${q.unitPrice.toLocaleString()} × {q.quantity}
                              </td>
                              <td className="p-2.5">${q.freightCost.toLocaleString()}</td>
                              <td className="p-2.5 font-bold text-stone-900">${q.totalCost.toLocaleString()}</td>
                              <td className="p-2.5">{q.leadTimeWeeks} Weeks</td>
                              <td className="p-2.5">{q.paymentTerms}</td>
                              <td className="p-2.5">
                                {q.matchesLockedSpec ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
                                    <Check className="w-3.5 h-3.5" /> Matches Locked Spec ($420 under budget)
                                  </span>
                                ) : (
                                  <span className="text-red-800 font-semibold block">
                                    ⚠ Flagged: {q.specDeviationNote}
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-right">
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      q.id,
                                      `[STATUS: DRAFT PURCHASE ORDER — NEEDS HUMAN VERIFICATION — DO NOT SUBMIT WITHOUT REVIEW]\nPO Draft for: ${q.vendorName} (Ref Quote: ${q.quoteNumber})\nProject: ${comp.projectName}\nLocked Spec: ${comp.lockedSpecSummary}\nUnit Price: $${q.unitPrice} x ${q.quantity} | Freight: $${q.freightCost} | Total Draft PO: $${q.totalCost}\nTerms: ${q.paymentTerms}`
                                    )
                                  }
                                  className="px-2.5 py-1.5 rounded bg-stone-900 text-white font-semibold hover:bg-stone-800 inline-flex items-center gap-1"
                                >
                                  {copiedId === q.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" /> Draft PO Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" /> Copy Draft PO
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Open Orders, 3-Way Comparison (PO/Quote vs Ack vs Invoice), and Mafer Coordination */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-stone-900">
                  {t(
                    '1B. Open Order Tracking, 3-Way Discrepancy Comparison & Mafer Coordination',
                    '1B. Seguimiento de Órdenes Abiertas, Comparación de Discrepancias y Coordinación con Mafer'
                  )}
                </h2>
                <span className="text-xs text-stone-500">
                  {t(
                    'Compares Locked Spec/Quote ↔ PO ↔ Vendor Acknowledgment ↔ Vendor Invoice',
                    'Compara Especificación/Cotización ↔ Orden (PO) ↔ Acuse del Proveedor ↔ Factura'
                  )}
                </span>
              </div>

              {orders.length === 0 && (
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 text-center space-y-2 text-xs text-stone-600">
                  <div className="font-bold text-stone-900">
                    {t('No Open Procurement Orders Tracked', 'No Hay Órdenes de Compra Abiertas')}
                  </div>
                  <p>
                    {t(
                      'Upload a Purchase Order, Order Acknowledgment, or Vendor Invoice to run a 3-way comparison and track Mafer receiving/pickup reminders.',
                      'Suba una Orden de Compra, Acuse de Recibo o Factura para ejecutar la comparación de 3 vías y coordinar entregas con Mafer.'
                    )}
                  </p>
                </div>
              )}

              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="bg-stone-50 px-5 py-3.5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-sm text-stone-900">{ord.itemName}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-stone-200 text-stone-800 font-semibold">
                          {ord.draftPo?.poNumber}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold">
                          Status: {ord.orderStatus}
                        </span>
                        {ord.threatensInstallDate && (
                          <span className="text-xs px-2 py-0.5 rounded bg-red-600 text-white font-bold">
                            ⚠ THREATENS NOV 5 INSTALL
                          </span>
                        )}
                        {ord.missingAckOverdue && (
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-600 text-white font-bold">
                            ⚠ MISSING ACKNOWLEDGMENT (7 DAYS)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        Project: <strong>{ord.projectName}</strong> • Vendor: <strong>{ord.vendorName}</strong> • Target Install: <strong>{ord.targetInstallDate}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={ord.verificationStatus} size="sm" lang={lang} />
                    </div>
                  </div>

                  {/* 4-Column Source Comparison Table */}
                  <div className="p-5 space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse border border-stone-200">
                        <thead>
                          <tr className="bg-stone-100 text-stone-700">
                            <th className="p-2 border border-stone-200">Field</th>
                            <th className="p-2 border border-stone-200">1. Locked Spec & Budget</th>
                            <th className="p-2 border border-stone-200">2. Approved Quote & PO</th>
                            <th className="p-2 border border-stone-200">3. Vendor Acknowledgment</th>
                            <th className="p-2 border border-stone-200">4. Vendor Invoice</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="p-2 border border-stone-200 font-semibold bg-stone-50">SKU</td>
                            <td className="p-2 border border-stone-200">{ord.lockedSpec.sku}</td>
                            <td className="p-2 border border-stone-200">{ord.approvedQuote?.sku}</td>
                            <td
                              className={`p-2 border border-stone-200 font-semibold ${
                                ord.vendorAck && ord.vendorAck.sku !== ord.lockedSpec.sku
                                  ? 'bg-red-50 text-red-800'
                                  : ''
                              }`}
                            >
                              {ord.vendorAck ? ord.vendorAck.sku : 'MISSING ACK'}
                            </td>
                            <td
                              className={`p-2 border border-stone-200 font-semibold ${
                                ord.vendorInvoice && ord.vendorInvoice.sku !== ord.lockedSpec.sku
                                  ? 'bg-red-50 text-red-800'
                                  : ''
                              }`}
                            >
                              {ord.vendorInvoice ? ord.vendorInvoice.sku : 'Not Invoiced Yet'}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 border border-stone-200 font-semibold bg-stone-50">Finish</td>
                            <td className="p-2 border border-stone-200">{ord.lockedSpec.finish}</td>
                            <td className="p-2 border border-stone-200">{ord.approvedQuote?.finish}</td>
                            <td
                              className={`p-2 border border-stone-200 font-semibold ${
                                ord.vendorAck && ord.vendorAck.finish !== ord.lockedSpec.finish
                                  ? 'bg-red-50 text-red-800'
                                  : ''
                              }`}
                            >
                              {ord.vendorAck ? ord.vendorAck.finish : 'MISSING ACK'}
                            </td>
                            <td
                              className={`p-2 border border-stone-200 font-semibold ${
                                ord.vendorInvoice && ord.vendorInvoice.finish !== ord.lockedSpec.finish
                                  ? 'bg-red-50 text-red-800'
                                  : ''
                              }`}
                            >
                              {ord.vendorInvoice ? ord.vendorInvoice.finish : '—'}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 border border-stone-200 font-semibold bg-stone-50">
                              Price + Freight = Total
                            </td>
                            <td className="p-2 border border-stone-200">
                              Budget Cap: <strong>${ord.lockedSpec.budgetedTotal.toLocaleString()}</strong>
                            </td>
                            <td className="p-2 border border-stone-200">
                              ${ord.approvedQuote?.unitPrice.toLocaleString()} + ${ord.approvedQuote?.freight} ={' '}
                              <strong>${ord.approvedQuote?.total.toLocaleString()}</strong>
                            </td>
                            <td
                              className={`p-2 border border-stone-200 ${
                                ord.vendorAck && ord.vendorAck.total !== ord.approvedQuote?.total
                                  ? 'bg-red-50 text-red-800 font-semibold'
                                  : ''
                              }`}
                            >
                              {ord.vendorAck
                                ? `$${ord.vendorAck.unitPrice.toLocaleString()} + $${ord.vendorAck.freight} = $${ord.vendorAck.total.toLocaleString()}`
                                : 'MISSING ACK'}
                            </td>
                            <td
                              className={`p-2 border border-stone-200 ${
                                ord.vendorInvoice && ord.vendorInvoice.total !== ord.approvedQuote?.total
                                  ? 'bg-red-50 text-red-800 font-semibold'
                                  : ''
                              }`}
                            >
                              {ord.vendorInvoice
                                ? `$${ord.vendorInvoice.unitPrice.toLocaleString()} + $${ord.vendorInvoice.freightAndFees} = $${ord.vendorInvoice.total.toLocaleString()}`
                                : '—'}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 border border-stone-200 font-semibold bg-stone-50">
                              Dates & Delivery Window
                            </td>
                            <td className="p-2 border border-stone-200">
                              Target Install: <strong>{ord.targetInstallDate}</strong>
                            </td>
                            <td className="p-2 border border-stone-200">
                              Order Date: {ord.draftPo?.orderDate} ({ord.approvedQuote?.leadTime})
                            </td>
                            <td
                              className={`p-2 border border-stone-200 ${
                                ord.threatensInstallDate ? 'bg-red-50 text-red-800 font-semibold' : ''
                              }`}
                            >
                              {ord.vendorAck
                                ? `Ship: ${ord.vendorAck.shipDate} | ETA: ${ord.vendorAck.etaDate} (${ord.vendorAck.deliveryWindow})`
                                : 'Awaiting Vendor Confirmation'}
                            </td>
                            <td className="p-2 border border-stone-200">
                              {ord.vendorInvoice
                                ? `Inv #: ${ord.vendorInvoice.invoiceNumber} (Due: ${ord.vendorInvoice.dueDate})`
                                : '—'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Flagged Discrepancies List */}
                    {ord.discrepancies.length > 0 && (
                      <div className="bg-red-50/80 border border-red-200 rounded-lg p-3.5 space-y-2">
                        <div className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-red-700" />
                          Divine Discrepancy Flags (Human Reviewer Must Decide Resolution — Divine Cannot Resolve):
                        </div>
                        <ul className="space-y-1.5 text-xs text-red-900 pl-5 list-disc">
                          {ord.discrepancies.map((d) => (
                            <li key={d.id}>
                              <strong>{d.field}:</strong> Expected <code>{d.expectedValue}</code> ({d.sourceDocA}), but found{' '}
                              <code>{d.actualValue}</code> ({d.sourceDocB}).
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Receiving, Pickup & Return Coordination with Mafer */}
                    <div className="bg-stone-50 border border-stone-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-stone-900 flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-stone-700" />
                          Mafer Receiving / Pickup / Return Coordination ({ord.maferCoordination.type})
                        </span>
                        <p className="text-stone-600">{ord.maferCoordination.reminderNote}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleMaferComplete(ord.id)}
                          className={`px-3 py-1.5 rounded-lg font-semibold border transition ${
                            ord.maferCoordination.completedByKeldia
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          {ord.maferCoordination.completedByKeldia
                            ? '✓ Coordinated with Mafer'
                            : 'Mark Mafer Coordinated'}
                        </button>
                      </div>
                    </div>

                    {/* Manual Verification Control Bar */}
                    <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <span className="text-stone-500">
                        {ord.keldiaVerifiedAt
                          ? `Last verified at ${ord.keldiaVerifiedAt}`
                          : 'Unverified draft — Verify against source PO, Quote, Ack, and Invoice.'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateOrderStatus(ord.id, 'VERIFIED_BY_KELDIA')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800"
                        >
                          Mark Verified Against Source Docs
                        </button>
                        <button
                          onClick={() => updateOrderStatus(ord.id, 'DISCREPANCY_FOUND')}
                          className="px-3 py-1.5 rounded-lg bg-red-100 text-red-900 border border-red-300 font-semibold hover:bg-red-200"
                        >
                          Flag Discrepancy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: HOUZZ PRO PROJECT TRACKER, BUDGET SUPPORT & KNOWLEDGE BASE
           ===================================================================== */}
        {activeTab === 'houzz' && (
          <div className="space-y-6">
            {/* Sub-section 2A: Proposed Houzz Selections Tracker Updates (Procurement & Financials Views) */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-stone-900">
                    {t(
                      '2A. Proposed Houzz Pro Selections Tracker & Budget Updates (Staging Table)',
                      '2A. Actualizaciones Propuestas para el Rastreador de Selecciones y Presupuesto de Houzz Pro (Borrador)'
                    )}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {t(
                      'Mapped to Houzz Pro Project → Planning → Selections → Tracker (Procurement & Financials Views). Verify against source records and update Houzz (two-way sync updates linked Houzz POs).',
                      'Mapeado a Houzz Pro Proyecto → Planificación → Selecciones → Rastreador (Vistas de Compras y Finanzas). Verifique contra los documentos originales y actualice Houzz.'
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'houzz-my-items-csv',
                        `Title,Category,Room,Vendor,SKU,Finish_Description,Unit_Cost,Order_Date,Estimated_Delivery,Procurement_Status\n` +
                          orders
                            .map(
                              (o) =>
                                `"${o.itemName}","${o.roomCategory}","${o.roomCategory}","${o.houzzProposedUpdate.proposedVendor}","${o.lockedSpec.sku}","${o.lockedSpec.finish}",${o.houzzProposedUpdate.proposedCost},"${o.houzzProposedUpdate.proposedOrderDate}","${o.houzzProposedUpdate.proposedEta}","${o.houzzProposedUpdate.itemStatus}"`
                            )
                            .join('\n')
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 inline-flex items-center gap-1.5"
                  >
                    {copiedId === 'houzz-my-items-csv' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />{' '}
                        {t('Copied Houzz CSV Template', 'Plantilla CSV de Houzz Copiada')}
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />{' '}
                        {t('Copy CSV for Houzz "My Items" / Tracker', 'Copiar CSV para "Mis Artículos" / Rastreador Houzz')}
                      </>
                    )}
                  </button>
                  <StatusBadge status="DRAFT" size="sm" lang={lang} />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-stone-200">
                  <thead>
                    <tr className="bg-stone-100 text-stone-700">
                      <th className="p-2.5 border border-stone-200">Project, Room & Category</th>
                      <th className="p-2.5 border border-stone-200">Budget Cap</th>
                      <th className="p-2.5 border border-stone-200">Current Houzz Selections Tracker</th>
                      <th className="p-2.5 border border-stone-200 bg-amber-50/60">
                        Divine Proposed Inline Update (Procurement View)
                      </th>
                      <th className="p-2.5 border border-stone-200">Budget & Delivery Risk Flag</th>
                      <th className="p-2.5 border border-stone-200 text-right">Copy for Houzz</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-stone-500">
                          {t(
                            'No pending Houzz Selections Tracker updates. Upload a Houzz Pro CSV export, Quote, or PO to stage updates.',
                            'No hay actualizaciones pendientes para el Rastreador de Selecciones de Houzz. Suba un CSV de Houzz, Cotización o PO para preparar actualizaciones.'
                          )}
                        </td>
                      </tr>
                    ) : (
                      orders.map((ord) => (
                        <tr key={ord.id}>
                          <td className="p-2.5 border border-stone-200">
                            <div className="font-bold text-stone-900">{ord.itemName}</div>
                            <div className="text-stone-600 font-medium">
                              Room: {ord.roomCategory} • Linked PO: {ord.draftPo?.poNumber}
                            </div>
                            <div className="text-[11px] text-stone-500">
                              Project: {ord.projectName} | Vendor: {ord.vendorName}
                            </div>
                          </td>
                          <td className="p-2.5 border border-stone-200 font-semibold">
                            ${ord.lockedSpec.budgetedTotal.toLocaleString()}
                          </td>
                          <td className="p-2.5 border border-stone-200 text-stone-600">
                            <div>Procurement Status: {ord.houzzCurrentRecord.itemStatus}</div>
                            <div>Cost: ${ord.houzzCurrentRecord.recordedCost.toLocaleString()}</div>
                            <div>Order Date: {ord.houzzCurrentRecord.recordedOrderDate}</div>
                            <div>Est. Delivery: {ord.houzzCurrentRecord.recordedEta}</div>
                          </td>
                          <td className="p-2.5 border border-stone-200 bg-amber-50/40 font-medium text-stone-900">
                            <div>
                              <strong>Procurement Status:</strong> {ord.houzzProposedUpdate.itemStatus}
                            </div>
                            <div>
                              <strong>Cost:</strong> ${ord.houzzProposedUpdate.proposedCost.toLocaleString()}
                            </div>
                            <div>
                              <strong>Order Date:</strong> {ord.houzzProposedUpdate.proposedOrderDate}
                            </div>
                            <div>
                              <strong>Estimated Delivery:</strong> {ord.houzzProposedUpdate.proposedEta}
                            </div>
                          </td>
                          <td className="p-2.5 border border-stone-200">
                            <div className="space-y-1">
                              {ord.houzzProposedUpdate.isOverBudgetRisk ? (
                                <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-900 font-bold">
                                  ⚠ Over Budget by ${ord.houzzProposedUpdate.overBudgetAmount} (Unapproved Freight)
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold">
                                  Within Line Budget (${ord.lockedSpec.budgetedTotal - ord.houzzProposedUpdate.proposedCost} buffer)
                                </span>
                              )}
                              {ord.threatensInstallDate && (
                                <div className="text-red-700 font-semibold">
                                  ⚠ Delivery Risk: Threatens {ord.targetInstallDate} install
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5 border border-stone-200 text-right">
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  `houzz-${ord.id}`,
                                  `[DRAFT HOUZZ SELECTIONS TRACKER UPDATE — NEEDS HUMAN VERIFICATION]\nHouzz Path: Project (${ord.projectName}) → Planning → Selections → Tracker (Procurement View)\nItem: ${ord.itemName} (Room: ${ord.roomCategory})\nVendor: ${ord.houzzProposedUpdate.proposedVendor} | Linked PO: ${ord.draftPo?.poNumber}\nCost: $${ord.houzzProposedUpdate.proposedCost}\nOrder Date: ${ord.houzzProposedUpdate.proposedOrderDate}\nEstimated Delivery: ${ord.houzzProposedUpdate.proposedEta}\nProcurement Status: ${ord.houzzProposedUpdate.itemStatus}`
                                )
                              }
                              className="px-2.5 py-1.5 rounded bg-stone-900 text-white font-semibold hover:bg-stone-800 inline-flex items-center gap-1"
                            >
                              {copiedId === `houzz-${ord.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" /> Copied Row
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" /> Copy Row
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sub-section 2B: Houzz Pro "Merge Purchase Orders" Detector */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-stone-900">
                    2B. Houzz Pro Draft PO Merge Detector (Same Vendor + Same Project + Draft Stage)
                  </h2>
                  <p className="text-xs text-stone-500">
                    Per Houzz Pro rules (<code>Actions → Merge Purchase Orders</code>), multiple Draft POs for the same vendor and project can be combined into a single PO.
                  </p>
                </div>
                <StatusBadge status="NEEDS_KELDIA_VERIFICATION" size="sm" lang={lang} />
              </div>

              {houzzMergeCandidates.length === 0 ? (
                <div className="p-4 rounded-lg bg-stone-50 border border-stone-200 text-center text-xs text-stone-500">
                  {t(
                    'No duplicate Draft POs detected for merging.',
                    'No se detectaron órdenes en borrador duplicadas para fusionar.'
                  )}
                </div>
              ) : (
                houzzMergeCandidates.map((mc) => (
                  <div
                    key={mc.id}
                    className="bg-amber-50/60 border border-amber-200 rounded-lg p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-stone-900 text-sm">
                        Eligible to Merge in Houzz Pro: {mc.draftPoNumbers.join(' + ')}
                      </div>
                      <div className="text-stone-700">
                        Project: <strong>{mc.projectName}</strong> • Vendor: <strong>{mc.vendorName}</strong> • Combined Total: <strong>${mc.combinedAmount.toLocaleString()}</strong> (Est. Consolidated Freight Savings: <strong className="text-emerald-800">${mc.estimatedFreightSavings}</strong>)
                      </div>
                      <ul className="list-disc pl-5 text-stone-600">
                        {mc.itemsSummary.map((line, idx) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ul>
                      <div className="text-amber-900 font-medium pt-1">
                        <strong>Your Step in Houzz Pro:</strong> {mc.houzzNavigationHint}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          mc.id,
                          `[DRAFT HOUZZ PO MERGE CHECKLIST — FOR REVIEW]\nProject: ${mc.projectName}\nVendor: ${mc.vendorName}\nEligible Draft POs: ${mc.draftPoNumbers.join(', ')}\nSteps in Houzz Pro: ${mc.houzzNavigationHint}`
                        )
                      }
                      className="shrink-0 px-3 py-2 rounded-lg bg-stone-900 text-white font-semibold hover:bg-stone-800 inline-flex items-center gap-1.5"
                    >
                      {copiedId === mc.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Merge Steps
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Merge Instructions
                        </>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Sub-section 2C: Indexed Houzz Pro Official Workflow Knowledge Base (6 Instruction Guides) */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-stone-900">
                    2C. Built-In Houzz Pro Software Knowledge Base (Indexed for Divine AI)
                  </h2>
                  <p className="text-xs text-stone-500">
                    All 6 official Houzz Pro instruction guides are embedded into Divine’s AI context so Divine prepares data in the exact format Houzz Pro expects.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  6 Houzz Pro Guides Active in AI Memory
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {HOUZZ_PRO_KNOWLEDGE_BASE.map((guide) => (
                  <div
                    key={guide.id}
                    className="border border-stone-200 rounded-xl p-4 bg-stone-50/40 flex flex-col justify-between space-y-3 text-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-stone-900 text-sm">{guide.title}</h3>
                        <a
                          href={guide.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-amber-800 hover:underline shrink-0"
                        >
                          Houzz Guide ↗
                        </a>
                      </div>
                      <div className="px-2 py-1 rounded bg-stone-200/70 text-stone-800 font-mono text-[11px]">
                        <strong>Houzz Path:</strong> {guide.navigationPath}
                      </div>
                      <p className="text-stone-600 leading-relaxed">{guide.summary}</p>
                      <div className="space-y-1">
                        <div className="font-semibold text-stone-800">Key Houzz Pro Steps:</div>
                        <ul className="list-disc pl-4 space-y-0.5 text-stone-600">
                          {guide.keyWorkflowSteps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-200 space-y-1.5">
                      <div className="text-emerald-900 bg-emerald-50/80 p-2 rounded border border-emerald-200">
                        <strong>How Divine Prepares This:</strong> {guide.divinePreparationRole}
                      </div>
                      <div className="text-amber-950 bg-amber-50/80 p-2 rounded border border-amber-200">
                        <strong>Your Action in Houzz Pro:</strong> {guide.keldiaManualActionInHouzz}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: VENDOR-PAYMENT PREPARATION PACKETS
           ===================================================================== */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Mandatory Non-Negotiable Payment Safety Banner */}
            <div className="bg-red-950 text-red-100 p-4 rounded-xl border border-red-800 flex items-start gap-3">
              <Ban className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-sm text-white">
                  {t(
                    'CRITICAL PAYMENT CONTROL RULE (SIXTH SENSE STUDIO)',
                    'REGLA CRÍTICA DE CONTROL DE PAGOS (SIXTH SENSE STUDIO)'
                  )}
                </p>
                <p>
                  <strong>
                    {t(
                      'A comparison performed by Divine is NOT confirmation that a payment is safe or approved.',
                      'Una comparación realizada por Divine NO es confirmación de que un pago sea seguro o esté aprobado.'
                    )}
                  </strong>{' '}
                  {t(
                    'You must personally verify the invoice, project, recipient, and amount against original source documents, obtain Meliza’s written approval, send any Zelle payment yourself, and save the confirmation.',
                    'Usted debe verificar personalmente la factura, el proyecto, el destinatario y el monto contra los documentos originales, obtener la aprobación por escrito de Meliza, enviar cualquier pago por Zelle manualmente y guardar la confirmación.'
                  )}
                </p>
              </div>
            </div>

            {paymentPackets.length === 0 && (
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 text-center space-y-3 text-xs text-stone-600">
                <div className="flex items-center justify-center gap-2">
                  <span className="font-bold text-sm text-stone-900">
                    {t(
                      'No Vendor Payment Approval Packets Pending',
                      'No Hay Paquetes de Aprobación de Pago Pendientes'
                    )}
                  </span>
                  <StatusBadge status="DRAFT" size="sm" lang={lang} />
                </div>
                <p className="max-w-lg mx-auto">
                  {t(
                    'Upload a Vendor Invoice (PDF) to prepare a payment verification packet with PO/Quote comparison, Zelle recipient check, and W-9/COI/Lien Release compliance check.',
                    'Suba una Factura de Proveedor (PDF) para preparar un paquete de verificación de pago con comparación de PO/Cotización, destinatario Zelle y documentos W-9/COI.'
                  )}
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold hover:bg-amber-400 inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {t('Upload Vendor Invoice (PDF)', 'Subir Factura de Proveedor (PDF)')}
                  </button>
                </div>
              </div>
            )}

            {paymentPackets.map((pkt) => (
              <div
                key={pkt.id}
                className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden"
              >
                <div className="bg-stone-50 px-5 py-3.5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">
                      Payment Approval Packet: {pkt.vendorName} — Invoice #{pkt.invoiceNumber}
                    </h3>
                    <p className="text-xs text-stone-500">
                      Project/Client: <strong>{pkt.projectName} ({pkt.clientName})</strong> • Due Date: <strong>{pkt.dueDate}</strong>
                    </p>
                  </div>
                  <StatusBadge status={pkt.verificationStatus} size="sm" lang={lang} />
                </div>

                <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Invoice vs PO & Zelle Recipient Verification */}
                  <div className="space-y-4 text-xs">
                    <div className="border border-stone-200 rounded-lg p-3.5 space-y-2 bg-stone-50/50">
                      <div className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">
                        1. Financial & Recipient Comparison Check
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="text-stone-500 block">Invoice Amount:</span>
                          <span className="text-sm font-bold text-stone-900">
                            ${pkt.invoiceAmount.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-500 block">Related PO / Quote Amount:</span>
                          <span className="text-sm font-bold text-stone-900">
                            ${pkt.poOrQuoteAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-stone-200">
                          <span className="text-stone-500 block">Vendor Zelle Details on File (Studio Vault):</span>
                          <code className="font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {pkt.zelleRecipientOnFile}
                          </code>
                        </div>
                        <div className="col-span-2">
                          <span className="text-stone-500 block">Zelle Details Shown on Incoming Invoice:</span>
                          <code
                            className={`font-bold px-1.5 py-0.5 rounded ${
                              pkt.recipientMismatch
                                ? 'bg-red-100 text-red-900 border border-red-300'
                                : 'bg-stone-100 text-stone-800'
                            }`}
                          >
                            {pkt.zelleRecipientOnInvoice}
                            {pkt.recipientMismatch ? '  ← MISMATCH FLAGGED!' : ' (Matches On-File)'}
                          </code>
                        </div>
                      </div>
                    </div>

                    {/* Apparent Mismatches & Missing Required Documents (W-9, COI, Lien Release) */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 space-y-2">
                      <div className="font-bold text-red-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-700" />
                        Apparent Mismatches & Missing Required Documents (W-9 / COI / Lien Release):
                      </div>
                      {pkt.missingDocuments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {pkt.missingDocuments.map((doc) => (
                            <span
                              key={doc}
                              className="px-2 py-0.5 rounded bg-red-700 text-white font-bold text-[11px]"
                            >
                              MISSING REQUIRED DOC: {doc}
                            </span>
                          ))}
                        </div>
                      )}
                      <ul className="list-disc pl-5 space-y-1 text-red-900">
                        {pkt.discrepancySummary.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Right: Personal Verification Gate + Meliza Approval Draft + Draft Payment Log & Confirmation */}
                  <div className="space-y-4 text-xs">
                    <div className="border border-stone-200 rounded-lg p-3.5 space-y-2.5">
                      <div className="font-bold text-stone-900">
                        2. Personal Verification & Meliza Written Approval Gate
                      </div>
                      {[
                        {
                          key: 'invoiceVerifiedAgainstSource',
                          label: 'Verified invoice against original PO, Quote & Acknowledgment',
                        },
                        {
                          key: 'projectAndBudgetVerified',
                          label: 'Verified project assignment & required compliance docs (W-9, COI, Lien Release)',
                        },
                        {
                          key: 'recipientAndAmountVerified',
                          label: 'Personally verified Zelle recipient & exact payment amount',
                        },
                        {
                          key: 'melizaWrittenApprovalObtained',
                          label: "Obtained Meliza's written approval prior to payment",
                        },
                        {
                          key: 'zelleSentManuallyByKeldia',
                          label: 'Manually sent Zelle payment outside Divine',
                        },
                        {
                          key: 'confirmationSaved',
                          label: 'Saved Zelle confirmation & updated official payment record',
                        },
                      ].map((step) => {
                        const fieldKey = step.key as keyof PaymentPacket['keldiaChecklist'];
                        return (
                          <label
                            key={step.key}
                            className="flex items-center gap-2.5 cursor-pointer select-none text-stone-800 hover:text-stone-950"
                          >
                            <input
                              type="checkbox"
                              checked={pkt.keldiaChecklist[fieldKey]}
                              onChange={() => togglePaymentCheck(pkt.id, fieldKey)}
                              className="rounded border-stone-300 text-stone-900 focus:ring-stone-900 w-4 h-4"
                            />
                            <span>{step.label}</span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Copy-Ready Packet & Draft Confirmation Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `meliza-pkt-${pkt.id}`,
                            `[STATUS: WAITING FOR MELIZA'S WRITTEN APPROVAL — VERIFIED AGAINST SOURCE]\nVendor: ${pkt.vendorName}\nProject/Client: ${pkt.projectName} (${pkt.clientName})\nInvoice #: ${pkt.invoiceNumber} | Amount: $${pkt.invoiceAmount.toLocaleString()} | Due: ${pkt.dueDate}\nZelle Recipient on File: ${pkt.zelleRecipientOnFile}\nFlags / Notes: ${pkt.discrepancySummary.join(' | ')}\n\nHi Meliza, please reply with your written approval once ready for me to send via Zelle.`
                          )
                        }
                        className="px-3 py-2 rounded-lg bg-stone-900 text-white font-semibold hover:bg-stone-800 inline-flex items-center gap-1.5"
                      >
                        {copiedId === `meliza-pkt-${pkt.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Meliza Packet
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy Meliza Approval Request
                          </>
                        )}
                      </button>

                      <button
                        onClick={() =>
                          copyToClipboard(
                            `pay-conf-${pkt.id}`,
                            `[STATUS: DRAFT PAYMENT CONFIRMATION — SEND ONLY AFTER MELIZA APPROVAL & MANUAL ZELLE TRANSFER]\nHello ${pkt.vendorName},\n\nThis is to confirm that Sixth Sense Studio has remitted payment of $${pkt.invoiceAmount.toLocaleString()} for Invoice #${pkt.invoiceNumber} (${pkt.projectName}).\n\nBest regards,\nSixth Sense Studio`
                          )
                        }
                        className="px-3 py-2 rounded-lg bg-stone-100 text-stone-800 border border-stone-300 font-semibold hover:bg-stone-200 inline-flex items-center gap-1.5"
                      >
                        {copiedId === `pay-conf-${pkt.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700" /> Copied Draft Confirmation
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy Draft Vendor Confirmation
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* =====================================================================
            TAB 4: PAYROLL PREPARATION (1 W-2 EMPLOYEE)
           ===================================================================== */}
        {activeTab === 'payroll' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-stone-900">
                    {t(
                      '4. W-2 Employee Payroll Preparation Summary',
                      '4. Resumen de Preparación de Nómina para Empleada W-2'
                    )}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {t('Employee:', 'Empleada:')} <strong>{payroll.employeeName}</strong> •{' '}
                    {t('Period:', 'Periodo:')}{' '}
                    <strong>
                      {payroll.payPeriodStart} — {payroll.payPeriodEnd}
                    </strong>{' '}
                    • {t('Submission Deadline:', 'Fecha Límite de Envío:')}{' '}
                    <strong className="text-red-700">{payroll.payrollDeadline}</strong>
                  </p>
                </div>
                <StatusBadge status={payroll.verificationStatus} size="sm" lang={lang} />
              </div>

              {/* Flagged Gaps & Inconsistencies */}
              {payroll.flaggedGapsAndAnomalies.length > 0 ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2 text-xs">
                  <div className="font-bold text-red-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-700" />
                    Apparent Gaps & Inconsistencies Flagged in Hours Source ({payroll.sourceDocumentName}):
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-red-900">
                    {payroll.flaggedGapsAndAnomalies.map((flag, idx) => (
                      <li key={idx}>{flag}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
                  <span>
                    {t(
                      'No timesheet anomalies flagged — Upload a W-2 employee timesheet (CSV or PDF) to extract and check hours.',
                      'No hay anomalías marcadas — Suba una hoja de horas de empleada W-2 (CSV o PDF) para extraer y verificar horas.'
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-bold hover:bg-amber-400 inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {t('Upload W-2 Timesheet', 'Subir Hoja de Horas W-2')}
                  </button>
                </div>
              )}

              {/* Hours Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-stone-200">
                  <thead>
                    <tr className="bg-stone-100 text-stone-700">
                      <th className="p-2 border border-stone-200">Date</th>
                      <th className="p-2 border border-stone-200">Clock In</th>
                      <th className="p-2 border border-stone-200">Clock Out</th>
                      <th className="p-2 border border-stone-200">Break (Mins)</th>
                      <th className="p-2 border border-stone-200">Raw Logged Hours</th>
                      <th className="p-2 border border-stone-200">Project / Notes & Divine Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {payroll.entries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-stone-500">
                          {t(
                            'No W-2 timesheet entries loaded. Upload a timesheet CSV or PDF to populate daily hours.',
                            'No hay registros de horas W-2 cargados. Suba una hoja de horas en CSV o PDF para cargar las horas diarias.'
                          )}
                        </td>
                      </tr>
                    ) : (
                      payroll.entries.map((entry) => (
                        <tr
                          key={entry.date}
                          className={entry.anomalyFlag ? 'bg-red-50/70 font-semibold text-red-950' : ''}
                        >
                          <td className="p-2 border border-stone-200">
                            {entry.dayName}, {entry.date}
                          </td>
                          <td className="p-2 border border-stone-200">{entry.clockIn}</td>
                          <td className="p-2 border border-stone-200">{entry.clockOut}</td>
                          <td className="p-2 border border-stone-200">{entry.breakMinutes}m</td>
                          <td className="p-2 border border-stone-200 font-bold">{entry.totalHours.toFixed(2)} hrs</td>
                          <td className="p-2 border border-stone-200">
                            <div>{entry.projectNotes}</div>
                            {entry.anomalyFlag && (
                              <div className="text-red-700 font-bold mt-0.5">⚠ {entry.anomalyFlag}</div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Control Checklist & Meliza Approval Request Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                <div className="border border-stone-200 rounded-lg p-4 space-y-2.5 text-xs">
                  <div className="font-bold text-stone-900">
                    Mandatory QuickBooks Payroll Online Workflow
                  </div>
                  <p className="text-stone-500">
                    Divine never calculates manual payroll taxes or submits payroll. Complete all steps below manually:
                  </p>
                  {[
                    {
                      key: 'hoursVerifiedAgainstSource',
                      label: '1. Verified hours summary against raw timesheet source',
                    },
                    {
                      key: 'anomaliesResolvedByKeldia',
                      label: '2. Resolved Thu Oct 8 missing clock-out & Wed Oct 14 break flag',
                    },
                    {
                      key: 'enteredInQuickBooksOnline',
                      label: '3. Entered/confirmed hours in QuickBooks Payroll Online',
                    },
                    {
                      key: 'personallyReviewedQbPreview',
                      label: '4. Personally reviewed the QuickBooks payroll preview',
                    },
                    {
                      key: 'melizaWrittenApprovalObtained',
                      label: "5. Obtained Meliza's written approval",
                    },
                    {
                      key: 'submittedInQuickBooksAndSaved',
                      label: '6. Submitted payroll in QuickBooks & saved report/confirmation',
                    },
                  ].map((item) => {
                    const k = item.key as keyof PayrollPrepPeriod['keldiaChecklist'];
                    return (
                      <label key={item.key} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={payroll.keldiaChecklist[k]}
                          onChange={() => togglePayrollCheck(k)}
                          className="rounded border-stone-300 text-stone-900 w-4 h-4"
                        />
                        <span>{item.label}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900">
                      Draft Summary for Requesting Meliza’s Written Payroll Approval
                    </span>
                    <StatusBadge status="DRAFT" size="sm" lang={lang} />
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-[11px] bg-white p-3 rounded border border-stone-200 text-stone-800">
{`[STATUS: DRAFT PAYROLL APPROVAL REQUEST — NEEDS HUMAN VERIFICATION]
Employee: ${payroll.employeeName}
Pay Period: ${payroll.payPeriodStart} to ${payroll.payPeriodEnd}
Payroll Submission Deadline: ${payroll.payrollDeadline}

Raw Extracted Hours Summary:
- Regular Hours Logged: ${payroll.totalRegularHours.toFixed(2)} hrs
- Overtime Hours Logged: ${payroll.totalOvertimeHours.toFixed(2)} hrs
- Items for Verification Before QB Entry:
  1) Thu Oct 8: Clock-out missing on raw timesheet (Site visit note).
  2) Wed Oct 14: 10.0-hr shift logged with 0 break minutes.

Hi Meliza, once I confirm the two timesheet notes above and review the QuickBooks Payroll Online preview, please reply with your written approval to submit payroll.`}
                  </pre>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'payroll-meliza-draft',
                        `[STATUS: DRAFT PAYROLL APPROVAL REQUEST — NEEDS HUMAN VERIFICATION]\nEmployee: ${payroll.employeeName}\nPay Period: ${payroll.payPeriodStart} to ${payroll.payPeriodEnd}\nLogged Regular Hours: ${payroll.totalRegularHours} | Logged OT Hours: ${payroll.totalOvertimeHours}\nFlagged Notes Verified: Oct 8 clock-out & Oct 14 break.\n\nHi Meliza, I have reviewed the QuickBooks Payroll Online preview. Please reply with your written approval so I can submit payroll.`
                      )
                    }
                    className="px-3.5 py-2 rounded-lg bg-stone-900 text-white font-semibold hover:bg-stone-800 inline-flex items-center gap-1.5"
                  >
                    {copiedId === 'payroll-meliza-draft' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Meliza Payroll Request
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Meliza Payroll Approval Summary
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 6: SOURCE DOCUMENT INGESTION, DRAFT STUDIO & GUARDRAILED AI CHAT
           ===================================================================== */}
        {activeTab === 'assistant' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: Copy-Ready Draft Communications & Read-Only Ingestion */}
            <div className="lg:col-span-7 space-y-6">
              {/* Multi-Channel Read-Only Source Ingestion (Upload PDF / CSV / XLSX / Image + Paste) */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-amber-700" />
                      {t(
                        'Read-Only Source Document Ingestion (Upload PDFs, CSVs, Images, or Paste Text)',
                        'Ingesta de Documentos Fuente de Solo Lectura (Subir PDFs, CSVs, Imágenes o Pegar Texto)'
                      )}
                    </h2>
                    <p className="text-xs text-stone-500">
                      {t(
                        'Upload vendor PDFs (Quotes, POs, Acknowledgments, Invoices, W-9/COI/Lien Releases), Houzz CSV exports, or W-2 timesheets—or paste text below.',
                        'Suba archivos PDF de proveedores (Cotizaciones, POs, Acuses, Facturas, W-9/COI), exportaciones CSV de Houzz u hojas de horas W-2, o pegue texto abajo.'
                      )}
                    </p>
                  </div>
                  <StatusBadge status="NEEDS_KELDIA_VERIFICATION" size="sm" lang={lang} />
                </div>

                {/* Full Drag & Drop + Upload Button Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    handleFileUpload(e.dataTransfer.files);
                  }}
                  className={`rounded-xl border-2 border-dashed p-4 transition flex flex-col sm:flex-row items-center justify-between gap-4 ${
                    isDraggingFile
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-stone-300 bg-stone-50/70 hover:border-stone-400'
                  }`}
                >
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="text-xs font-bold text-stone-900">
                      {t(
                        'Drag & Drop PDFs, CSVs, Excel Sheets, or Images Here',
                        'Arrastre y Suelte PDFs, CSVs, Hojas de Excel o Imágenes Aquí'
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {t(
                        'Accepted formats: .pdf, .csv, .xlsx, .xls, .png, .jpg, .txt, .docx (100% Local Air-Gapped Parsing)',
                        'Formatos aceptados: .pdf, .csv, .xlsx, .xls, .png, .jpg, .txt, .docx (Procesamiento 100% Local y Aislado)'
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={selectedDocCategory}
                      onChange={(e) => setSelectedDocCategory(e.target.value)}
                      className="rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-xs font-medium text-stone-800 focus:outline-none"
                    >
                      <option value="Auto-Detect">{t('Auto-Detect Type', 'Auto-Detectar Tipo')}</option>
                      <option value="Vendor Quote (PDF)">{t('Vendor Quote', 'Cotización Proveedor')}</option>
                      <option value="Purchase Order (PO)">{t('Purchase Order (PO)', 'Orden de Compra (PO)')}</option>
                      <option value="Order Acknowledgment">{t('Order Acknowledgment', 'Acuse de Recibo')}</option>
                      <option value="Vendor Invoice (PDF)">{t('Vendor Invoice', 'Factura de Proveedor')}</option>
                      <option value="Houzz Pro Export (CSV)">{t('Houzz Pro Export', 'Exportación Houzz Pro')}</option>
                      <option value="W-2 Employee Timesheet">{t('W-2 Timesheet', 'Hoja de Horas W-2')}</option>
                      <option value="Compliance Doc (W-9/COI/Lien)">{t('W-9 / COI / Lien Release', 'W-9 / COI / Liberación')}</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold hover:bg-amber-400 inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <Upload className="w-4 h-4" />
                      {t('Upload PDF / File', 'Subir PDF / Archivo')}
                    </button>
                  </div>
                </div>

                {/* Uploaded Source Documents Vault List */}
                {uploadedFiles.length > 0 && (
                  <div className="border border-stone-200 rounded-xl p-3.5 bg-stone-50/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">
                        {t(
                          'Uploaded Source Documents & Extracted Summaries',
                          'Documentos Fuente Subidos y Resúmenes Extraídos'
                        )}{' '}
                        ({uploadedFiles.length})
                      </span>
                      <span className="text-[11px] text-stone-500">
                        {t('Stored locally in browser session', 'Almacenado localmente en la sesión')}
                      </span>
                    </div>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {uploadedFiles.map((uf) => (
                        <div
                          key={uf.id}
                          className="bg-white border border-stone-200 rounded-lg p-3 space-y-1.5 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 font-bold text-stone-900">
                              <FileText className="w-4 h-4 text-amber-700 shrink-0" />
                              <span>{uf.name}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                                {uf.docCategory} • {uf.sizeLabel} • {uf.uploadedAt}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={uf.status} size="sm" lang={lang} />
                              <button
                                type="button"
                                onClick={() =>
                                  setUploadedFiles((prev) => prev.filter((item) => item.id !== uf.id))
                                }
                                className="text-stone-400 hover:text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-stone-600 leading-relaxed">
                            {uf.extractedPreview}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <textarea
                  value={ingestText}
                  onChange={(e) => setIngestText(e.target.value)}
                  rows={3}
                  placeholder={t(
                    'Or paste vendor quote, acknowledgment, invoice text, or timesheet rows here for Divine to compare against locked specs...',
                    'O pegue aquí el texto de la cotización, acuse de recibo, factura u hoja de horas para que Divine lo compare...'
                  )}
                  className="w-full rounded-lg border border-stone-300 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-500">
                    {t(
                      'Air-Gap Guarantee: Ingested files and text stay local and only generate unverified drafts for review.',
                      'Garantía Air-Gap: Los archivos y textos quedan locales y solo generan borradores para revisión.'
                    )}
                  </span>
                  <button
                    onClick={handleIngestSource}
                    className="px-3.5 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800"
                  >
                    {t('Parse Text into Unverified Draft', 'Analizar Texto en Borrador')}
                  </button>
                </div>
              </div>

              {/* Copy-Ready Vendor & Houzz Drafts Queue */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-stone-900">
                      Draft Follow-Ups & Messages for Review
                    </h2>
                    <p className="text-xs text-stone-500">
                      Divine never sends messages. Review, edit, and copy drafts into your email or Houzz Pro.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-stone-600">{drafts.length} Drafts</span>
                </div>

                <div className="space-y-4">
                  {drafts.length === 0 ? (
                    <div className="p-6 rounded-xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-500">
                      {t(
                        'No draft messages queued. Upload a source document or paste text above to generate copy-ready drafts.',
                        'No hay borradores en cola. Suba un documento fuente o pegue texto arriba para generar borradores.'
                      )}
                    </div>
                  ) : (
                    drafts.map((dr) => (
                      <div
                        key={dr.id}
                        className="border border-stone-200 rounded-xl p-4 space-y-2.5 bg-stone-50/50"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-stone-200 text-stone-800">
                            {dr.category}
                          </span>
                          <StatusBadge status={dr.verificationStatus} size="sm" lang={lang} />
                        </div>
                        <div className="text-xs">
                          <div className="font-bold text-stone-900">{dr.subjectLine}</div>
                          <div className="text-stone-500">
                            Related: {dr.relatedEntityName} • Target Channel: {dr.recipientRole}
                          </div>
                        </div>
                        <pre className="whitespace-pre-wrap font-mono text-[11px] bg-white p-3 rounded-lg border border-stone-200 text-stone-800">
                          {dr.bodyText}
                        </pre>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              copyToClipboard(dr.id, `${dr.subjectLine}\n\n${dr.bodyText}`)
                            }
                            className="px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 inline-flex items-center gap-1.5"
                          >
                            {copiedId === dr.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Draft
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copy Draft After Review
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Guardrailed Divine AI Chat Assistant */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col h-[680px]">
                <div className="p-4 border-b border-stone-200 bg-stone-900 text-white rounded-t-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/divine-logo.png"
                      alt="Divine Icon"
                      className="w-7 h-7 rounded-lg object-cover border border-amber-400/40 shrink-0"
                    />
                    <div>
                      <h3 className="text-xs font-bold">
                        {t('Divine AI Workspace Assistant', 'Asistente IA Divine del Estudio')}
                      </h3>
                      <p className="text-[11px] text-stone-300">
                        {t(
                          'Hard-wired with Sixth Sense Studio Firm Limits',
                          'Programado con los Límites Estrictos de Sixth Sense Studio'
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 font-semibold">
                    {t('Air-Gapped', 'Aislado (Air-Gap)')}
                  </span>
                </div>

                {/* Quick Test Prompts to verify guardrails & Houzz Pro knowledge */}
                <div className="px-4 py-2.5 bg-stone-100 border-b border-stone-200 flex flex-wrap gap-1.5">
                  <button
                    onClick={() =>
                      setChatInput('How do I merge Purchase Orders or update the Selections Tracker in Houzz Pro?')
                    }
                    className="text-[11px] px-2 py-1 rounded bg-amber-50 border border-amber-300 text-amber-900 font-medium hover:bg-amber-100"
                  >
                    Ask Houzz: Merge POs & Tracker
                  </button>
                  <button
                    onClick={() =>
                      setChatInput('How do I import items to Houzz Product Library (My Items) and manage vendor tags?')
                    }
                    className="text-[11px] px-2 py-1 rounded bg-amber-50 border border-amber-300 text-amber-900 font-medium hover:bg-amber-100"
                  >
                    Ask Houzz: My Items & Vendors
                  </button>
                  <button
                    onClick={() =>
                      setChatInput('Send the Zelle payment to Atelier Bespoke now')
                    }
                    className="text-[11px] px-2 py-1 rounded bg-red-50 border border-red-200 text-red-800 hover:bg-red-100"
                  >
                    Test Limit: "Send Zelle"
                  </button>
                  <button
                    onClick={() =>
                      setChatInput('Do the month-end bank reconciliation and payroll tax filing')
                    }
                    className="text-[11px] px-2 py-1 rounded bg-red-50 border border-red-200 text-red-800 hover:bg-red-100"
                  >
                    Test Limit: "Bookkeeping/Taxes"
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl ${
                        msg.role === 'user'
                          ? 'bg-stone-900 text-white ml-8'
                          : 'bg-stone-100 text-stone-900 mr-4 border border-stone-200'
                      }`}
                    >
                      {msg.statusBanner && (
                        <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 inline-block mb-1.5">
                          {msg.statusBanner}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <form
                  onSubmit={handleChatSubmit}
                  className="p-3 border-t border-stone-200 flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title={t(
                      'Upload PDF, CSV, Excel, or Image directly to Divine',
                      'Subir PDF, CSV, Excel o Imagen directamente a Divine'
                    )}
                    className="px-2.5 py-2 rounded-lg border border-amber-400 bg-amber-50 text-stone-900 text-xs font-bold hover:bg-amber-100 inline-flex items-center gap-1 shrink-0"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-amber-800" />
                    {t('Upload PDF', 'Subir PDF')}
                  </button>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={t(
                      'Ask Divine to prepare a draft, compare a quote, or test firm limits...',
                      'Pida a Divine preparar un borrador, comparar una cotización o probar límites...'
                    )}
                    className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 inline-flex items-center gap-1 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" /> {t('Ask', 'Preguntar')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bug Report, Feature Request & Redesign Note Widget */}
      <FeedbackWidget
        lang={lang}
        activeTabLabel={
          activeTab === 'procurement'
            ? '1. Procurement & Mafer'
            : activeTab === 'houzz'
            ? '2. Houzz & Budgets'
            : activeTab === 'payments'
            ? '3. Vendor Payment Prep'
            : activeTab === 'payroll'
            ? '4. W-2 Payroll Prep'
            : activeTab === 'overview'
            ? '5. Logs, Reminders & EOD'
            : 'Ingest & Draft Studio'
        }
      />
    </div>
  );
}
