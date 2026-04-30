import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type FormSheetProps = {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
};

export function FormSheet({ open, title, description, onClose, children }: FormSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
