import { StepType } from '../engine/types';
import { InstructionPayload, operationInstructions, stepInstructions, explanationKeyInstructions } from './instructionCatalog';

export function resolveInstruction(input: {
  operation: string;
  stepType?: StepType;
  explanationKey?: string;
  status: 'idle' | 'generated' | 'solving' | 'correct' | 'error' | 'finished';
}): InstructionPayload {
  // 1. Error Status -> This is handled separately by the UI (hintMessage), 
  // but we can provide a generic error instruction if needed.
  if (input.status === 'error') {
    return {
      title: 'Fehler',
      body: 'Das stimmt noch nicht ganz. Schau dir den markierten Bereich nochmal an.',
      severity: 'warning',
    };
  }

  if (input.status === 'finished') {
    return {
      title: 'Geschafft!',
      body: 'Du hast die Aufgabe erfolgreich gelöst.',
      severity: 'info',
    };
  }

  // 2. ExplanationKey-specific Instruction
  if (input.explanationKey && explanationKeyInstructions[input.explanationKey]) {
    return explanationKeyInstructions[input.explanationKey];
  }

  // 3. StepType-specific Instruction
  if (input.stepType && stepInstructions[input.stepType]) {
    return stepInstructions[input.stepType];
  }

  // 4. Operation-specific Instruction
  if (operationInstructions[input.operation]) {
    return operationInstructions[input.operation];
  }

  // 5. Generic Fallback
  return {
    title: 'Nächster Schritt',
    body: 'Bearbeite den markierten Bereich Schritt für Schritt.',
    severity: 'info',
  };
}
