'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FeedbackCategory,
  FeedbackPriority,
  RedesignFeedbackItem,
  VerificationStatus,
} from '@/types/divine';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Bug,
  Lightbulb,
  MessageSquarePlus,
  FileText,
  Copy,
  Check,
  Download,
  Upload,
  Trash2,
  X,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

const STORAGE_KEY = 'divine_redesign_feedback_v1';
const GITBRIDGE_BASE_URL = 'http://127.0.0.1:8000';
const GITBRIDGE_APP_SLUG = 'devine2';

const INITIAL_SAMPLE_FEEDBACK: RedesignFeedbackItem[] = [
  {
    id: 'fb-sample-1',
    category: 'REDESIGN_UX',
    priority: 'MEDIUM',
    targetArea: '1. Procurement & Mafer',
    reporterName: 'Keldia (Reviewer)',
    title: 'Side-by-side PDF preview next to 3-Way Match table',
    description:
      'When checking Arteriors or Vanguard acknowledgments against the locked spec, having to scroll up and down between the uploaded file summary and the 3-way table takes extra clicks.',
    redesignSuggestion:
      'In the redesign, add a split-pane drawer so the uploaded vendor PDF/Ack summary stays pinned on the left while verifying SKU, Finish, and Freight on the right.',
    createdAt: 'Oct 20, 11:20 AM',
    verificationStatus: 'VERIFIED_BY_KELDIA',
    reviewerVerifiedNote: 'Confirmed priority workflow improvement for v2 redesign.',
    gitbridgeStatus: 'SYNCED',
  },
];

interface FeedbackWidgetProps {
  lang: 'en' | 'es';
  activeTabLabel: string;
}

