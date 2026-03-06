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

    return (
        <div className={cn(
            "bg-gray-100 p-2 rounded-xl select-none touch-manipulation",
            isSide ? "w-[160px] h-full overflow-y-auto" : "w-full",
            className
        )}>
            <div className={cn(
                "grid gap-2",
                isSide ? "grid-cols-2" : "grid-cols-6 sm:grid-cols-12" // Ultra wide on bottom? No, standard numpad is better.
            )}>
                {/* 
                    Bottom Layout:
                    1 2 3 4 5
                    6 7 8 9 0
                    DEL ENTER
                    
                    OR Standard Phone Numpad:
                    1 2 3
                    4 5 6
                    7 8 9
                    . 0 DEL
                */}
                
                {/* Let's use a standard 1-9 grid + bottom row for both, just changing columns */}
                <div className={cn("contents", isSide ? "" : "hidden")}>
                    {/* Side Layout (2 cols) */}
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(d => (
                         <button key={d} onClick={() => onDigit(d)} className="h-12 bg-white rounded shadow-sm font-bold text-xl active:bg-gray-50">{d}</button>
                    ))}
                    <button onClick={onDelete} className="h-12 bg-red-100 text-red-600 rounded shadow-sm flex items-center justify-center active:bg-red-200"><Delete size={20}/></button>
                    <button onClick={onEnter} className="h-12 bg-blue-500 text-white rounded shadow-sm flex items-center justify-center active:bg-blue-600">
                        {enterLabel === 'Next' ? <ArrowRight/> : <Check/>}
                    </button>
                </div>

                <div className={cn("grid grid-cols-7 gap-1 w-full", isSide ? "hidden" : "")}>
                    {/* Bottom Layout (Linear / Wide for landscape phones if at bottom, or standard block) 
                        Actually, for mobile portrait, a 3x4 block is standard.
                        For mobile landscape, if we put it on the side, it's 2x6.
                    */}
                </div>
            </div>
            
            {/* 
                Let's simplify. I will render a standard keypad structure and let CSS Grid handle the shape.
            */}
            <div className={cn(
                "grid gap-2",
                layout === 'side' ? "grid-cols-2" : "grid-cols-6" // 6 cols for bottom bar: 1,2,3,4,5,6 / 7,8,9,0,Del,Ent
            )}>
                 {['1', '2', '3', '4', '5', '6'].map(d => (
                    <button key={d} onClick={() => onDigit(d)} className="h-10 sm:h-12 bg-white rounded shadow-sm font-bold text-xl active:bg-gray-50 active:scale-95 transition-transform">{d}</button>
                 ))}
                 {['7', '8', '9', '0'].map(d => (
                    <button key={d} onClick={() => onDigit(d)} className="h-10 sm:h-12 bg-white rounded shadow-sm font-bold text-xl active:bg-gray-50 active:scale-95 transition-transform">{d}</button>
                 ))}
                 <button onClick={onDelete} className="h-10 sm:h-12 bg-red-100 text-red-600 rounded shadow-sm flex items-center justify-center active:bg-red-200 active:scale-95 transition-transform"><Delete size={20}/></button>
                 <button onClick={onEnter} className={cn(
                    "h-10 sm:h-12 text-white rounded shadow-sm flex items-center justify-center active:scale-95 transition-transform",
                    enterLabel === 'Next' ? "bg-green-500 active:bg-green-600" : "bg-blue-500 active:bg-blue-600"
                 )}>
                    {enterLabel === 'Next' ? <ArrowRight size={20}/> : <Check size={20}/>}
                 </button>
            </div>
        </div>
    );
}
