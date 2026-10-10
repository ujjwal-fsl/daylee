import React from 'react';
import { Calendar, ArrowRight, Check, X, Sparkles } from 'lucide-react';
import { Category, HandwritingFont, Task } from '../types';
import { formatSearchGroupDate, isToday } from '../utils/dateUtils';
import { HandwrittenCheckbox } from './HandwrittenCheckbox';
import { EmptyNotebookState } from './EmptyNotebookState';

interface SearchResultsListProps {
  matchingTasks: Task[];
  categories: Category[];
  searchQuery: string;
  onClearSearch: () => void;
  onSelectTask: (task: Task) => void;
  onToggleComplete: (taskId: string, taskDate: string) => void;
  font: HandwritingFont;
  accentColor: string;
  isOffline?: boolean;
}

export const SearchResultsList: React.FC<SearchResultsListProps> = ({
  matchingTasks,
  categories,
  searchQuery,
  onClearSearch,
  onSelectTask,
  onToggleComplete,
  font,
  accentColor,
  isOffline = false,
}) => {
  if (matchingTasks.length === 0) {
    return (
      <EmptyNotebookState
        font={font}
        isSearchActive={true}
        searchQuery={searchQuery}
        onClearSearch={onClearSearch}
        accentColor={accentColor}
      />
    );
  }

  // Group tasks by their associated date (createdDate or repeatRule startDate)
  const groupedByDate: Record<string, Task[]> = {};
  matchingTasks.forEach((task) => {
    const taskDate = task.createdDate || 'Unscheduled';
    if (!groupedByDate[taskDate]) {
      groupedByDate[taskDate] = [];
    }
    groupedByDate[taskDate].push(task);
  });

  // Sort dates chronologically
  const sortedDates = Object.keys(groupedByDate).sort();

  const fontClass =
    font === 'kalam'
      ? 'font-kalam text-lg sm:text-xl leading-snug'
      : font === 'caveat'
      ? 'font-caveat text-xl sm:text-2xl leading-tight'
      : 'font-patrick text-lg sm:text-xl leading-snug';

  return (
    <div className="w-full space-y-5 my-2">
      {/* Search Header Banner */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E8DFD0] text-xs font-sans">
        <div className="flex items-center gap-2 text-[#5E574B]">
          <span className="font-semibold text-[#2D2B28]">
            {matchingTasks.length} {matchingTasks.length === 1 ? 'task' : 'tasks'} found
          </span>
          <span className="text-[#999183]">•</span>
          <span className="text-[#7A7367]">Searching across all notebook dates</span>
        </div>
        <button
          type="button"
          onClick={onClearSearch}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#7A7367] hover:text-[#2D2B28] px-2 py-0.5 rounded-md hover:bg-[#EFE8DA] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          <span>Clear search</span>
        </button>
      </div>

      {/* Date-grouped Search Results */}
      <div className="space-y-6">
        {sortedDates.map((dateStr) => {
          const dateTasks = groupedByDate[dateStr];
          const formattedDate = formatSearchGroupDate(dateStr);
          const isCurrentDay = isToday(dateStr);

          return (
            <div key={dateStr} className="space-y-1.5">
              {/* Date Group Header */}
              <div className="flex items-center justify-between pt-1 pb-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#8E877B]" />
                  <h3 className="font-serif font-medium text-base text-[#2D2B28] tracking-tight">
                    {formattedDate}
                  </h3>
                  {isCurrentDay && (
                    <span
                      className="text-[10px] font-sans font-semibold uppercase px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                    >
                      Today
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onSelectTask(dateTasks[0])}
                  className="text-[11px] font-sans text-[#8C8476] hover:text-[#2D2B28] inline-flex items-center gap-1 hover:underline"
                >
                  <span>Go to page</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Tasks under this date */}
              <div className="divide-y divide-transparent space-y-1 pl-1">
                {dateTasks.map((task) => {
                  const category = categories.find((c) => c.id === task.categoryId);
                  const isCompleted = task.completedDates.includes(dateStr);

                  return (
                    <div
                      key={task.id}
                      className="group flex items-center justify-between p-2 rounded-xl hover:bg-[#F7F2E7]/80 transition-colors border border-transparent hover:border-[#E8DFD0]/60 cursor-pointer"
                      onClick={() => onSelectTask(task)}
                    >
                      <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0 pr-2">
                        {/* Hand-drawn Checkbox */}
                        <div
                          className="mt-0.5 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleComplete(task.id, dateStr);
                          }}
                        >
                          <HandwrittenCheckbox
                            checked={isCompleted}
                            disabled={isOffline}
                            onChange={() => onToggleComplete(task.id, dateStr)}
                            accentColor={accentColor}
                          />
                        </div>

                        {/* Task text & tags */}
                        <div className="flex-1 min-w-0">
                          <span
                            className={`break-words transition-colors block ${fontClass} ${
                              isCompleted
                                ? 'text-[#969186] line-through decoration-[#8A7F73]/70 decoration-1.5'
                                : 'text-[#2D2B28]'
                            }`}
                          >
                            {task.text}
                          </span>

                          <div className="flex items-center gap-2 mt-0.5 font-sans">
                            {category && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#7A7367]">
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                                <span>{category.name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Jump action hint button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTask(task);
                        }}
                        title={`Open notebook page for ${formattedDate}`}
                        className="opacity-0 group-hover:opacity-100 shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[#6B6356] bg-white border border-[#DDD4C4] hover:bg-[#FAF6EE] transition-all shadow-2xs"
                      >
                        <span className="hidden sm:inline">View on page</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
