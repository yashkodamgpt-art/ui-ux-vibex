
import React from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm' }) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        onClick={onCancel}
        className="fixed inset-0 bg-black/50 z-[3000] transition-opacity duration-300 opacity-100" 
        aria-hidden="true"
      />
      <div 
        className={`fixed inset-0 z-[3010] flex items-end sm:items-center justify-center p-0 sm:p-4 ${isOpen ? '' : 'pointer-events-none'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
      >
        <div className={`w-full max-w-sm bg-[--color-bg-primary] sm:rounded-2xl rounded-t-2xl shadow-2xl p-6 space-y-4 modal-content-container transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <h2 id="confirmation-title" className="text-xl font-bold text-[--color-text-primary]">{title}</h2>
          <p className="text-[--color-text-secondary]">{message}</p>
          <div className="flex justify-end space-x-3 pt-2">
            <button 
              type="button" 
              onClick={onCancel} 
              className="px-4 py-2 bg-[--color-bg-tertiary] text-[--color-text-primary] font-semibold rounded-lg hover:bg-[--color-border] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={onConfirm} 
              className="px-4 py-2 bg-[--color-error] text-white font-semibold rounded-lg shadow-md hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmationDialog;