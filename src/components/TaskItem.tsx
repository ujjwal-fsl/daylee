import React, { useState, useRef, useEffect } from 'react';
import { Trash2, GripVertical, Repeat } from 'lucide-react';
import { HandwrittenCheckbox } from './HandwrittenCheckbox';
import { Category, HandwritingFont, Task } from '../types';

interface TaskItemProps {
  task: Task;
  category?: Category;
  isCompleted: boolean;
  onToggleComplete: (taskId: string) => void;
  onEdit: (taskId: string, newText: string) => void;
  onDelete: (taskId: string) => void;
  font: HandwritingFont;
  accentColor: string;
  isOffline?: boolean;
  isHighlighted?: boolean;
  onClickTask?: () => void;
  showDateBadge?: string;
  // Drag and drop props
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  category,
  isCompleted,
  onToggleComplete,
  onEdit,
  onDelete,
  font,
  accentColor,
  isOffline = false,
  isHighlighted = false,
  onClickTask,
  showDateBadge,
  isDragging = false,
  onDragStart,
  onDragOver,
  onDragEnd,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHighlighted && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isHighlighted]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editText.trim() && editText.trim() !== task.text) {
      onEdit(task.id, editText.trim());
    } else {
      setEditText(task.text);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditText(task.text);
      setIsEditing(false);
    }
  };

  const fontClass =
    font === 'kalam'
      ? 'font-kalam text-lg sm:text-xl leading-snug'
      : font === 'caveat'
      ? 'font-caveat text-xl sm:text-2xl leading-tight'
      : 'font-patrick text-lg sm:text-xl leading-snug';

  // Format recurrence description
  const getRepeatLabel = () => {
    if (!task.repeatRule || task.repeatRule.type === 'none') return null;
    switch (task.repeatRule.type) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'custom_weekdays': {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return task.repeatRule.weekdays?.map((d) => days[d]).join(', ') || 'Custom';
      }
      case 'every_x_days':
        return `Every ${task.repeatRule.interval}d`;
      default:
        return null;
    }
  };

  const repeatLabel = getRepeatLabel();

  return (
    <div
      ref={itemRef}
      draggable={!isEditing && !isOffline}
      onDragStart={(e) => onDragStart && onDragStart(e, task.id)}
      onDragOver={(e) => onDragOver && onDragOver(e, task.id)}
      onDragEnd={onDragEnd}
      className={`group relative flex items-start gap-2.5 sm:gap-3.5 py-2.5 px-2 rounded-xl transition-all select-none ${
        isHighlighted
          ? 'bg-[#FFF3D6] ring-2 ring-[#E0A96D] shadow-xs'
          : isDragging
          ? 'opacity-40 bg-[#EFE8DA]/50 scale-[0.99]'
          : 'hover:bg-[#F7F2E7]/60'
      }`}
    >
      {/* Drag handle */}
      {!isOffline && (
        <div
          className="mt-1 cursor-grab active:cursor-grabbing text-[#B8B1A4] opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* Hand-drawn Checkbox */}
      <div className="mt-0.5">
        <HandwrittenCheckbox
          checked={isCompleted}
          disabled={isOffline}
          onChange={() => onToggleComplete(task.id)}
          accentColor={accentColor}
        />
      </div>

      {/* Task Content / Inline Editing Area */}
      <div className="flex-1 min-w-0 pr-1">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editText}
            disabled={isOffline}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={`w-full bg-transparent border-b border-[#2D2B28] text-[#2D2B28] focus:outline-none px-0.5 py-0 ${fontClass}`}
          />
        ) : (
          <div
            onClick={() => {
              if (!isOffline) {
                setIsEditing(true);
              }
            }}
            className="cursor-text"
            title={isOffline ? undefined : "Tap to edit task"}
          >
            <div className="relative inline-block max-w-full">
              {/* Task text */}
              <span
                className={`break-words tracking-wide transition-colors ${fontClass} ${
                  isCompleted
                    ? 'text-[#969186] line-through decoration-[#8A7F73]/70 decoration-1.5'
                    : 'text-[#2D2B28]'
                }`}
              >
                {task.text}
              </span>

              {/* Hand-drawn organic strike-through overlay when newly marked */}
              {isCompleted && (
                <span
                  className="absolute left-0 top-[52%] h-[1.8px] bg-[#7D766B] rounded-full pointer-events-none animate-strike"
                  style={{
                    transform: 'rotate(-0.4deg)',
                  }}
                />
              )}
            </div>

            {/* Metadata tags: Category & Recurrence rule */}
            <div className="flex items-center gap-2 mt-0.5 font-sans flex-wrap">
              {/* Associated Date badge for search results */}
              {showDateBadge && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#686053] bg-[#EFE7D8] border border-[#E0D7C6] px-2 py-0.5 rounded-md">
                  <span>{showDateBadge}</span>
                </span>
              )}

              {/* Category indicator: subtle pastel bullet */}
              {category && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#7A7367]">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </span>
              )}

              {/* Recurrence tag */}
              {repeatLabel && (
                <span className="inline-flex items-center gap-1 text-[10px] text-[#8C8477] bg-[#EFE9DD]/70 px-1.5 py-0.5 rounded-md">
                  <Repeat className="w-2.5 h-2.5 text-[#8C8477]" />
                  <span>{repeatLabel}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete task button */}
      {!isOffline && (
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
          title="Delete task"
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#A0988A] hover:text-[#C55745] hover:bg-[#F2E8E4]/60 transition-all active:scale-95"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
