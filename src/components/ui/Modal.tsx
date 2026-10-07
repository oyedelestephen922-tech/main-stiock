"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}

/** Accessible dialog built on <dialog>: focus trap, Esc to close, backdrop click to close. */
export function Modal({ open, onClose, title, children, width = "max-w-md" }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby={titleId}
      className={`panel m-auto w-[calc(100%-2rem)] ${width} bg-surface p-0 text-ink backdrop:bg-black/60 backdrop:backdrop-blur-sm`}
    >
      {open && (
        <div className="rise-in p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 id={titleId} className="type-title text-lg">
              {title}
            </h2>
            <button onClick={onClose} className="btn-ghost -mr-2 rounded-md p-2" aria-label="Close">
              <Icon name="close" size={16} />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
