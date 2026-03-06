export interface InstructionPayload {
  title: string;
  body: string;
  inputHint?: string;
  severity?: 'info' | 'guided' | 'warning';
}

export const operationInstructions: Record<string, InstructionPayload> = {
  addition: {
    title: 'Schriftliche Addition',
    body: 'Addiere die Zahlen spaltenweise von rechts nach links. Vergiss den Übertrag nicht!',
    inputHint: 'Ziffern 0-9',
  },
  subtraction: {
    title: 'Schriftliche Subtraktion',
    body: 'Subtrahiere die untere Zahl von der oberen, spaltenweise von rechts nach links. Denke ans Entleihen!',
    inputHint: 'Ziffern 0-9',
  },
  multiplication: {
    title: 'Schriftliche Multiplikation',
    body: 'Multipliziere die erste Zahl mit jeder Ziffer der zweiten Zahl. Addiere danach die Teilprodukte.',
    inputHint: 'Ziffern 0-9',
  },
  division: {
    title: 'Schriftliche Division',
    body: 'Teile Schritt für Schritt: Schätzen, Multiplizieren, Subtrahieren, nächste Ziffer herunterholen.',
    inputHint: 'Ziffern 0-9',
  },
  algebra: {
    title: 'Terme vereinfachen',
    body: 'Löse die Klammern auf, indem du den Faktor vor der Klammer mit jedem Term in der Klammer multiplizierst.',
    inputHint: 'Zahlen, Variablen (x, y) und Vorzeichen (+, -)',
  },
  insert_parentheses: {
    title: 'Klammern setzen',
    body: 'Setze Klammern in den Ausdruck, sodass das vorgegebene Ergebnis herauskommt.',
    inputHint: 'Klammern ( )',
  },
  parentheses_evaluation: {
    title: 'Klammern ausrechnen',
    body: 'Berechne den Ausdruck Schritt für Schritt. Klammern werden immer zuerst berechnet!',
    inputHint: 'Ziffern und Rechenzeichen (+, -)',
  },
};

export const stepInstructions: Record<string, InstructionPayload> = {
  add_column: {
    title: 'Spalte addieren',
    body: 'Addiere die Ziffern in der markierten Spalte.',
  },
  carry: {
    title: 'Übertrag notieren',
    body: 'Trage den Übertrag in die nächste Spalte ein.',
  },
  subtract_column: {
    title: 'Spalte subtrahieren',
    body: 'Subtrahiere die untere Ziffer von der oberen in der markierten Spalte.',
  },
  borrow: {
    title: 'Entleihen',
    body: 'Die obere Ziffer ist zu klein. Entleihe 10 von der nächsten Spalte links.',
  },
  multiply_digit: {
    title: 'Ziffer multiplizieren',
    body: 'Multipliziere mit der aktuellen Ziffer und trage das Ergebnis ein.',
  },
  divide_estimate: {
    title: 'Ergebnis schätzen',
    body: 'Wie oft passt der Divisor in die aktuelle Zahl? Trage die Ziffer ins Ergebnis ein.',
  },
  divide_multiply: {
    title: 'Rückrechnen',
    body: 'Multipliziere deine geschätzte Ziffer mit dem Divisor und schreibe das Ergebnis unter die aktuelle Zahl.',
  },
  divide_subtract: {
    title: 'Rest berechnen',
    body: 'Subtrahiere, um den Rest für diesen Schritt zu berechnen.',
  },
  divide_bring_down: {
    title: 'Ziffer herunterholen',
    body: 'Hole die nächste Ziffer von oben herunter.',
  },
  algebra_expand: {
    title: 'Klammer auflösen',
    body: 'Multipliziere den Faktor mit dem Term in der Klammer.',
  },
  insert_parentheses: {
    title: 'Klammern setzen',
    body: 'Tippe den Ausdruck mit Klammern in die markierten Felder.',
    inputHint: 'Nutze ( und )',
  },
  parentheses_inner_result: {
    title: 'Klammer ausrechnen',
    body: 'Berechne zuerst das Ergebnis der inneren Klammer.',
  },
  parentheses_substitute: {
    title: 'Wert einsetzen',
    body: 'Setze das berechnete Klammer-Ergebnis in die äußere Rechnung ein.',
  },
};

export const explanationKeyInstructions: Record<string, InstructionPayload> = {
  parentheses_inner_setup_explanation: {
    title: 'Innere Rechnung aufschreiben',
    body: 'Schreibe zuerst die Aufgabe aus der Klammer auf die linke Seite.',
  },
  parentheses_outer_setup_explanation: {
    title: 'Äußere Rechnung aufschreiben',
    body: 'Schreibe nun die äußere Rechnung auf die rechte Seite. Nutze dafür dein Zwischenergebnis.',
  },
};
