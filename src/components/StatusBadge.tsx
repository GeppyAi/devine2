'use client';

import React from 'react';
import { VerificationStatus } from '@/types/divine';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileEdit,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';

interface StatusBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md';
  lang?: 'en' | 'es';
}

export function StatusBadge({ status, size = 'md', lang = 'en' }: StatusBadgeProps) {
  const styles: Record<
    VerificationStatus,
    { labelEn: string; labelEs: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    DRAFT: {
      labelEn: 'Draft — Needs Human Verification',
      labelEs: 'Borrador — Requiere Verificación Humana',
      bg: 'bg-amber-50',
      text: 'text-amber-900',
      border: 'border-amber-300',
      icon: <FileEdit className="w-3.5 h-3.5 text-amber-700" />,
    },
    NEEDS_KELDIA_VERIFICATION: {
      labelEn: 'Needs Human Verification',
      labelEs: 'Requiere Verificación Humana',
      bg: 'bg-blue-50',
      text: 'text-blue-900',
      border: 'border-blue-300',
      icon: <Clock className="w-3.5 h-3.5 text-blue-700" />,
    },
    DISCREPANCY_FOUND: {
      labelEn: 'Discrepancy Found — Reviewer Decision Required',
      labelEs: 'Discrepancia Detectada — Decisión Requerida',
      bg: 'bg-red-50',
      text: 'text-red-900',
      border: 'border-red-300',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-red-700" />,
    },
    VERIFIED_BY_KELDIA: {
      labelEn: 'Verified by Reviewer (Source Checked)',
      labelEs: 'Verificado por Revisor (Fuente Revisada)',
      bg: 'bg-emerald-50',
      text: 'text-emerald-900',
      border: 'border-emerald-300',
      icon: <UserCheck className="w-3.5 h-3.5 text-emerald-700" />,
    },
    WAITING_MELIZA_APPROVAL: {
      labelEn: "Waiting for Meliza's Written Approval",
      labelEs: 'Esperando Aprobación Escrita de Meliza',
      bg: 'bg-purple-50',
      text: 'text-purple-900',
      border: 'border-purple-300',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-purple-700" />,
    },
    MELIZA_APPROVED: {
      labelEn: "Meliza's Written Approval Recorded",
      labelEs: 'Aprobación Escrita de Meliza Registrada',
      bg: 'bg-indigo-50',
      text: 'text-indigo-900',
      border: 'border-indigo-300',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-indigo-700" />,
    },
    COMPLETED_MANUALLY: {
      labelEn: 'Action Completed Manually by Reviewer',
      labelEs: 'Acción Completada Manualmente por Revisor',
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      border: 'border-slate-300',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-slate-700" />,
    },
  };

  const current = styles[status];
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${current.bg} ${current.text} ${current.border} ${padding}`}
    >
      {current.icon}
      {lang === 'es' ? current.labelEs : current.labelEn}
    </span>
  );
}
