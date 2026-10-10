import React, { useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { Task } from '../types';

interface UndoSnackbarProps {
  deletedTask: Task | null;
  onUndo: () => void;
  onDismiss: () => void;
}

export const UndoSnackbar: React.FC<UndoSnackbarProps> = ({
  deletedTask,
  onUndo,
  onDismiss,
}) => {
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    if (!deletedTask) return;

    setTimeLeft(5);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [deletedTask]);

  if (!deletedTask) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#2D2B28] text-white shadow-xl text-xs font-sans border border-[#44403B]">
        <span className="text-[#DDD6C8] max-w-[200px] sm:max-w-xs truncate">
          Task deleted: <strong className="text-white font-medium">"{deletedTask.text}"</strong>
        </span>

        <button
          type="button"
          onClick={onUndo}
          className="inline-flex items-center gap-1 font-semibold text-[#E9C496] hover:text-[#FFDDB3] transition-colors ml-1 px-2 py-1 rounded-lg hover:bg-white/10"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Undo ({timeLeft}s)</span>
        </button>

        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-full text-[#9C9488] hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
