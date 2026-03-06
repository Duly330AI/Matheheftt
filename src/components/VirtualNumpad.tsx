import React from 'react';
import { Delete, Check, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface VirtualNumpadProps {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  enterLabel?: 'Check' | 'Next' | 'Done';
  className?: string;
}

export const VirtualNumpad: React.FC<VirtualNumpadProps> = ({
  onDigit,
  onDelete,
  onEnter,
  enterLabel = 'Check',
  className
}) => {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <div className={cn("grid gap-2 p-2 bg-gray-100 rounded-xl select-none touch-manipulation", className)}>
      {/* Portrait Layout (Default) - 3 columns */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            onClick={() => onDigit(digit)}
            className="h-12 bg-white rounded-lg shadow-sm border border-gray-200 text-xl font-semibold active:bg-gray-50 active:scale-95 transition-all"
          >
            {digit}
          </button>
        ))}
        <button
          onClick={onDelete}
          className="h-12 bg-red-50 rounded-lg shadow-sm border border-red-100 text-red-600 flex items-center justify-center active:bg-red-100 active:scale-95 transition-all"
        >
          <Delete size={24} />
        </button>
        <button
          onClick={() => onDigit('0')}
          className="h-12 bg-white rounded-lg shadow-sm border border-gray-200 text-xl font-semibold active:bg-gray-50 active:scale-95 transition-all"
        >
          0
        </button>
        <button
          onClick={onEnter}
          className={cn(
            "h-12 rounded-lg shadow-sm border flex items-center justify-center active:scale-95 transition-all font-medium",
            enterLabel === 'Next' 
              ? "bg-green-500 text-white border-green-600 hover:bg-green-600" 
              : "bg-blue-500 text-white border-blue-600 hover:bg-blue-600"
          )}
        >
          {enterLabel === 'Next' ? <ArrowRight size={24} /> : <Check size={24} />}
        </button>
      </div>

      {/* Landscape Layout (Side Panel) - 2 columns */}
      <div className="hidden md:grid grid-cols-2 gap-2">
         {/* We might not need a desktop version if we hide it, but for tablet landscape it's useful */}
         {/* Actually, the requirement is "Mobile Landscape: Numpad at the side". 
             So we need a responsive layout that switches based on orientation/screen size.
             Tailwind's 'md' breakpoint is width-based. 
             For mobile landscape, the width is often > height, but might be < md (768px).
             
             Let's stick to a flexible grid that can be styled by the parent container 
             or use a media query for orientation if needed.
             
             For now, let's provide a single flexible structure and let the parent control dimensions/columns via className.
          */}
      </div>
    </div>
  );
};

// Revised approach: 
// We'll make a single responsive component that adapts its internal grid based on a prop or CSS class,
// but for simplicity in Phase 3, let's build two distinct internal layouts and toggle them with CSS classes 
// passed from the parent, or just use a standard grid that reflows.

// Actually, a standard 3-col grid works for bottom-bar.
// A 1-col or 2-col grid works for side-bar.

export const ResponsiveVirtualNumpad: React.FC<VirtualNumpadProps & { layout?: 'bottom' | 'side' }> = ({
    onDigit,
    onDelete,
    onEnter,
    enterLabel = 'Check',
    layout = 'bottom',
    className
}) => {
    const isSide = layout === 'side';

    const renderKey = (key: string, label?: React.ReactNode, variant: 'default' | 'action' | 'delete' | 'submit' = 'default') => {
        const baseClass = "rounded shadow-sm font-bold text-xl active:scale-95 transition-transform flex items-center justify-center";
        const variants = {
            default: "bg-white active:bg-gray-50 h-10 sm:h-12",
            action: "bg-blue-50 text-blue-600 border border-blue-100 active:bg-blue-100 h-10 sm:h-12",
            delete: "bg-red-100 text-red-600 active:bg-red-200 h-10 sm:h-12",
            submit: cn(
                "text-white h-10 sm:h-12",
                enterLabel === 'Next' ? "bg-green-500 active:bg-green-600" : "bg-blue-500 active:bg-blue-600"
            )
        };

        return (
            <button 
                key={key} 
                onClick={variant === 'delete' ? onDelete : variant === 'submit' ? onEnter : () => onDigit(key)} 
                className={cn(baseClass, variants[variant])}
            >
                {label || key}
            </button>
        );
    };

    return (
        <div className={cn(
            "bg-gray-100 p-2 rounded-xl select-none touch-manipulation",
            isSide ? "w-[240px] h-full overflow-y-auto" : "w-full",
            className
        )}>
            <div className={cn(
                "grid gap-2",
                isSide ? "grid-cols-3" : "grid-cols-6 sm:grid-cols-8"
            )}>
                {/* Numbers 1-9 */}
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => renderKey(d))}
                
                {/* Zero */}
                {renderKey('0')}

                {/* Operators - Always visible now */}
                {renderKey('+', '+', 'action')}
                {renderKey('-', '-', 'action')}
                {renderKey('(', '(', 'action')}
                {renderKey(')', ')', 'action')}
                {/* Extra algebra keys could go here if needed, e.g. x, y, z */}
                
                {/* Actions */}
                {renderKey('DEL', <Delete size={20}/>, 'delete')}
                {renderKey('ENTER', enterLabel === 'Next' ? <ArrowRight size={20}/> : <Check size={20}/>, 'submit')}
            </div>
        </div>
    );
}
