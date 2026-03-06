import React from 'react';
import { InstructionPayload } from '../session/instructionCatalog';
import { Info, AlertCircle, CheckCircle } from 'lucide-react';

interface TaskInstructionCardProps {
  instruction: InstructionPayload;
  mode?: 'compact' | 'default';
}

export const TaskInstructionCard: React.FC<TaskInstructionCardProps> = ({ instruction, mode = 'default' }) => {
  const { title, body, inputHint, severity = 'info' } = instruction;

  const getIcon = () => {
    switch (severity) {
      case 'warning': return <AlertCircle className="text-amber-500" size={20} />;
      case 'guided': return <CheckCircle className="text-emerald-500" size={20} />;
      case 'info':
      default: return <Info className="text-blue-500" size={20} />;
    }
  };

  const getBgColor = () => {
    switch (severity) {
      case 'warning': return 'bg-amber-50 border-amber-200';
      case 'guided': return 'bg-emerald-50 border-emerald-200';
      case 'info':
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  if (mode === 'compact') {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${getBgColor()} shadow-sm`}>
        <div className="flex-shrink-0">{getIcon()}</div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-600">{body}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 p-4 rounded-xl border ${getBgColor()} shadow-sm`}>
      <div className="flex items-center gap-2">
        {getIcon()}
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{body}</p>
      {inputHint && (
        <div className="mt-2 pt-2 border-t border-black/5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Tipp: {inputHint}</p>
        </div>
      )}
    </div>
  );
};
