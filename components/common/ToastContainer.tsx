
import React from 'react';
import ReactDOM from 'react-dom';
import Toast, { type ToastProps } from './Toast';

export type Toast = Omit<ToastProps, 'onDismiss'>;

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  const toastRoot = document.getElementById('toast-root');

  if (!toastRoot) return null;

  return ReactDOM.createPortal(
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[5000] w-full max-w-xs flex flex-col gap-2">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onDismiss={removeToast} />
      ))}
    </div>,
    toastRoot
  );
};

export default ToastContainer;
