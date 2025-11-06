import React, { useState, useEffect } from 'react';
import type { Tag } from '../../types';
import { containsOffensiveContent } from '../../lib/contentFilter'; // NEW

interface CreateTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tagData: Omit<Tag, 'id' | 'memberIds'>) => void;
  existingTag: Tag | null;
}

const colors = ['green', 'blue', 'purple', 'orange', 'red', 'pink', 'yellow', 'gray'];
const emojis = ['🎉', '🎮', '🏀', '📚', '☕', '🍕', '🙋', '💡', '🍪', '🤝', '🏸', '♟️', '🎬'];

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

const CreateTagModal: React.FC<CreateTagModalProps> = ({ isOpen, onClose, onSave, existingTag }) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('green');
  const [selectedEmoji, setSelectedEmoji] = useState('🎉');
  const [error, setError] = useState('');

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
    }
  }, [isOpen, existingTag]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Tag name is required.');
      return;
    }
    
    // NEW: Content Filtering
    if (containsOffensiveContent(name)) {
        setError('Please use appropriate language for the tag name.');
        return;
    }

    onSave({ name, color: selectedColor, emoji: selectedEmoji });
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
        className="fixed inset-0 z-[2010] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-tag-title"
      >
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 transform transition-all duration-300 scale-100">
          <h2 id="create-tag-title" className="text-2xl font-bold text-gray-800">
            {existingTag ? 'Edit Tag' : 'Create New Tag'}
          </h2>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <div>
              <label htmlFor="tag-name" className="text-sm font-medium text-gray-700">Tag Name</label>
              <input 
                id="tag-name" 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                maxLength={20}
                required 
                className={`mt-1 block w-full px-4 py-2 bg-gray-50 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 ${error ? 'border-red-500' : 'border-gray-300'}`} 
                placeholder="e.g., Study Buddies"
              />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Color</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {colors.map(color => (
                <button type="button" key={color} onClick={() => setSelectedColor(color)} className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${colorClasses[color]} ${selectedColor === color ? 'ring-2 ring-offset-2 ring-green-500' : ''}`} aria-label={`Select color ${color}`}></button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Emoji</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {emojis.map(emoji => (
                <button type="button" key={emoji} onClick={() => setSelectedEmoji(emoji)} className={`w-12 h-12 text-2xl rounded-lg flex items-center justify-center transition-all ${selectedEmoji === emoji ? 'border-2 border-green-500 bg-green-100' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">Save Tag</button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateTagModal;