
import React, { useState, useEffect } from 'react';
import type { Friend, Tag } from '../../types';

interface AssignTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: Friend;
  tags: Tag[];
  onSave: (friendId: string, selectedTagIds: string[]) => void;
  onCreateTag: () => void;
}

const AssignTagModal: React.FC<AssignTagModalProps> = ({ isOpen, onClose, friend, tags, onSave, onCreateTag }) => {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Pre-select tags the friend is already in
      const currentTagIds = tags
        .filter(tag => tag.memberIds.includes(friend.id))
        .map(tag => tag.id);
      setSelectedTagIds(currentTagIds);
    }
  }, [isOpen, friend, tags]);

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleQuickCreate = () => {
    onClose();
    onCreateTag();
  };
  
  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(friend.id, selectedTagIds);
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-[2000] transition-opacity duration-300 opacity-100" 
        aria-hidden="true"
      />
      <div 
        className={`fixed inset-0 z-[2010] flex items-end sm:items-center justify-center p-0 sm:p-4 ${isOpen ? '' : 'pointer-events-none'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-tag-title"
      >
        <form onSubmit={handleSubmit} className={`w-full max-w-md bg-[--color-bg-primary] sm:rounded-2xl rounded-t-2xl shadow-2xl p-6 sm:p-8 space-y-6 modal-content-container transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <h2 id="assign-tag-title" className="text-2xl font-bold text-[--color-text-primary]">
            Add <span className="text-[--color-accent-primary]">{friend.username}</span> to Tags
          </h2>
          
          <div className="space-y-2 max-h-60 overflow-y-auto border border-[--color-border] rounded-lg p-2 bg-[--color-bg-secondary]">
            {tags.length > 0 ? tags.map(tag => (
              <label key={tag.id} className="flex items-center p-2 rounded-lg hover:bg-[--color-bg-tertiary] cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTagIds.includes(tag.id)}
                  onChange={() => handleToggleTag(tag.id)}
                  className="h-5 w-5 rounded text-[--color-accent-primary] border-[--color-border] focus:ring-[--color-accent-primary]"
                />
                <span className="ml-3 flex items-center text-sm">
                  <span className="mr-2">{tag.emoji}</span>
                  <span className="font-semibold text-[--color-text-primary]">{tag.name}</span>
                  <span className="text-[--color-text-secondary] ml-1">({tag.memberIds.length})</span>
                </span>
              </label>
            )) : (
              <p className="text-center text-sm text-[--color-text-secondary] py-4">No tags created yet.</p>
            )}
          </div>
          
          <button
            type="button"
            onClick={handleQuickCreate}
            className="w-full text-center text-sm font-semibold text-[--color-accent-primary] hover:underline"
          >
            + Create a new tag
          </button>

          <div className="flex justify-end space-x-4 pt-4 border-t border-[--color-border]">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-[--color-bg-tertiary] text-[--color-text-primary] font-semibold rounded-lg hover:bg-[--color-border] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-[--color-accent-primary] text-[--color-text-on-accent] font-semibold rounded-lg shadow-md hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary] focus:ring-offset-2">Save Tags</button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AssignTagModal;