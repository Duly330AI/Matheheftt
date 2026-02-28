import { CognitiveLoadState } from '../cognitive/types';
import { ResponseAction, ResponseContext } from './types';

export class AdaptiveResponseEngine {
  public decide(context: ResponseContext): ResponseAction {
    const action: ResponseAction = {
      difficultyModifier: 0,
      enableHints: false,
      reduceDigits: false,
      focusMode: false,
      motivationalMessage: null,
    };

    const { loadState, skillConfidence, recentErrorRate, consecutiveSuccesses } = context;

    // 1. Handle Overload (Frustration Risk)
    if (loadState === CognitiveLoadState.OVERLOADED) {
      action.focusMode = true; // Slow down, reduce distractions

      if (skillConfidence < 0.6) {
        // Weak skill + Overloaded -> Simplify significantly
        action.difficultyModifier = -1;
        action.reduceDigits = true;
        action.enableHints = true;
        action.motivationalMessage = "Lass uns das Schritt für Schritt machen.";
      } else {
        // Strong skill + Overloaded -> Likely careless errors or fatigue
        // Don't reduce difficulty too much, but offer support
        action.enableHints = true;
        if (recentErrorRate > 0.5) {
          action.difficultyModifier = -1;
          action.motivationalMessage = "Konzentrier dich, du kannst das!";
        } else {
          action.motivationalMessage = "Nimm dir Zeit.";
        }
      }
      return action;
    }

    // 2. Handle High Load (Challenging but manageable)
    if (loadState === CognitiveLoadState.HIGH) {
      if (recentErrorRate > 0.3) {
        // Struggling a bit -> Enable hints
        action.enableHints = true;
        if (skillConfidence < 0.5) {
          action.motivationalMessage = "Fast geschafft, bleib dran!";
        }
      }
      // Otherwise, keep challenge high (good for learning)
      return action;
    }

    // 3. Handle Optimal Load (Flow)
    if (loadState === CognitiveLoadState.OPTIMAL) {
      // Don't interfere. Flow is sacred.
      if (consecutiveSuccesses > 5) {
        // Maybe slight nudge if they are cruising too easily
        action.motivationalMessage = "Super Lauf!";
      }
      return action;
    }

    // 4. Handle Underload (Boredom Risk)
    if (loadState === CognitiveLoadState.UNDERLOADED) {
      if (consecutiveSuccesses > 2) {
        // Too easy -> Increase challenge
        action.difficultyModifier = 1;
        action.motivationalMessage = "Zu einfach? Hier kommt was Schwierigeres!";
      } else if (recentErrorRate > 0) {
        // Fast but wrong -> Careless
        action.focusMode = true;
        action.motivationalMessage = "Nicht raten, genau hinschauen!";
      }
      return action;
    }

    return action;
  }
}
