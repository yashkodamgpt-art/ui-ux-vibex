
import React, { useState, useEffect, useRef } from 'react';
import type { Tag } from '../../types';
import { containsOffensiveContent } from '../../lib/contentFilter'; // NEW

interface CreateTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tagData: Omit<Tag, 'id' | 'memberIds' | 'creator_id'>) => void;
  existingTag: Tag | null;
}

const colors = ['green', 'blue', 'purple', 'orange', 'red', 'pink', 'yellow', 'gray'];
const emojis = ['🎉', '🎮', '🏀', '📚', '☕', '🍕', '🙋', '💡', '🍪', '🤝', '🏸', '♟️', '🎬'];
const MAX_CHARS = 20;

const colorClasses: { [key: string]: string } = {
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  pink: 'bg-pink-500',
  yellow: 'bg-yellow-500',
  gray: 'bg-gray-500',
};

const getCharLimitColors = (length: number, limit: number) => {
    if (length >= limit) return { text: 'text-[--color-error]', border: 'border-red-500 ring-red-500' };
    if (length >= limit - 5) return { text: 'text-orange-500', border: 'border-orange-400 ring-orange-400' };
    return { text: 'text-[--color-text-secondary]', border: 'border-[--color-border]' };
};

const CreateTagModal: React.FC<CreateTagModalProps> = ({ isOpen, onClose, onSave, existingTag }) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('green');
  const [selectedEmoji, setSelectedEmoji] = useState('🎉');
  const [error, setError] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (existingTag) {
        setName(existingTag.name);
        setSelectedColor(existingTag.color);
        setSelectedEmoji(existingTag.emoji);
      } else {
        setName('');
        setSelectedColor('green');
        setSelectedEmoji('🎉');
      }
      setError('');
      setTimeout(() => nameInputRef.current?.focus(), 150);
    }
  }, [isOpen, existingTag]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Tag name is required.');
      return;
    }
    
    if (containsOffensiveContent(name)) {
        setError('Please use appropriate language for the tag name.');
        return;
    }

    onSave({ name, color: selectedColor, emoji: selectedEmoji });
  };

  if (!isOpen) return null;
  
  const nameColors = getCharLimitColors(name.length, MAX_CHARS);

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
        aria-labelledby="create-tag-title"
      >
        <form onSubmit={handleSubmit} className={`w-full max-w-md bg-[--color-bg-primary] sm:rounded-2xl rounded-t-2xl shadow-2xl p-6 sm:p-8 space-y-6 modal-content-container transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <h2 id="create-tag-title" className="text-2xl font-bold text-[--color-text-primary]">
            {existingTag ? 'Edit Tag' : 'Create New Tag'}
          </h2>
          {error && <p className="text-[--color-error] text-sm">{error}</p>}
          
          <div>
              <label htmlFor="tag-name" className="text-sm font-medium text-[--color-text-secondary]">Tag Name</label>
              <input 
                ref={nameInputRef}
                id="tag-name" 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                maxLength={MAX_CHARS}
                required 
                className={`mt-1 block w-full px-4 py-2 bg-[--color-bg-tertiary] border rounded-lg text-[--color-text-primary] focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary] ${error ? 'border-red-500' : nameColors.border}`} 
                placeholder="e.g., Study Buddies"
                style={{fontSize: '16px'}}
              />
              <p className={`text-right text-xs mt-1 ${nameColors.text}`}>{name.length}/{MAX_CHARS}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-[--color-text-secondary]">Color</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {colors.map(color => (
                <button type="button" key={color} onClick={() => setSelectedColor(color)} className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${colorClasses[color]} ${selectedColor === color ? `ring-2 ring-offset-2 ring-[--color-accent-primary] ring-offset-[--color-bg-primary]` : ''}`} aria-label={`Select color ${color}`}></button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-[--color-text-secondary]">Emoji</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {emojis.map(emoji => (
                <button type="button" key={emoji} onClick={() => setSelectedEmoji(emoji)} className={`w-12 h-12 text-2xl rounded-lg flex items-center justify-center transition-all ${selectedEmoji === emoji ? 'border-2 border-[--color-accent-primary] bg-green-100/50 dark:bg-green-500/20' : 'bg-[--color-bg-tertiary] hover:bg-[--color-border]'}`}>
                    {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-[--color-border]">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-[--color-bg-tertiary] text-[--color-text-primary] font-semibold rounded-lg hover:bg-[--color-border] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-[--color-accent-primary] text-[--color-text-on-accent] font-semibold rounded-lg shadow-md hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary] focus:ring-offset-2">Save Tag</button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateTagModal;