import React from 'react';
import { Settings2 } from 'lucide-react';
import { Category } from '../types';

interface CategoryChipsProps {
  categories: Category[];
  activeCategoryId: string | null; // null means 'All'
  onSelectCategory: (id: string | null) => void;
  onOpenManager: () => void;
  accentColor: string;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  categories,
  activeCategoryId,
  onSelectCategory,
  onOpenManager,
  accentColor,
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-2 text-xs font-sans no-scrollbar">
      {/* 'All' Chip */}
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all ${
          activeCategoryId === null
            ? 'text-[#2D2B28] font-semibold border'
            : 'text-[#6E675B] hover:text-[#2D2B28] border border-transparent hover:border-[#DDD4C4]'
        }`}
        style={
          activeCategoryId === null
            ? {
                backgroundColor: `${accentColor}18`,
                borderColor: `${accentColor}50`,
              }
            : {}
        }
      >
        All Tasks
      </button>

      {/* Category Chips */}
      {categories.map((cat) => {
        const isSelected = activeCategoryId === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(isSelected ? null : cat.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all ${
              isSelected
                ? 'text-[#2D2B28] font-semibold border'
                : 'text-[#6E675B] hover:text-[#2D2B28] border border-transparent hover:border-[#DDD4C4]'
            }`}
            style={
              isSelected
                ? {
                    backgroundColor: `${cat.color}1F`,
                    borderColor: `${cat.color}60`,
                  }
                : {}
            }
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <span>{cat.name}</span>
          </button>
        );
      })}

      {/* Manage categories button */}
      <button
        type="button"
        onClick={onOpenManager}
        title="Manage categories"
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] text-[#8E877B] hover:text-[#2D2B28] hover:bg-[#EFE8DA] shrink-0 transition-colors ml-auto"
      >
        <Settings2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Categories</span>
      </button>
    </div>
  );
};
