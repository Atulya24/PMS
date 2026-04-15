import React, { useEffect, useState } from 'react';

const Toast = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-success-500 text-white';
      case 'error':
        return 'bg-danger-500 text-white';
      case 'warning':
        return 'bg-warning-500 text-white';
      case 'info':
        return 'bg-primary-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-pulse">
      <div className={`${getToastStyles()} px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3`}>
        <span>{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
          className="text-white hover:text-gray-200"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;
