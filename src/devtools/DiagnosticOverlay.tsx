import React, { useState, useEffect } from 'react';
import { MathSessionState } from '../session/sessionTypes';
import { StudentModel } from '../student/StudentModel';

interface DiagnosticOverlayProps {
  state: MathSessionState;
  seed?: number;
  studentModel?: StudentModel;
}

export const DiagnosticOverlay: React.FC<DiagnosticOverlayProps> = ({ state, seed, studentModel }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'd') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  const currentStep = state.steps[state.currentStepIndex];

  return (
    <div className="fixed top-4 right-4 w-80 bg-gray-900 text-green-400 p-4 rounded-lg shadow-2xl font-mono text-xs z-50 opacity-95 overflow-y-auto max-h-[90vh]">
      <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
        <h3 className="text-white font-bold">Diagnostic Overlay</h3>
        <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-white">✕</button>
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-gray-400">Status:</span> 
          <span className={`ml-2 ${state.status === 'error' ? 'text-red-400' : state.status === 'correct' ? 'text-green-400' : 'text-yellow-400'}`}>
            {state.status}
          </span>
        </div>

        {seed !== undefined && (
          <div>
            <span className="text-gray-400">Seed:</span> 
            <span className="ml-2 text-blue-300">{seed}</span>
          </div>
        )}

        <div>
          <span className="text-gray-400">Step:</span> 
          <span className="ml-2 text-white">{state.currentStepIndex + 1} / {state.steps.length}</span>
        </div>

        {currentStep && (
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-gray-400 mb-1">Current Step Details:</div>
            <div><span className="text-gray-500">Type:</span> {currentStep.type}</div>
            <div><span className="text-gray-500">Targets:</span> {JSON.stringify(currentStep.targetCells)}</div>
            <div><span className="text-gray-500">Expected:</span> {JSON.stringify(currentStep.expectedValues)}</div>
            <div><span className="text-gray-500">Dependencies:</span> {JSON.stringify(currentStep.dependencies || [])}</div>
          </div>
        )}

        {studentModel && (
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-gray-400 mb-1">STUDENT MODEL</div>
            <div className="grid grid-cols-2 gap-1">
              {['addition_carry', 'subtraction_borrow', 'multiplication_basic', 'division_process'].map(skill => (
                <React.Fragment key={skill}>
                  <span className="truncate text-gray-500" title={skill}>{skill.replace(/_/g, ' ')}:</span>
                  <span className="text-white text-right">
                    {(studentModel.getSkillScore(skill as any) * 100).toFixed(0)}%
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {state.highlights.length > 0 && (
          <div>
            <span className="text-gray-400">Highlights:</span> 
            <span className="ml-2 text-red-400">{JSON.stringify(state.highlights)}</span>
          </div>
        )}

        {state.stepResult && (
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-gray-400 mb-1">Last Validation:</div>
            <div><span className="text-gray-500">Correct:</span> {state.stepResult.correct ? 'Yes' : 'No'}</div>
            {state.stepResult.errors.length > 0 && (
              <div className="text-red-400 mt-1">
                Errors: {JSON.stringify(state.stepResult.errors)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
