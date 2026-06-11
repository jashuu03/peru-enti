import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className={`relative z-10 w-full max-w-lg glass-panel rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <h3 className="text-xl font-bold text-white bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
