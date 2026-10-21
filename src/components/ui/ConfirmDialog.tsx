"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Input } from "./Input";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  requireConfirmText?: boolean;
  confirmText?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  requireConfirmText = false,
  confirmText = "confirm",
}: ConfirmDialogProps) {
  const [working, setWorking] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleConfirm = async () => {
    try {
      setWorking(true);
      await onConfirm();
      onClose();
      setInputValue("");
    } finally {
      setWorking(false);
    }
  };

  const handleClose = () => {
    onClose();
    setInputValue("");
  };

  const isConfirmDisabled = requireConfirmText && inputValue !== confirmText;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm" hideCloseButton>
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-400">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </span>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-fg">{title}</h2>
            {description && (
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {description}
              </p>
            )}
          </div>
        </div>
        {requireConfirmText && (
          <div>
            <p className="mb-2 text-sm text-muted">
              Type <strong className="font-semibold text-fg">{confirmText}</strong> to confirm:
            </p>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={confirmText}
              autoComplete="off"
              autoFocus
            />
          </div>
        )}
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={handleClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone}
            className="flex-1"
            onClick={handleConfirm}
            isLoading={working}
            disabled={isConfirmDisabled}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
