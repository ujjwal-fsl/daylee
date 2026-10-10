import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { Category, Task } from '../types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  tasks: Task[];
  onAddCategory: (name: string, color: string) => void;
  onRenameCategory: (id: string, newName: string) => void;
  onDeleteCategory: (idToDelete: string, reassignToId: string) => void;
  accentColor: string;
}

const PASTEL_PALETTE = [
  '#6A8E7F', // Sage Green
  '#5B879E', // Dusty Blue
  '#8A7BA5', // Lavender
  '#D77F67', // Warm Peach
  '#C49439', // Soft Mustard
  '#7C9264', // Olive Pastel
  '#A07886', // Dusty Rose
  '#659591', // Muted Teal
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  tasks,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  accentColor,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PASTEL_PALETTE[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Reassignment deletion flow state
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<Category | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('A category with this name already exists.');
      return;
    }

    onAddCategory(trimmed, selectedColor);
    setNewCatName('');
  };

  const startEditing = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const saveRename = (catId: string) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    if (categories.some((c) => c.id !== catId && c.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('A category with this name already exists.');
      return;
    }
    onRenameCategory(catId, trimmed);
    setEditingId(null);
  };

  const initiateDelete = (cat: Category) => {
    // Count how many tasks are assigned to this category
    const affectedCount = tasks.filter((t) => t.categoryId === cat.id).length;
    const remainingCategories = categories.filter((c) => c.id !== cat.id);

    if (remainingCategories.length === 0) {
      alert('You must have at least one category.');
      return;
    }

    if (affectedCount === 0) {
      // Direct delete if no tasks assigned
      onDeleteCategory(cat.id, remainingCategories[0].id);
    } else {
      // Reassignment flow required by Section 8.9 & 19
      setCategoryPendingDelete(cat);
      setReassignTargetId(remainingCategories[0].id);
    }
  };

  const confirmReassignAndDelete = () => {
    if (!categoryPendingDelete || !reassignTargetId) return;
    onDeleteCategory(categoryPendingDelete.id, reassignTargetId);
    setCategoryPendingDelete(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs font-sans">
      <div className="w-full max-w-md bg-[#FFFDF9] rounded-2xl shadow-xl border border-[#E5DEC9] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFE8DA] bg-[#FAF6EE]">
          <div>
            <h2 className="text-base font-semibold text-[#2D2B28]">Manage Categories</h2>
            <p className="text-xs text-[#7A7367]">Organize tasks with calm pastel tones</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#8A8478] hover:text-[#2D2B28] hover:bg-[#EFE8DA]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Create New Category Form */}
          <form onSubmit={handleCreate} className="space-y-3">
            <label className="text-xs font-semibold text-[#5A5449] block">
              Add New Category
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Chemistry, Reading, Project..."
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-[#DDD4C4] bg-white focus:outline-none focus:ring-1 focus:ring-[#8E887E] text-[#2D2B28]"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-white text-xs font-medium hover:opacity-90 active:scale-95 transition-all"
                style={{ backgroundColor: accentColor }}
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Color Swatches */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-[#7A7367]">Color:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {PASTEL_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`w-5 h-5 rounded-full transition-transform ${
                      selectedColor === c ? 'scale-125 ring-2 ring-offset-1 ring-[#8E887E]' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </form>

          {/* List of Existing Categories */}
          <div className="space-y-2 pt-2 border-t border-[#EFE8DA]">
            <label className="text-xs font-semibold text-[#5A5449] block">
              Current Categories ({categories.length})
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {categories.map((cat) => {
                const count = tasks.filter((t) => t.categoryId === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#FAF6EE] border border-[#ECE4D5]"
                  >
                    {editingId === cat.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveRename(cat.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="flex-1 px-2 py-1 text-xs rounded border border-[#C5BBAA] bg-white"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => saveRename(cat.id)}
                          className="text-xs px-2 py-1 rounded bg-[#2D2B28] text-white"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm font-medium text-[#2D2B28]">{cat.name}</span>
                        <span className="text-[11px] text-[#8C8477]">
                          ({count} {count === 1 ? 'task' : 'tasks'})
                        </span>
                      </div>
                    )}

                    {editingId !== cat.id && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEditing(cat)}
                          title="Rename category"
                          className="p-1 rounded text-[#8E877B] hover:text-[#2D2B28] hover:bg-[#EFE8DA]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {categories.length > 1 && (
                          <button
                            type="button"
                            onClick={() => initiateDelete(cat)}
                            title="Delete category"
                            className="p-1 rounded text-[#8E877B] hover:text-[#C55745] hover:bg-[#F4E9E6]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#FAF6EE] border-t border-[#EFE8DA] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4A453E] hover:bg-[#EFE8DA] transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {/* Reassign Confirmation Modal (Section 8.9 & 19 Requirement) */}
      {categoryPendingDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-sans">
          <div className="w-full max-w-sm bg-[#FFFDF9] rounded-2xl shadow-2xl border border-[#E5DEC9] p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-[#FAF0ED] text-[#D77F67]">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#2D2B28]">
                  Reassign tasks in "{categoryPendingDelete.name}"
                </h3>
                <p className="text-xs text-[#7A7367] mt-1">
                  This category contains {tasks.filter((t) => t.categoryId === categoryPendingDelete.id).length} tasks.
                  Please select where to move them:
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#4A453E]">Move tasks to:</label>
              <select
                value={reassignTargetId}
                onChange={(e) => setReassignTargetId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#DDD4C4] bg-white text-[#2D2B28] focus:outline-none"
              >
                {categories
                  .filter((c) => c.id !== categoryPendingDelete.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCategoryPendingDelete(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#6B645A] hover:bg-[#EFE8DA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReassignAndDelete}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-white bg-[#C55745] hover:opacity-90"
              >
                Reassign & Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