export function FeedbackWidget({ lang, activeTabLabel }: FeedbackWidgetProps) {
  const t = (en: string, es: string) => (lang === 'es' ? es : en);

  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<RedesignFeedbackItem[]>(INITIAL_SAMPLE_FEEDBACK);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  // GitBridge Live Connection & Auto-Fix State
  const [gitbridgeOnline, setGitbridgeOnline] = useState<boolean>(false);
  const [gitbridgeChecking, setGitbridgeChecking] = useState<boolean>(false);
  const [autoFixViaGitbridge, setAutoFixViaGitbridge] = useState<boolean>(true);
  const [autoHotReloadAfterFix, setAutoHotReloadAfterFix] = useState<boolean>(false);
  const [isProcessingGitbridge, setIsProcessingGitbridge] = useState<boolean>(false);
  const [processingItemId, setProcessingItemId] = useState<string | null>(null);
  const [gitbridgeBanner, setGitbridgeBanner] = useState<{
    type: 'info' | 'success' | 'error';
    message: string;
    canHotReload?: boolean;
  } | null>(null);

  // Restore Points / Version History State
  const [restorePoints, setRestorePoints] = useState<
    {
      id: string;
      label: string;
      reason: string;
      kind: string;
      created_at: string;
      commit_sha?: string;
      files_count?: number;
    }[]
  >([]);
  const [restoringPointId, setRestoringPointId] = useState<string | null>(null);
  const [creatingRestorePoint, setCreatingRestorePoint] = useState<boolean>(false);

  // Form state
  const [category, setCategory] = useState<FeedbackCategory>('BUG');
  const [priority, setPriority] = useState<FeedbackPriority>('MEDIUM');
  const [targetArea, setTargetArea] = useState<string>(activeTabLabel);
  const [reporterName, setReporterName] = useState<string>('Keldia');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [redesignSuggestion, setRedesignSuggestion] = useState<string>('');

  // Filter & UI state
  const [filterCategory, setFilterCategory] = useState<'ALL' | FeedbackCategory>('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  // Sync default targetArea when user switches tabs in the main app
  useEffect(() => {
    setTargetArea(activeTabLabel);
  }, [activeTabLabel]);

  // Check if local GitBridge server (http://127.0.0.1:8000) is running
  const checkGitbridgeConnection = useCallback(async () => {
    setGitbridgeChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2200);
      const res = await fetch(`${GITBRIDGE_BASE_URL}/api/apps/${GITBRIDGE_APP_SLUG}`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      setGitbridgeOnline(res.ok);
      if (res.ok) {
        try {
          const rpRes = await fetch(
            `${GITBRIDGE_BASE_URL}/api/apps/${GITBRIDGE_APP_SLUG}/restore-points`
          );
          if (rpRes.ok) {
            const rpData = await rpRes.json();
            if (Array.isArray(rpData?.restore_points)) {
              setRestorePoints(rpData.restore_points);
            }
          }
        } catch {
          // Ignore restore points fetch errors
        }
      }
      return res.ok;
    } catch {
      setGitbridgeOnline(false);
      return false;
    } finally {
      setGitbridgeChecking(false);
    }
  }, []);

  // Load persisted feedback from localStorage on client mount & ping GitBridge
  useEffect(() => {
    try {
      const cleanMode =
        window.localStorage.getItem('divine_workspace_clean_mode') === 'clean' ||
        Boolean((window as unknown as { __DIVINE_DEFAULT_CLEAN__?: boolean }).__DIVINE_DEFAULT_CLEAN__);
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      } else if (cleanMode) {
        setItems([]);
      }
    } catch {
      // Keep default sample items if localStorage is unavailable
    } finally {
      setHasLoadedStorage(true);
    }
    checkGitbridgeConnection();
  }, [checkGitbridgeConnection]);

  // Listen for global "Clear All / Reset" or "Restore Demo Data" events from the main header
  useEffect(() => {
    const handleClearAll = () => {
      setItems([]);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      } catch {
        // Ignore storage errors
      }
    };
    const handleRestoreDemo = () => {
      setItems(INITIAL_SAMPLE_FEEDBACK);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_FEEDBACK));
      } catch {
        // Ignore storage errors
      }
    };
    window.addEventListener('divine-clear-all-data', handleClearAll);
    window.addEventListener('divine-restore-demo-data', handleRestoreDemo);
    return () => {
      window.removeEventListener('divine-clear-all-data', handleClearAll);
      window.removeEventListener('divine-restore-demo-data', handleRestoreDemo);
    };
  }, []);

  // Re-check GitBridge when modal opens
  useEffect(() => {
    if (!isOpen) return;
    checkGitbridgeConnection();
    const interval = setInterval(checkGitbridgeConnection, 15000);
    return () => clearInterval(interval);
  }, [isOpen, checkGitbridgeConnection]);

  // Save to localStorage whenever items change after initial load
  useEffect(() => {
    if (!hasLoadedStorage) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota errors
    }
  }, [items, hasLoadedStorage]);

  // Hot-reload the live app from GitHub's freshly republished standalone HTML or local GitBridge
  const hotReloadFromGitbridge = async () => {
    try {
      // 1. If local GitBridge is reachable, try its freshly built standalone HTML first
      if (gitbridgeOnline) {
        try {
          const localRes = await fetch(
            `${GITBRIDGE_BASE_URL}/api/apps/${GITBRIDGE_APP_SLUG}/standalone-html?t=${Date.now()}`,
            { cache: 'no-store' }
          );
          if (localRes.ok) {
            const html = await localRes.text();
            if (html.includes('<!DOCTYPE html>')) {
              document.open();
              document.write(html);
              document.close();
              return;
            }
          }
        } catch {
          // Fall through to GitHub raw standalone HTML
        }
      }

      // 2. Pull the newly republished standalone HTML directly from GitHub (works from anywhere!)
      const ghRes = await fetch(
        `https://raw.githubusercontent.com/GeppyAi/devine2/main/Divine_Sixth_Sense_Studio_Standalone.html?t=${Date.now()}`,
        { cache: 'no-store' }
      );
      if (ghRes.ok) {
        const html = await ghRes.text();
        if (html.includes('<!DOCTYPE html>')) {
          document.open();
          document.write(html);
          document.close();
          return;
        }
      }
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  // Poll GitHub version.json & closed issues when waiting for a remote GitBridge Listener fix
  const pollGitHubForRemoteFix = useCallback(
    (itemId: string, baselineVer: string) => {
      let attempts = 0;
      const timer = setInterval(async () => {
        attempts += 1;
        if (attempts > 45) {
          clearInterval(timer);
          return;
        }
        try {
          const res = await fetch(
            `https://raw.githubusercontent.com/GeppyAi/devine2/main/version.json?t=${Date.now()}`,
            { cache: 'no-store' }
          );
          if (!res.ok) return;
          const vData = await res.json();
          const remoteVer = String(vData?.version || '').trim();
          if (remoteVer && remoteVer !== baselineVer) {
            clearInterval(timer);
            setItems((prev) =>
              prev.map((it) =>
                it.id === itemId
                  ? {
                      ...it,
                      gitbridgeStatus: 'AUTO_FIXED',
                      gitbridgeAutoFixSummary: `Fixed & republished to GitHub as v${remoteVer} (${vData?.builtAt || 'latest'})`,
                      gitbridgeRebuiltStandalone: true,
                    }
                  : it
              )
            );
            setGitbridgeBanner({
              type: 'success',
              canHotReload: true,
              message: t(
                `✅ GitBridge Listener published v${remoteVer} to GitHub! Click "Hot-Reload Updated App Now" to load the fix.`,
                `✅ ¡GitBridge Listener publicó v${remoteVer} en GitHub! Haga clic en "Recargar App Actualizada Ahora" para cargar la corrección.`
              ),
            });
            window.dispatchEvent(new Event('divine-github-update-ready'));
            if (autoHotReloadAfterFix) {
              setTimeout(() => {
                hotReloadFromGitbridge();
              }, 1200);
            }
          }
        } catch {
          // Continue polling
        }
      }, 5000);
    },
    [autoHotReloadAfterFix, lang]
  );

  // Send a feedback item to GitBridge (/api/apps/devine2/bugs) or relay via GitHub Issues -> GitBridge Listener
  const sendItemToGitbridge = async (
    item: RedesignFeedbackItem,
    runAutoFix: boolean
  ): Promise<void> => {
    setIsProcessingGitbridge(true);
    setProcessingItemId(item.id);
    const currentAppVer =
      (typeof window !== 'undefined' &&
        (window as unknown as { __DIVINE_APP_VERSION__?: string }).__DIVINE_APP_VERSION__) ||
      '1.1.0';

    setGitbridgeBanner({
      type: 'info',
      message: runAutoFix
        ? t(
            `Notifying GitBridge! Applying AI code fix for "${item.title}", bumping version from v${currentAppVer}, and republishing to GitHub...`,
            `¡Notificando a GitBridge! Aplicando corrección para "${item.title}", incrementando versión desde v${currentAppVer} y republicando en GitHub...`
          )
        : t(
            `Sending "${item.title}" to GitBridge Backlog, Health Card & GitHub...`,
            `Enviando "${item.title}" al Backlog de GitBridge, Health Card y GitHub...`
          ),
    });

    const capturedErrors =
      typeof window !== 'undefined' &&
      Array.isArray((window as unknown as { GEPPY_CAPTURED_ERRORS?: string[] }).GEPPY_CAPTURED_ERRORS)
        ? (window as unknown as { GEPPY_CAPTURED_ERRORS: string[] }).GEPPY_CAPTURED_ERRORS.slice(0, 10)
        : [];

    const severityMap: Record<FeedbackPriority, string> = {
      HIGH: 'high',
      MEDIUM: 'medium',
      LOW: 'low',
    };

    const bugPayload = {
      client_feedback_id: item.id,
      app_slug: GITBRIDGE_APP_SLUG,
      app_name: 'Devine2',
      category: item.category,
      target_area: item.targetArea,
      reporter_name: item.reporterName,
      title: item.title,
      description: item.description || item.title,
      redesign_suggestion: item.redesignSuggestion || '',
      severity: severityMap[item.priority] || 'high',
      file_path: 'src/app/page.tsx',
      url: typeof window !== 'undefined' ? window.location.href : '',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
      console_errors: capturedErrors,
      auto_fix: runAutoFix,
      log_to_health_card: true,
      create_github_issue: true,
    };

    try {
      const res = await fetch(`${GITBRIDGE_BASE_URL}/api/apps/${GITBRIDGE_APP_SLUG}/bugs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bugPayload),
      });

      if (!res.ok) {
        throw new Error(`GitBridge returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const bugObj = data?.bug || {};
      const fixRes = bugObj?.auto_fix_result || {};
      const wasAutoFixed = Boolean(fixRes?.applied);
      const patchedFile = fixRes?.file_path || bugObj?.target_file || 'src/app/page.tsx';
      const publishedVer = fixRes?.published_version || '';
      const commitSha = fixRes?.commit_hash || '';
      const republished = Boolean(fixRes?.republished_to_github);
      const explanation =
        fixRes?.explanation ||
        bugObj?.diagnosis_summary ||
        t('Logged to GitBridge Backlog & Health Card.', 'Registrado en GitBridge.');

      setItems((prev) =>
        prev.map((existing) =>
          existing.id === item.id
            ? {
                ...existing,
                gitbridgeBugId: bugObj?.id,
                gitbridgeStatus: wasAutoFixed ? 'AUTO_FIXED' : 'SYNCED',
                gitbridgeAutoFixSummary:
                  explanation +
                  (publishedVer ? ` (Published v${publishedVer} to GitHub)` : ''),
                gitbridgePatchedFile: patchedFile,
                gitbridgeRebuiltStandalone: Boolean(fixRes?.rebuilt_bundle),
                githubIssueUrl: bugObj?.github_issue_url || undefined,
                githubCommitSha: commitSha || undefined,
              }
            : existing
        )
      );

      setGitbridgeOnline(true);
      checkGitbridgeConnection();
      window.dispatchEvent(new Event('divine-github-update-ready'));

      setGitbridgeBanner({
        type: 'success',
        canHotReload: wasAutoFixed,
        message: wasAutoFixed
          ? t(
              `✅ Auto-Fix Complete on ${patchedFile}${
                publishedVer ? ` • Version bumped to v${publishedVer}` : ''
              }${republished ? ' & Republished to GitHub!' : '!'} ${explanation}`,
              `✅ ¡Auto-Corrección completada en ${patchedFile}${
                publishedVer ? ` • Versión actualizada a v${publishedVer}` : ''
              }${republished ? ' y Republicada en GitHub!' : '!'} ${explanation}`
            )
          : t(
              `✅ Logged to GitBridge Backlog & GitHub! (${explanation})`,
              `✅ ¡Registrado en el Backlog de GitBridge y GitHub! (${explanation})`
            ),
      });

      if (wasAutoFixed && autoHotReloadAfterFix) {
        setTimeout(() => {
          hotReloadFromGitbridge();
        }, 1200);
      }
    } catch {
      // Remote machine fallback: Report through GitHub Issues -> GitBridge Listener on owner's PC picks it up, fixes, bumps version & republishes to GitHub!
      setGitbridgeOnline(false);
      const issueTitle = `[GeppyBug] [${item.category}] ${item.title}`;
      const issueBody =
        `### 🐞 Remote Divine Bug / Edit Report\n` +
        `- **Category:** \`${item.category}\`\n` +
        `- **Priority:** \`${item.priority}\`\n` +
        `- **Section:** ${item.targetArea}\n` +
        `- **Reported By:** ${item.reporterName}\n` +
        `- **Current App Version:** \`v${currentAppVer}\`\n\n` +
        `#### Description\n${item.description || item.title}\n\n` +
        (item.redesignSuggestion ? `#### Redesign Instruction\n${item.redesignSuggestion}\n\n` : '') +
        `<!-- GEPPY_BUG_PAYLOAD_START\n${JSON.stringify(bugPayload)}\nGEPPY_BUG_PAYLOAD_END -->`;

      const githubIssueNewUrl = `https://github.com/GeppyAi/devine2/issues/new?labels=geppy-remote-bug&title=${encodeURIComponent(
        issueTitle
      )}&body=${encodeURIComponent(issueBody)}`;

      setItems((prev) =>
        prev.map((existing) =>
          existing.id === item.id
            ? {
                ...existing,
                gitbridgeStatus: 'WAITING_GITHUB_LISTENER',
                githubIssueUrl: githubIssueNewUrl,
              }
            : existing
        )
      );

      if (typeof window !== 'undefined') {
        window.open(githubIssueNewUrl, '_blank', 'noopener,noreferrer');
      }

      pollGitHubForRemoteFix(item.id, currentAppVer);

      setGitbridgeBanner({
        type: 'info',
        message: t(
          `📡 Opened GitHub Issue Relay for "${item.title}"! Submit the pre-filled issue on GitHub — GitBridge's Listener on the owner's PC will automatically detect it, apply the fix, bump the version from v${currentAppVer}, and republish to GitHub while this window watches for the update!`,
          `📡 ¡Relé de GitHub abierto para "${item.title}"! Envíe el reporte pre-llenado en GitHub — el Listener de GitBridge lo detectará automáticamente, aplicará la corrección, subirá la nueva versión desde v${currentAppVer} a GitHub y esta ventana le avisará al instante!`
        ),
      });
    } finally {
      setIsProcessingGitbridge(false);
      setProcessingItemId(null);
    }
  };

  // Create a manual Restore Point snapshot on demand
  const handleCreateManualRestorePoint = async () => {
    setCreatingRestorePoint(true);
    try {
      const res = await fetch(
        `${GITBRIDGE_BASE_URL}/api/apps/${GITBRIDGE_APP_SLUG}/restore-points`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: 'Manual Restore Point',
            reason: `Saved manually from Divine (${activeTabLabel})`,
          }),
        }
      );
      if (res.ok) {
        await checkGitbridgeConnection();
        setGitbridgeBanner({
          type: 'success',
          message: t(
            '✅ Manual Restore Point & Git Commit created! You can roll back to this exact state anytime.',
            '✅ ¡Punto de Restauración y Commit de Git creados! Puede volver a este estado exacto en cualquier momento.'
          ),
        });
      }
    } catch {
      setGitbridgeBanner({
        type: 'error',
        message: t(
          'Could not reach GitBridge (127.0.0.1:8000) to create a restore point.',
          'No se pudo conectar con GitBridge (127.0.0.1:8000) para crear el punto de restauración.'
        ),
      });
    } finally {
      setCreatingRestorePoint(false);
    }
  };

  // Roll back to a chosen Restore Point / Generation
  const handleRestoreToPoint = async (pointId: string, label: string) => {
    setRestoringPointId(pointId);
    setGitbridgeBanner({
      type: 'info',
      message: t(
        `Rolling back Divine to "${label}" and rebuilding standalone bundle...`,
        `Restaurando Divine a "${label}" y reconstruyendo el paquete...`
      ),
    });
    try {
      const res = await fetch(
        `${GITBRIDGE_BASE_URL}/api/apps/${GITBRIDGE_APP_SLUG}/restore-points/${encodeURIComponent(
          pointId
        )}/restore`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (res.ok && data?.success) {
        await checkGitbridgeConnection();
        setGitbridgeBanner({
          type: 'success',
          canHotReload: true,
          message: t(
            `✅ Rolled back to "${label}"! Click "Hot-Reload Updated App Now" to view the restored version.`,
            `✅ ¡Restaurado a "${label}"! Haga clic en "Recargar App Actualizada Ahora" para ver la versión restaurada.`
          ),
        });
        if (autoHotReloadAfterFix) {
          setTimeout(() => {
            hotReloadFromGitbridge();
          }, 1000);
        }
      } else {
        throw new Error(data?.message || 'Restore failed');
      }
    } catch {
      setGitbridgeBanner({
        type: 'error',
        message: t(
          'Rollback failed — make sure GitBridge is running on http://127.0.0.1:8000.',
          'Error al restaurar — asegúrese de que GitBridge esté activo en http://127.0.0.1:8000.'
        ),
      });
    } finally {
      setRestoringPointId(null);
    }
  };

  const categoryMeta: Record<
    FeedbackCategory,
    { labelEn: string; labelEs: string; badgeBg: string; badgeText: string; badgeBorder: string }
  > = {
    BUG: {
      labelEn: 'Bug Report',
      labelEs: 'Reporte de Error (Bug)',
      badgeBg: 'bg-red-50',
      badgeText: 'text-red-900',
      badgeBorder: 'border-red-300',
    },
    FEATURE_REQUEST: {
      labelEn: 'Feature Request',
      labelEs: 'Solicitud de Función',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-900',
      badgeBorder: 'border-amber-300',
    },
    REDESIGN_UX: {
      labelEn: 'Redesign / UI-UX Idea',
      labelEs: 'Idea de Rediseño / UI-UX',
      badgeBg: 'bg-indigo-50',
      badgeText: 'text-indigo-900',
      badgeBorder: 'border-indigo-300',
    },
    GENERAL_NOTE: {
      labelEn: 'General Note',
      labelEs: 'Nota General',
      badgeBg: 'bg-stone-100',
      badgeText: 'text-stone-800',
      badgeBorder: 'border-stone-300',
    },
  };

  const priorityMeta: Record<
    FeedbackPriority,
    { labelEn: string; labelEs: string; classes: string }
  > = {
    HIGH: {
      labelEn: 'High / Blocker',
      labelEs: 'Alta / Bloqueante',
      classes: 'bg-red-600 text-white',
    },
    MEDIUM: {
      labelEn: 'Medium',
      labelEs: 'Media',
      classes: 'bg-amber-500 text-stone-950',
    },
    LOW: {
      labelEn: 'Low / Minor',
      labelEs: 'Baja / Menor',
      classes: 'bg-stone-200 text-stone-800',
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !description.trim()) return;

    const nowStr = new Date().toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newItem: RedesignFeedbackItem = {
      id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category,
      priority,
      targetArea: targetArea || activeTabLabel,
      reporterName: reporterName.trim() || 'Reviewer',
      title:
        title.trim() ||
        description.trim().slice(0, 60) + (description.trim().length > 60 ? '...' : ''),
      description: description.trim(),
      redesignSuggestion: redesignSuggestion.trim() || undefined,
      createdAt: nowStr,
      // Per Workspace Rule 2: automated/new entries start as DRAFT — Needs Human Verification
      verificationStatus: 'DRAFT',
      gitbridgeStatus: 'PENDING_LOCAL',
    };

    setItems((prev) => [newItem, ...prev]);
    setTitle('');
    setDescription('');
    setRedesignSuggestion('');
    setJustSubmitted(true);
    setTimeout(() => setJustSubmitted(false), 2500);

    // Automatically forward to GitBridge so the owner gets a notification and optional instant AI fix
    await sendItemToGitbridge(newItem, autoFixViaGitbridge);
  };

  const toggleReviewerVerified = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const isCurrentlyVerified = item.verificationStatus === 'VERIFIED_BY_KELDIA';
        const nextStatus: VerificationStatus = isCurrentlyVerified
          ? 'DRAFT'
          : 'VERIFIED_BY_KELDIA';
        return {
          ...item,
          verificationStatus: nextStatus,
          reviewerVerifiedNote: isCurrentlyVerified
            ? undefined
            : `Verified by Reviewer on ${new Date().toLocaleDateString()} for Redesign Reintegration`,
        };
      })
    );
  };

  const updateReviewerNote = (id: string, note: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, reviewerVerifiedNote: note } : item))
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const buildRedesignMarkdownBrief = (): string => {
    const bugs = items.filter((i) => i.category === 'BUG');
    const features = items.filter((i) => i.category === 'FEATURE_REQUEST');
    const uxNotes = items.filter((i) => i.category === 'REDESIGN_UX');
    const generalNotes = items.filter((i) => i.category === 'GENERAL_NOTE');

    const formatSection = (heading: string, list: RedesignFeedbackItem[]) => {
      if (list.length === 0) return `### ${heading}\n_None logged._\n`;
      return (
        `### ${heading} (${list.length})\n` +
        list
          .map(
            (item, idx) =>
              `${idx + 1}. **[${item.priority}] ${item.title}**\n` +
              `   - **Area / Tab:** ${item.targetArea}\n` +
              `   - **Reported By:** ${item.reporterName} (${item.createdAt})\n` +
              `   - **Verification Status:** ${
                item.verificationStatus === 'VERIFIED_BY_KELDIA'
                  ? 'Verified by Reviewer (Source Checked)'
                  : 'Draft — Needs Human Verification'
              }${item.reviewerVerifiedNote ? ` (${item.reviewerVerifiedNote})` : ''}\n` +
              `   - **GitBridge Status:** ${item.gitbridgeStatus || 'LOCAL'}${
                item.gitbridgeAutoFixSummary ? ` — ${item.gitbridgeAutoFixSummary}` : ''
              }\n` +
              `   - **Details:** ${item.description || 'N/A'}\n` +
              (item.redesignSuggestion
                ? `   - **Redesign Integration Goal:** ${item.redesignSuggestion}\n`
                : '')
          )
          .join('\n')
      );
    };

    return [
      `# DIVINE (SIXTH SENSE STUDIO) — USER FEEDBACK & REDESIGN REINTEGRATION BRIEF`,
      `Generated: ${new Date().toLocaleString()}`,
      `Total Logged Items: ${items.length} (${bugs.length} Bugs, ${features.length} Feature Requests, ${uxNotes.length} Redesign/UX Notes, ${generalNotes.length} General Notes)`,
      `Air-Gap Status: 100% Local Export — Prepared for Human Review & Redesign Reintegration`,
      ``,
      formatSection('1. Bug Reports to Fix', bugs),
      formatSection('2. Feature Requests to Add', features),
      formatSection('3. Redesign & UI/UX Improvements', uxNotes),
      formatSection('4. General Operational Notes', generalNotes),
    ].join('\n');
  };

  const downloadJsonExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      application: 'Divine — Sixth Sense Studio',
      airGapNotice:
        'Local export for redesign reintegration. All items carry explicit verification statuses.',
      totalCount: items.length,
      items,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `divine-redesign-feedback-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCsvExport = () => {
    const escapeCsv = (val: string) => `"${String(val || '').replace(/"/g, '""')}"`;
    const headers = [
      'ID',
      'Category',
      'Priority',
      'Target Area',
      'Reporter',
      'Created At',
      'Verification Status',
      'GitBridge Status',
      'Title',
      'Description',
      'Redesign Goal',
      'Reviewer Verification Note',
    ];
    const rows = items.map((item) =>
      [
        item.id,
        categoryMeta[item.category].labelEn,
        item.priority,
        item.targetArea,
        item.reporterName,
        item.createdAt,
        item.verificationStatus === 'VERIFIED_BY_KELDIA'
          ? 'Verified by Reviewer'
          : 'Draft — Needs Human Verification',
        item.gitbridgeStatus || 'LOCAL',
        item.title,
        item.description,
        item.redesignSuggestion || '',
        item.reviewerVerifiedNote || '',
      ]
        .map(escapeCsv)
        .join(',')
    );
    const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `divine-redesign-feedback-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = typeof ev.target?.result === 'string' ? ev.target.result : '';
        const parsed = JSON.parse(raw);
        const importedList: RedesignFeedbackItem[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.items)
          ? parsed.items
          : [];
        if (importedList.length > 0) {
          setItems((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const newUnique = importedList.filter((i) => i && i.id && !existingIds.has(i.id));
            return [...newUnique, ...prev];
          });
        }
      } catch {
        alert(
          t(
            'Could not parse feedback JSON file. Please select a valid Divine feedback export.',
            'No se pudo leer el archivo JSON de comentarios. Seleccione una exportación válida de Divine.'
          )
        );
      }
    };
    reader.readAsText(file);
    if (importInputRef.current) {
      importInputRef.current.value = '';
    }
  };

  const filteredItems =
    filterCategory === 'ALL' ? items : items.filter((i) => i.category === filterCategory);

  const bugCount = items.filter((i) => i.category === 'BUG').length;

  return (
    <>
      {/* Hidden JSON Import Input */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        onChange={(e) => handleImportJson(e.target.files)}
        className="hidden"
      />

      {/* Floating Action Button (Bottom-Right) */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title={t(
            'Report a Bug, Request a Feature, or Trigger an Instant GitBridge Live Fix',
            'Reportar un Error (Bug), Solicitar Función o Ejecutar Corrección Instantánea con GitBridge'
          )}
          className="group flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-stone-900 text-white hover:bg-stone-800 border-2 border-amber-400 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.99]"
        >
          <span className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-amber-400 text-stone-950 shrink-0">
            <MessageSquarePlus className="w-4 h-4" />
            {bugCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border border-stone-900">
                {bugCount}
              </span>
            )}
          </span>
          <div className="text-left">
            <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
              <span>{t('Report Bug / Feature / Note', 'Reportar Bug / Idea / Nota')}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 font-semibold">
                {items.length}
              </span>
            </div>
            <div className="text-[10px] text-stone-300 leading-tight flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  gitbridgeOnline ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'
                }`}
              />
              <span>
                {gitbridgeOnline
                  ? t('GitBridge Live • Auto-Fix Ready', 'GitBridge Activo • Auto-Fix Listo')
                  : t('Saved locally for Redesign', 'Guardado local para Rediseño')}
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Feedback & GitBridge Live Auto-Fix Modal Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[1px] flex items-center justify-end p-0 sm:p-4">
          <div className="bg-[#faf8f6] border border-stone-300 sm:rounded-2xl shadow-2xl w-full max-w-2xl h-full sm:h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="bg-stone-900 text-white px-5 py-4 flex items-start justify-between gap-4 border-b border-stone-700 shrink-0">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquarePlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold">
                      {t(
                        'Bug Reports, Feature Requests & GitBridge Live Auto-Fix',
                        'Reportes de Bugs, Funciones y Auto-Corrección con GitBridge'
                      )}
                    </h2>
                    <button
                      type="button"
                      onClick={checkGitbridgeConnection}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1.5 border ${
                        gitbridgeOnline
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                          : 'bg-stone-800 text-stone-300 border-stone-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          gitbridgeOnline ? 'bg-emerald-400' : 'bg-stone-400'
                        }`}
                      />
                      {gitbridgeChecking
                        ? t('Checking GitBridge...', 'Verificando GitBridge...')
                        : gitbridgeOnline
                        ? t('GitBridge Connected (127.0.0.1:8000)', 'GitBridge Conectado (127.0.0.1:8000)')
                        : t('GitBridge Offline (Local Mode)', 'GitBridge Desconectado (Modo Local)')}
                    </button>
                  </div>
                  <p className="text-xs text-stone-300 mt-0.5">
                    {t(
                      'When GitBridge is open on your PC, submitting feedback notifies GitBridge immediately and can auto-patch the live app code via Antigravity.',
                      'Cuando GitBridge está abierto en su PC, enviar un reporte notifica a GitBridge al instante y puede aplicar la corrección en vivo con Antigravity.'
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Live GitBridge Status / Auto-Fix Result Banner */}
              {gitbridgeBanner && (
                <div
                  className={`rounded-xl border p-3.5 text-xs flex flex-wrap items-center justify-between gap-3 ${
                    gitbridgeBanner.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : gitbridgeBanner.type === 'error'
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-stone-900 border-amber-400 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1">
                    {isProcessingGitbridge && (
                      <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                    )}
                    <span className="font-medium leading-relaxed">{gitbridgeBanner.message}</span>
                  </div>
                  {gitbridgeBanner.canHotReload && (
                    <button
                      type="button"
                      onClick={hotReloadFromGitbridge}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 inline-flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {t('Hot-Reload Updated App Now', 'Recargar App Actualizada Ahora')}
                    </button>
                  )}
                </div>
              )}

              {/* New Feedback Form Card */}
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 space-y-3.5"
              >
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    {t(
                      '1. Report Bug, Feature Request, or Live Edit',
                      '1. Reportar Bug, Nueva Función o Cambio en Vivo'
                    )}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    {gitbridgeOnline
                      ? t('Connected to GitBridge Auto-Fix', 'Conectado a GitBridge Auto-Fix')
                      : t('Auto-saved in browser storage', 'Guardado automático en el navegador')}
                  </span>
                </div>

                {/* Category Selector Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'BUG', icon: Bug, labelEn: 'Bug Report', labelEs: 'Bug / Error' },
                      {
                        id: 'FEATURE_REQUEST',
                        icon: Lightbulb,
                        labelEn: 'Feature Request',
                        labelEs: 'Nueva Función',
                      },
                      {
                        id: 'REDESIGN_UX',
                        icon: Sparkles,
                        labelEn: 'Redesign / UX',
                        labelEs: 'Rediseño / UX',
                      },
                      {
                        id: 'GENERAL_NOTE',
                        icon: FileText,
                        labelEn: 'General Note',
                        labelEs: 'Nota General',
                      },
                    ] as const
                  ).map((cat) => {
                    const Icon = cat.icon;
                    const active = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold border transition ${
                          active
                            ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{lang === 'es' ? cat.labelEs : cat.labelEn}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Target Area, Priority, Reporter */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {t('Where in the App?', '¿En qué sección?')}
                    </label>
                    <select
                      value={targetArea}
                      onChange={(e) => setTargetArea(e.target.value)}
                      className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
                    >
                      <option value={activeTabLabel}>
                        {t('Current Tab:', 'Pestaña Actual:')} {activeTabLabel}
                      </option>
                      <option value="Global / Entire App">
                        {t('Global / Entire App', 'Global / Toda la App')}
                      </option>
                      <option value="1. Procurement & Mafer">1. Procurement & Mafer</option>
                      <option value="2. Houzz & Budgets">2. Houzz & Budgets</option>
                      <option value="3. Vendor Payment Prep">3. Vendor Payment Prep</option>
                      <option value="4. W-2 Payroll Prep">4. W-2 Payroll Prep</option>
                      <option value="5. Logs, Reminders & EOD">5. Logs, Reminders & EOD</option>
                      <option value="Ingest & Draft Studio">Ingest & Draft Studio</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {t('Priority / Impact', 'Prioridad / Impacto')}
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as FeedbackPriority)}
                      className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
                    >
                      <option value="HIGH">{t('High / Blocker', 'Alta / Bloqueante')}</option>
                      <option value="MEDIUM">{t('Medium / Important', 'Media / Importante')}</option>
                      <option value="LOW">{t('Low / Nice to Have', 'Baja / Detalle Menor')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {t('Logged By', 'Reportado Por')}
                    </label>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="Keldia / Meliza / Mafer"
                      className="w-full rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {t('Short Summary / Title', 'Resumen Corto / Título')}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t(
                      'e.g., Add filter by project in Vendor Payment Prep, or fix button alignment...',
                      'ej., Agregar filtro por proyecto en Pagos, o corregir alineación de botón...'
                    )}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {t(
                      'What happened or what should be changed?',
                      '¿Qué ocurrió o qué desea modificar?'
                    )}
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t(
                      'Describe the bug, feature request, or UI change you want applied...',
                      'Describa el error, función o cambio de interfaz que desea aplicar...'
                    )}
                    className="w-full rounded-lg border border-stone-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                {/* Redesign Suggestion */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {t(
                      'Redesign / Exact Edit Instruction (Optional)',
                      'Instrucción de Rediseño / Edición Exacta (Opcional)'
                    )}
                  </label>
                  <input
                    type="text"
                    value={redesignSuggestion}
                    onChange={(e) => setRedesignSuggestion(e.target.value)}
                    placeholder={t(
                      'e.g., Put a one-click project dropdown at the top of the table...',
                      'ej., Poner un menú desplegable de proyectos arriba de la tabla...'
                    )}
                    className="w-full rounded-lg border border-stone-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                {/* GitBridge Instant Auto-Fix Toggles */}
                <div className="bg-stone-900 text-stone-100 rounded-xl p-3 space-y-2 border border-stone-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-300">
                      <input
                        type="checkbox"
                        checked={autoFixViaGitbridge}
                        onChange={(e) => setAutoFixViaGitbridge(e.target.checked)}
                        className="rounded border-stone-600 text-amber-500 focus:ring-amber-400"
                      />
                      <span>
                        {t(
                          '⚡ Instant Auto-Edit via GitBridge & Antigravity (Notifies & Patches Code Automatically)',
                          '⚡ Auto-Edición Instantánea vía GitBridge y Antigravity (Notifica y Aplica el Cambio)'
                        )}
                      </span>
                    </label>
                  </div>
                  {autoFixViaGitbridge && (
                    <label className="inline-flex items-center gap-2 cursor-pointer text-[11px] text-stone-300 pl-6">
                      <input
                        type="checkbox"
                        checked={autoHotReloadAfterFix}
                        onChange={(e) => setAutoHotReloadAfterFix(e.target.checked)}
                        className="rounded border-stone-600 text-emerald-500 focus:ring-emerald-400"
                      />
                      <span>
                        {t(
                          'Automatically hot-reload the app as soon as GitBridge finishes patching',
                          'Recargar automáticamente la aplicación apenas GitBridge termine de aplicar el cambio'
                        )}
                      </span>
                    </label>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-stone-500">
                    {t(
                      'Tagged [Draft — Needs Human Verification] until reviewed.',
                      'Marcado como [Borrador] hasta ser verificado.'
                    )}
                  </span>
                  <button
                    type="submit"
                    disabled={isProcessingGitbridge}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold hover:bg-amber-400 transition shadow-sm inline-flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {isProcessingGitbridge ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {t(
                          'GitBridge Auto-Fixing...',
                          'GitBridge Aplicando Cambio...'
                        )}
                      </>
                    ) : justSubmitted ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-900" />
                        {t('Sent to GitBridge!', '¡Enviado a GitBridge!')}
                      </>
                    ) : (
                      <>
                        <MessageSquarePlus className="w-4 h-4" />
                        {autoFixViaGitbridge
                          ? t(
                              'Submit & Auto-Fix with GitBridge',
                              'Enviar y Auto-Corregir con GitBridge'
                            )
                          : t('Add to Redesign Log', 'Guardar en el Registro')}
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Version History & Restore Points (1-Click Rollback) */}
              <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                  <div>
                    <h3 className="text-xs font-bold text-stone-900">
                      {t(
                        '2. Generation Restore Points & 1-Click Rollback',
                        '2. Puntos de Restauración por Generación y Reversión en 1 Clic'
                      )}
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      {t(
                        'Every GitBridge auto-fix automatically saves a "Before" and "After" restore point + Git commit so you can undo any edit in 1 click.',
                        'Cada auto-corrección de GitBridge guarda automáticamente un punto de restauración "Antes" y "Después" + Commit de Git para deshacer cualquier cambio en 1 clic.'
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!gitbridgeOnline || creatingRestorePoint}
                    onClick={handleCreateManualRestorePoint}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 text-amber-300 text-[11px] font-bold hover:bg-stone-800 inline-flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${creatingRestorePoint ? 'animate-spin' : ''}`}
                    />
                    {t('Save Restore Point Now', 'Guardar Punto de Restauración Ahora')}
                  </button>
                </div>

                {restorePoints.length === 0 ? (
                  <div className="text-[11px] text-stone-500 bg-stone-50 rounded-lg p-3 border border-stone-200/80">
                    {gitbridgeOnline
                      ? t(
                          'No restore points yet — click "Save Restore Point Now" or run an Auto-Fix to record your first snapshot.',
                          'Aún no hay puntos de restauración — haga clic en "Guardar Punto de Restauración Ahora" o ejecute un Auto-Fix.'
                        )
                      : t(
                          'Start GitBridge (http://127.0.0.1:8000) to view and restore generation snapshots & Git commits.',
                          'Inicie GitBridge (http://127.0.0.1:8000) para ver y restaurar instantáneas y commits de Git.'
                        )}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {restorePoints.slice(0, 12).map((rp) => {
                      const isRestoringThis = restoringPointId === rp.id;
                      return (
                        <div
                          key={rp.id}
                          className="flex flex-wrap items-center justify-between gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-stone-900">{rp.label}</span>
                              {rp.commit_sha && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-200 text-stone-800 font-semibold">
                                  #{rp.commit_sha}
                                </span>
                              )}
                              <span className="text-[10px] text-stone-500">• {rp.created_at}</span>
                            </div>
                            <div className="text-[11px] text-stone-600">{rp.reason}</div>
                          </div>
                          <button
                            type="button"
                            disabled={Boolean(restoringPointId)}
                            onClick={() => handleRestoreToPoint(rp.id, rp.label)}
                            className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 hover:bg-amber-50 hover:border-amber-400 text-stone-900 text-[11px] font-bold inline-flex items-center gap-1 shadow-sm disabled:opacity-50 shrink-0"
                          >
                            <RefreshCw
                              className={`w-3 h-3 text-amber-700 ${
                                isRestoringThis ? 'animate-spin' : ''
                              }`}
                            />
                            {isRestoringThis
                              ? t('Restoring...', 'Restaurando...')
                              : t('⏪ Restore This Version', '⏪ Restaurar Esta Versión')}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Export & Reintegrate Bar */}
              <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-stone-900">
                      {t(
                        '3. Reintegrate into Redesign (Copy Brief or Export File)',
                        '3. Reintegrar en el Rediseño (Copiar Informe o Exportar Archivo)'
                      )}
                    </h3>
                    <p className="text-[11px] text-stone-700">
                      {t(
                        'Copy the structured Markdown specification to paste directly into your redesign session, or download JSON/CSV.',
                        'Copie la especificación estructurada para pegarla directamente en su sesión de rediseño, o descargue JSON/CSV.'
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyText('all-brief', buildRedesignMarkdownBrief())}
                    className="px-3.5 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 inline-flex items-center gap-1.5 shadow-sm"
                  >
                    {copiedKey === 'all-brief' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        {t('Copied Redesign Brief!', '¡Informe de Rediseño Copiado!')}
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-400" />
                        {t(
                          'Copy Full Redesign Brief (Markdown)',
                          'Copiar Informe Completo para Rediseño'
                        )}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={downloadJsonExport}
                    className="px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-800 text-xs font-semibold hover:bg-stone-100 inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-800" />
                    {t('Export JSON', 'Exportar JSON')}
                  </button>

                  <button
                    type="button"
                    onClick={downloadCsvExport}
                    className="px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-800 text-xs font-semibold hover:bg-stone-100 inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-800" />
                    {t('Export CSV', 'Exportar CSV')}
                  </button>

                  <button
                    type="button"
                    onClick={() => importInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-800 text-xs font-semibold hover:bg-stone-100 inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-stone-700" />
                    {t('Import JSON', 'Importar JSON')}
                  </button>
                </div>
              </div>

              {/* Logged Items Queue */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-stone-900">
                    {t('Logged Feedback & Redesign Queue', 'Cola de Bugs, Ideas y Notas')} (
                    {filteredItems.length})
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {(
                      [
                        { id: 'ALL', labelEn: 'All', labelEs: 'Todos' },
                        { id: 'BUG', labelEn: 'Bugs', labelEs: 'Bugs' },
                        { id: 'FEATURE_REQUEST', labelEn: 'Features', labelEs: 'Funciones' },
                        { id: 'REDESIGN_UX', labelEn: 'Redesign', labelEs: 'Rediseño' },
                        { id: 'GENERAL_NOTE', labelEn: 'Notes', labelEs: 'Notas' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFilterCategory(f.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          filterCategory === f.id
                            ? 'bg-stone-900 text-white'
                            : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        {lang === 'es' ? f.labelEs : f.labelEn}
                      </button>
                    ))}
                    {items.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setItems([]);
                          try {
                            window.localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
                          } catch {
                            // Ignore storage errors
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-50 border border-red-200 text-red-800 hover:bg-red-100 inline-flex items-center gap-1 ml-1"
                        title={t('Clear all logged feedback items', 'Limpiar todos los reportes')}
                      >
                        <Trash2 className="w-3 h-3" />
                        {t('Clear All', 'Limpiar Todo')}
                      </button>
                    )}
                  </div>
                </div>

                {filteredItems.length === 0 ? (
                  <div className="bg-white border border-stone-200 rounded-xl p-6 text-center text-xs text-stone-500">
                    {t(
                      'No feedback items in this filter yet. Use the form above to log a bug, feature request, or general note.',
                      'Aún no hay elementos en este filtro. Use el formulario de arriba para registrar un bug, función o nota.'
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredItems.map((item) => {
                      const catStyle = categoryMeta[item.category];
                      const prioStyle = priorityMeta[item.priority];
                      const isVerified = item.verificationStatus === 'VERIFIED_BY_KELDIA';
                      const isThisProcessing = processingItemId === item.id;

                      return (
                        <div
                          key={item.id}
                          className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-2.5 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${catStyle.badgeBg} ${catStyle.badgeText} ${catStyle.badgeBorder}`}
                              >
                                {lang === 'es' ? catStyle.labelEs : catStyle.labelEn}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${prioStyle.classes}`}
                              >
                                {lang === 'es' ? prioStyle.labelEs : prioStyle.labelEn}
                              </span>
                              {item.gitbridgeStatus === 'AUTO_FIXED' && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  ⚡ {t('Auto-Patched & Republished', 'Auto-Corregido y Publicado')}
                                </span>
                              )}
                              {item.gitbridgeStatus === 'WAITING_GITHUB_LISTENER' && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-300">
                                  📡 {t('GitHub Relay → Waiting for GitBridge Listener', 'Relé GitHub → Esperando Listener')}
                                </span>
                              )}
                              {item.gitbridgeStatus === 'SYNCED' && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                                  ✓ {t('Synced to GitBridge', 'Sincronizado en GitBridge')}
                                </span>
                              )}
                              <span className="text-[11px] font-medium text-stone-500">
                                • {item.targetArea}
                              </span>
                            </div>
                            <StatusBadge status={item.verificationStatus} size="sm" lang={lang} />
                          </div>

                          <div>
                            <div className="font-bold text-stone-900 text-sm">{item.title}</div>
                            <div className="text-[11px] text-stone-500">
                              {t('Logged by', 'Reportado por')} {item.reporterName} •{' '}
                              {item.createdAt}
                            </div>
                          </div>

                          {item.description && (
                            <p className="text-stone-700 leading-relaxed whitespace-pre-wrap bg-stone-50 p-2.5 rounded-lg border border-stone-200/80">
                              {item.description}
                            </p>
                          )}

                          {item.redesignSuggestion && (
                            <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 text-stone-800">
                              <span className="font-bold text-amber-900">
                                {t('Redesign Target:', 'Objetivo de Rediseño:')}{' '}
                              </span>
                              {item.redesignSuggestion}
                            </div>
                          )}

                          {item.gitbridgeAutoFixSummary && (
                            <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-2.5 text-[11px] text-emerald-950 flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="font-bold">
                                  {t('GitBridge Action:', 'Acción de GitBridge:')}{' '}
                                </span>
                                {item.gitbridgeAutoFixSummary}
                              </div>
                              {item.gitbridgeStatus === 'AUTO_FIXED' && (
                                <button
                                  type="button"
                                  onClick={hotReloadFromGitbridge}
                                  className="px-2.5 py-1 rounded bg-emerald-700 text-white font-bold hover:bg-emerald-800 inline-flex items-center gap-1 shrink-0"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  {t('Hot-Reload App', 'Recargar App')}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Explicit Human Verification & Actions Bar (Rule 2 Compliance) */}
                          <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                            <label className="inline-flex items-center gap-2 cursor-pointer select-none text-[11px] font-semibold text-stone-800">
                              <input
                                type="checkbox"
                                checked={isVerified}
                                onChange={() => toggleReviewerVerified(item.id)}
                                className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                              />
                              <span>
                                {t(
                                  'Reviewer Verified for Redesign Scope',
                                  'Verificado por Revisor para el Rediseño'
                                )}
                              </span>
                            </label>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isProcessingGitbridge}
                                onClick={() => sendItemToGitbridge(item, true)}
                                className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-300 text-[11px] font-bold inline-flex items-center gap-1 disabled:opacity-50"
                                title={t(
                                  'Send to GitBridge and apply AI code fix now',
                                  'Enviar a GitBridge y aplicar cambio en el código ahora'
                                )}
                              >
                                <RefreshCw
                                  className={`w-3 h-3 ${isThisProcessing ? 'animate-spin' : ''}`}
                                />
                                <span>
                                  {isThisProcessing
                                    ? t('Patching...', 'Aplicando...')
                                    : t('⚡ Auto-Fix via GitBridge', '⚡ Auto-Fix con GitBridge')}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  copyText(
                                    item.id,
                                    `[${catStyle.labelEn} | ${item.priority}] ${item.title}\nArea: ${item.targetArea}\nDetails: ${item.description}\nRedesign Suggestion: ${item.redesignSuggestion || 'N/A'}`
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-semibold inline-flex items-center gap-1"
                              >
                                {copiedKey === item.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    {t('Copied', 'Copiado')}
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    {t('Copy Item', 'Copiar')}
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteItem(item.id)}
                                className="p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50"
                                title={t('Delete item', 'Eliminar')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {isVerified && (
                            <div className="pt-1">
                              <input
                                type="text"
                                value={item.reviewerVerifiedNote || ''}
                                onChange={(e) => updateReviewerNote(item.id, e.target.value)}
                                placeholder={t(
                                  'Optional reviewer reference note for redesign...',
                                  'Nota opcional del revisor para el rediseño...'
                                )}
                                className="w-full rounded border border-emerald-300 bg-emerald-50/40 px-2.5 py-1 text-[11px] text-emerald-950 focus:outline-none"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
