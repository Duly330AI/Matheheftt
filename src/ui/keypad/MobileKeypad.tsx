import React from 'react';
import { motion } from 'motion/react';
import { Delete, Check } from 'lucide-react';

export type KeypadKey = 
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | '+' | '-' | '*' | '/' | '(' | ')' | 'x' | 'y' | 'a' | 'b'
  | 'Backspace' | 'Enter';

export interface MobileKeypadProps {
  onKeyPress: (key: KeypadKey) => void;
  mode?: 'numeric' | 'algebra';
  isVisible?: boolean;
}

export const MobileKeypad: React.FC<MobileKeypadProps> = ({ 
  onKeyPress, 
  mode = 'numeric',
  isVisible = true 
}) => {
  if (!isVisible) return null;

  const handlePress = (key: KeypadKey) => {
    // Provide haptic feedback if available
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
    onKeyPress(key);
  };

  const renderKey = (key: KeypadKey, label?: React.ReactNode, className: string = '') => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        handlePress(key);
      }}
      className={`h-14 flex items-center justify-center text-2xl font-medium rounded-xl bg-white shadow-sm border border-gray-200 active:bg-gray-100 active:scale-95 transition-all select-none touch-manipulation ${className}`}
    >
      {label || key}
    </button>
  );

  const numericKeys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['0', 'Backspace', 'Enter']
  ];

  const algebraKeys = [
    ['x', 'y', 'a', 'b'],
    ['7', '8', '9', '+'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', 'Backspace'],
    ['0', '(', ')', 'Enter']
  ];

  const layout = mode === 'algebra' ? algebraKeys : numericKeys;

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed bottom-0 left-0 right-0 bg-gray-100 p-2 pb-safe border-t border-gray-200 z-50 md:hidden"
    >
      <div className="max-w-md mx-auto flex flex-col gap-2">
        {layout.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2">
            {row.map((key) => {
              if (key === 'Backspace') {
                return renderKey(key as KeypadKey, <Delete className="w-6 h-6" />, 'flex-1 bg-gray-200 text-gray-700');
              }
              if (key === 'Enter') {
                return renderKey(key as KeypadKey, <Check className="w-6 h-6" />, 'flex-1 bg-blue-500 text-white border-blue-600 active:bg-blue-600');
              }
              if (['+', '-', '*', '/', '(', ')', 'x', 'y', 'a', 'b'].includes(key)) {
                return renderKey(key as KeypadKey, key, 'flex-1 bg-gray-50 text-indigo-700');
              }
              return renderKey(key as KeypadKey, key, 'flex-1');
            })}
          </div>
        ))}
      </div>
    </motion.div>
  );
};
