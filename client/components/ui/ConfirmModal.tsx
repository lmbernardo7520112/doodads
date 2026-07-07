// =============================================================
// 🔔 components/ui/ConfirmModal.tsx
// -------------------------------------------------------------
// Modal de confirmação customizado (substitui window.confirm).
// Suporta título, mensagem, botões customizáveis e campo
// opcional de motivo (ex: cancelamento com reason).
// =============================================================

"use client";

import { Fragment, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Tone controls the color of the confirm button */
  tone?: "danger" | "warning" | "success";
  /** If true, shows a textarea for the user to provide a reason */
  showReasonField?: boolean;
  reasonPlaceholder?: string;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "danger",
  showReasonField = false,
  reasonPlaceholder = "Informe o motivo (opcional)...",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const toneStyles = {
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    warning: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500",
    success: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
  };

  const handleConfirm = () => {
    onConfirm(showReasonField ? reason.trim() : undefined);
    setReason("");
  };

  const handleCancel = () => {
    setReason("");
    onCancel();
  };

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          {/* Close button */}
          <button
            onClick={handleCancel}
            className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon + Title */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3
                id="confirm-modal-title"
                className="text-lg font-bold text-gray-900"
              >
                {title}
              </h3>
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {message}
          </p>

          {/* Optional reason field */}
          {showReasonField && (
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              maxLength={500}
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg p-3 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
            />
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              {cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${toneStyles[tone]}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
