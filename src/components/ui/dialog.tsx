"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue>({ open: false, setOpen: () => {} });

export function DialogProvider({ children, ...props }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {React.cloneElement(children as React.ReactElement, props)}
    </DialogContext.Provider>
  );
}

export function useDialogContext() {
  return React.useContext(DialogContext);
}

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <DialogContext.Provider value={{ open, setOpen: (o) => onOpenChange?.(o) }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function DialogContent({
  children,
  className,
  onClose,
}: {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}) {
  const { open, setOpen } = React.useContext(DialogContext);
  const closeDialog = () => {
    setOpen(false);
    onClose?.();
  };

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && open && closeDialog();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in" onClick={closeDialog} />
      <div
        className={cn(
          "relative z-10 w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95",
          className
        )}
      >
        <button
          onClick={closeDialog}
          className="absolute right-4 top-4 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-5 py-4 border-b border-slate-100", className)}>{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-slate-900">{children}</h2>;
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="mt-0.5 text-sm text-slate-500">{children}</p>;
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100", className)}>{children}</div>;
}

export { DialogTrigger as DialogClose };